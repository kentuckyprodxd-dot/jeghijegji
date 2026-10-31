# Cum continui videourile (pentru o sesiune nouă)

Toate videourile de până acum sunt în rădăcina repo-ului (`*.html`, `*.mp4`, `*-descriere.md`, `*-audio/`). Ultimul: `luna-cade` („Ce-ar fi dacă Luna ar cădea pe Pământ?"), primul în stil realist.

## Ce vrea autorul
- Idei noi „ce-ar fi dacă…", în română, care să prindă pe TikTok/Reels/Shorts. Nu repeta temele: apocalipsa zombi, fără Soare, gaura neagră, gaura prin Pământ, internet 30 de zile, lumea fără oameni, Pământul se oprește, Luna cade, lumea bună, lumea rea 50 de zile, gravitația dispare 5 secunde, timpul se oprește, toți oamenii sar deodată, Pământul plat, liftul spațial.
- **Stil realist** (nu cartoon cu contur): lumini și umbre naturale, ceață, cer, materiale.
- **Cameră fixă în orașe/străzi** (trepied, fără dolly și fără tremur „de mână”): autorul a văzut orice mișcare a camerei ca pe o „stradă care se mișcă / se glitchuiește”. Se mișcă doar obiectele. Traficul trebuie să fie o buclă lungă, cu capetele în afara cadrului (mașinile nu au voie să apară/dispară în cadru), iar pe aceeași bandă toate mașinile au aceeași viteză.
- **Formatul preferat (cerut din nou de autor): cel „vechi”, cartoon motion design** — personaje 3D cu umbrire cel și contur negru, culori vii, „slam”-uri mari cu cifre (Anton + etichetă galbenă), HUD cu contoare, subtitrări cinetice și **mai multe scene diferite** în același video (glob, personaje, obiecte, infografic). Șablonul e `unelte/sari.src.html` (makeGuy/poseGuy, mulțimi instanțiate cu contur, glob cu mască de uscat, efecte ElevenLabs + muzică ElevenLabs). Autorul s-a plâns că videourile realiste cu orașul ieșeau „la fel de fiecare dată”.
- **Ultima cerere: „să nu se vadă că e făcut în JavaScript”, mai fain.** Șablonul pentru aspect cinematic e `unelte/plat.src.html`: randare în render target HalfFloat (multisample), bloom propriu (prag + blur separabil), ACES + gradare + vignetă + grain în shaderul final, texturi reale (NASA Blue Marble, LRO), umbre moi (PCFSoft) în scenele cu sol, MeshStandard, camera pe cadre-cheie cu ease (`camKeys`), text curat (fără contur negru, „slam”-uri sobre). Atenție: `camAt` întoarce `[distanță, azimut, elevație, țintă]` fără timp.
- **Repede**: ~1 oră de la cerere până la MP4 (vezi setările de randare de mai jos), nu 3 ore.
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
