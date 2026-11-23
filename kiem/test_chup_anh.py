# Kiểm [1.8] chụp ảnh màn lỗi chạy thật: Chrome ngầm tự nhận chia sẻ tab, app giả có màn lỗi API (cao) và màn sạch.
# Mong đợi: ô «chụp» bật được; màn lỗi có 1 ảnh PNG, màn sạch không có ảnh; ảnh lưu ở kho, nút đếm đúng; ảnh không lộ bảng công cụ.
# Chạy: python3 -I kiem/test_chup_anh.py [thư mục lưu ảnh ra để xem]
import base64, http.server, json, pathlib, socket, subprocess, sys, tempfile, threading

GOC = pathlib.Path(__file__).resolve().parent.parent
RA = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None
TRANG = """<!doctype html><html lang="vi"><meta charset="utf-8"><title>app giả</title>
<body style="font:16px system-ui;margin:0">
<nav class="navigation" style="position:fixed;left:0;top:0;width:180px;height:900px;background:#eef"><a href="/m/1" style="display:block;padding:8px">Màn lỗi</a><a href="/m/2" style="display:block;padding:8px">Màn sạch</a></nav>
<main style="margin-left:200px;padding:16px"></main>
<script>
const m = document.querySelector('main');
const ve = () => { const p = location.pathname;
  if (p === '/m/1') { m.innerHTML = '<h1>Màn lỗi</h1><p>Danh sách hồ sơ</p>'; fetch('/api/hong').catch(() => {}); }
  else if (p === '/m/2') m.innerHTML = '<h1>Màn sạch</h1><p>Không có gì sai.</p>';
  else m.innerHTML = '<h1>Trang chủ</h1>'; };
document.addEventListener('click', e => { const a = e.target.closest('a[href]'); if (a) { e.preventDefault(); history.pushState(null, '', a.getAttribute('href')); ve(); } });   // app một trang: đổi màn không tải lại trang
addEventListener('popstate', ve); ve();
</script>
<script>window.__itaHoSo = {}</script><script src="/tool.js"></script></body>"""

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        if self.path == '/tool.js': b, t = (T / 'tool.js').read_bytes(), 'text/javascript'
        elif self.path.startswith('/api/hong'): self.send_response(500); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(b'{"loi":"x"}'); return
        elif self.path.startswith('/api/'): b, t = b'{}', 'application/json'
        else: b, t = TRANG.encode(), 'text/html; charset=utf-8'
        self.send_response(200); self.send_header('Content-Type', t); self.end_headers(); self.wfile.write(b)

