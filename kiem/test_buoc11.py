# Kiểm bước 11: axe-core (WCAG 2.2 A/AA) chạy thật trong lần chạy; TC TRO_NANG, KHUNG-CHUNG.*, <quy trình>.KHUNG_CHUNG, O_TIM chấm đúng.
# Chạy: python3 -I kiem/test_buoc11.py
# Dựng bản thử bằng cong-cu/dong_goi.py (--ra, không ghi đè dist/) + một dòng xuất hàm nội bộ ra window.__itaThu; chạy kiem/thu_buoc11.html
# trong Chrome thời gian thật (kiem/mo_chrome.mjs). Trang mẫu cố ý có lỗi trợ năng và lỗi khung chung.
import json, pathlib, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
with tempfile.TemporaryDirectory() as t:
    t = pathlib.Path(t)
    subprocess.run([sys.executable, '-I', str(GOC / 'cong-cu/dong_goi.py'), '--du-an', 'dqtv', '--ra', str(t / 'dist.js')], check=True, stdout=subprocess.DEVNULL)
    dist = (t / 'dist.js').read_text(encoding='utf-8')
    assert 'axe v4.14.0' in dist and 'if (!window.axe) {' in dist, 'tệp dán không kèm axe-core'
    (t / 'tool.js').write_text(dist.rstrip()[:-len('})();')] + 'window.__itaThu = { doiChieuDacTa, phuDanhMucTC, sangHTML };\n})();\n', encoding='utf-8')
    (t / 'thu.html').write_text((GOC / 'kiem/thu_buoc11.html').read_text(encoding='utf-8'), encoding='utf-8')
    so = socket.socket(); so.bind(('127.0.0.1', 0)); cong = so.getsockname()[1]; so.close()
    mc = subprocess.Popen([sys.executable, '-I', '-m', 'http.server', str(cong), '--bind', '127.0.0.1', '--directory', str(t)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(0.8)
        r = subprocess.run(['node', str(GOC / 'kiem/mo_chrome.mjs'), 'http://127.0.0.1:%d/thu.html' % cong, str(t / 'p'), '300'], capture_output=True, text=True, timeout=360)
    finally:
        mc.terminate()
assert r.stdout, 'Chrome không trả kết quả: ' + r.stderr[-500:]
k = json.loads(r.stdout)

# chấm TC trên dữ liệu dựng sẵn
for d in k['cham']['dong']: print('  ', d['kq'].ljust(10), d['ma'].ljust(28), ('mắt xích ' + d['mx']) if d['mx'] else '', d['nhom'], '|', d['dg'][:100])
dong = {d['ma']: d for d in k['cham']['dong']}
assert dong['KHUNG-CHUNG.CHU_CAT']['kq'] == 'CẢNH BÁO' and dong['KHUNG-CHUNG.CHU_CAT']['mx'] == 'khung'
assert dong['KHUNG-CHUNG.THOI_DIEM']['kq'] == 'ĐẠT' and dong['KHUNG-CHUNG.TIM.KHONG_CO']['kq'] == 'ĐẠT'
assert dong['KHUNG-CHUNG.DEM_KHOP']['kq'] == 'CHƯA KIỂM' and 'phần chưa kiểm' in dong['KHUNG-CHUNG.DEM_KHOP']['dg']
assert dong['KHUNG-CHUNG.DANH_MUC_VAI']['kq'] == 'CHƯA KIỂM' and dong['KHUNG-CHUNG.DANH_MUC_VAI']['nhom'] == 'CÔNG CỤ'
print('đạt: KHUNG-CHUNG.* — lệch ra CẢNH BÁO (mắt xích khung chung); đủ phép kiểm, không lệch ra ĐẠT; phép kiểm một phần / nghiệp vụ ra CHƯA KIỂM có lý do')
# các ca người rà chỉ ra (06/11): không được ra ĐẠT
assert dong['KHUNG-CHUNG.TRAN_NGANG']['kq'] == 'CHƯA KIỂM' and '1366' in dong['KHUNG-CHUNG.TRAN_NGANG']['dg']
assert dong['KHUNG-CHUNG.O_CO_NHAN']['kq'] == 'CẢNH BÁO' and 'axe: ô không có tên' in dong['KHUNG-CHUNG.O_CO_NHAN']['dg']   # 11c: axe thấy ô chọn không tên → không được ĐẠT / CHƯA KIỂM
assert dong['KHUNG-CHUNG.TIM.KHONG_DAU']['kq'] == 'CHƯA KIỂM'
assert dong['KHUNG-CHUNG.TIEU_DE_MENU']['kq'] == 'CHƯA KIỂM' and 'không đọc được tiêu đề' in dong['KHUNG-CHUNG.TIEU_DE_MENU']['dg']
assert dong['KHUNG-CHUNG.CCCD_12']['kq'] == 'CHƯA KIỂM', dong['KHUNG-CHUNG.CCCD_12']
assert 'KHUNG-CHUNG.THOI_DIEM=CHƯA KIỂM' in k['cham']['dung_giua_chung'] and not any(x.endswith('=ĐẠT') for x in k['cham']['dung_giua_chung']), k['cham']['dung_giua_chung']
print('đạt: khổ cửa sổ khác 1366/1920, chưa mở form, mốc «có dấu» không ra dữ liệu, màn menu không có tiêu đề, ô «Ngày cấp CCCD», lần chạy dừng giữa chừng → CHƯA KIỂM, không ĐẠT giả')
assert dong['MAU.TRO_NANG']['kq'] == 'CẢNH BÁO' and dong['MAU.TRO_NANG']['mx'] == 'chuẩn' and 'color-contrast' in dong['MAU.TRO_NANG']['dg'] and '1.4.3' in dong['MAU.TRO_NANG']['dg']
assert '1/1 màn' in dong['MAU.TRO_NANG']['dg'] and 'Việc của tôi' not in dong['MAU.TRO_NANG']['dg'], dong['MAU.TRO_NANG']   # 11c: «Việc của tôi» không tính là màn của quy trình
assert dong['MAUB.TRO_NANG']['kq'] == 'CHƯA KIỂM' and 'bàn phím' in dong['MAUB.TRO_NANG']['dg']
print('đạt: TRO_NANG — lỗi mức nghiêm trọng của axe ở màn của quy trình → CẢNH BÁO kèm mục WCAG; không có lỗi nghiêm trọng → CHƯA KIỂM (phần bàn phím chưa thử), không ghi ĐẠT')
assert dong['MAU.O_TIM']['kq'] == 'CẢNH BÁO' and 'API lỗi' in dong['MAU.O_TIM']['dg']
assert dong['MAU.KHUNG_CHUNG']['kq'] == 'CẢNH BÁO' and 'KHUNG-CHUNG.CHU_CAT' in dong['MAU.KHUNG_CHUNG']['dg']
assert k['cham']['phu'] == {'ap_dung': 1, 'co_ket_qua': 1}, k['cham']['phu']
print('đạt: O_TIM lỗi máy chủ khi tìm → CẢNH BÁO; <quy trình>.KHUNG_CHUNG ghi mã KHUNG-CHUNG lệch; KHUNG-CHUNG.* áp cho mọi vai và có kết quả trong phủ danh mục TC')

# chạy thật: axe trong lần chạy
c = k['chay']
print('chạy thật (%s giây):' % c['giay'], json.dumps(c, ensure_ascii=False)[:900])
assert not c['loi_chay'] and k['loi_js'] == 'không', (c['loi_chay'], k['loi_js'])
assert c['tro_nang'], 'lần chạy không ra kết quả: ' + json.dumps(k.get('log'), ensure_ascii=False)[:3000]
assert c['tro_nang'] and c['tro_nang']['cong_cu'] == 'axe-core 4.14.0'
m1 = next(x for x in c['tro_nang']['ds'] if x['man'] == 'Danh sách mẫu')
id1 = {v.split('|')[0]: v for v in m1['vi_pham']}
assert not m1['loi'] and {'color-contrast', 'button-name', 'image-alt'} <= set(id1), m1
assert id1['color-contrast'].endswith('|1.4.3') and id1['image-alt'].split('|')[1] == 'critical', id1
print('đạt: axe-core 4.14.0 chạy trong lần chạy, bắt đúng 3 lỗi cố ý (tương phản 1.4.3, nút không tên, ảnh không chữ thay thế)')
vd = {v['tab']: v for v in c['van_de']}
v1, v2 = vd['Danh sách mẫu'], vd['Mẫu hai']
assert 'color-contrast' in v1['wcag_loi'] and 'wcag_loi: chuẩn' in v1['can_cu'], v1
assert 'ISO' in v1['gio'] and 'gio_khong_chuan: TC v7' in v1['can_cu'], v1
assert (v1['chu_la'] or v1['ma_enum']) and 'TC v7 — KHUNG-CHUNG.MA_CHUA_DICH' in v1['can_cu'], v1
assert v2['menu'] and 'tieu_de_lech_menu: TC v7' in v2['can_cu'] and v2['muc'] != 'ghi nhận', v2
print('đạt: dòng vấn đề của màn ghi lỗi WCAG (căn cứ chuẩn), giờ ISO thô, mã camelCase, tiêu đề khác menu (căn cứ TC v7 KHUNG-CHUNG), được tính mức')
assert c['html'] == {'tro_nang': True, 'tuong_phan': True}, c['html']
print('đạt: báo cáo HTML có mục «Kiểm trợ năng tự động — axe-core», tên mục WCAG tiếng Việt')
