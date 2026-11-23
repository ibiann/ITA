# [1.7.2] Admin (superadmin) đứng trong cuộc họp /87: menu cuộc họp có thêm mục «Bảng điều hành» dẫn ra trang tổ chức «/».
# Lỗi gốc (báo cáo ita-administrator-2026-11-19-09-19): công cụ bấm mục đó, rời cuộc họp, menu cuộc họp mất,
# 13 mục còn lại «không mở được» sau 0,0 giây, lần chạy xong trong 13 giây với «1 màn đã kiểm».
# Đạt khi:
#   A. app openslides, bắt đầu ở /87/: «Bảng điều hành» bị bỏ qua có lý do; kiểm đủ Trang chủ, Chương trình nghị sự, Kiến nghị.
#   B. app thường (không khai kieu_app), bắt đầu ở /88/: không bỏ mục nào; «Bảng điều hành» vẫn được kiểm; bấm xong lỡ rời
#      cuộc họp thì công cụ quay về trang bắt đầu và tìm lại mục menu, nên các mục sau vẫn được kiểm.
#   C. báo cáo ghi lý do cho mục không kiểm được (không để danh sách trơ tên mục).
# Chạy: python3 -I kiem/test_cuoc_hop_openslides.py   (cần google-chrome)
import html, json, pathlib, re, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
# Trang giả: menu cuộc họp chỉ hiện khi đường dẫn nằm trong /<số>/; ra ngoài thì chỉ còn trang tổ chức, không còn menu (như PMS thật).
TRANG = """<!doctype html><meta charset="utf-8">
<body><div id="app"></div>
  <script>
    const goc = '/' + location.pathname.split('/')[1];
    const MAN = { [goc + '/']: 'Trang chủ', [goc + '/agenda']: 'Chương trình nghị sự', [goc + '/motions']: 'Kiến nghị' };
    // như PMS thật: chuyển mục trong cuộc họp chỉ đổi phần chính, menu giữ nguyên; ra ngoài thì menu mất, vào lại thì menu dựng mới (mất dấu công cụ gắn)
    const ve = () => { const p = location.pathname, app = document.getElementById('app');
      if (!p.startsWith(goc)) { app.innerHTML = '<main><h1>Bảng điều hành</h1><p>Danh sách cuộc họp của tổ chức</p><table><thead><tr><th>Cuộc họp</th></tr></thead><tbody><tr><td>ITA</td></tr></tbody></table></main>'; return; }
      if (!app.querySelector('nav')) app.innerHTML = '<nav class="navigation" style="position:fixed;left:0;top:0;width:180px;height:900px">'
        + '<a href="/">Bảng điều hành</a><a href="' + goc + '/">Trang chủ</a><a href="' + goc + '/agenda">Chương trình nghị sự</a><a href="' + goc + '/motions">Kiến nghị</a></nav><main style="margin-left:200px"></main>';
      app.querySelector('main').innerHTML = '<h1>' + (MAN[p] || 'Trang chủ') + '</h1><table><thead><tr><th>Tên</th></tr></thead><tbody><tr><td>Một</td></tr></tbody></table>'; };
    document.addEventListener('click', e => { const a = e.target.closest('a[href]'); if (a) { e.preventDefault(); history.pushState(null, '', a.getAttribute('href')); ve(); } });
    addEventListener('popstate', ve); ve();
  </script>
  __HO_SO__
  <script src="/tool.js"></script>
  <script>
    addEventListener('load', () => setTimeout(async () => {
      let error = '', kq = null;
      try { kq = await ita.chay({ kiemNgonTu: false, kiemThietKe: false, kiemKeTruong: false, thuOTim: false, moHoSoDau: false, tuTaiBaoCao: false, kiemTroNang: false, thuLoiDoc: false }); } catch (e) { error = e.message; }
      document.body.setAttribute('data-kq', JSON.stringify({ error, man: kq ? (kq.man_da_kiem || []).map(r => r.tab) : [],
        khong_mo: kq ? (kq.menu_khong_mo_duoc || []) : [], bo_qua: kq ? (kq.bo_qua_khong_bam || []).map(x => ({ chu: x.chu, ly_do: x.ly_do })) : [],
        so_muc: kq ? kq.so_muc_menu : -1,
        // C: báo cáo của một lần chạy hỏng như lỗi gốc (1/14 mục kiểm được, 13 mục không mở được)
        html_hong: kq && window.__itaThu ? window.__itaThu.html(Object.assign({}, kq, { so_muc_menu: 14, so_man_da_kiem: 1,
          menu_khong_mo_duoc: Array.from({ length: 13 }, (_, i) => 'Mục ' + (i + 1) + ' (không thấy mục menu sau khi quay về /87/; trang đang ở /meetings)') })) : '' }));
    }, 300));
  </script>
</body>"""
HO_SO = '<script>window.__itaHoSo = %s</script>'
CA = {   # thư mục bắt đầu → (hồ sơ dự án, lời nhắc)
    '87': {'ten': 'thử cuộc họp openslides', 'ten_mien': '127.0.0.1', 'kieu_app': 'openslides', 'post_cho_qua': ['/system/auth/who-am-i']},
    '88': {'ten': 'thử app thường', 'ten_mien': '127.0.0.1', 'post_cho_qua': []},
}


