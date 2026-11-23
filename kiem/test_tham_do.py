# [GĐ 8] Kiểm lệnh ita.thamDo() / nút «🔍 Thăm dò»: lệnh mất từ bản 3.26 (nút và lõi itaAudit({ __thamDo }) còn, thiếu ita.thamDo).
# Đạt khi: ita.thamDo là hàm; trả đủ các mục Lá chắn, Thanh menu, Vùng chính, Bảng dữ liệu, Ô tìm, Tài khoản;
# nhận đúng menu (3 mục), vùng chính <main>, bảng 2 dòng, ô tìm «Tìm kiếm»; KHÔNG bấm gì, KHÔNG đổi đường dẫn, KHÔNG gửi lệnh mạng.
# Chạy: python3 -I kiem/test_tham_do.py   (cần google-chrome)
import html, json, pathlib, re, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
TRANG = """<!doctype html><meta charset="utf-8">
<body>
  <nav class="navigation" style="position:fixed;left:0;top:0;width:180px;height:900px">
    <a href="/87">Trang chủ</a><a href="/87/a">Mục A</a><a href="/87/b">Mục B</a>
  </nav>
  <main style="margin-left:200px">
    <h1>Danh sách</h1>
    <input type="search" aria-label="Tìm kiếm" placeholder="Tìm kiếm">
    <button>Thêm mới</button>
    <table><thead><tr><th>Tên</th><th>Mã</th></tr></thead>
      <tbody><tr><td>Một</td><td>01</td></tr><tr><td>Hai</td><td>02</td></tr></tbody></table>
  </main>
  <script>history.replaceState(null, '', '/87'); window.__bam = []; window.__mang = [];
    document.addEventListener('click', e => { if (!e.target.closest('#ita-panel-host')) window.__bam.push((e.target.textContent || '').trim()); }, true);
    const f0 = window.fetch; window.fetch = function (u) { window.__mang.push(String(u)); return f0.apply(this, arguments); };</script>
  <script>window.__itaHoSo = %s</script>
  <script src="tool.js"></script>
  <script>
    addEventListener('load', () => setTimeout(async () => {
      let error = '', rows = null; const duong0 = location.pathname;
      const laHam = !!(window.ita && typeof ita.thamDo === 'function');
      try { if (laHam) rows = await ita.thamDo(); } catch (e) { error = e.message; }
      document.body.setAttribute('data-kq', JSON.stringify({ laHam, rows, error, bam: window.__bam, mang: window.__mang,
        doiDuong: location.pathname !== duong0 }));
    }, 300));
  </script>
</body>"""


def chay():
    with tempfile.TemporaryDirectory() as t:
        t = pathlib.Path(t)
        subprocess.run([sys.executable, '-I', str(GOC / 'cong-cu/dong_goi.py'), '--ra', str(t / 'tool.js')], check=True, stdout=subprocess.DEVNULL)
        ho_so = {'ten': 'thử', 'ten_mien': '127.0.0.1', 'post_cho_qua': []}
        (t / 'thu.html').write_text(TRANG % json.dumps(ho_so, ensure_ascii=False), encoding='utf-8')
        so = socket.socket(); so.bind(('127.0.0.1', 0)); cong = so.getsockname()[1]; so.close()
        mc = subprocess.Popen([sys.executable, '-I', '-m', 'http.server', str(cong), '--bind', '127.0.0.1', '--directory', str(t)],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            time.sleep(0.8)
            r = subprocess.run(['google-chrome', '--headless=new', '--no-sandbox', '--disable-gpu', '--dump-dom',
                                '--virtual-time-budget=20000', 'http://127.0.0.1:%d/thu.html' % cong],
                               capture_output=True, text=True, timeout=120)
        finally:
            mc.terminate()
    m = re.search(r'<body[^>]*\bdata-kq="([^"]*)"', r.stdout)
    assert m, 'Chrome chưa ghi kết quả: ' + r.stdout[-800:] + r.stderr[-400:]
    return json.loads(html.unescape(m.group(1)))


k = chay()
assert k['laHam'], 'ita.thamDo không phải là hàm (nút «Thăm dò» sẽ báo lỗi)'
assert not k['error'], k['error']
assert isinstance(k['rows'], list) and k['rows'], 'thamDo không trả danh sách mục'
muc = {r['muc']: r for r in k['rows']}
for ten in ('Lá chắn', 'Thanh menu', 'Vùng chính', 'Bảng dữ liệu', 'Ô tìm', 'Tài khoản'):
    assert ten in muc, 'thiếu mục ' + ten + ': ' + ', '.join(muc)
assert '3 mục' in muc['Thanh menu']['ket_qua'] and muc['Thanh menu'][''] == '✔', muc['Thanh menu']
assert muc['Vùng chính']['ket_qua'].startswith('main') and muc['Vùng chính'][''] == '✔', muc['Vùng chính']
assert '2 dòng' in muc['Bảng dữ liệu']['ket_qua'], muc['Bảng dữ liệu']
assert 'Tìm kiếm' in muc['Ô tìm']['ket_qua'], muc['Ô tìm']
assert not k['bam'], 'thăm dò đã bấm: ' + str(k['bam'])
assert not k['doiDuong'], 'thăm dò đã đổi đường dẫn'
assert not k['mang'], 'thăm dò đã gửi lệnh mạng: ' + str(k['mang'])
print('đạt: ita.thamDo trả %d mục, nhận đúng menu / vùng chính / bảng / ô tìm, không bấm, không đổi đường, không gửi lệnh mạng' % len(k['rows']))
