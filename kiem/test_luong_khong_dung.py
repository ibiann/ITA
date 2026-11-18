# [GĐ 8] Phản hồi dạng luồng không bao giờ kết thúc (SSE, autoupdate, long-poll…) không được làm ITA chờ tới hết hạn ở mọi lần «chờ trang yên».
# Trước đây ITA đọc thân MỌI phản hồi fetch (r.clone().json()) và đếm vào pendingJson → luồng mở mãi thì pendingJson không về 0,
# mỗi lần chờ kéo dài tới waitMax (mặc định 10 giây) → chạy rất chậm trên app có luồng (đo được ở PMS).
# Trang thử: mỗi màn app mở 1 luồng /api/luong (text/event-stream, gửi 1 dòng rồi để ngỏ mãi), 1 luồng /api/treo mang nhãn
#   application/json (gửi một mẩu rồi im mãi) và 1 phản hồi JSON thường /api/ds; cả lần chạy có 1 luồng XHR thật qua mạng (/api/sse-xhr);
#   «luồng giả» tạo bằng ReadableStream không đóng, gắn trước khi nạp ITA (đúng như app gọi fetch thật).
# Thêm (18/11, gặp ở PMS): phản hồi mà app đã đọc thân (/api/da-doc) hoặc đang giữ thân (/api/da-khoa) trước khi tới lượt ITA.
# Đạt khi: không lần chờ nào hết hạn; không lỗi «clone» nào lộ ra Console; lý do chờ «json» gần 0; JSON thường vẫn được đọc; luồng có ghi nhận trong nhật ký mạng.
# Chạy: python3 -I kiem/test_luong_khong_dung.py   (cần google-chrome)
import http.server, json, pathlib, subprocess, sys, tempfile, threading

GOC = pathlib.Path(__file__).resolve().parent.parent
TRANG = """<!doctype html><meta charset="utf-8">
<body>
  <nav class="navigation" style="position:fixed;left:0;top:0;width:180px;height:900px"><a href="/m/1">Màn A</a><a href="/m/2">Màn B</a><a href="/m/3">Màn C</a></nav>
  <main style="margin-left:200px"></main>
  <script>
    // fetch «gốc» của app: /api/luong trả luồng không bao giờ đóng; /api/ds trả JSON ngay
    window.__fetch0 = window.fetch; window.__loiHua = [];
    addEventListener('unhandledrejection', e => window.__loiHua.push(String(e.reason && e.reason.message || e.reason)));
    window.fetch = function (u) {
      u = String((u && u.url) || u);
      if (u.includes('/api/luong')) {
        const s = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('data: {"x":1}\\n\\n')); /* không bao giờ close() */ } });
        return Promise.resolve(new Response(s, { status: 200, headers: { 'content-type': 'text/event-stream' } }));
      }
      if (u.includes('/api/treo')) {   // luồng mang nhãn JSON (không khai là luồng): gửi một mẩu rồi im mãi
        const s = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('{"dang":')); } });
        return Promise.resolve(new Response(s, { status: 200, headers: { 'content-type': 'application/json' } }));
      }
      if (u.includes('/api/da-doc')) {   // app (hoặc lớp bọc fetch của app) đã đọc thân trước khi ITA tới lượt — gặp ở PMS 18/11
        const r = new Response('{"a":1}', { status: 200, headers: { 'content-type': 'application/json' } }); return r.text().then(() => r);
      }
      if (u.includes('/api/da-khoa')) {   // thân đang bị app giữ (reader) → clone() ném «Response body is already used»
        const r = new Response('{"a":1}', { status: 200, headers: { 'content-type': 'application/json' } }); r.body.getReader(); return Promise.resolve(r);
      }
      if (u.includes('/api/ds')) return Promise.resolve(new Response(JSON.stringify({ ds: [{ ten: 'Một' }] }), { status: 200, headers: { 'content-type': 'application/json' } }));
      return window.__fetch0.apply(this, arguments);
    };
  </script>
  <script>window.__itaHoSo = {"ten": "thử luồng", "ten_mien": "127.0.0.1", "post_cho_qua": []}</script>
  <script src="/tool.js"></script>
  <script>
    const ve = () => { const m = document.querySelector('main'); m.innerHTML = '<h1>' + location.pathname + '</h1><table><thead><tr><th>Tên</th></tr></thead><tbody><tr><td>Một</td></tr></tbody></table>';
      fetch('/api/luong?man=' + location.pathname); fetch('/api/treo?man=' + location.pathname); fetch('/api/da-doc'); fetch('/api/da-khoa'); fetch('/api/ds').then(r => r.json()).then(j => { window.__dsDoc = j.ds.length; });
      if (location.pathname === '/m/2' && !window.__xhrMo) { window.__xhrMo = 1; const x = new XMLHttpRequest(); x.open('GET', '/api/sse-xhr'); x.send(); } };   // một luồng XHR thật trong lúc ITA chạy (giữ dưới 6 kết nối / máy chủ)   // mỗi màn mở thêm một luồng như app thật (đăng ký nhận cập nhật)
    history.replaceState(null, '', '/m/1'); ve(); addEventListener('popstate', ve);
    document.addEventListener('click', e => { const a = e.target.closest('a[href]'); if (!a) return; e.preventDefault(); history.pushState(null, '', a.getAttribute('href')); ve(); }, true);
    addEventListener('load', () => setTimeout(async () => {
      let error = '', kq = null;
      try { kq = await ita.chay({ waitMax: 6000, kiemNgonTu: false, kiemThietKe: false, kiemKeTruong: false, thuOTim: false, moHoSoDau: false, tuTaiBaoCao: false, kiemTroNang: false, thuLoiDoc: false }); } catch (e) { error = e.message; }
      document.body.setAttribute('data-kq', JSON.stringify({ error, man: kq ? (kq.man_da_kiem || []).map(r => r.tab) : [],
        tg: kq ? kq.thoi_gian_theo_muc : [], wait: 6000, dsDoc: window.__dsDoc, nk: ita.nhatKy(400).filter(x => x.loai === 'không chờ phản hồi').map(x => x.nd), loiHua: window.__loiHua }));
    }, 300));
  </script>
</body>"""

