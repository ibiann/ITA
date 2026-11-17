# Kiểm việc 1 (an toàn khi bấm): ITA bấm những nút nào trên một màn có «Thêm mới», nút nghiệp vụ «Trình ký»
# và «Đặt lại về cài đặt mặc định».
#  - có hồ sơ dự án: bấm «Thêm mới» và «Trình ký» (đọc form nghiệp vụ, lá chắn chặn ghi), KHÔNG bấm «Đặt lại…»
#  - giao diện thuần (hồ sơ tạm): chỉ bấm «Thêm mới»
# Chạy: python3 -I kiem/test_nut_nghiep_vu.py   (cần google-chrome)
import html, json, pathlib, re, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
TRANG = """<!doctype html><meta charset="utf-8">
<body>
  <nav class="navigation" style="position:fixed;left:0;top:0;width:180px;height:900px">
    <a href="/87">Trang chủ</a><a href="/87/a">Mục A</a><a href="/87/b">Mục B</a>
  </nav>
  <main style="margin-left:200px">
    <h1>Trang chủ</h1>
    <div class="toolbar"><button>Thêm mới</button> <button>Trình ký</button> <button>Đặt lại về cài đặt mặc định</button></div>
  </main>
  <script>history.replaceState(null, '', '/87'); window.__bam = [];
    document.addEventListener('click', e => { const b = e.target.closest('button'); if (b) window.__bam.push(b.textContent.trim());
      const a = e.target.closest('a[href]'); if (a) { e.preventDefault(); history.pushState(null, '', a.getAttribute('href')); } }, true);</script>
  <script>window.__itaHoSo = %s</script>
  <script src="tool.js"></script>
  <script>
    addEventListener('load', () => setTimeout(async () => {
      let error = '';
      try { await ita.chay({ tenMienDuocChay: null, kiemThietKe: false, kiemNgonTu: false,
        thuOTim: false, moHoSoDau: false, tuTaiBaoCao: false, kiemTroNang: false }); } catch (e) { error = e.message; }
      document.body.setAttribute('data-kq', JSON.stringify({ bam: [...new Set(window.__bam)], error }));
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
    return k['bam']


co_ho_so = chay({'ten': 'thử', 'ten_mien': '127.0.0.1', 'post_cho_qua': []})
assert 'Thêm mới' in co_ho_so and 'Trình ký' in co_ho_so, co_ho_so
assert not any(x.startswith('Đặt lại') for x in co_ho_so), co_ho_so
thuan = chay({'ten': 'thử (giao diện thuần)', 'ten_mien': '127.0.0.1', 'post_cho_qua': [], 'giao_dien_thuan': True})
assert thuan == ['Thêm mới'], thuan
print('đạt: có hồ sơ bấm', co_ho_so, '· giao diện thuần chỉ bấm', thuan, '· không bao giờ bấm «Đặt lại…»')
