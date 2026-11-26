# P004 M4 — lưu không xoá mất mật khẩu / khoá bí mật: form «Sửa…» có ô mật khẩu để trống thì lệnh lưu không được gửi trường đó rỗng.
# Form thử: Ghi chú (note), Mật khẩu (matKhau, để trống), Khoá API (apiKey, ô chữ, để trống). Tool dùng chung một lần bấm Lưu với M3.
#  - vang: lệnh {note}                          → cả hai ô khoá ĐẠT (lệnh không mang trường)
#  - rong: lệnh {note, matKhau:'', apiKey:null} → cả hai SAI (lưu một lần là mất khoá)
#  - co_gia_tri: lệnh {note, matKhau:'x'}       → matKhau «Cần xem»
#  - khong_co: form không có ô khoá             → một dòng «Chưa thử được: chưa gặp form có ô mật khẩu»
#  - không cờ kiem_luu: không có dòng LUU_KHONG_XOA_KHOA
# Chạy: python3 -I kiem/test_luu_m4.py   (cần google-chrome)
import html, json, pathlib, re, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
TRANG = """<!doctype html><meta charset="utf-8">
<body>
  <nav class="navigation" style="position:fixed;left:0;top:0;width:180px;height:900px">
    <a href="/87">Trang chủ</a><a href="/87/a">Mục A</a>
  </nav>
  <main style="margin-left:200px"><h1>Trang chủ</h1><div class="toolbar"><button>Sửa kế hoạch</button></div><div id="f"></div></main>
  <script>history.replaceState(null, '', '/87'); const MODE = '%s'; window.__sua = [];
    const v = n => document.querySelector('[name=' + n + ']').value;
    document.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b && b.textContent.trim() === 'Sửa kế hoạch') document.getElementById('f').innerHTML = '<div id="frm">'
        + '<label>Ghi chú <input name="note" value="cũ"></label>'
        + (MODE === 'khong_co' ? '' : ' <label>Mật khẩu <input type="password" name="matKhau" value=""></label> <label>Khoá API <input name="apiKey" value=""></label>')
        + ' <button id="luu">Lưu</button> <button>Hủy</button><div id="b"></div></div>';
      if (b && b.id === 'luu') {
        const body = MODE === 'rong' ? { note: v('note'), matKhau: '', apiKey: null } : MODE === 'co_gia_tri' ? { note: v('note'), matKhau: 'x' } : { note: v('note') };
        fetch('/api/luu', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
          .catch(() => { document.getElementById('b').innerHTML = '<div role="alert">Không lưu được</div>'; });
      }
      const a = e.target.closest('a[href]'); if (a) { e.preventDefault(); history.pushState(null, '', a.getAttribute('href')); } }, true);</script>
  <script>window.__itaHoSo = %s; window.__itaGioiHanO = { o: {}, _nguon: { tep: 'thử', ban: '', ghi_chu: '' } };</script>
  <script src="tool.js"></script>
  <script>
    addEventListener('load', () => setTimeout(async () => {
      let error = '';
      try { await ita.chay({ tenMienDuocChay: null, kiemThietKe: false, kiemNgonTu: false,
        thuOTim: false, moHoSoDau: false, tuTaiBaoCao: false, kiemTroNang: false }); } catch (e) { error = e.message; }
      const ko = (window.__ITA_AUDIT && window.__ITA_AUDIT.ketQua && window.__ITA_AUDIT.ketQua.kiem_o) || { dong: [] };
      const q = n => { const e = document.querySelector('[name=' + n + ']'); return e ? e.value : null; };
      document.body.setAttribute('data-kq', JSON.stringify({ error, dong: ko.dong.filter(d => d.ca === 'LUU_KHONG_XOA_KHOA'), sau: { note: q('note'), matKhau: q('matKhau'), apiKey: q('apiKey') } }));
    }, 300));
  </script>
</body>"""


def chay(mode, ho_so):
    with tempfile.TemporaryDirectory() as t:
        t = pathlib.Path(t)
        subprocess.run([sys.executable, '-I', str(GOC / 'cong-cu/dong_goi.py'), '--ra', str(t / 'tool.js')], check=True, stdout=subprocess.DEVNULL)
        (t / 'thu.html').write_text(TRANG % (mode, json.dumps(ho_so, ensure_ascii=False)), encoding='utf-8')
        so = socket.socket(); so.bind(('127.0.0.1', 0)); cong = so.getsockname()[1]; so.close()
        mc = subprocess.Popen([sys.executable, '-I', '-m', 'http.server', str(cong), '--bind', '127.0.0.1', '--directory', str(t)],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            time.sleep(0.8)
            r = subprocess.run(['google-chrome', '--headless=new', '--no-sandbox', '--disable-gpu', '--dump-dom',
                                '--virtual-time-budget=90000', 'http://127.0.0.1:%d/thu.html' % cong],
                               capture_output=True, text=True, timeout=150)
        finally:
            mc.terminate()
    m = re.search(r'<body[^>]*\bdata-kq="([^"]*)"', r.stdout)
    assert m, 'Chrome chưa ghi kết quả: ' + r.stdout[-800:] + r.stderr[-400:]
    k = json.loads(html.unescape(m.group(1)))
    assert not k['error'], k
    return k


HS = {'ten': 'thử', 'ten_mien': '127.0.0.1', 'post_cho_qua': [], 'kiem_luu': True}
for mode in ('vang', 'rong', 'co_gia_tri'):
    k = chay(mode, HS)
    assert k['sau'] == {'note': 'cũ', 'matKhau': '', 'apiKey': ''}, (mode, k['sau'])   # tool không gõ gì vào ô khoá
    d = {x['name']: x for x in k['dong'] if x['name']}
    if mode == 'vang':
        assert d['matKhau']['kq'] == 'ĐẠT' and d['apiKey']['kq'] == 'ĐẠT', k['dong']
    if mode == 'rong':
        assert d['matKhau']['kq'] == 'SAI' and d['apiKey']['kq'] == 'SAI' and 'xoá mất khoá' in d['matKhau']['quan_sat'], k['dong']
    if mode == 'co_gia_tri':
        assert d['matKhau']['kq'] == 'GHI NHẬN' and d['apiKey']['kq'] == 'ĐẠT', k['dong']
kc = chay('khong_co', HS)
assert len(kc['dong']) == 1 and kc['dong'][0]['kq'] == 'CHƯA KIỂM' and 'chưa gặp' in kc['dong'][0]['quan_sat'], kc['dong']
tat = chay('rong', {k: v for k, v in HS.items() if k != 'kiem_luu'})
assert tat['dong'] == [], tat
print('đạt: lệnh không mang ô khoá → ĐẠT · lệnh gửi khoá rỗng → SAI · có giá trị → Cần xem · không có form khoá → «chưa gặp» · không cờ thì không chạy · tool không gõ gì vào ô khoá')
