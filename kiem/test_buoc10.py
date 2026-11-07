# Kiểm bước 10: chạy một lần ra đủ (điểm dừng đầy đủ ở IndexedDB khi localStorage hết chỗ), nút theo mã bước, danh sách bước máy chủ, mắt xích.
# Chạy: python3 -I kiem/test_buoc10.py
# Dựng bản thử bằng cong-cu/dong_goi.py (--ra, không ghi đè dist/) + một dòng xuất hàm nội bộ ra window.__itaThu; chạy kiem/thu_buoc10.html
# trong Chrome thời gian thật (kiem/mo_chrome.mjs). Trang mẫu giả trình duyệt hết chỗ cho điểm dừng đầy đủ, rồi tải lại trang giữa lúc chạy.
import json, pathlib, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent

with tempfile.TemporaryDirectory() as t:
    t = pathlib.Path(t)
    subprocess.run([sys.executable, '-I', str(GOC / 'cong-cu/dong_goi.py'), '--du-an', 'dqtv', '--ra', str(t / 'dist.js')], check=True, stdout=subprocess.DEVNULL)
    dist = (t / 'dist.js').read_text(encoding='utf-8')
    (t / 'tool.js').write_text(dist.rstrip()[:-len('})();')] + 'window.__itaThu = { doiChieuDacTa, phuDanhMucTC, sangHTML };\n})();\n', encoding='utf-8')
    (t / 'thu.html').write_text((GOC / 'kiem/thu_buoc10.html').read_text(encoding='utf-8'), encoding='utf-8')
    so = socket.socket(); so.bind(('127.0.0.1', 0)); cong = so.getsockname()[1]; so.close()
    mc = subprocess.Popen([sys.executable, '-I', '-m', 'http.server', str(cong), '--bind', '127.0.0.1', '--directory', str(t)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    kq = {}
    try:
        time.sleep(0.8)
        for ca, hoi in (('co_idb', ''), ('khong_idb', '?khongIDB=1')):
            r = subprocess.run(['node', str(GOC / 'kiem/mo_chrome.mjs'), 'http://127.0.0.1:%d/thu.html%s' % (cong, hoi), str(t / ('p-' + ca)), '300'], capture_output=True, text=True, timeout=360)
            assert r.stdout, ca + ': Chrome không trả kết quả: ' + r.stderr[-500:]
            kq[ca] = json.loads(r.stdout)
    finally:
        mc.terminate()

# 10b–10e trên dữ liệu quan sát dựng sẵn
c = kq['co_idb']['cham']
for d in c['dong']: print('  ', d['kq'].ljust(10), d['ma'].ljust(22), ('mắt xích ' + d['mx']) if d['mx'] else '', d['nhom'], '|', d['dg'][:110])
dong = {d['ma']: d for d in c['dong']}
assert dong['MAU.B1.DUNG']['kq'] == 'ĐẠT' and 'Ghi nhận nhiệm vụ' in dong['MAU.B1.DUNG']['dg'] and 'raiseX' in dong['MAU.B1.DUNG']['dg']
print('đạt: chữ nút ngắn hơn tên bước + máy chủ xác nhận mã bước → ĐẠT, ghi chú chữ khác')
assert dong['MAUB.B1.DUNG']['kq'] == 'CHƯA KIỂM' and dong['MAUB.B1.DUNG']['nhom'] == 'CÔNG CỤ' and dong['MAUB.B1.DUNG']['mx'] == '1'
print('đạt: nút gần chữ mà không có xác nhận máy chủ → CHƯA KIỂM, mắt xích 1 (công cụ)')
assert dong['MAU.B2.DUNG']['kq'] == 'CẢNH BÁO' and dong['MAU.B2.DUNG']['nhom'] == 'ỨNG DỤNG' and dong['MAU.B2.DUNG']['mx'] == '2'
print('đạt: máy chủ cho làm mà màn không có nút → lỗi app thật, mắt xích 2')
assert dong['MAU.B3.DUNG']['kq'] == 'CHƯA KIỂM' and dong['MAU.B3.DUNG']['nhom'] == 'CÔNG CỤ' and dong['MAU.B3.DUNG']['mx'] == '1'
assert dong['MAU.B4.DUNG']['kq'] == 'CHƯA KIỂM' and dong['MAU.B4.DUNG']['mx'] == '0'
assert dong['MAU.B5.SAI_VAI']['kq'] == 'CẢNH BÁO' and dong['MAU.B5.SAI_VAI']['nhom'] == 'QUY TRÌNH' and dong['MAU.B5.SAI_VAI']['mx'] == '3'
assert dong['MAU.B6.DUNG']['kq'] == 'CẢNH BÁO' and dong['MAU.B6.DUNG']['nhom'] == 'QUY TRÌNH' and dong['MAU.B6.DUNG']['mx'] == '3'
print('đạt: không thấy, không có xác nhận → CHƯA KIỂM mắt xích 1; máy chủ không cho → mắt xích 0; máy chủ cho vai trái tài liệu / không chào bước ở chặng tài liệu ghi → mắt xích 3')
sai = [d for d in c['dong'] if 'không thấy nút' in d['dg'] and d['nhom'] == 'ỨNG DỤNG' and 'máy chủ cho làm' not in d['dg']]
assert not sai, sai
assert all(d['mx'] for d in c['dong'] if d['kq'] not in ('ĐẠT', 'GHI NHẬN', 'LỚP 4')), 'dòng chưa đạt thiếu mắt xích'
print('đạt: không dòng «không thấy nút» nào ra ỨNG DỤNG mà thiếu căn cứ máy chủ; mọi dòng chưa đạt có mắt xích')
assert c['phu']['co_ket_qua'] == 1 and c['phu']['theo_ma_khac'][0]['theo'] == 'MAU.B2.DUNG', c['phu']
print('đạt: TC của bước đã dời lấy kết quả theo TC đề xuất tương ứng')
assert c['html'] == {'mat_xich_2': True, 'mat_ket_qua': True, 'theo_de_xuat': True}, c['html']
print('đạt: báo cáo HTML ghi mắt xích, mục mất kết quả, TC theo mã đề xuất')

# 10a: tải lại trang giữa lúc chạy, localStorage hết chỗ cho điểm dừng đầy đủ
a, b = kq['co_idb'], kq['khong_idb']
for ca, x in (('có IndexedDB', a), ('đối chứng: xoá bản IndexedDB', b)):
    print(ca + ':', {k: x[k] for k in ('so_man', 'gon', 'mat_kq', 'kho_sau', 'loi_chay', 'loi_js')}, '| trước tải lại:', {'xong': (x['truoc_tai_lai']['gon'] or {}).get('xong'), 'kho': x['truoc_tai_lai']['kho']})
for x in (a, b):
    assert x['loi_js'] == 'không' and not x['loi_chay']
    assert x['truoc_tai_lai']['gon'] and x['truoc_tai_lai']['gon']['gon'] and len(x['truoc_tai_lai']['gon']['xong']) >= 1, 'chưa tải lại giữa chừng'
menu = {'Danh sách mẫu', 'Mẫu hai', 'Mẫu ba', 'Mẫu bốn', 'Mẫu năm', 'Mẫu sáu', 'Mẫu bảy', 'Mẫu tám'}
assert a['gon'] is True and a['truoc_tai_lai']['kho'] >= 1, 'không giả được cảnh hết chỗ / không có bản đầy đủ ở IndexedDB'
assert any('Chạy tiếp từ điểm dừng' in l for l in a['log']) and not any('1/8 Danh sách mẫu' in l for l in a['log']), 'lần sau tải lại không chạy tiếp từ bản đầy đủ: ' + str(a['log'])
assert {m.split(' › ')[0] for m in a['man']} >= menu and a['mat_kq'] == [] and a['kho_sau'] == 0, a
print('đạt: hết chỗ + tải lại giữa chừng → chạy tiếp (không chạy lại mục đã xong), báo cáo vẫn đủ màn của cả 8 mục menu, không mục nào mất kết quả; chạy xong thì xoá bản ở IndexedDB')
assert 'Danh sách mẫu' in b['mat_kq'] and 'Danh sách mẫu' not in {m.split(' › ')[0] for m in b['man']}, b
print('đạt: đối chứng — không đọc lại được bản đầy đủ thì báo cáo ghi rõ mục menu mất kết quả, không lặng lẽ thiếu màn')
