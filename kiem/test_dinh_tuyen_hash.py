# [GĐ 8] App định tuyến bằng dấu # (#/a, #/b, #/c): mọi màn cùng location.pathname, chỉ khác phần #.
# Đạt khi: kiểm đủ các mục menu; màn #/b hiện «Unexpected Application Error» (màn sập) thì chỉ #/b bị ghi sập,
# #/c vẫn được kiểm (không bị coi là «màn sập ở lần trước» chỉ vì cùng pathname); điểm dừng ghi tuyến có phần #.
# Đối chứng: trước khi sửa, mọi tuyến của app # đều thành «/thu.html» → sập một màn là bỏ hết các mục sau.
# Chạy: python3 -I kiem/test_dinh_tuyen_hash.py   (cần google-chrome)
import html, json, pathlib, re, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
TRANG = """<!doctype html><meta charset="utf-8">
<body>
  <nav class="navigation" style="position:fixed;left:0;top:0;width:180px;height:900px">
    <a href="/thu.html#/a">Mục A</a><a href="/thu.html#/b">Mục B</a><a href="/thu.html#/c">Mục C</a><a href="#/d">Mục D</a>
  </nav>
  <main style="margin-left:200px"></main>
  <script>
    const ve = () => { const h = location.hash || '#/a', m = document.querySelector('main');
      m.innerHTML = h === '#/b' ? '<h2>Unexpected Application Error!</h2><p>Cannot read properties of undefined</p>'
                                : '<h1>' + ({ '#/c': 'Mục C', '#/d': 'Mục D' }[h] || 'Mục A') + '</h1><table><thead><tr><th>Tên</th></tr></thead><tbody><tr><td>Một</td></tr></tbody></table>'; };
    if (!location.hash) history.replaceState(null, '', '#/a'); ve(); addEventListener('hashchange', ve);
  </script>
  <script>window.__itaHoSo = {"ten": "thử hash", "ten_mien": "127.0.0.1", "post_cho_qua": []}</script>
  <script src="/tool.js"></script>
  <script>
    addEventListener('load', () => setTimeout(async () => {
      let error = '', kq = null;
      try { kq = await ita.chay({ kiemNgonTu: false, kiemThietKe: false, kiemKeTruong: false, thuOTim: false, moHoSoDau: false, tuTaiBaoCao: false, kiemTroNang: false, thuLoiDoc: false }); } catch (e) { error = e.message; }
      document.body.setAttribute('data-kq', JSON.stringify({ error, man: kq ? (kq.man_da_kiem || []).map(r => r.tab) : [],
        chua: kq ? (kq.menu_chua_chay || []) : [], sap: kq ? (kq.man_sap || []).map(x => ({ man: x.man, duong_dan: x.duong_dan })) : [] }));
    }, 300));
  </script>
</body>"""

with tempfile.TemporaryDirectory() as t:
    t = pathlib.Path(t)
    subprocess.run([sys.executable, '-I', str(GOC / 'cong-cu/dong_goi.py'), '--ra', str(t / 'tool.js')], check=True, stdout=subprocess.DEVNULL)
    (t / 'thu.html').write_text(TRANG, encoding='utf-8')
    so = socket.socket(); so.bind(('127.0.0.1', 0)); cong = so.getsockname()[1]; so.close()
    mc = subprocess.Popen([sys.executable, '-I', '-m', 'http.server', str(cong), '--bind', '127.0.0.1', '--directory', str(t)],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(0.8)
        r = subprocess.run(['google-chrome', '--headless=new', '--no-sandbox', '--disable-gpu', '--dump-dom',
                            '--virtual-time-budget=90000', 'http://127.0.0.1:%d/thu.html' % cong], capture_output=True, text=True, timeout=240)
    finally:
        mc.terminate()

m = re.search(r'<body[^>]*\bdata-kq="([^"]*)"', r.stdout)
assert m, 'Chrome chưa ghi kết quả: ' + r.stdout[-800:]
k = json.loads(html.unescape(m.group(1)))
print('màn đã kiểm:', k['man'], '· chưa chạy:', k['chua'], '· sập:', k['sap'])
assert not k['error'], k['error']
assert 'Mục A' in k['man'], 'không kiểm mục đầu: %s' % k['man']
assert any(x['man'] == 'Mục B' for x in k['sap']), 'màn #/b hiện «Unexpected Application Error» mà không ghi sập: %s' % k['sap']
assert all(x['duong_dan'].endswith('#/b') for x in k['sap']), 'tuyến của màn sập phải có phần # (#/b): %s' % k['sap']
assert 'Mục C' in k['man'], 'sập ở /thu.html#/b làm bỏ luôn /thu.html#/c (mọi tuyến của app # bị coi là một): %s' % k['man']
assert 'Mục D' in k['man'], 'không kiểm mục có link chỉ phần # (#/d): %s' % k['man']
print('đạt: app định tuyến # — kiểm đủ A, C, D; chỉ B ghi sập với tuyến «…#/b»; sập một màn không kéo theo các mục sau')
