// Pornește quiz-ul pe http://localhost:8080 și îi trimite chatul live-ului tău TikTok (prin WebSocket, pe portul 21213).
// Folosire: node server.mjs numele_tau   (sau dublu-click pe PORNESTE.bat)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { TikTokLiveConnection, WebcastEvent, ControlEvent } from 'tiktok-live-connector';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.join(DIR, 'quiz.html'), CFG = path.join(DIR, 'utilizator.txt');
const HTTP_PORT = 8080, WS_PORT = 21213;

// numele contului TikTok: din linia de comandă, din utilizator.txt sau întrebăm o dată
let user = (process.argv[2] || (fs.existsSync(CFG) ? fs.readFileSync(CFG, 'utf8') : '')).trim().replace(/^@/, '');
if (!user) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  user = (await rl.question('Scrie numele tău de TikTok (fără @): ')).trim().replace(/^@/, '');
  rl.close();
  fs.writeFileSync(CFG, user);
}

// 1) pagina quiz-ului
http.createServer((req, res) => {
  if (req.url.startsWith('/favicon')) { res.writeHead(204); return res.end(); }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  fs.createReadStream(PAGE).pipe(res);
}).listen(HTTP_PORT, () => {
  console.log(`\n✅ Quiz-ul rulează la:  http://localhost:${HTTP_PORT}/?auto=1`);
  console.log('   Pune adresa asta în TikTok LIVE Studio (sursă „Link”) sau deschide-o în Chrome și folosește „Captură fereastră”.\n');
});

// 2) canalul prin care pagina primește chatul
const clients = new Set();
const wss = new WebSocketServer({ port: WS_PORT });
wss.on('connection', ws => { clients.add(ws); ws.on('close', () => clients.delete(ws)); });
wss.on('error', e => { if (e.code === 'EADDRINUSE') console.log(`⚠️  Portul ${WS_PORT} e deja folosit (probabil de TikFinity). Închide TikFinity sau folosește-l pe el în locul acestui program.`); });
const send = obj => { const s = JSON.stringify(obj); for (const c of clients) if (c.readyState === 1) c.send(s); };

// 3) legătura cu live-ul TikTok (se reconectează singură)
async function connect() {
  const conn = new TikTokLiveConnection(user);
  conn.on(WebcastEvent.CHAT, d => {
    const u = d.user || {};
    send({ event: 'chat', data: { uniqueId: u.uniqueId || d.uniqueId, nickname: u.nickname || d.nickname || u.uniqueId, comment: d.comment } });
  });
  conn.on(ControlEvent.DISCONNECTED, () => { console.log('🔌 Deconectat de la live. Reîncerc în 10 secunde…'); setTimeout(connect, 10000); });
  conn.on(WebcastEvent.STREAM_END, () => console.log('⏹️  Live-ul s-a încheiat.'));
  try {
    const st = await conn.connect();
    console.log(`🟢 Conectat la live-ul lui @${user} (camera ${st.roomId}). Chatul ajunge acum în quiz.`);
  } catch (e) {
    const msg = String(e && (e.message || e));
    console.log(/offline|not live|UserOffline/i.test(msg) ? `⏳ @${user} nu e live acum. Reîncerc în 30 de secunde… (pornește live-ul din TikTok LIVE Studio)` : `⚠️  Nu m-am putut conecta: ${msg}. Reîncerc în 30 de secunde…`);
    setTimeout(connect, 30000);
  }
}
connect();
