# Mixează offline vocea și efectele după aceeași listă de indicii ca pagina (cues.json) -> WAV
import json, subprocess, sys, numpy as np
cues_f, audio, out = sys.argv[1:4]
C = json.load(open(cues_f)); SR = 48000
def load(f):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2)
N = int((C['total'] + .5) * SR)
voice = np.zeros((N, 2), np.float32); sfx = np.zeros((N, 2), np.float32)
for v in C['voice']:
    x = load(f"{audio}/s{v['i']}.mp3"); a = int(v['at'] * SR); n = min(len(x), N - a); voice[a:a + n] += x[:n] * C['voiceGain']
cache = {}
for c in C['sfx']:
    x = cache.setdefault(c['name'], load(f"{audio}/sfx/{c['name']}.mp3"))
    o = int(c['offset'] * SR); x = x[o:]
    dur = min(c['dur'] if c['dur'] is not None else 1e9, len(x) / SR)
    n = int(dur * SR); a = int(c['at'] * SR); n = min(n, N - a)
    t = np.arange(n) / SR
    env = np.minimum(1, t / max(c['fadeIn'], 1e-3)) * np.clip((dur - t) / max(c['fadeOut'], 1e-3), 0, 1) * c['gain']
    sfx[a:a + n] += x[:n] * env[:, None]
# efectele coboară sub voce (rampă scurtă, ca în pagină)
duck = np.ones(N, np.float32)
for a, b in C['duck']: duck[int(max(a, 0) * SR):int(b * SR)] = C['duckGain']
k = int(.12 * SR); duck = np.convolve(duck, np.ones(k) / k, mode='same').astype(np.float32)
mix = voice + sfx * duck[:, None] * C['sfxGain']
peak = np.abs(mix).max(); print('vârf', peak)
mix = np.tanh(mix * 1.1) / np.tanh(1.1) if peak > .95 else mix   # limitare blândă doar dacă e nevoie
mix *= .97 / max(np.abs(mix).max(), 1e-6) if np.abs(mix).max() > .97 else 1
import wave
w = wave.open(out, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes()); w.close()
