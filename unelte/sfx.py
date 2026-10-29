# Efecte sonore ElevenLabs (sound-generation)
import os, json, sys, urllib.request
KEY = os.environ['ELEVENLABS_API_KEY']; OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
FX = {
 'amb':     ("Night ambience by a lake, crickets chirping, soft wind through pine trees, gentle water lapping on the shore, clear and audible", 10, False),
 'rumble':  ("Deep low cinematic sub rumble, distant earth tremor, ominous, slowly growing", 8, False),
 'surge':   ("Massive ocean surge, huge waves crashing and roaring toward the shore, powerful realistic water", 6, False),
 'flood':   ("Torrent of flood water rushing through city streets, debris, distant car alarms muffled", 6, False),
 'crack':   ("Gigantic rock cracking and splitting apart, deep stone fracture, cinematic, heavy", 4, False),
 'boom':    ("Cinematic deep impact boom with long sub bass tail, trailer hit", 4, False),
 'awe':     ("Ethereal cinematic choir pad, slow, awe and wonder, soft and wide, no percussion", 10, False),
 'meteors': ("Meteors streaking through the sky with fiery whooshes, distant heavy explosions and rumbling impacts", 7, False),
 'fire':    ("Huge roaring firestorm and boiling water hissing, intense wind, realistic", 6, False),
 'calm':    ("Calm peaceful night at the seaside, gentle waves on pebbles, light breeze, distant crickets", 9, True),
 'tension': ("Slow dark cinematic low strings drone, cellos and double basses, tension building, no drums", 14, False),
 'whoosh':  ("Soft deep cinematic air whoosh transition, smooth, natural", 2, False),
}
only = sys.argv[2:]
for k, (p, d, loop) in FX.items():
    fn = f'{OUT}/{k}.mp3'
    if os.path.exists(fn) or (only and k not in only): continue
    body = {'text': p, 'duration_seconds': d, 'prompt_influence': .45, 'model_id': 'eleven_text_to_sound_v2'}
    if loop: body['loop'] = True
    req = urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', data=json.dumps(body).encode(),
                                 headers={'xi-api-key': KEY, 'Content-Type': 'application/json'})
    try: open(fn, 'wb').write(urllib.request.urlopen(req).read()); print('ok', k)
    except urllib.error.HTTPError as e: print(k, e.read().decode()[:300])
