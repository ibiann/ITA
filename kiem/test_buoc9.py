# Kiểm bước 7d + 9: đóng gói sẵn quy trình / TC v7 / trạng thái quy trình; không bấm Nạp vẫn có đủ. Chạy: python3 -I kiem/test_buoc9.py
# Dựng bản thử bằng cong-cu/dong_goi.py (--ra, không ghi đè dist/) + một dòng xuất biến nội bộ ra window.__dqtvThu; chạy kiem/thu_goi_san.html
# trong Chrome thời gian thật (kiem/mo_chrome.mjs: IndexedDB treo ở chế độ thời gian ảo).
import json, pathlib, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
subprocess.run([sys.executable, '-I', str(GOC / 'cong-cu/sinh_trang_thai_qt.py')], check=True)
tt = json.loads((GOC / 'du-an/dqtv/trang-thai-quy-trinh.json').read_text(encoding='utf-8'))
assert tt['_nguon']['app'] and tt['tai_lieu_app_khong_co'] and tt['app_chua_co_tai_lieu']
print('đạt: tệp trạng thái sinh từ', tt['_nguon']['app'])
with tempfile.TemporaryDirectory() as t:
    t = pathlib.Path(t)
    subprocess.run([sys.executable, '-I', str(GOC / 'cong-cu/dong_goi.py'), '--ra', str(t / 'dist.js')], check=True, stdout=subprocess.DEVNULL)
    dist = (t / 'dist.js').read_text(encoding='utf-8')
    assert 'window.__dqtvGoiSan = ' in dist and 'window.__dqtvTrangThaiQT = ' in dist
    print('bản đóng gói: %.2f MB' % (len(dist.encode('utf-8')) / 1e6))
    (t / 'tool.js').write_text(dist.rstrip()[:-len('})();')] + 'window.__dqtvThu = { sangHTML, docDacTa, NAP: () => NAP_DA_DUNG, DM: () => DM_V7, DP: () => DO_PHU };\n})();\n', encoding='utf-8')
    (t / 'thu.html').write_text((GOC / 'kiem/thu_goi_san.html').read_text(encoding='utf-8'), encoding='utf-8')
    so = socket.socket(); so.bind(('127.0.0.1', 0)); cong = so.getsockname()[1]; so.close()
    mc = subprocess.Popen([sys.executable, '-I', '-m', 'http.server', str(cong), '--bind', '127.0.0.1', '--directory', str(t)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(0.8)
        r = subprocess.run(['node', str(GOC / 'kiem/mo_chrome.mjs'), 'http://127.0.0.1:%d/thu.html' % cong, str(t / 'p'), '240'], capture_output=True, text=True, timeout=300)
    finally:
        mc.terminate()
assert r.stdout, 'Chrome không trả kết quả: ' + r.stderr[-500:]
k = json.loads(r.stdout)
print(json.dumps(k, ensure_ascii=False, indent=1))
assert k['loi_js'] == 'không' and not k['loi_chay']
assert k['nap']['goi_san'] == k['nap']['so_tep'] and k['nap']['theo_bo_doc'].get('quy-trinh-md') == 119 and sorted(k['nap']['so_muc_tc']) == [1006, 44124]
print('đạt: không bấm Nạp vẫn có 119 tài liệu quy trình, 44.124 TC v7 và 1.006 TC bộ đề xuất 05/11 (đóng gói sẵn), nạp xong sau %s giây' % k['giay_nap'])
assert k['dm']['so_tc'] == 21425 + 285 + 245 + 15 and k['dm']['nhom'].get('QUY TRÌNH', 0) > 0
assert k['so_bang_dac_ta'] == 112, k['so_bang_dac_ta']   # bước 11: + bảng KHUNG (TC KHUNG-CHUNG.* mọi vai) + 7 quy trình chỉ có TC giao diện chung chạy được   # 102 bảng ghép (test_buoc7) trừ 3 quy trình app không còn (mọi TC không chạy nên không dựng bảng), cộng 5 quy trình của bộ đề xuất 05/11
assert k['dm_mau'][0] and 'campaign-registration.yaml' in k['dm_mau'][0]['ly_do'] and '214' in k['dm_mau'][0]['ly_do']
assert k['dm_mau'][1] and 'markDecisionUsed' in k['dm_mau'][1]['ly_do'] and '204' in k['dm_mau'][1]['ly_do']
print('đạt: danh mục TC ghép tài liệu (21.425 TC M1 6 loại của v7 + 285 của bộ đề xuất); TC của quy trình app đã gỡ / bước app không có → chưa chạy, ghi lý do và số báo cáo rà soát')
assert k['do_phu']['chua_co_tc_v7'] == []   # 5 quy trình mới đã có TC từ bộ đề xuất 05/11 (PM cho tự duyệt)
assert sorted(k['do_phu']['tai_lieu_app_khong_co']) == ['7.campaign-registration', '8.bureau-receipt-notice', 'ngoai63.curriculum-dossier'] and k['do_phu']['app_chua_co_tai_lieu'] == 5
assert k['kq_co_do_phu'] and all(k['html'].values()), k['html']
print('đạt: kết quả lần chạy và báo cáo HTML có mục «Độ phủ quy trình»; dòng «Dữ liệu đã nạp» gom theo bộ đọc')
