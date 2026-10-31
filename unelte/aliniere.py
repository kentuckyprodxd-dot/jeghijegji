# Subtitrări 1–3 cuvinte pentru voci generate fără timestamps (ex. prin conectorul ElevenLabs MCP).
# Folosire: python3 aliniere.py <dir-audio> <text.json>
# Pauzele din audio (ffmpeg silencedetect) sunt potrivite cu semnele de punctuație din text; în interiorul
# fiecărei fraze, timpii cuvintelor se împart proporțional cu numărul de litere.
import json, re, subprocess, sys
OUT = sys.argv[1]
SCRIPT = json.load(open(sys.argv[2]))
SEG, HL = SCRIPT['seg'], set(SCRIPT['hl'])
WEAK = {'de', 'și', 'în', 'ar', 'să', 'se', 'o', 'la', 'e', 'cu', 'pe', 'din', 'un', 'care', 'îl', 'a', 'ca', 'mai', 'că', 'iar', 'fi', 'noi', 'sub', 'nu'}

def silences(fn):
    r = subprocess.run(['ffmpeg', '-i', fn, '-af', 'silencedetect=noise=-38dB:d=0.11', '-f', 'null', '-'], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', r)]
    en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r)]
    dur = float(re.findall(r'time=(\d+):(\d+):([\d.]+)', r)[-1][2]) + 60 * float(re.findall(r'time=(\d+):(\d+):([\d.]+)', r)[-1][1])
    return list(zip(st, en + [dur] * (len(st) - len(en)))), dur

timing = []
for i, text in enumerate(SEG):
    fn = f'{OUT}/s{i}.mp3'
    sil, dur = silences(fn)
    words = text.split()
    # vorbirea începe după prima tăcere (dacă e la început) și se termină la ultima
    t0 = sil[0][1] if sil and sil[0][0] < .05 else 0.
    t1 = sil[-1][0] if sil and sil[-1][1] >= dur - .05 else dur
    inner = [s for s in sil if s[0] > t0 + .05 and s[1] < t1 - .05]
    # fraze după punctuație
    phrases, cur = [], []
    for w in words:
        cur.append(w)
        if re.search(r'[.,?!:;…]$', w): phrases.append(cur); cur = []
    if cur: phrases.append(cur)
    # potrivim pauzele interioare cu granițele frazelor (cele mai lungi pauze, în ordine)
    nb = len(phrases) - 1
    use = sorted(sorted(inner, key=lambda s: s[1] - s[0], reverse=True)[:nb])
    starts, ends = [t0] + [s[1] for s in use], [s[0] for s in use] + [t1]
    if len(use) < nb:   # prea puține pauze: împărțim restul proporțional
        total = sum(len(' '.join(p)) for p in phrases); acc = 0; starts, ends = [], []
        for p in phrases: a = t0 + (t1 - t0) * acc / total; acc += len(' '.join(p)) + 1; starts.append(a); ends.append(t0 + (t1 - t0) * acc / total)
    wt = []
    for p, a, b in zip(phrases, starts, ends):
        n = sum(len(w) + 1 for w in p); acc = 0
        for w in p: wt.append((w, a + (b - a) * acc / n)); acc += len(w) + 1
    # grupare 1–3 cuvinte (ca în gen.py)
    clen = lambda g: sum(len(x[0]) for x in g) + len(g) - 1
    caps, grp = [], []
    for k, w in enumerate(wt):
        grp.append(w)
        if k == len(wt) - 1: break
        punct = re.search(r'[.,?!:;…]$', w[0]); nxt = wt[k + 1][0]
        if punct and (clen(grp) >= 5 or len(grp) > 1 or re.search(r'[.?!]$', w[0])): caps.append(grp); grp = []; continue
        if len(grp) >= 2 and clen(grp) + len(nxt) + 1 > 17 or len(grp) == 3:
            if len(grp) > 1 and w[0].lower() in WEAK and not punct: caps.append(grp[:-1]); grp = [w]
            else: caps.append(grp); grp = []
    if grp: caps.append(grp)
    out = [[round(g[0][1], 3), ' '.join(f'*{w[0]}*' if re.sub(r'[.,?!:;…]', '', w[0].lower()) in HL else w[0] for w in g)] for g in caps]
    timing.append({'caps': out, 'dur': round(t1, 3), 'text': text})
    print(i, round(t1, 2), [c[1] for c in out])
json.dump(timing, open(f'{OUT}/timing.json', 'w'), ensure_ascii=False, indent=1)
