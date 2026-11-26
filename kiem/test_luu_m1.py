# P004 M1 — ô trong form «Sửa…» so với dữ liệu máy chủ trả về cho màn (chỉ đọc, không bấm Lưu).
# Trang thử: máy chủ giả trả quantity 45, startDate 2026-11-20, subject «kế hoạch a», note null; form hiện 30, 20/11/2026, «Kế hoạch A», trống, thêm ô zzz không có trong dữ liệu.
#  - quantity: SAI (ô 30, máy chủ 45)
#  - startDate (ngày khác dạng), subject (khác hoa thường), note (null ↔ trống): không báo
#  - zzz: không xét (không có trường cùng tên), tính vào dòng tổng
#  - hồ sơ không có kiem_luu: không có dòng KHOP_MAY_CHU nào
# Chạy: python3 -I kiem/test_luu_m1.py   (cần google-chrome)
import html, json, pathlib, re, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
TRANG = """<!doctype html><meta charset="utf-8">
<body>
  <nav class="navigation" style="position:fixed;left:0;top:0;width:180px;height:900px">
    <a href="/87">Trang chủ</a><a href="/87/a">Mục A</a>
  </nav>
  <main style="margin-left:200px"><h1>Trang chủ</h1><div class="toolbar"><button>Sửa kế hoạch</button></div><div id="f"></div></main>
  <script>history.replaceState(null, '', '/87'); fetch('/api/ke-hoach.json');
    document.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b) { fetch('/api/ke-hoach.json');
        document.getElementById('f').innerHTML = '<form onsubmit="return false">'
          + '<label>Số lượng <input name="quantity" value="30"></label> <label>Ngày bắt đầu <input name="startDate" value="20/11/2026"></label>'
          + ' <label>Chủ đề <input name="subject" value="Kế hoạch A"></label> <label>Ghi chú <input name="note" value=""></label>'
          + ' <label>Khác <input name="zzz" value="x"></label></form>'; }
      const a = e.target.closest('a[href]'); if (a) { e.preventDefault(); history.pushState(null, '', a.getAttribute('href')); fetch('/api/ke-hoach.json'); } }, true);</script>
  <script>window.__itaHoSo = %s; window.__itaGioiHanO = { o: {}, _nguon: { tep: 'thử', ban: '', ghi_chu: '' } };</script>
  <script src="tool.js"></script>
  <script>
    addEventListener('load', () => setTimeout(async () => {
      let error = '';
      try { await ita.chay({ tenMienDuocChay: null, kiemThietKe: false, kiemNgonTu: false,
        thuOTim: false, moHoSoDau: false, tuTaiBaoCao: false, kiemTroNang: false }); } catch (e) { error = e.message; }
      const ko = (window.__ITA_AUDIT && window.__ITA_AUDIT.ketQua && window.__ITA_AUDIT.ketQua.kiem_o) || { dong: [] };
      document.body.setAttribute('data-kq', JSON.stringify({ error, dong: ko.dong.filter(d => d.ca === 'KHOP_MAY_CHU') }));
    }, 300));
  </script>
</body>"""
MAY_CHU = {'quantity': 45, 'startDate': '2026-11-20', 'subject': 'kế hoạch a', 'note': None}


def chay(ho_so):
    with tempfile.TemporaryDirectory() as t:
        t = pathlib.Path(t)
        subprocess.run([sys.executable, '-I', str(GOC / 'cong-cu/dong_goi.py'), '--ra', str(t / 'tool.js')], check=True, stdout=subprocess.DEVNULL)
        (t / 'thu.html').write_text(TRANG % json.dumps(ho_so, ensure_ascii=False), encoding='utf-8')
        (t / 'api').mkdir()
        (t / 'api/ke-hoach.json').write_text(json.dumps(MAY_CHU), encoding='utf-8')
        so = socket.socket(); so.bind(('127.0.0.1', 0)); cong = so.getsockname()[1]; so.close()
        mc = subprocess.Popen([sys.executable, '-I', '-m', 'http.server', str(cong), '--bind', '127.0.0.1', '--directory', str(t)],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            time.sleep(0.8)
            r = subprocess.run(['google-chrome', '--headless=new', '--no-sandbox', '--disable-gpu', '--dump-dom',
                                '--virtual-time-budget=60000', 'http://127.0.0.1:%d/thu.html' % cong],
                               capture_output=True, text=True, timeout=120)
        finally:
            mc.terminate()
    m = re.search(r'<body[^>]*\bdata-kq="([^"]*)"', r.stdout)
    assert m, 'Chrome chưa ghi kết quả: ' + r.stdout[-800:] + r.stderr[-400:]
    k = json.loads(html.unescape(m.group(1)))
    assert not k['error'], k
    return k['dong']


dong = chay({'ten': 'thử', 'ten_mien': '127.0.0.1', 'post_cho_qua': [], 'kiem_luu': True})
sai = [d for d in dong if d['kq'] == 'SAI']
assert [d['name'] for d in sai] == ['quantity'], dong
assert '«30»' in sai[0]['quan_sat'] and '«45»' in sai[0]['quan_sat'], sai
tong = [d for d in dong if d['name'] == '']
assert len(tong) == 1 and tong[0]['kq'] == 'GHI NHẬN', dong
assert '3 ô khớp, 1 ô lệch, 1 ô không có trường' in tong[0]['quan_sat'], tong
tat = chay({'ten': 'thử', 'ten_mien': '127.0.0.1', 'post_cho_qua': []})
assert tat == [], tat
print('đạt: ô 30 ↔ máy chủ 45 báo SAI · ngày khác dạng / hoa thường / null↔trống không báo · ô lạ không xét · không cờ kiem_luu thì không chạy')
