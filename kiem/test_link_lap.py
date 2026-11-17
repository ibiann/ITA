# Link lặp theo từng mục (danh sách dạng thẻ, mỗi thẻ một nút cùng chữ trỏ /…/<mã mục>/…) là danh sách hồ sơ, không phải tab:
#  - không coi là tab (bỏ qua 1 dòng ghi số link); mục đầu mở như «hồ sơ đầu»   (kiểu danh sách xếp thành thẻ, không phải bảng)
#  - link cùng chữ chỉ khác tham số lọc (?status=…) vẫn là tab riêng     (DQTV «Xem danh sách»)
# Chạy: python3 -I kiem/test_link_lap.py   (cần google-chrome)
import html, json, pathlib, re, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
THE = ''.join('<div class="card"><h3>%s</h3><a href="/m/1/service/%s/logs">Show logs</a></div>' % (s, s) for s in ('a', 'b', 'c', 'd'))
TRANG = """<!doctype html><meta charset="utf-8">
<body>
  <nav class="navigation" style="position:fixed;left:0;top:0;width:180px;height:900px"><a href="/m/1">Màn A</a><a href="/m/2">Màn B</a><a href="/m/3">Màn C</a></nav>
  <main style="margin-left:200px"></main>
  <script>
    // /m/1: danh sách dạng thẻ · /m/2: danh sách dạng bảng (luật cũ phải vẫn chạy) · trang hồ sơ: chỉ tiêu đề
    const THE = '%s', BANG = '<table><thead><tr><th>Mã</th><th>Tên</th></tr></thead><tbody><tr><td><a href="/m/2/ho-so/1">HS-1</a></td><td>Một</td></tr><tr><td><a href="/m/2/ho-so/2">HS-2</a></td><td>Hai</td></tr></tbody></table>';
    const ve = () => { const p = location.pathname, m = document.querySelector('main');
      m.innerHTML = '<h1>' + p + location.search + '</h1>' + (p === '/m/1' ? THE + '<a href="/m/1?status=cho">Xem danh sách</a> <a href="/m/1?status=xong">Xem danh sách</a>' : p === '/m/2' ? BANG : ''); };
    history.replaceState(null, '', '/m/1'); ve(); addEventListener('popstate', ve);
    document.addEventListener('click', e => { const a = e.target.closest('a[href]'); if (!a) return; e.preventDefault(); history.pushState(null, '', a.getAttribute('href')); ve(); }, true);</script>
  <script>window.__itaHoSo = {"ten": "thử", "ten_mien": "127.0.0.1", "post_cho_qua": []}</script>
  <script src="/tool.js"></script>
  <script>
    addEventListener('load', () => setTimeout(async () => {
      let error = '', kq = null;
      try { kq = await ita.chay({ kiemNgonTu: false, kiemThietKe: false, kiemKeTruong: false, thuOTim: false, moHoSoDau: true, tuTaiBaoCao: false, kiemTroNang: false, thuLoiDoc: false }); } catch (e) { error = e.message; }
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
assert not [x for x in k['man'] if 'Show logs' in x], 'link mở từng mục bị coi là tab: %s' % k['man']
assert 'Màn B › [hồ sơ đầu]' in k['man'], 'danh sách dạng bảng không mở hồ sơ đầu: %s' % k['man']
assert 'Màn A › [hồ sơ đầu]' in k['man'], 'danh sách dạng thẻ không mở hồ sơ đầu: %s' % k['man']
assert sum('Xem danh sách' in x for x in k['man']) == 2, 'tab lọc «Xem danh sách» phải mở đủ 2: %s' % k['man']
bo = [b for b in k['bo'] if b.get('chu') == 'Show logs' and b.get('man') == 'Màn A']
assert len(bo) == 1 and '4 link' in bo[0]['ly_do'], bo
print('đạt: 4 thẻ «Show logs» → không thành tab, mở mục đầu như «hồ sơ đầu» · bảng vẫn mở dòng đầu · «Xem danh sách» khác tham số vẫn mở 2 tab')
