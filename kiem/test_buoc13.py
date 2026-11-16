# Kiểm bước 13b (hồ sơ dự án nạp được, chưa có hồ sơ thì không chạy). Chạy: python3 -I kiem/test_buoc13.py
# Bản thử = dist/ita.js (chỉ máy kiểm, không gói dự án) + một dòng xuất CO ra window.__itaThu (chỉ trong bản thử).
# Nạp kiem/thu_buoc13.html (thời gian thật, kiem/mo_chrome.mjs) hai lần trên cùng hồ sơ Chrome, máy chủ thử 127.0.0.1.
import json, pathlib, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
dist = (GOC / 'dist/ita.js').read_text(encoding='utf-8')
assert not any(x.startswith(('window.__itaHoSo =', 'window.__itaGoiSan =')) for x in dist.split('\n')), 'dist/ita.js không được gói dữ liệu dự án'
assert dist.rstrip().endswith('})();')
thu = dist.rstrip()[:-len('})();')] + 'window.__itaThu = { co: () => CO };\n})();\n'

with tempfile.TemporaryDirectory() as t:
    t = pathlib.Path(t)
    (t / 'tool.js').write_text(thu, encoding='utf-8')
    (t / 'thu.html').write_text((GOC / 'kiem/thu_buoc13.html').read_text(encoding='utf-8'), encoding='utf-8')
    so = socket.socket(); so.bind(('127.0.0.1', 0)); cong = so.getsockname()[1]; so.close()
    mc = subprocess.Popen([sys.executable, '-I', '-m', 'http.server', str(cong), '--bind', '127.0.0.1', '--directory', str(t)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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
assert k1['loi_js'] == 'không' and k2['loi_js'] == 'không', (k1['loi_js'], k2['loi_js'])
assert 'loi_trang_thu' not in k1 and 'loi_trang_thu' not in k2, (k1.get('loi_trang_thu'), k2.get('loi_trang_thu'))
assert k1['truoc'] == {'ho_so': 'undefined', 'ten_mien': 'null', 'session': 'block', 'khac': 'block'}, k1['truoc']
assert k1['chay_khong_ho_so'].startswith('Không chạy: chưa có hồ sơ dự án'), k1['chay_khong_ho_so']
print('đạt: chưa có hồ sơ → không chạy kiểm, mọi POST bị chặn')
assert k1['nap1'] == [{'tep': 'du-an/mau/ho-so.json', 'bo_doc': 'ho-so', 'so_bang': 0}], k1['nap1']
assert k1['sau_nap1'] == {'ten_mien': '/^khong-khop\\.vidu$/i', 'session': 'ok', 'khac': 'block'}, k1['sau_nap1']
assert k1['chay_sai_mien'] == {'loi': True, 'co_ket_qua': False}, k1['chay_sai_mien']
print('đạt: nạp ho-so.json bằng «Nạp thư mục» → khoá tên miền và danh sách POST lấy từ hồ sơ đã nạp; sai tên miền thì không chạy')
cd = k1['chay_dung_mien']
assert cd['so_man'] and cd['so_man'] >= 1 and 'du-an/mau/ho-so.json · ho-so' in cd['du_lieu_nap'], cd
print('đạt: hồ sơ đúng tên miền → chạy, báo cáo ghi hồ sơ trong «Dữ liệu đã nạp»')
assert k2['sau_tai_lai'] == {'ho_so': 'MẪU THỬ', 'ten_mien': '/^127\\.0\\.0\\.1$/i', 'session': 'ok'}, k2['sau_tai_lai']
assert k2['xem_sau_xoa'] == 0, k2
print('đạt: tải lại trang vẫn dùng hồ sơ đã nạp; ita.xoaNap() xoá hết')