def chay(thu_muc):
    with tempfile.TemporaryDirectory() as t:
        t = pathlib.Path(t)
        subprocess.run([sys.executable, '-I', str(GOC / 'cong-cu/dong_goi.py'), '--ra', str(t / 'dist.js')], check=True, stdout=subprocess.DEVNULL)
        dist = (t / 'dist.js').read_text(encoding='utf-8').rstrip()
        assert dist.endswith('})();')
        (t / 'tool.js').write_text(dist[:-len('})();')] + 'window.__itaThu = { html: sangHTML };\n})();\n', encoding='utf-8')   # như test_bao_cao_ro.py: lộ hàm dựng báo cáo để thử
        for ma, ho_so in CA.items():
            (t / ma).mkdir()
            (t / ma / 'index.html').write_text(TRANG.replace('__HO_SO__', HO_SO % json.dumps(ho_so)), encoding='utf-8')
        so = socket.socket(); so.bind(('127.0.0.1', 0)); cong = so.getsockname()[1]; so.close()
        mc = subprocess.Popen([sys.executable, '-I', '-m', 'http.server', str(cong), '--bind', '127.0.0.1', '--directory', str(t)],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            time.sleep(0.8)
            r = subprocess.run(['google-chrome', '--headless=new', '--no-sandbox', '--disable-gpu', '--dump-dom', '--user-data-dir=' + str(t / 'p'),
                                '--virtual-time-budget=90000', 'http://127.0.0.1:%d/%s/' % (cong, thu_muc)], capture_output=True, text=True, timeout=240)
        finally:
            mc.terminate()
    m = re.search(r'<body[^>]*\bdata-kq="([^"]*)"', r.stdout)
    assert m, 'Chrome chưa ghi kết quả (' + thu_muc + '): ' + r.stdout[-800:]
    return json.loads(html.unescape(m.group(1)))


# A. app openslides, bắt đầu trong cuộc họp
a = chay('87')
print('A (openslides /87/): kiểm', a['man'], '· không mở được', a['khong_mo'], '· bỏ qua', a['bo_qua'])
assert not a['error'], a['error']
for ten in ('Trang chủ', 'Chương trình nghị sự', 'Kiến nghị'):
    assert ten in a['man'], 'A: không kiểm «%s» (mục trong cuộc họp): %s — lỗi gốc: bấm «Bảng điều hành» rồi mất menu cuộc họp' % (ten, a['man'])
assert 'Bảng điều hành' not in a['man'], 'A: «Bảng điều hành» dẫn ra ngoài cuộc họp mà vẫn bị bấm và kiểm'
assert not a['khong_mo'], 'A: còn mục «không mở được»: %s' % a['khong_mo']
bq = [x for x in a['bo_qua'] if x['chu'] == 'Bảng điều hành']
assert bq and 'ngoài cuộc họp' in bq[0]['ly_do'], 'A: «Bảng điều hành» phải nằm trong «Không bấm / bỏ qua» với lý do «ngoài cuộc họp»: %s' % a['bo_qua']
print('đạt A: bỏ «Bảng điều hành» có lý do; kiểm đủ 3 mục trong cuộc họp')

# B. app thường: không bỏ mục nào, bấm lỡ rời cuộc họp thì quay về tìm lại mục
b = chay('88')
print('B (app thường /88/): kiểm', b['man'], '· không mở được', b['khong_mo'])
assert not b['error'], b['error']
for ten in ('Bảng điều hành', 'Trang chủ', 'Chương trình nghị sự', 'Kiến nghị'):
    assert ten in b['man'], 'B: không kiểm «%s» — rời cuộc họp rồi không quay về tìm lại mục menu: %s / chưa mở: %s' % (ten, b['man'], b['khong_mo'])
assert not b['khong_mo'], 'B: còn mục «không mở được»: %s' % b['khong_mo']
print('đạt B: app thường kiểm đủ 4 mục kể cả «Bảng điều hành»; lỡ rời cuộc họp vẫn quay về và kiểm các mục sau')

# C. báo cáo của lần chạy hỏng nói rõ, không để người đọc tưởng đã kiểm xong
h = html.unescape(b['html_hong'])
assert 'CHỈ KIỂM ĐƯỢC 1/14 MỤC MENU' in h, 'C: dòng đầu báo cáo không cảnh báo «chỉ kiểm được 1/14 mục menu»'
assert 'trang đang ở /meetings' in h, 'C: mục menu không mở được phải kèm lý do trong báo cáo'
print('đạt C: báo cáo lần chạy hỏng có dòng đỏ «chỉ kiểm được 1/14 mục menu» và lý do từng mục')
