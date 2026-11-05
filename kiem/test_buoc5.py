# Kiểm bước 5 (quy tắc căn cứ). Chạy: python3 -I kiem/test_buoc5.py
# Dựng bản thử = dist + một dòng xuất hàm nội bộ ra window.__dqtvThu (chỉ trong bản thử, không có trong dist),
# nạp kiem/thu_can_cu.html trên máy chủ thử 127.0.0.1 trong Chrome chạy ngầm.
import html, json, pathlib, re, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
dist = sorted((GOC / 'dist').glob('dqtv-kiem-tra-*.js'))[-1].read_text(encoding='utf-8')
assert dist.rstrip().endswith('})();'), 'dist không kết thúc bằng })();'
thu = dist.rstrip()[:-len('})();')] + 'window.__dqtvThu = { doiChieuDacTa, sangHTML, canCuKiem };\n})();\n'

with tempfile.TemporaryDirectory() as t:
    t = pathlib.Path(t)
    (t / 'tool.js').write_text(thu, encoding='utf-8')
    (t / 'thu.html').write_text((GOC / 'kiem/thu_can_cu.html').read_text(encoding='utf-8'), encoding='utf-8')
    so = socket.socket(); so.bind(('127.0.0.1', 0)); cong = so.getsockname()[1]; so.close()
    mc = subprocess.Popen([sys.executable, '-I', '-m', 'http.server', str(cong), '--bind', '127.0.0.1', '--directory', str(t)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(0.8)
        r = subprocess.run(['google-chrome', '--headless=new', '--disable-gpu', '--no-first-run', '--user-data-dir=' + str(t / 'p'), '--window-size=1280,900',
                            '--virtual-time-budget=60000', '--dump-dom', 'http://127.0.0.1:%d/thu.html' % cong], capture_output=True, text=True, timeout=180)
    finally:
        mc.terminate()
m = re.search(r'data-kq="([^"]*)"', r.stdout)
assert m, 'Chrome không trả kết quả'
k = json.loads(html.unescape(m.group(1)))

print('căn cứ phép kiểm chung:', k['can_cu_kiem'])
assert k['can_cu_kiem'] == {'api_loi=500 /api/x': 'sự việc', 'o_khong_nhan=1 ô': 'chuẩn', 'phan_tram_vo_ly=150%': 'tự đặt', 'chu_la=NaN': 'sự việc',
                            'chu_la=firstName': 'tự đặt', 'tran_ngang=40px': 'tự đặt', 'nut_chinh_nhieu=3': 'tự đặt'}
print('đạt: phép kiểm chung có căn cứ rõ; ngưỡng tự đặt không tính là lỗi')

for d in k['dong']: print('  ', d['kq'].ljust(10), d['ma'].ljust(26), '| căn cứ:', d['can_cu'] or '—')
kl = [d for d in k['dong'] + k['dong_khi_khai_uc'] if d['kq'] in ('ĐẠT', 'LỆCH', 'CẢNH BÁO')]
assert kl and all(d['can_cu'] and d['dg'] for d in kl), 'có kết luận thiếu căn cứ hoặc quan sát'
print('đạt: %d dòng kết luận đều có căn cứ và quan sát' % len(kl))
theo = {d['ma']: d for d in k['dong']}
assert theo['MAU.B1.DUNG']['kq'] == 'ĐẠT' and 'mau-thu.json' in theo['MAU.B1.DUNG']['can_cu'] and 'B1.DUNG' in theo['MAU.B1.DUNG']['can_cu']
assert theo['MAU.XEM']['kq'] == 'GHI NHẬN', 'quyền xem không khai mà vẫn kết luận'
assert theo['MAU.B1.TRUONG_THUA']['kq'] == 'GHI NHẬN'
assert theo['MAU.B1.TRUONG.ho_ten.SAN']['kq'] == 'GHI NHẬN' and 'đặc tả không ghi giá trị mặc định' in theo['MAU.B1.TRUONG.ho_ten.SAN']['dg']
assert not any('AUTO-ĐIỀN' in d['dg'] for d in k['dong']), 'còn luật đoán AUTO-ĐIỀN'
assert all(d['kq'] not in ('ĐẠT', 'LỆCH', 'CẢNH BÁO') for d in k['dong'] if d['loai_bang'] == 'khung'), 'bảng khung vẫn ra kết luận'
assert theo['MAU.B1.TRUONG.so_cccd']['kq'] == 'CẢNH BÁO' and not any(d['kq'] == 'LỆCH' for d in k['dong']), 'chưa khai nguồn đã duyệt mà vẫn ra LỆCH'
assert {d['ma']: d for d in k['dong_khi_khai_uc']}['MAU.B1.TRUONG.so_cccd']['kq'] == 'LỆCH', 'khai nguồn UC đã duyệt mà không ra LỆCH'
print('đạt: không khai nguồn đã duyệt thì không có LỆCH; quyền xem không khai, trường thừa, ô có giá trị sẵn, bảng khung → GHI NHẬN')

assert k['html'] == {'cot_can_cu': True, 'muc_ghi_nhan': True, 'chu_mau_thu': True}, k['html']
print('đạt: báo cáo HTML có cột Căn cứ và mục GHI NHẬN riêng')

print('chạy thật trên trang mẫu:', k['chay']); print('lỗi JS:', k['loi_js'])
assert isinstance(k['chay'], list) and k['chay'], 'không có kết quả lần chạy; gỡ lỗi: ' + str(k.get('go_loi'))
assert k['loi_js'] == 'không'
for r in k['chay']:
    assert r['can_cu'], 'dòng vấn đề thiếu căn cứ'
    assert r['muc_do'] == 'ghi nhận' or any(x in r['can_cu'] for x in ('sự việc', 'chuẩn', 'đặc tả')), 'dòng có mức mà không có căn cứ: ' + str(r)
assert any('chu_la: sự việc' in r['can_cu'] for r in k['chay']) and any('o_khong_nhan: chuẩn' in r['can_cu'] for r in k['chay'])
assert any(r['muc_do'] == 'ghi nhận' and r['can_cu'].startswith('phan_tram_vo_ly: tự đặt') for r in k['chay']), 'màn chỉ có phép kiểm tự đặt không ra «ghi nhận»'
print('đạt: chạy thật — mỗi màn có vấn đề đều ghi căn cứ; màn chỉ có ngưỡng tự đặt ra «ghi nhận»; mức chỉ tính cho phép kiểm có căn cứ')
