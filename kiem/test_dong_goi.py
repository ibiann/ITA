# Kiểm tệp dist sau khi đóng gói. Chạy: python3 -I kiem/test_dong_goi.py
# Đạt khi: không còn dữ liệu quy trình / UC / TC tự sinh; sổ lỗi chỉ còn UI-01; khoá lưu mới; cú pháp đúng;
# may/ chỉ khác phần mã 3.26 ở số dòng đã định; mã không còn chữ riêng DQTV; nạp được trong Chrome có và không có hồ sơ dự án;
# chặn ghi: chỉ POST tới đường dẫn trong hồ sơ được đi, không công tắc nào mở được ghi.
import difflib, html, json, pathlib, re, shutil, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
NEN = pathlib.Path.home() / 'Downloads/dqtv-kiem-tra-dacta-3.26.js'
dist = sorted((GOC / 'dist').glob('dqtv-kiem-tra-*.js'))
assert dist, 'dist/ trống: chạy cong-cu/dong_goi.py'
d = dist[-1].read_text(encoding='utf-8')
dong = d.split('\n')

# 1. không còn khối dữ liệu tự sinh (chỉ xét dòng gán dữ liệu, không xét chú thích trong mã)
gan = [x for x in dong if x.startswith('window.__dqtv') and ' = ' in x[:40]]
assert all(not x.startswith(('window.__dqtvDacTaNap =', 'window.__dqtvDanhMucTC =')) for x in gan), 'còn dữ liệu đặc tả / danh mục TC'
for chu in ('tu-sinh', 'TR-046', '"tc_dong"', '"nguon_da_duyet"', '"ban_giao"', '"tc_nhap"'):
    assert not any(chu in x for x in gan), 'dòng dữ liệu còn: ' + chu
print('đạt: không còn quy trình / UC / TC tự sinh')

# 2. sổ lỗi chỉ còn UI-01
qt = [x for x in gan if x.startswith('window.__dqtvQuyTac =')]
assert len(qt) == 1 and '"UI-01"' in qt[0] and len(re.findall(r'"ma":"', qt[0])) == 1, 'sổ lỗi sai'
print('đạt: sổ lỗi chỉ còn UI-01')

# 3. khoá lưu mới, không đọc lại khoá của 3.25 / 3.26
assert ".v325'" not in d and "'dqtv.dacta.v3261'" in d, 'khoá lưu chưa đổi'
print('đạt: khoá lưu trình duyệt đã đổi')

# 4. cú pháp
subprocess.run(['node', '--check', str(dist[-1])], check=True)
print('đạt: node --check')

# 5. may/ chỉ khác 3.26 ở các dòng đã định
with tempfile.TemporaryDirectory() as t:
    subprocess.run([sys.executable, '-I', str(GOC / 'cong-cu/tach.py'), str(NEN), '--may', t], check=True, capture_output=True)
    khac, moi = [], []
    for p in sorted((GOC / 'may').glob('*.js')):
        if not (pathlib.Path(t) / p.name).exists():
            moi.append(p.name); continue   # tệp mới, 3.26 không có
        a = (pathlib.Path(t) / p.name).read_text(encoding='utf-8').splitlines()
        b = p.read_text(encoding='utf-8').splitlines()
        khac += [p.name + ': ' + x for x in difflib.unified_diff(a, b, lineterm='', n=0) if x[:1] == '+' and not x.startswith('+++')]
for x in khac:
    print('  đổi:', x[:140])
# bước 2: 8 dòng; bước 3: 25 dòng; bước 4: 18 dòng (chặn ghi); bước 5: 77 dòng (quy tắc căn cứ)
# bước 6: SO_B6 dòng trong tệp cũ (nút Nạp, khởi động, báo cáo) + tệp mới 70-nap.js
# bước 8: SO_B8 dòng thêm (kiểm ô theo khai báo giới hạn của app: 120 dòng ở 30-loi-kiem.js, 1 dòng mục báo cáo ở 60-bao-cao.js)
# bước 7c + 9: SO_B9 dòng (30-loi-kiem.js 1 dòng do_phu_quy_trinh; 50-doi-chieu-dac-ta.js 7 dòng: danh mục TC v7 sau ghép và lý do TC không chạy; 60-bao-cao.js 1 dòng mục «Độ phủ quy trình»);
# phần còn lại của 7c/7d nằm ở 70-nap.js (tệp mới) và bo-doc/
SO_B4, SO_B5, SO_B6, SO_B8, SO_B9 = 18, 77, 8, 121, 9
assert moi == ['70-nap.js'], 'tệp mới trong may/: %s' % moi
assert len(khac) == 33 + SO_B4 + SO_B5 + SO_B6 + SO_B8 + SO_B9, 'số dòng đổi so với 3.26 là %d' % len(khac)
print('đạt: may/ khác 3.26 %d dòng đã định, thêm tệp mới %s' % (len(khac), ', '.join(moi)))

# 6. dòng mã (không tính chú thích) trong may/ không còn chữ riêng DQTV
RIENG = re.compile(r'linksafe|viec-cua-toi|Việc của tôi|YC-[A-Z]+-\d|/dqtv\b|\[A-ZĐ\]\{2,3\}')
con = [p.name + ':' + str(i) for p in sorted((GOC / 'may').glob('*.js')) + sorted((GOC / 'bo-doc').glob('*.js'))
       for i, x in enumerate(p.read_text(encoding='utf-8').split('\n'), 1)
       if RIENG.search(x) and not re.match(r'\s*(\*|//|/\*)', x)]
