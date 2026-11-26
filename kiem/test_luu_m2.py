# P004 M2 — bấm Lưu thử (bamLuuThu): chỉ bấm khi an toàn, trả lệnh ghi bị chặn kèm nội dung đã che + chữ báo lỗi.
#  - trang thường, hồ sơ kiem_luu: bấm, có «POST /api/luu» bị chặn + nội dung đã che (không lộ CCCD), có chữ báo lỗi «Không lưu được»
#  - trang có lệnh đi vòng bộ chặn (gọi bằng fetch gốc giữ từ trước khi tool tải): KHÔNG bấm, di_vong = true
#  - hồ sơ không có kiem_luu: không bấm
# Cách gọi: tool chạy (không chờ), hook window.__itaThu.bamLuuThu hiện ra lúc itaAudit bắt đầu → trang gọi nó ngay khi lá chắn còn đang bật.
# Chạy: python3 -I kiem/test_luu_m2.py   (cần google-chrome)
import html, json, pathlib, re, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
TRANG = """<!doctype html><meta charset="utf-8">
<body>
  <nav class="navigation" style="position:fixed;left:0;top:0;width:180px;height:900px">
    <a href="/87">Trang chủ</a><a href="/87/a">Mục A</a>
  </nav>
  <main style="margin-left:200px"><h1>Trang chủ</h1>
    <div id="f"><label>Ghi chú <input name="note" value="a"></label> <label>CCCD <input name="cccd" value="012345678901"></label>
      <button id="luu">Lưu</button> <button>Hủy</button><div id="b"></div></div></main>
  <script>history.replaceState(null, '', '/87'); window.__orig = window.fetch; window.__itaThu = {};
    document.addEventListener('click', e => {
      const b = e.target.closest('#luu');
      if (b) fetch('/api/luu', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ note: 'a', cccd: '012345678901' }) })
        .catch(() => { document.getElementById('b').innerHTML = '<div role="alert">Không lưu được</div>'; });
      const a = e.target.closest('a[href]'); if (a) { e.preventDefault(); history.pushState(null, '', a.getAttribute('href')); } }, true);</script>
  <script>window.__itaHoSo = %s</script>
  <script src="tool.js"></script>
  <script>
    const ngu = ms => new Promise(r => setTimeout(r, ms));
    addEventListener('load', () => setTimeout(async () => {
      let error = '', kq = null;
      const p = ita.chay({ tenMienDuocChay: null, kiemThietKe: false, kiemNgonTu: false, thuOTim: false, moHoSoDau: false,
        tuTaiBaoCao: false, kiemTroNang: false, moFormDeKiemKe: false, maxFormMoiMan: 0 }).catch(e => { error = e.message; });
      const t0 = Date.now(); while (!window.__itaThu.bamLuuThu && Date.now() - t0 < 20000) await ngu(100);
      try {
        if (%s) { await window.__orig('/api/ping.json'); await ngu(1500); }   // lệnh đi vòng: fetch gốc, bộ chặn không thấy
        kq = await window.__itaThu.bamLuuThu(document.getElementById('f'));
      } catch (e) { error = error || e.message; }
      await p;
      document.body.setAttribute('data-kq', JSON.stringify({ error, kq }));
    }, 300));
  </script>
</body>"""


def chay(ho_so, di_vong=False):
    with tempfile.TemporaryDirectory() as t:
        t = pathlib.Path(t)
        subprocess.run([sys.executable, '-I', str(GOC / 'cong-cu/dong_goi.py'), '--ra', str(t / 'tool.js')], check=True, stdout=subprocess.DEVNULL)
        (t / 'thu.html').write_text(TRANG % (json.dumps(ho_so, ensure_ascii=False), 'true' if di_vong else 'false'), encoding='utf-8')
        (t / 'api').mkdir(); (t / 'api/ping.json').write_text('{}', encoding='utf-8')
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
    return k['kq']


HS = {'ten': 'thử', 'ten_mien': '127.0.0.1', 'post_cho_qua': [], 'kiem_luu': True}
ok = chay(HS)
assert ok['bam'] and len(ok['chan']) == 1 and ok['chan'][0]['lenh'] == 'POST /api/luu', ok
nd = ok['chan'][0]['noi_dung']
assert '"cccd"' in nd and '012345678901' not in nd, nd
assert 'Không lưu được' in ok['loi'], ok
assert not ok['di_vong'], ok
vong = chay(HS, di_vong=True)
assert not vong['bam'] and vong['di_vong'] and 'đi vòng' in vong['ly_do'], vong
khong_co = chay({k: v for k, v in HS.items() if k != 'kiem_luu'})
assert not khong_co['bam'] and 'kiem_luu' in khong_co['ly_do'], khong_co
print('đạt: bấm Lưu → lệnh bị chặn kèm nội dung đã che + chữ báo lỗi · có lệnh đi vòng thì không bấm · không cờ kiem_luu thì không bấm')