NODE = r"""
const [cong, hoSo, ra] = process.argv.slice(2);
import { spawn } from 'node:child_process'; import fs from 'node:fs';
const c = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run', '--window-size=1280,900', '--auto-accept-this-tab-capture',
  '--remote-debugging-port=0', '--user-data-dir=' + hoSo, 'http://127.0.0.1:' + cong + '/'], { stdio: ['ignore', 'ignore', 'pipe'] });
const tat = () => { try { c.kill(); } catch (e) {} };
try {
  const ws = await new Promise((ok, no) => { let s = ''; c.stderr.on('data', d => { s += d; const m = /DevTools listening on (ws:\/\/\S+)/.exec(s); if (m) ok(m[1]); }); c.on('exit', () => no(new Error('Chrome thoát'))); });
  const dc = new URL(ws).port; let trang;
  for (let i = 0; i < 50 && !trang; i++) { trang = (await (await fetch('http://127.0.0.1:' + dc + '/json/list')).json()).find(x => x.type === 'page'); if (!trang) await new Promise(r => setTimeout(r, 200)); }
  const so = new WebSocket(trang.webSocketDebuggerUrl); await new Promise((ok, no) => { so.onopen = ok; so.onerror = no; });
  let id = 0; const cho = new Map(); so.onmessage = e => { const m = JSON.parse(e.data); if (cho.has(m.id)) { cho.get(m.id)(m); cho.delete(m.id); } };
  const goi = (method, params) => new Promise(r => { cho.set(++id, r); so.send(JSON.stringify({ id, method, params })); });
  const ev = async (expr, gesture) => { const r = await goi('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true, userGesture: !!gesture }); if (!r.result) throw new Error('CDP: ' + JSON.stringify(r.error)); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result.result.value; };
  await new Promise(r => setTimeout(r, 2500));
  const bat = await ev('ita.batChup()', true);
  const OPT = '{ tenMienDuocChay: null, kiemThietKe: false, kiemNgonTu: false, kiemKeTruong: false, moFormDeKiemKe: false, thuOTim: false, moHoSoDau: false, tuTaiBaoCao: false }';
  await ev('ita.chay(' + OPT + ').then(() => 1)', false);
  const kq = await ev(`(async () => {
    const dem = Object.keys(localStorage).filter(k => k.startsWith('ita.anhdem.v1')).map(k => JSON.parse(localStorage.getItem(k)));
    const db = await new Promise((ok, no) => { const q = indexedDB.open('ita-anh'); q.onsuccess = () => ok(q.result); q.onerror = () => no(q.error); });
    let luu = null; try { luu = await new Promise(ok => { const q = db.transaction('tep', 'readonly'); const st = q.objectStore(q.objectStoreNames[0]); const g = st.getAll(); g.onsuccess = () => ok(g.result); g.onerror = () => ok(null); }); } catch (e) {}
    let last = null; try { const k = JSON.parse(localStorage.getItem('ita.last') || localStorage.getItem(Object.keys(localStorage).find(x => /last/i.test(x)) || '') || 'null'); last = k && { man: (k.van_de || []).map(v => v.tab + ' | ' + (v.muc_do || '') + ' | ' + (v.api_loi || '').slice(0, 80)), tat_ca: k.so_man_da_kiem }; } catch (e) {}
    return JSON.stringify({ dem, kho: luu ? luu.map(x => x.chu) : null, last });
  })()`, false);
  fs.writeFileSync(ra, JSON.stringify({ bat, kq: JSON.parse(kq) }));
} finally { tat(); }
"""
with tempfile.TemporaryDirectory() as t:
    T = pathlib.Path(t); t = T
    subprocess.run([sys.executable, '-I', str(GOC / 'cong-cu/dong_goi.py'), '--ra', str(T / 'tool.js')], check=True, stdout=subprocess.DEVNULL)
    (T / 'doc.mjs').write_text(NODE, encoding='utf-8')
    sv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), H); cong = sv.server_address[1]
    threading.Thread(target=sv.serve_forever, daemon=True).start()
    r = subprocess.run(['node', str(T / 'doc.mjs'), str(cong), str(T / 'hoso'), str(T / 'ra.json')], capture_output=True, text=True, timeout=240)
    sv.shutdown()
    assert (T / 'ra.json').exists(), 'Chrome không trả kết quả: ' + (r.stdout + r.stderr)[-800:]
    o = json.loads((T / 'ra.json').read_text())
assert o['bat'] is True, 'batChup không được quyền chia sẻ tab (cờ Chrome?): %r' % o
dem = o['kq']['dem']; assert dem and dem[0]['n'] >= 1, 'không có ảnh nào được lưu: %r' % o['kq']
chu = [json.loads(x) for x in (o['kq']['kho'] or [])]
assert chu, 'kho ảnh trống'
anh = chu[0]['anh']
assert all(a['png'].startswith('data:image/png;base64,') and len(a['png']) > 5000 for a in anh), 'ảnh PNG hỏng / quá nhỏ'
assert any('Màn lỗi' in a['man'] for a in anh), 'không có ảnh của màn lỗi: %r' % [a['man'] for a in anh]
assert not any('Màn sạch' in a['man'] for a in anh), 'màn sạch bị chụp: %r' % [(a['man'], a['muc'], a['loi']) for a in anh]
print('đạt: chụp thật — %d ảnh (%s), %d màn không chụp được; màn sạch không chụp' % (len(anh), ', '.join(a['man'] + ' ' + a['muc'] for a in anh), len(chu[0]['khong'])))
if RA:
    RA.mkdir(parents=True, exist_ok=True)
    for i, a in enumerate(anh): (RA / ('anh%d.png' % (i + 1))).write_bytes(base64.b64decode(a['png'].split(',', 1)[1]))
    print('ảnh ra:', RA)
