# P004 M0 — nội dung lệnh ghi bị chặn có trong báo cáo, đã che.
#  - hồ sơ có kiem_luu: nút «Trình ký» gửi POST có CCCD / điện thoại / mật khẩu → hàng màn có chan_ghi_noi_dung,
#    giữ tên trường, KHÔNG còn giá trị gốc; số giữ nguyên
#  - hồ sơ không có kiem_luu: chan_ghi_noi_dung rỗng (tool chạy như cũ)
# Chạy: python3 -I kiem/test_luu_m0.py   (cần google-chrome)
import html, json, pathlib, re, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
TRANG = """<!doctype html><meta charset="utf-8">
<body>
  <nav class="navigation" style="position:fixed;left:0;top:0;width:180px;height:900px">
    <a href="/87">Trang chủ</a><a href="/87/a">Mục A</a>
  </nav>
  <main style="margin-left:200px"><h1>Trang chủ</h1><div class="toolbar"><button>Trình ký</button></div></main>
  <script>history.replaceState(null, '', '/87');
    document.addEventListener('click', e => { const b = e.target.closest('button');
      if (b) fetch('/api/thu-ky', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ cccd: '012345678901', dienThoai: '0912345678', matKhau: 'BiMat12345', soLuong: 5, ghiChu: '' }) }).catch(() => {});
      const a = e.target.closest('a[href]'); if (a) { e.preventDefault(); history.pushState(null, '', a.getAttribute('href')); } }, true);</script>
  <script>window.__itaHoSo = %s</script>
  <script src="tool.js"></script>
  <script>
    addEventListener('load', () => setTimeout(async () => {
      let error = '';
      try { await ita.chay({ tenMienDuocChay: null, kiemThietKe: false, kiemNgonTu: false,
        thuOTim: false, moHoSoDau: false, tuTaiBaoCao: false, kiemTroNang: false }); } catch (e) { error = e.message; }
      const res = (window.__ITA_AUDIT && window.__ITA_AUDIT.res) || [];
      document.body.setAttribute('data-kq', JSON.stringify({ error, chan: res.map(r => r.chan_ghi || ''), nd: res.map(r => r.chan_ghi_noi_dung || '') }));
    }, 300));
  </script>
</body>"""


def chay(ho_so):
    with tempfile.TemporaryDirectory() as t:
        t = pathlib.Path(t)
        subprocess.run([sys.executable, '-I', str(GOC / 'cong-cu/dong_goi.py'), '--ra', str(t / 'tool.js')], check=True, stdout=subprocess.DEVNULL)
        (t / 'thu.html').write_text(TRANG % json.dumps(ho_so, ensure_ascii=False), encoding='utf-8')
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
    return k


bat = chay({'ten': 'thử', 'ten_mien': '127.0.0.1', 'post_cho_qua': [], 'kiem_luu': True})
assert any('/api/thu-ky' in c for c in bat['chan']), bat['chan']
nd = ' | '.join(bat['nd'])
assert '/api/thu-ky' in nd and '"cccd"' in nd and '"soLuong":5' in nd, nd
for goc in ('012345678901', '0912345678', 'BiMat12345'):
    assert goc not in nd, ('lộ giá trị gốc', goc, nd)
tat = chay({'ten': 'thử', 'ten_mien': '127.0.0.1', 'post_cho_qua': []})
assert any('/api/thu-ky' in c for c in tat['chan']), tat['chan']
assert not any(tat['nd']), tat['nd']
print('đạt: nội dung lệnh bị chặn có tên trường, số giữ nguyên, CCCD / điện thoại / mật khẩu đã che · không cờ kiem_luu thì không ghi')
