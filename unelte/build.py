# Construiește pagina finală: inserează subtitrările, vocea, efectele și textura Lunii (base64)
import json, base64, sys, os
src, audio, moon, out = sys.argv[1:5]
b = lambda f: base64.b64encode(open(f, 'rb').read()).decode()
T = json.load(open(f'{audio}/timing.json'))
s = open(src).read()
s = s.replace('/*TIMING*/[]', json.dumps([{'caps': t['caps'], 'dur': t['dur']} for t in T], ensure_ascii=False))
s = s.replace('/*AUDIO*/[]', json.dumps([b(f'{audio}/s{i}.mp3') for i in range(len(T))]))
s = s.replace('/*SFX*/{}', json.dumps({os.path.splitext(f)[0]: b(f'{audio}/sfx/{f}') for f in sorted(os.listdir(f'{audio}/sfx')) if f.endswith('.mp3')}))
if moon != "-":
    mime = 'image/png' if moon.endswith('.png') else 'image/jpeg'
    s = s.replace("/*MOON*/''", f"'data:{mime};base64," + b(moon) + "'")
# imagini suplimentare: nume=cale → /*IMG_nume*/''
for arg in sys.argv[5:]:
    k, p = arg.split('=', 1)
    mime = 'image/png' if p.endswith('.png') else 'image/jpeg'
    s = s.replace(f"/*IMG_{k}*/''", f"'data:{mime};base64," + b(p) + "'")
open(out, 'w').write(s)
print(out, len(s) // 1024, 'KB')
