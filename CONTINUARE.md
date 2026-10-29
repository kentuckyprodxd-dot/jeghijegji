# Cum continui videourile (pentru o sesiune nouă)

Branch: `claude/video-animatie-javascript-648fuu`. Toate videourile de până acum sunt aici (`*.html`, `*.mp4`, `*-descriere.md`, `*-audio/`).

## Ce vrea autorul pentru următorul video
- O idee nouă, „fain rău", interesantă, care să prindă pe TikTok/Reels/Shorts, în română.
- **Mai realist** decât până acum (nu cartoon cu contur negru): lumini, materiale, cer, ceață, umbre, culori naturale.
- **Sunete bune**: fără efecte sintetizate care sună urât (bipuri, „whoosh" din zgomot alb). Efectele se generează cu ElevenLabs (`POST /v1/sound-generation`, ~10 credite/secundă), puse discret sub voce, nu tare.
- Descriere + hashtag-uri + comentariu fixat + text pentru copertă, ca la celelalte (`*-descriere.md`).
- MP4 vertical 1080×1920 trimis autorului, pagina HTML publicată ca artifact, commit + push pe branch.

## Cum s-au făcut până acum (de refolosit)
- Voce: ElevenLabs `eleven_multilingual_v2`, vocea **Chris** (`iP95p4xoKVk53GoZ742B`), endpoint `with-timestamps`; subtitrări de 1–3 cuvinte cronometrate pe aliniere (vezi scriptul `gen.py` descris mai jos). Cheia e în `ELEVENLABS_API_KEY` — nu se pune niciodată în pagină.
- Pagina: Three.js r128 de pe cdnjs, totul într-un singur HTML (voce și efecte ca base64), redare deterministă în funcție de timp `t`.
- MP4: pagina randată cadru cu cadru în Chromium headless (Playwright, `__frame(t)`), Math.random cu sămânță fixă, 4 procese în paralel, audio mixat offline cu `OfflineAudioContext`, apoi `ffmpeg` (libx264 crf 22, AAC). Atenție: cadrele de la granița proceselor trebuie să fie identice (sămânță fixă, fără animații CSS dependente de timpul real).
- Dacă planul ElevenLabs e plătit: se pot folosi și vocile românești din bibliotecă (Andrei `S98OhkhaxeAKHEbhoLi7`, Anca `GRHbHyXbUO8nF4YexVTa`, Liviu Mihai `Q1khAM9K4Mi6p5TK0ueC`).
