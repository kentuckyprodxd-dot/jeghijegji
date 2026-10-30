# Cum continui videourile (pentru o sesiune nouă)

Toate videourile de până acum sunt în rădăcina repo-ului (`*.html`, `*.mp4`, `*-descriere.md`, `*-audio/`). Ultimul: `luna-cade` („Ce-ar fi dacă Luna ar cădea pe Pământ?"), primul în stil realist.

## Ce vrea autorul
- Idei noi „ce-ar fi dacă…", în română, care să prindă pe TikTok/Reels/Shorts. Nu repeta temele: apocalipsa zombi, fără Soare, gaura neagră, gaura prin Pământ, internet 30 de zile, lumea fără oameni, Pământul se oprește, Luna cade, lumea bună, lumea rea 50 de zile, gravitația dispare 5 secunde.
- **Stil realist** (nu cartoon cu contur): lumini și umbre naturale, ceață, cer, materiale, mișcări de cameră cinematice.
- **Sunete bune**, generate cu ElevenLabs (`POST /v1/sound-generation`), puse discret sub voce. Fără bipuri / zgomot sintetizat.
- 45–60 s; MP4 vertical 1080×1920 trimis autorului, pagina publicată ca artifact, descriere + hashtag-uri + comentariu fixat + text copertă (`*-descriere.md`), commit + push.
- Verifică întâi creditele: `GET /v1/user/subscription` (planul e **free**, 10.000 caractere/lună; vocile din bibliotecă, inclusiv cele românești, nu merg pe free prin API).

## Unelte (folderul `unelte/`)
- `gen.py <dir>` — vocea pe segmente (ElevenLabs `eleven_multilingual_v2`, Chris `iP95p4xoKVk53GoZ742B`, endpoint `with-timestamps`) + `timing.json` cu subtitrări de 1–3 cuvinte. Textul și cuvintele evidențiate se editează în script.
- `sfx.py <dir>/sfx [nume…]` — efectele sonore (prompturi în script). După generare se normalizează la −20 LUFS cu `ffmpeg loudnorm` (vocea la −16).
- `luna-cade.src.html` — șablonul paginii (Three.js r128 de pe cdnjs). Redare deterministă `renderAt(t)`; în modul `?render` expune `window.__ready`, `window.__frame(t)` și `window.__cues` (lista de sunete).
  Tehnici: două treceri (cer în km + sol în metri), apă cu reflexie reală (cameră oglindită, ca `THREE.Reflector`), teren procedural cu grilă mai deasă lângă cameră, ceață exponențială + bancuri de ceață, ACES tone mapping. Materialele de sol sunt `MeshPhongMaterial` cu specular negru (Standard dădea un luciu gri la unghiuri razante).
- `build.py src audio textura out` — inserează base64 (subtitrări, voce, efecte, textură) într-un singur HTML.
- `snap.js pagina.html outdir t1 t2…` — capturi rapide pentru verificare vizuală.
- `render.js pagina.html outdir fps start end` — cadre JPEG. **Rapid (recomandat):** `DPR=1` (540×960, mărit la 1080×1920 de ffmpeg), 25 fps, 2 procese în paralel: ~75 cadre/min, adică ~20 min pentru 1 minut de video. Mai multe procese nu ajută, SwiftShader folosește deja toate nucleele. Contează mult numărul de triunghiuri (umbrele le desenează de două ori): coroanele copacilor au `SphereGeometry(1, 8, 6)`. Fără `DPR` se randează la 1080×1920 nativ, de ~2,5 ori mai lent.
- Testele vizuale cu `snap.js` se fac la `DPR=1` și cât mai puține; nu le rula în timpul randării finale.
- `mix.py cues.json audio out.wav` — mixaj offline identic cu pagina (fade-uri, ducking sub voce). Apoi `ffmpeg -framerate 25 -i f%05d.jpg -i mix.wav -vf scale=1080:1920:flags=lanczos,unsharp=5:5:0.6 -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:v libx264 -preset slow -b:v 5000k -maxrate 7000k -bufsize 10000k -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 192k -ar 48000 -shortest out.mp4` (5 Mbps ține fișierul sub ~40 MB pentru GitHub).
