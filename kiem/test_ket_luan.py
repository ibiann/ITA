# Kiểm «bốn chữ kết luận» và luật «một chỗ chỉ ra một dòng»:
#  - «NaN» trên màn (sự việc)                         → Sai, có mức
#  - tiêu đề màn khác tên menu (ITA không chắc)       → Cần xem, không mức
#  - một ô chữ cắt «…» chứa mã máy dài không ngắt: trúng 3 phép (chữ cắt, mã lộ, chuỗi dài) trên CÙNG thành phần
#    → chỉ 1 dòng mẫu lỗi (kết luận mạnh nhất: Lệch chuẩn), 2 phép kia ghi ở «cũng»
#  - HTML có cột «Kết luận», CSV có cột ket_luan
# Chạy: python3 -I kiem/test_ket_luan.py   (cần google-chrome)
import csv, html, io, json, pathlib, re, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
MA = 'TRANG_THAI_DANG_XU_LY_HO_SO_CHO_PHE_DUYET_CAP_TREN'
TRANG = """<!doctype html><meta charset="utf-8">
<body>
  <nav class="navigation" style="position:fixed;left:0;top:0;width:180px;height:900px"><a href="/m/1">Màn A</a><a href="/m/2">Màn B</a></nav>
  <main style="margin-left:200px"><h1>Trang khác</h1><p>Tổng tiền: <b>NaN</b></p>
    <div style="width:120px"><span class="o-ma" style="display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">%s</span></div></main>
  <script>history.replaceState(null, '', '/m/1');
    document.addEventListener('click', e => { const a = e.target.closest('a[href]'); if (!a) return; e.preventDefault();
      history.pushState(null, '', a.getAttribute('href')); }, true);</script>
  <script>window.__itaHoSo = {"ten": "thử", "ten_mien": "127.0.0.1", "post_cho_qua": []}</script>
  <script src="/tool.js"></script>
  <script>
    addEventListener('load', () => setTimeout(async () => {
      let error = '', kq = null;
      try { kq = await ita.chay({ kiemNgonTu: false, kiemThietKe: false, kiemKeTruong: false, thuOTim: false, moHoSoDau: false, tuTaiBaoCao: false, kiemTroNang: false }); } catch (e) { error = e.message; }
      document.body.setAttribute('data-kq', JSON.stringify({ error, mau: kq ? kq.mau_loi : [], van_de: kq ? kq.van_de : [], dem: kq && kq.dem_ket_luan,
        html: kq ? window.__itaThu.html(kq) : '', csv: kq ? window.__itaThu.csv(kq) : '' }));
    }, 300));
  </script>
</body>""" % MA

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
                            '--virtual-time-budget=60000', 'http://127.0.0.1:%d/thu.html' % cong], capture_output=True, text=True, timeout=180)
    finally:
        mc.terminate()

m = re.search(r'<body[^>]*\bdata-kq="([^"]*)"', r.stdout)
assert m, 'Chrome chưa ghi kết quả: ' + r.stdout[-800:]
k = json.loads(html.unescape(m.group(1)))
assert not k['error'], k['error']
mau = k['mau']
nan = [x for x in mau if x['loai'] == 'chu_la' and 'NaN' in x['chi_tiet']]
assert nan and all(x['ket_luan'] == 'Sai' and x['muc_do'] != 'ghi nhận' for x in nan), nan
menu = [x for x in mau if x['loai'] == 'tieu_de_lech_menu']
assert menu and all(x['ket_luan'] == 'Cần xem' and x['muc_do'] == 'ghi nhận' for x in menu), menu
tp = [x for x in mau if x['loai'] in ('cat_chu_khong_tooltip', 'ma_enum_lo', 'chuoi_dai_khong_ngat')]
assert len({x['chi_tiet'] for x in tp}) == len(tp), 'một thành phần ra nhiều dòng: ' + json.dumps(tp, ensure_ascii=False)
assert any(x['loai'] == 'cat_chu_khong_tooltip' and x['ket_luan'] == 'Lệch chuẩn' and 'chuoi_dai_khong_ngat' in x['cung'] for x in tp), tp
assert not any(x['loai'] == 'chuoi_dai_khong_ngat' for x in tp), tp
assert all(v['ket_luan'] in ('Sai', 'Lệch chuẩn', 'Cần xem') for v in k['van_de']), k['van_de']
assert '<th>Kết luận</th>' in k['html'] and 'Cần xem' in k['html'], 'HTML thiếu cột Kết luận'
dong = list(csv.DictReader(io.StringIO(k['csv'].lstrip('﻿'))))
assert dong and 'ket_luan' in dong[0] and {'Sai', 'Cần xem'} <= {d['ket_luan'] for d in dong}, dong[:3]
print('đạt: NaN → Sai · tiêu đề khác menu → Cần xem · ô chữ cắt chứa mã dài → 1 dòng «Lệch chuẩn», phép khác ghi «cũng»: %s · đếm %s'
      % (next(x['cung'] for x in tp if x['loai'] == 'cat_chu_khong_tooltip'), k['dem']))
