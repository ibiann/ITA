# Kiểm bước 14: mục menu không bị nhận nhầm thành tab và liên kết thương hiệu không thành mục menu.
# Chạy: python3 -I kiem/test_buoc14.py
import html, json, pathlib, re, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
with tempfile.TemporaryDirectory() as t:
    t = pathlib.Path(t)
    subprocess.run([sys.executable, '-I', str(GOC / 'cong-cu/dong_goi.py'), '--ra', str(t / 'dist.js')], check=True, stdout=subprocess.DEVNULL)
    dist = (t / 'dist.js').read_text(encoding='utf-8')
    moc = '  const findByMid = mid =>'
    assert moc in dist, 'không tìm thấy điểm chèn phép thử menu/tab'
    probe = """  window.__itaMenuProbe = {
      menu: menuItems.map(x => x.ten),
      tabs: tabCands().map(e => txt(e))
    };
    return window.__itaMenuProbe;
"""
    (t / 'tool.js').write_text(dist.replace(moc, probe + moc, 1), encoding='utf-8')
    (t / 'thu.html').write_text("""<!doctype html><meta charset="utf-8">
<body>
  <nav class="navigation" style="position:fixed;left:0;top:0;width:180px;height:900px">
    <div class="nav-toolbar-logo"><a class="nav-toolbar-logo__link" href="/87">LANCS NETWORKS</a></div>
    <div><a href="/87">Trang chủ</a><a href="/87/motions">Biểu quyết</a><a href="/87/participants">Thành viên</a></div>
  </nav>
  <div class="content" style="margin-left:200px">
    <h1>Trang chủ</h1>
    <div class="tab-list"><a href="/87/home/open">Đang mở</a><a href="/87/home/closed">Đã đóng</a></div>
  </div>
  <script>history.replaceState(null, '', '/87')</script>
  <script>window.__itaHoSo = {}</script>
  <script src="tool.js"></script>
  <script>
    addEventListener('load', () => setTimeout(async () => {
      let error = '';
      try { await ita.chay({ tenMienDuocChay: null, kiemThietKe: false, kiemNgonTu: false,
        kiemKeTruong: false, moFormDeKiemKe: false, thuOTim: false, moHoSoDau: false,
        tuTaiBaoCao: false }); } catch (e) { error = e.message; }
      document.body.setAttribute('data-kq', JSON.stringify({ probe: window.__itaMenuProbe, error }));
    }, 300));
  </script>
</body>""", encoding='utf-8')

    so = socket.socket(); so.bind(('127.0.0.1', 0)); cong = so.getsockname()[1]; so.close()
    mc = subprocess.Popen([sys.executable, '-I', '-m', 'http.server', str(cong), '--bind', '127.0.0.1', '--directory', str(t)],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(0.8)
        r = subprocess.run(['google-chrome', '--headless=new', '--no-sandbox', '--disable-gpu', '--dump-dom',
                            '--virtual-time-budget=30000', 'http://127.0.0.1:%d/thu.html' % cong],
                           capture_output=True, text=True, timeout=60)
    finally:
        mc.terminate()

assert r.returncode == 0 and r.stdout, 'Chrome không trả kết quả: ' + r.stderr[-500:]
m = re.search(r'<body[^>]*\bdata-kq="([^"]*)"', r.stdout)
assert m, 'Chrome chưa ghi kết quả: ' + r.stdout[-1000:]
k = json.loads(html.unescape(m.group(1)))
assert not k['error'], k
assert 'probe' in k, k
assert k['probe']['menu'] == ['Trang chủ', 'Biểu quyết', 'Thành viên'], k
assert k['probe']['tabs'] == ['Đang mở', 'Đã đóng'], k
print('đạt: ở /87, chỉ tab trong vùng tab được nhận là tab; LANCS NETWORKS không thành mục menu')
