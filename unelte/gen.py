# Generează vocea (ElevenLabs, Chris, with-timestamps) pe segmente + subtitrări 1–3 cuvinte
import os, json, base64, re, sys, urllib.request
KEY = os.environ['ELEVENLABS_API_KEY']
VOICE = 'iP95p4xoKVk53GoZ742B'
OUT = sys.argv[1]
SEG = [
 "Ce s-ar întâmpla dacă Luna ar începe să cadă spre Pământ?",
 "Acum e la trei sute optzeci și patru de mii de kilometri. Dar imaginează-ți că, într-o noapte, începe să se apropie.",
 "Primele care simt asta sunt oceanele. Mareele cresc de zeci de ori. Apa urcă peste porturi, peste străzi, peste orașe întregi.",
 "Pe cer, Luna devine uriașă. Noaptea e aproape la fel de luminoasă ca ziua.",
 "Apoi, la mai puțin de zece mii de kilometri, gravitația Pământului o rupe în bucăți.",
 "Pentru o clipă, Pământul ar avea un inel, ca Saturn. Cea mai frumoasă priveliște din istorie.",
 "Doar că bucățile încep să cadă. Miliarde de tone de rocă. Cerul ia foc, iar oceanele încep să fiarbă.",
 "Vestea bună? Luna face exact opusul. Se îndepărtează de noi cu patru centimetri pe an.",
 "Tu ai vrea să vezi inelul… chiar dacă ar fi ultimul lucru pe care îl vezi?",
]
HL = {'luna','pământ','pământ?','oceanele','zeci','orașe','uriașă','ziua','bucăți','inel','saturn','istorie','cadă','foc','fiarbă','opusul','patru','centimetri','inelul','ultimul','apropie'}
if '--count' in sys.argv: print(sum(len(s) for s in SEG)); sys.exit()
os.makedirs(OUT, exist_ok=True)
timing = []
for i, text in enumerate(SEG):
    fn = f'{OUT}/s{i}.mp3'; jn = f'{OUT}/s{i}.json'
    if not os.path.exists(jn):
        req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128',
            data=json.dumps({'text': text, 'model_id': 'eleven_multilingual_v2', 'language_code': 'ro',
                             'voice_settings': {'stability': .45, 'similarity_boost': .8, 'style': .3, 'use_speaker_boost': True}}).encode(),
            headers={'xi-api-key': KEY, 'Content-Type': 'application/json'})
        try: r = json.load(urllib.request.urlopen(req))
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            if 'language_code' in body:  # modelul nu acceptă language_code
                d = json.loads(req.data); d.pop('language_code'); req.data = json.dumps(d).encode(); r = json.load(urllib.request.urlopen(req))
            else: raise SystemExit(body)
        open(fn, 'wb').write(base64.b64decode(r['audio_base64']))
        json.dump(r['alignment'], open(jn, 'w'))
    al = json.load(open(jn))
    ch, st, en = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    # cuvinte cu timpi
    words, cur, cs = [], '', None
    for c, s, e in zip(ch, st, en):
        if c.isspace():
            if cur: words.append((cur, cs, pe)); cur = ''
            continue
        if not cur: cs = s
        cur += c; pe = e
    if cur: words.append((cur, cs, pe))
    WEAK = {'de','și','în','ar','să','se','o','la','e','cu','pe','din','un','care','îl','a','ca','mai','că','iar','fi','de','noi'}
    clen = lambda g: sum(len(x[0]) for x in g) + len(g) - 1
    caps, grp = [], []
    for k, w in enumerate(words):
        grp.append(w)
        last = k == len(words) - 1
        punct = re.search(r'[.,?!…]$', w[0])
        if last: break
        nxt = words[k + 1][0]
        if punct and clen(grp) >= 5: caps.append(grp); grp = []; continue
        if punct and len(grp) > 1: caps.append(grp); grp = []; continue
        if len(grp) >= 2 and clen(grp) + len(nxt) + 1 > 17 or len(grp) == 3:
            if len(grp) > 1 and w[0].lower() in WEAK and not punct:   # nu termina pe cuvânt mic
                caps.append(grp[:-1]); grp = [w]
            else: caps.append(grp); grp = []
    if grp: caps.append(grp)
    out = []
    for g in caps:
        txt = ' '.join(f'*{w[0]}*' if re.sub(r'[.,?!…]', '', w[0].lower()) in HL else w[0] for w in g)
        out.append([round(g[0][1], 3), txt])
    timing.append({'caps': out, 'dur': round(en[-1], 3), 'text': text})
json.dump(timing, open(f'{OUT}/timing.json', 'w'), ensure_ascii=False, indent=1)
for t in timing: print(t['dur'], [c[1] for c in t['caps']])
print('total', sum(t['dur'] for t in timing))
