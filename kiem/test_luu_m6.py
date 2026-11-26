# P004 M6 — ô bắt buộc để trống rồi Lưu: màn phải báo lỗi VÀ không gửi lệnh ghi.
# Form «Sửa kế hoạch» thử: Tên (required, «A»), Số lượng (required, «5»), Ghi chú (tuỳ chọn). Tool xoá trống từng ô bắt buộc rồi Lưu thử, trả lại giá trị.
#  - chan_dung: màn báo «Bắt buộc», không gửi lệnh  → mỗi ô ĐẠT
#  - de_lot: không kiểm tra, vẫn gửi lệnh           → mỗi ô SAI
#  - im_lang: không gửi lệnh, cũng không báo lỗi    → mỗi ô GHI NHẬN (Cần xem)
#  - them_trong: form «Thêm mới» có hai ô bắt buộc trống từ đầu (không tách được từng ô) → một dòng «cả form» ĐẠT
#  - không cờ kiem_luu: không có dòng LUU_TRONG_BAT_BUOC
# Chạy: python3 -I kiem/test_luu_m6.py   (cần google-chrome)
import html, json, pathlib, re, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
TRANG = """<!doctype html><meta charset="utf-8">
<body>
  <nav class="navigation" style="position:fixed;left:0;top:0;width:180px;height:900px">
    <a href="/87">Trang chủ</a><a href="/87/a">Mục A</a>
  </nav>
  <main style="margin-left:200px"><h1>Trang chủ</h1><div class="toolbar"><button>%s</button></div><div id="f"></div></main>
  <script>history.replaceState(null, '', '/87'); const MODE = '%s';
    document.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b && /^(Sửa kế hoạch|Thêm mới)$/.test(b.textContent.trim())) { const them = MODE === 'them_trong';
        document.getElementById('f').innerHTML = '<div id="frm">'
          + '<div class="form-group"><label>Tên * <input name="ten" required value="' + (them ? '' : 'A') + '"></label></div>'
          + '<div class="form-group"><label>Số lượng * <input name="so" type="number" required value="' + (them ? '' : '5') + '"></label></div>'
          + '<div class="form-group"><label>Ghi chú <input name="note" value="cũ"></label></div>'
          + '<button id="luu">Lưu</button> <button>Hủy</button></div>'; }
      if (b && b.id === 'luu') {
        document.querySelectorAll('.error').forEach(x => x.remove());
        const sai = [...document.querySelectorAll('#frm [required]')].filter(x => x.value === '');
        if (sai.length && MODE !== 'de_lot') { if (MODE !== 'im_lang') sai.forEach(x => x.parentElement.insertAdjacentHTML('afterend', '<div class="error">Bắt buộc</div>')); return; }
        fetch('/api/luu', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ten: document.querySelector('[name=ten]').value }) }).catch(() => {});
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
      document.body.setAttribute('data-kq', JSON.stringify({ error, dong: ko.dong.filter(d => d.ca === 'LUU_TRONG_BAT_BUOC'), sau: { ten: q('ten'), so: q('so') } }));
    }, 300));
  </script>
</body>"""


def chay(mode, ho_so):
    with tempfile.TemporaryDirectory() as t:
        t = pathlib.Path(t)
        subprocess.run([sys.executable, '-I', str(GOC / 'cong-cu/dong_goi.py'), '--ra', str(t / 'tool.js')], check=True, stdout=subprocess.DEVNULL)
        nut = 'Thêm mới' if mode == 'them_trong' else 'Sửa kế hoạch'
        (t / 'thu.html').write_text(TRANG % (nut, mode, json.dumps(ho_so, ensure_ascii=False)), encoding='utf-8')
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
for mode, mong in (('chan_dung', 'ĐẠT'), ('de_lot', 'SAI'), ('im_lang', 'GHI NHẬN')):
    k = chay(mode, HS)
    d = {x['name']: x for x in k['dong']}
    assert set(d) == {'ten', 'so'} and all(x['kq'] == mong for x in d.values()), (mode, k['dong'])
    assert k['sau'] == {'ten': 'A', 'so': '5'}, (mode, k['sau'])   # đã trả lại giá trị
k = chay('them_trong', HS)
assert len(k['dong']) == 1 and k['dong'][0]['kq'] == 'ĐẠT' and k['dong'][0]['o'] == '(cả form)', k['dong']
tat = chay('de_lot', {k: v for k, v in HS.items() if k != 'kiem_luu'})
assert tat['dong'] == [], tat
print('đạt: báo lỗi + không gửi lệnh → ĐẠT · vẫn gửi lệnh → SAI · không gửi cũng không báo → Cần xem · form thêm mới trống từ đầu → thử cả form · trả lại giá trị · không cờ thì không chạy')
