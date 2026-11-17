# Link lặp theo từng mục (thẻ dịch vụ, mỗi thẻ một nút «Show logs» trỏ /…/service/<tên>/logs) là danh sách hồ sơ, không phải tab:
#  - chỉ mở link đầu, các link cùng chữ khác đường dẫn ghi vào «bỏ qua»   (Grafana: 24/40 màn là «Logs › Show logs»)
#  - link cùng chữ chỉ khác tham số lọc (?status=…) vẫn là tab riêng     (DQTV «Xem danh sách»)
# Chạy: python3 -I kiem/test_link_lap.py   (cần google-chrome)
import html, json, pathlib, re, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
THE = ''.join('<div class="card"><h3>%s</h3><a href="/m/1/service/%s/logs">Show logs</a></div>' % (s, s) for s in ('a', 'b', 'c', 'd'))
TRANG = """<!doctype html><meta charset="utf-8">
<body>
  <nav class="navigation" style="position:fixed;left:0;top:0;width:180px;height:900px"><a href="/m/1">Màn A</a><a href="/m/2">Màn B</a><a href="/m/3">Màn C</a></nav>
  <main style="margin-left:200px"><h1>Màn A</h1>%s
    <a href="/m/1?status=cho">Xem danh sách</a> <a href="/m/1?status=xong">Xem danh sách</a></main>
  <script>history.replaceState(null, '', '/m/1');
    document.addEventListener('click', e => { const a = e.target.closest('a[href]'); if (!a) return; e.preventDefault();
      history.pushState(null, '', a.getAttribute('href')); document.querySelector('h1').textContent = a.getAttribute('href'); }, true);</script>
  <script>window.__itaHoSo = {"ten": "thử", "ten_mien": "127.0.0.1", "post_cho_qua": []}</script>
  <script src="/tool.js"></script>
  <script>
    addEventListener('load', () => setTimeout(async () => {
      let error = '', kq = null;
      try { kq = await ita.chay({ kiemNgonTu: false, kiemThietKe: false, kiemKeTruong: false, thuOTim: false, moHoSoDau: false, tuTaiBaoCao: false, kiemTroNang: false, thuLoiDoc: false }); } catch (e) { error = e.message; }
      document.body.setAttribute('data-kq', JSON.stringify({ error, man: kq ? kq.da_kiem.map(x => x.split(' — ')[0]) : [], bo: kq ? kq.bo_qua_khong_bam : [] }));
    }, 300));
  </script>
</body>""" % THE

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
assert not k['error'], k['error']
logs = [x for x in k['man'] if x.endswith('› Show logs')]
assert len(logs) == 1, 'link lặp theo mục bị mở %d lần: %s' % (len(logs), k['man'])
assert sum('Xem danh sách' in x for x in k['man']) == 2, 'tab lọc «Xem danh sách» phải mở đủ 2: %s' % k['man']
assert sum(1 for b in k['bo'] if b.get('chu') == 'Show logs') == 3, k['bo']
print('đạt: «Show logs» mở 1/4, 3 link còn lại ghi bỏ qua · «Xem danh sách» khác tham số vẫn mở 2 tab')