with tempfile.TemporaryDirectory() as t:
    t = pathlib.Path(t)
    subprocess.run([sys.executable, '-I', str(GOC / 'cong-cu/dong_goi.py'), '--ra', str(t / 'tool.js')], check=True, stdout=subprocess.DEVNULL)
    (t / 'thu.html').write_text(TRANG, encoding='utf-8')
    dung = threading.Event()
    class XuLy(http.server.SimpleHTTPRequestHandler):
        def __init__(s, *a, **k): super().__init__(*a, directory=str(t), **k)
        def log_message(s, *a): pass
        def do_GET(s):
            if not s.path.startswith('/api/sse-xhr'): return super().do_GET()
            # luồng THẬT qua mạng cho XHR: gửi đầu + một sự kiện rồi giữ kết nối tới khi test xong
            s.send_response(200); s.send_header('Content-Type', 'text/event-stream'); s.send_header('Cache-Control', 'no-cache'); s.end_headers()
            try:
                s.wfile.write(b'data: {"x":1}\n\n'); s.wfile.flush()
                while not dung.wait(0.5): pass
            except Exception: pass
    mc = http.server.ThreadingHTTPServer(('127.0.0.1', 0), XuLy); mc.daemon_threads = True; cong = mc.server_address[1]
    threading.Thread(target=mc.serve_forever, daemon=True).start()
    try:
        # thời gian thật (kiem/mo_chrome.mjs): ở chế độ thời gian ảo Chrome không cho thời gian trôi khi còn thân phản hồi đang đọc dở
        r = subprocess.run(['node', str(GOC / 'kiem/mo_chrome.mjs'), 'http://127.0.0.1:%d/thu.html' % cong, str(t / 'p'), '240'],
                           capture_output=True, text=True, timeout=300)
    finally:
        dung.set(); mc.shutdown()

assert r.stdout, 'Chrome không trả kết quả: ' + r.stderr[-500:]
k = json.loads(r.stdout)
assert not k['error'], k['error']
tg = {x['muc']: x for x in k['tg']}
for ten, x in tg.items():
    print('  %-12s chờ %d lần, tổng %d ms, lâu nhất %d ms, hết hạn %d · vì json %d ms, mạng %d ms' % (
        ten, x['lan_cho'], x['cho_ms'], x['cho_max_ms'], x['het_han'], x['vi']['json'], x['vi']['mang']))
assert {'Màn A', 'Màn B', 'Màn C'} <= set(k['man']), 'không kiểm đủ 3 màn: %s' % k['man']
het = sum(x['het_han'] for x in k['tg'])
assert het == 0, '%d lần chờ trang yên kéo tới hết hạn (%d ms) vì luồng không kết thúc' % (het, k['wait'])
assert all(x['cho_max_ms'] < k['wait'] / 2 for x in k['tg']), 'có lần chờ quá nửa waitMax: %s' % [(x['muc'], x['cho_max_ms']) for x in k['tg']]
assert k['dsDoc'] == 1, 'app không còn đọc được JSON thường: %s' % k['dsDoc']
assert any(x.startswith('/api/luong') and 'event-stream' in x for x in k['nk']) and any(x.startswith('/api/treo') and 'ngừng gửi' in x for x in k['nk']) and any(x.startswith('/api/sse-xhr') and 'event-stream' in x for x in k['nk']), 'nhật ký phải ghi ba luồng không chờ (fetch event-stream, fetch treo, XHR event-stream): %s' % k['nk']
print('nhật ký:', k['nk'])
assert not [x for x in k['loiHua'] if 'clone' in x], 'ITA làm lộ lỗi clone ra Console: %s' % k['loiHua']
assert any(x.startswith('/api/da-doc') and 'không đọc được thân' in x for x in k['nk']) and any(x.startswith('/api/da-khoa') and 'không đọc được thân' in x for x in k['nk']), 'thân đã đọc / đang bị giữ phải ghi nhật ký: %s' % k['nk']
print('đạt: luồng không kết thúc không làm ITA chờ tới hết hạn; kiểm đủ 3 màn')