assert not con, 'mã còn chữ riêng DQTV: ' + ', '.join(con)
print('đạt: mã trong may/ và bo-doc/ không còn chữ riêng DQTV')

# 7. nạp thử trong Chrome chạy ngầm: có hồ sơ (dist) và không có hồ sơ (bỏ dòng __dqtvHoSo)
def nap(noi_dung):
    with tempfile.TemporaryDirectory() as t:
        t = pathlib.Path(t)
        (t / 'tool.js').write_text(noi_dung, encoding='utf-8')
        (t / 'thu.html').write_text((GOC / 'kiem/thu_trinh_duyet.html').read_text(encoding='utf-8').replace('TOOL', 'tool.js'), encoding='utf-8')
        r = subprocess.run(['google-chrome', '--headless=new', '--disable-gpu', '--no-first-run', '--user-data-dir=' + str(t / 'p'),
                            '--virtual-time-budget=4000', '--dump-dom', (t / 'thu.html').as_uri()], capture_output=True, text=True, timeout=90)
        m = re.search(r'data-kq="([^"]*)"', r.stdout)
        assert m, 'Chrome không trả kết quả'
        return json.loads(html.unescape(m.group(1)))
if shutil.which('google-chrome'):
    co = nap(d)
    khong = nap('\n'.join(x for x in dong if not x.startswith('window.__dqtvHoSo =')))
    print('  có hồ sơ:', co); print('  không hồ sơ:', khong)
    for k in (co, khong):
        assert k['co_dqtv'] == 'object' and k['bang_dieu_khien'] and k['loi_js'] == 'không'
        assert k['co_DacTaNap'] == 'undefined' and k['co_DanhMucTC'] == 'undefined'
    assert co['ten_mien'] == '/^dqtv\\.linksafe\\.vn$/i' and co['vai_nhan_ra'] == 'MAU: PK'
    assert khong['ten_mien'] == 'null' and khong['vai_nhan_ra'] == 'MAU: ngoài đặc tả'
    print('đạt: nạp được cả có và không có hồ sơ; hồ sơ quyết định khoá tên miền và cách nhận vai')
else:
    print('CHƯA KIỂM: không có google-chrome')


# 8. chặn ghi, chạy trên máy chủ thử 127.0.0.1 (máy chủ không nhận POST nên trả 501: thấy 501 là lệnh đã đi qua lá chắn)
def nap_http(noi_dung, trang):
    with tempfile.TemporaryDirectory() as t:
        t = pathlib.Path(t)
        (t / 'tool.js').write_text(noi_dung, encoding='utf-8')
        (t / 'thu.html').write_text((GOC / 'kiem' / trang).read_text(encoding='utf-8'), encoding='utf-8')
        so = socket.socket(); so.bind(('127.0.0.1', 0)); cong = so.getsockname()[1]; so.close()
        may_chu = subprocess.Popen([sys.executable, '-I', '-m', 'http.server', str(cong), '--bind', '127.0.0.1', '--directory', str(t)],
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            time.sleep(0.8)
            r = subprocess.run(['google-chrome', '--headless=new', '--disable-gpu', '--no-first-run', '--user-data-dir=' + str(t / 'p'),
                                '--virtual-time-budget=8000', '--dump-dom', 'http://127.0.0.1:%d/thu.html' % cong], capture_output=True, text=True, timeout=120)
        finally:
            may_chu.terminate()
        m = re.search(r'data-kq="([^"]*)"', r.stdout)
        assert m, 'Chrome không trả kết quả'
        return json.loads(html.unescape(m.group(1)))
if shutil.which('google-chrome'):
    # hồ sơ có ten_mien dqtv.linksafe.vn; trang thử chạy trên 127.0.0.1 nên lần chạy kiểm truyền tenMienDuocChay: null
    k = nap_http(d, 'thu_chan_ghi.html')
    print('  quyết định:', k['quyet_dinh']); print('  gửi thật:', k['gui_that']); print('  khi chạy:', k['khi_chay']); print('  lỗi JS:', k['loi_js'])
    di = {'POST /api/session', 'POST /api/search?q=a', 'GET /api/duty-registrations/1'}
    for ca, kq in k['quyet_dinh'].items():
        assert kq == ('ok' if ca in di else 'block'), 'sai: ' + ca + ' = ' + kq
    assert k['gui_that'] == {'/api/session': 'đi qua (501)', '/api/duty-registrations/1/extend-age': 'bị chặn'}, k['gui_that']
    assert k['khi_chay'] == {'PUT /api/units/1': 'block', 'POST /api/units/1/approve': 'block', 'POST /api/search': 'ok'}, k['khi_chay']
    k0 = nap_http('\n'.join(x for x in dong if not x.startswith('window.__dqtvHoSo =')), 'thu_chan_ghi.html')
    assert k0['quyet_dinh']['POST /api/session'] == 'block' and k0['quyet_dinh']['POST /api/search?q=a'] == 'block', k0['quyet_dinh']
    print('đạt: chỉ POST /api/session và /api/search đi qua; extend-age, extend-deadline, renew, PUT/PATCH/DELETE, tên miền khác bị chặn; công tắc mở ghi không có tác dụng; không hồ sơ thì chặn mọi POST')
else:
    print('CHƯA KIỂM: không có google-chrome')
