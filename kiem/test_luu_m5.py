# P004 M5 — công tắc tự lưu: đổi → lệnh ghi bị chặn → trong 2 giây giao diện phải trả về giá trị cũ VÀ báo lỗi.
# Trang thử có một công tắc «Bật thông báo» (role=switch) tự gọi POST /api/cau-hinh khi đổi, và một ô đánh dấu trong bảng (không được đụng).
#  - tra_lai: gỡ giá trị mới + hiện «Không lưu được»  → ĐẠT
#  - khong_bao: gỡ giá trị mới nhưng không báo lỗi    → GHI NHẬN (Cần xem)
#  - lech: giữ giá trị mới sau lệnh lưu thất bại      → SAI
#  - khong_ghi: đổi mà không gửi lệnh ghi (bộ lọc)    → CHƯA KIỂM
#  - khong_co: trang không có công tắc                → một dòng «chưa gặp công tắc tự lưu»
#  - mọi trường hợp: công tắc về như ban đầu, ô trong bảng không bị đổi; không cờ kiem_luu thì không chạy
# Chạy: python3 -I kiem/test_luu_m5.py   (cần google-chrome)
import html, json, pathlib, re, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
TRANG = """<!doctype html><meta charset="utf-8">
<body>
  <nav class="navigation" style="position:fixed;left:0;top:0;width:180px;height:900px">
    <a href="/87">Trang chủ</a><a href="/87/a">Mục A</a>
  </nav>
  <main style="margin-left:200px"><h1>Trang chủ</h1>
    <div>%s</div>
    <table><thead><tr><th>Tên</th><th>Chọn</th></tr></thead><tbody><tr><td>Dòng 1</td><td><input type="checkbox" id="dong1"></td></tr></tbody></table>
    <div id="b"></div></main>
  <script>history.replaceState(null, '', '/87'); const MODE = '%s';
    document.addEventListener('click', e => {
      const s = e.target.closest('[role=switch]');
      if (s) {
        const cu = s.getAttribute('aria-checked'), moi = cu === 'true' ? 'false' : 'true';
        s.setAttribute('aria-checked', moi);   // hiện ngay (lạc quan)
        if (MODE === 'khong_ghi') return;
        fetch('/api/cau-hinh', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ thongBao: moi === 'true' }) })
          .catch(() => { if (MODE !== 'lech') s.setAttribute('aria-checked', cu); if (MODE === 'tra_lai') document.getElementById('b').innerHTML = '<div role="alert">Không lưu được</div>'; });
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
      const s = document.querySelector('[role=switch]');
      document.body.setAttribute('data-kq', JSON.stringify({ error, dong: ko.dong.filter(d => d.ca === 'CONG_TAC_TRA_LAI'),
        sau: { cong_tac: s ? s.getAttribute('aria-checked') : null, dong1: document.getElementById('dong1').checked } }));
    }, 300));
  </script>
</body>"""
CONG_TAC = '<button role="switch" aria-checked="false">Bật thông báo</button>'


def chay(mode, ho_so):
    with tempfile.TemporaryDirectory() as t:
        t = pathlib.Path(t)
        subprocess.run([sys.executable, '-I', str(GOC / 'cong-cu/dong_goi.py'), '--ra', str(t / 'tool.js')], check=True, stdout=subprocess.DEVNULL)
        (t / 'thu.html').write_text(TRANG % ('' if mode == 'khong_co' else CONG_TAC, mode, json.dumps(ho_so, ensure_ascii=False)), encoding='utf-8')
        so = socket.socket(); so.bind(('127.0.0.1', 0)); cong = so.getsockname()[1]; so.close()
        mc = subprocess.Popen([sys.executable, '-I', '-m', 'http.server', str(cong), '--bind', '127.0.0.1', '--directory', str(t)],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            time.sleep(0.8)
            r = subprocess.run(['google-chrome', '--headless=new', '--no-sandbox', '--disable-gpu', '--dump-dom',
                                '--virtual-time-budget=120000', 'http://127.0.0.1:%d/thu.html' % cong],
                               capture_output=True, text=True, timeout=180)
        finally:
            mc.terminate()
    m = re.search(r'<body[^>]*\bdata-kq="([^"]*)"', r.stdout)
    assert m, 'Chrome chưa ghi kết quả: ' + r.stdout[-800:] + r.stderr[-400:]
    k = json.loads(html.unescape(m.group(1)))
    assert not k['error'], k
    return k


HS = {'ten': 'thử', 'ten_mien': '127.0.0.1', 'post_cho_qua': [], 'kiem_luu': True}
for mode, mong in (('tra_lai', 'ĐẠT'), ('khong_bao', 'GHI NHẬN'), ('lech', 'SAI'), ('khong_ghi', 'CHƯA KIỂM')):
    k = chay(mode, HS)
    assert k['dong'] and all(d['kq'] == mong for d in k['dong']), (mode, k['dong'])
    assert k['sau'] == {'cong_tac': 'false', 'dong1': False}, (mode, k['sau'])   # công tắc về như cũ, ô trong bảng không bị đụng
kc = chay('khong_co', HS)
assert len(kc['dong']) == 1 and 'chưa gặp công tắc' in kc['dong'][0]['quan_sat'], kc['dong']
tat = chay('lech', {k: v for k, v in HS.items() if k != 'kiem_luu'})
assert tat['dong'] == [] and tat['sau']['cong_tac'] == 'false', tat
print('đạt: trả lại + báo lỗi → ĐẠT · trả lại không báo → Cần xem · vẫn giá trị mới → SAI · không lệnh ghi → Chưa thử được · không có công tắc → «chưa gặp» · công tắc về như cũ, ô trong bảng không bị đụng · không cờ thì không chạy')
