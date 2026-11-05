# Kiểm bước 6 (nút Nạp, bộ đọc, giữ dữ liệu qua tải lại). Chạy: python3 -I kiem/test_buoc6.py
# Bản thử = dist + một dòng xuất root của bảng điều khiển và BO_DOC ra window.__dqtvThu (chỉ trong bản thử).
# Nạp kiem/thu_nap.html (thời gian thật, kiem/mo_chrome.mjs) hai lần trên cùng hồ sơ Chrome, cùng máy chủ thử 127.0.0.1: lần 1 nạp + chạy, lần 2 xem còn không + xoá.
import json, pathlib, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
dist = sorted((GOC / 'dist').glob('dqtv-kiem-tra-*.js'))[-1].read_text(encoding='utf-8')
# từ bước 7d dist kèm sẵn quy trình / TC (window.__dqtvGoiSan, __dqtvTrangThaiQT): gỡ ra để kiểm riêng cơ chế Nạp của bước 6
dist = '\n'.join(x for x in dist.split('\n') if not x.startswith(('window.__dqtvGoiSan = ', 'window.__dqtvTrangThaiQT = ')))
assert dist.rstrip().endswith('})();')
thu = dist.rstrip()[:-len('})();')] + 'window.__dqtvThu = { goc: () => root, BO_DOC };\n})();\n'

with tempfile.TemporaryDirectory() as t:
    t = pathlib.Path(t)
    (t / 'tool.js').write_text(thu, encoding='utf-8')
    (t / 'thu.html').write_text((GOC / 'kiem/thu_nap.html').read_text(encoding='utf-8'), encoding='utf-8')
    so = socket.socket(); so.bind(('127.0.0.1', 0)); cong = so.getsockname()[1]; so.close()
    mc = subprocess.Popen([sys.executable, '-I', '-m', 'http.server', str(cong), '--bind', '127.0.0.1', '--directory', str(t)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    # thời gian thật qua kiem/mo_chrome.mjs: IndexedDB treo ở chế độ thời gian ảo của --dump-dom
    def mo(buoc):
        r = subprocess.run(['node', str(GOC / 'kiem/mo_chrome.mjs'), 'http://127.0.0.1:%d/thu.html?buoc=%d' % (cong, buoc), str(t / 'p'), '150'],
                           capture_output=True, text=True, timeout=200)
        assert r.returncode == 0 and r.stdout, 'Chrome không trả kết quả (lần %d): %s' % (buoc, r.stderr[-300:])
        return json.loads(r.stdout)
    try:
        time.sleep(0.8)
        k1 = mo(1); k2 = mo(2)
    finally:
        mc.terminate()

print('lần 1:', json.dumps(k1, ensure_ascii=False, indent=1))
print('lần 2:', k2)
assert k1['loi_js'] == 'không' and k2['loi_js'] == 'không'
assert 'loi_trang_thu' not in k1 and 'loi_trang_thu' not in k2, (k1.get('loi_trang_thu'), k2.get('loi_trang_thu'))
assert k1['truoc'] == [], 'chưa nạp mà đã có bảng đặc tả'
assert k1['nut'] == [True, True], 'bảng điều khiển thiếu nút Nạp tệp / Nạp thư mục'
assert k1['bo_doc'] == ['dac-ta-json-2.1', 'quy-trinh-md', 'v7-tc-csv'], k1['bo_doc']   # bước 7 thêm hai bộ đọc: tài liệu quy trình, TC v7 (CSV)
print('đạt: chưa nạp gì thì không có bảng đặc tả; bảng điều khiển có nút «Nạp tệp», «Nạp thư mục»')
assert k1['nap']['dung'] == [{'tep': 'mau-thu.json', 'bo_doc': 'dac-ta-json-2.1', 'so_bang': 1}], k1['nap']['dung']
kn = dict(x.split(': ', 1) for x in k1['nap']['khong_nhan'])
assert set(kn) == {'MaTran_UC_TC_v7.zip', 'tc.csv', 'khong-phai-dac-ta.json', 'hong.json', 'mot-bang-sai.json'}, kn
assert kn['MaTran_UC_TC_v7.zip'].startswith('tệp nén'), kn
print('đạt: nhận đúng 1 tệp đặc tả; 5 tệp lạ (zip, csv, JSON khác khuôn, JSON hỏng, tệp có 1 bảng sai khuôn) báo «không nhận ra», không dùng')
assert k1['sau'] == ['MAU: TQ'], k1['sau']
dn = k1['chay']['du_lieu_nap']
assert dn and dn[0]['tep'] == 'mau-thu.json' and dn[0]['so_bang'] == 1, dn
assert any(d.startswith('ĐẠT MAU.B1.DUNG | tệp mau-thu.json › bảng MAU › B1.DUNG') for d in k1['chay']['dong']), k1['chay']['dong']
print('đạt: nạp xong thì phần đối chiếu chạy; báo cáo ghi tệp đã nạp và căn cứ trỏ về tệp đó')
assert k2['sau_tai_lai'] == ['MAU: TQ'] and k2['xem'] == ['mau-thu.json'], k2
assert k2['sau_xoa'] == [] and k2['xem_sau_xoa'] == 0, k2
print('đạt: tải lại trang vẫn còn dữ liệu đã nạp; dqtv.xoaNap() xoá hết')
