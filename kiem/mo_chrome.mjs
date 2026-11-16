// Mở một trang trong Chrome chạy ngầm bằng THỜI GIAN THẬT, chờ trang tự ghi kết quả vào thuộc tính data-kq của <body>, in ra rồi đóng Chrome.
// Dùng thay cho --dump-dom --virtual-time-budget khi trang cần IndexedDB: ở chế độ thời gian ảo, indexedDB.open() treo mãi (đã thử 05/11/2026).
// Không cần cài gì thêm: Node có sẵn WebSocket và fetch.
// Chạy: node kiem/mo_chrome.mjs <url> <thư mục hồ sơ Chrome> [số giây chờ tối đa, mặc định 120]
import { spawn } from 'node:child_process';

const [url, hoSo, giay = '120'] = process.argv.slice(2);
const c = spawn('google-chrome', ['--headless=new', '--disable-gpu', '--no-first-run', '--window-size=1280,900',
  '--remote-debugging-port=0', '--user-data-dir=' + hoSo, url], { stdio: ['ignore', 'ignore', 'pipe'] });
const tat = () => { try { c.kill(); } catch (e) {} };
try {
  const wsTrinhDuyet = await new Promise((ok, loi) => {
    let s = '';
    c.stderr.on('data', d => { s += d; const m = /DevTools listening on (ws:\/\/\S+)/.exec(s); if (m) ok(m[1]); });
    c.on('exit', () => loi(new Error('Chrome thoát trước khi mở cổng điều khiển')));
  });
  const cong = new URL(wsTrinhDuyet).port;
  let trang;
  for (let i = 0; i < 50 && !trang; i++) {
    trang = (await (await fetch(`http://127.0.0.1:${cong}/json/list`)).json()).find(x => x.type === 'page');
    if (!trang) await new Promise(r => setTimeout(r, 200));
  }
  if (!trang) throw new Error('không thấy trang');
  const so = new WebSocket(trang.webSocketDebuggerUrl);
  await new Promise((ok, loi) => { so.onopen = ok; so.onerror = loi; });
  let id = 0; const cho = new Map();
  so.onmessage = e => { const m = JSON.parse(e.data); if (cho.has(m.id)) { cho.get(m.id)(m); cho.delete(m.id); } };
  const goi = (method, params) => new Promise(r => { cho.set(++id, r); so.send(JSON.stringify({ id, method, params })); });
  const het = Date.now() + Number(giay) * 1000;
  let kq = null;
  while (Date.now() < het && !kq) {
    const r = await goi('Runtime.evaluate', { expression: "document.body && document.body.getAttribute('data-kq')", returnByValue: true });
    kq = r.result && r.result.result && r.result.result.value;
    if (!kq) await new Promise(r => setTimeout(r, 500));
  }
  so.close();
  if (!kq) { console.error('Hết giờ: trang chưa ghi data-kq'); process.exitCode = 1; }
  else process.stdout.write(kq);
} finally { tat(); }
