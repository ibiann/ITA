# Kiểm «báo cáo đủ chỗ xảy ra»: một lỗi / một giá trị thiết kế có ở 6 màn thì báo cáo phải kể ĐỦ 6 màn
# (trước đây chỉ giữ 4 màn ví dụ, bảng thiết kế chỉ giữ 12 giá trị phổ biến nhất).
#  - tầng gom: mẫu lỗi «NaN» có ds_man đủ 6 màn = so_man; cỡ chữ 13px (giá trị hiếm) còn trong bảng, đủ 6 màn
#  - tầng hiện: HTML có «xem đủ 6 màn» và tên cả 6 màn
#  - tầng xuất: CSV mẫu lỗi có 6 dòng cho mẫu «NaN» (mỗi màn một dòng)
# Chạy: python3 -I kiem/test_du_cho.py   (cần google-chrome)
import csv, html, io, json, pathlib, re, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
MAN = ['Màn ' + c for c in 'ABCDEF']
TRANG = """<!doctype html><meta charset="utf-8">
<body>
  <nav class="navigation" style="position:fixed;left:0;top:0;width:180px;height:900px">%s</nav>
  <main style="margin-left:200px"><h1>Màn 1</h1><p>Tổng tiền: <b>NaN</b></p><p><span style="font-size:13px">ghi chú nhỏ</span></p></main>
  <script>history.replaceState(null, '', '/m/1');
    document.addEventListener('click', e => { const a = e.target.closest('a[href]'); if (!a) return; e.preventDefault();
      history.pushState(null, '', a.getAttribute('href')); document.querySelector('h1').textContent = a.textContent; }, true);</script>
  <script>window.__itaHoSo = {"ten": "thử", "ten_mien": "127.0.0.1", "post_cho_qua": []}</script>
  <script src="/tool.js"></script>
  <script>
    addEventListener('load', () => setTimeout(async () => {
      let error = '', kq = null;
      try { kq = await ita.chay({ kiemNgonTu: false, kiemKeTruong: false, thuOTim: false, moHoSoDau: false, tuTaiBaoCao: false, kiemTroNang: false }); } catch (e) { error = e.message; }
      const nan = kq && kq.mau_loi.find(m => m.loai === 'chu_la' && /NaN/.test(m.chi_tiet));
      const co13 = kq && kq.he_thong_thiet_ke.co_chu.pho_bien.find(p => p.gia_tri === '13px');
      document.body.setAttribute('data-kq', JSON.stringify({ error, nan, co13,
        html: kq ? window.__itaThu.html(kq) : '', csv: kq ? window.__itaThu.csv(kq) : '' }));
    }, 300));
  </script>
</body>""" % ''.join('<a href="/m/%d">%s</a>' % (i + 1, m) for i, m in enumerate(MAN))

with tempfile.TemporaryDirectory() as t:
    t = pathlib.Path(t)
    subprocess.run([sys.executable, '-I', str(GOC / 'cong-cu/dong_goi.py'), '--ra', str(t / 'dist.js')], check=True, stdout=subprocess.DEVNULL)
    dist = (t / 'dist.js').read_text(encoding='utf-8').rstrip()
    assert dist.endswith('})();')
    (t / 'tool.js').write_text(dist[:-len('})();')] + 'window.__itaThu = { html: sangHTML, csv: sangCSVMau };\n})();\n', encoding='utf-8')
    (t / 'thu.html').write_text(TRANG, encoding='utf-8')
    so = socket.socket(); so.bind(('127.0.0.1', 0)); cong = so.getsockname()[1]; so.close()
    mc = subprocess.Popen([sys.executable, '-I', '-m', 'http.server', str(cong), '--bind', '127.0.0.1', '--directory', str(t)],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(0.8)
        r = subprocess.run(['google-chrome', '--headless=new', '--no-sandbox', '--disable-gpu', '--dump-dom',
                            '--virtual-time-budget=90000', 'http://127.0.0.1:%d/thu.html' % cong], capture_output=True, text=True, timeout=180)
    finally:
        mc.terminate()

m = re.search(r'<body[^>]*\bdata-kq="([^"]*)"', r.stdout)
assert m, 'Chrome chưa ghi kết quả: ' + r.stdout[-800:]
k = json.loads(html.unescape(m.group(1)))
assert not k['error'], k['error']
nan, co13 = k['nan'], k['co13']
# tầng gom
assert nan and nan['so_man'] == 6 and sorted(nan['ds_man']) == MAN, nan
assert co13 and co13['so_man'] == 6 and sorted(co13['man']) == MAN, co13
# tầng hiện
assert 'xem đủ 6 màn' in k['html'] and all(x in k['html'] for x in MAN), 'HTML thiếu danh sách đủ màn'
# tầng xuất
dong = [d for d in csv.DictReader(io.StringIO(k['csv'].lstrip('﻿'))) if d['loai'] == 'chu_la' and 'NaN' in d['chi_tiet']]
assert sorted(d['man'] for d in dong) == MAN, dong
print('đạt: «NaN» và cỡ chữ 13px ở 6 màn → gom đủ 6 màn, HTML «xem đủ 6 màn», CSV 6 dòng (mỗi màn một dòng)')
