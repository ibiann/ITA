# P004 M3 — lệnh lưu khớp form: tool đổi một ô chữ an toàn («Ghi chú»), bấm Lưu thử (lệnh bị chặn), so thân lệnh với form.
# Form thử có: Ghi chú (note), Chủ đề (subject), Mật khẩu (matKhau), Điện thoại (dienThoai). Tool chỉ được đổi «note», rồi trả lại giá trị cũ.
#  - dung: lệnh {note: <giá trị đổi>}  → ĐẠT (ô không đổi như subject không có trong lệnh KHÔNG phải lỗi)
#  - rot: lệnh {subject}               → SAI (thay đổi của người dùng bị làm rơi)
#  - khac_ten: {ghiChu, subject:'Sai'} → ĐẠT (tên trường khác tên ô, có ghi chú) + «Cần xem» cho subject lệch
#  - khong_cờ: hồ sơ không kiem_luu    → không có dòng LUU_MANG_DU, ô «note» không bị đổi
# Chạy: python3 -I kiem/test_luu_m3.py   (cần google-chrome)
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
        + '<label>Ghi chú <input name="note" value="cũ"></label> <label>Chủ đề <input name="subject" value="Kế hoạch A"></label>'
        + ' <label>Mật khẩu <input type="password" name="matKhau" value="BiMat"></label> <label>Điện thoại <input name="dienThoai" value="0912345678"></label>'
        + ' <button id="luu">Lưu</button> <button>Hủy</button><div id="b"></div></div>';
      if (b && b.id === 'luu') {
        const body = MODE === 'rot' ? { subject: v('subject') } : MODE === 'khac_ten' ? { ghiChu: v('note'), subject: 'Sai' } : { note: v('note') };
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
      document.body.setAttribute('data-kq', JSON.stringify({ error, dong: ko.dong.filter(d => d.ca === 'LUU_MANG_DU'), sau: { note: q('note'), matKhau: q('matKhau'), dienThoai: q('dienThoai') } }));
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
for mode in ('dung', 'rot', 'khac_ten'):
    k = chay(mode, HS)
    assert k['sau'] == {'note': 'cũ', 'matKhau': 'BiMat', 'dienThoai': '0912345678'}, (mode, k['sau'])   # trả lại ô đã đổi; không đụng mật khẩu / điện thoại
    k['d'] = {d['name']: d for d in k['dong']}
    if mode == 'dung':
        assert k['d']['note']['kq'] == 'ĐẠT' and 'subject' not in k['d'], k['dong']
    if mode == 'rot':
        assert k['d']['note']['kq'] == 'SAI' and 'subject' in k['d']['note']['quan_sat'], k['dong']
    if mode == 'khac_ten':
        assert k['d']['note']['kq'] == 'ĐẠT' and 'ghiChu' in k['d']['note']['quan_sat'], k['dong']
        assert k['d']['subject']['kq'] == 'GHI NHẬN', k['dong']
tat = chay('dung', {k: v for k, v in HS.items() if k != 'kiem_luu'})
assert tat['dong'] == [] and tat['sau']['note'] == 'cũ', tat
print('đạt: ô đã đổi có trong lệnh → ĐẠT · lệnh làm rơi ô đã đổi → SAI · tên trường khác → ĐẠT kèm ghi chú · ô không đổi không có trong lệnh không báo · trả lại giá trị cũ, không đụng mật khẩu / điện thoại · không cờ thì không chạy')
