# Efecte sonore ElevenLabs (sound-generation). Folosire: python3 sfx.py <dir> <efecte.json> [nume...]
import os, json, sys, urllib.request
KEY = os.environ['ELEVENLABS_API_KEY']; OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
# prompturile vin dintr-un JSON: {"nume": [prompt, secunde, loop]}
FX = json.load(open(sys.argv[2]))
only = sys.argv[3:]
for k, (p, d, loop) in FX.items():
    fn = f'{OUT}/{k}.mp3'
    if os.path.exists(fn) or (only and k not in only): continue
    body = {'text': p, 'duration_seconds': d, 'prompt_influence': .45, 'model_id': 'eleven_text_to_sound_v2'}
    if loop: body['loop'] = True
    req = urllib.request.Request('https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128', data=json.dumps(body).encode(),
                                 headers={'xi-api-key': KEY, 'Content-Type': 'application/json'})
    try: open(fn, 'wb').write(urllib.request.urlopen(req).read()); print('ok', k)
    except urllib.error.HTTPError as e: print(k, e.read().decode()[:300])
