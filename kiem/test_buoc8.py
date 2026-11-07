# Kiểm bước 8 (kiểm ô theo khai báo giới hạn của app). Chạy: python3 -I kiem/test_buoc8.py
# 1. Sinh du-an/dqtv/gioi-han-o.json từ app thật (~/dqtv/dqtv-app); bộ sinh tự đối chiếu mẫu thử với pattern của app.
# 2. Đóng gói, dựng bản thử (= dist + xuất sangHTML ra window.__itaThu), chạy thật trên kiem/thu_kiem_o.html
#    (thời gian thật qua kiem/mo_chrome.mjs), đọc kết quả lần chạy.
import json, pathlib, re, shutil, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
subprocess.run(['node', str(GOC / 'cong-cu/sinh_gioi_han_o.mjs')], check=True)
gh = json.loads((GOC / 'du-an/dqtv/gioi-han-o.json').read_text(encoding='utf-8'))
assert gh['_nguon']['ban'], 'không ghi được bản của app'
assert gh['o']['title'] == [{'kind': 'text', 'maxLength': 300, 'kieu_gia_tri': 'shortText', 'noi': gh['o']['title'][0]['noi']}]
assert len(gh['o']['decisionNumber']) == 3 and any(k.get('pattern') for k in gh['o']['decisionNumber'])
assert not gh['pattern_chua_co_mau'], gh['pattern_chua_co_mau']
print('đạt: bộ dữ liệu sinh từ app bản %s, %d tên ô; mọi pattern đều có mẫu thử đã đối chiếu' % (gh['_nguon']['ban'], len(gh['o'])))

with tempfile.TemporaryDirectory() as t:
    t = pathlib.Path(t)
    # Đóng gói bằng chính cong-cu/dong_goi.py trên một bản chép, KHÔNG ghi đè dist/. Bộ đọc nào dùng GHEP mà may/ chưa khai GHEP
    # (bước 7 đang làm dở) thì bỏ khỏi bản chép: chúng chưa nối vào tool, gói vào là tool lỗi «GHEP is not defined».
    shutil.copytree(GOC, t / 'goc', ignore=shutil.ignore_patterns('dist', 'tc', 'quy-trinh', 'ket-qua'))
    ma_may = ''.join(p.read_text(encoding='utf-8') for p in (t / 'goc/may').glob('*.js'))
    for p in (t / 'goc/bo-doc').glob('*.js'):
        if 'GHEP' in p.read_text(encoding='utf-8') and not re.search(r'\b(const|let|var)\s+GHEP\b', ma_may):
            print('bỏ khỏi bản thử (chưa nối vào tool):', p.name); p.unlink()
    subprocess.run([sys.executable, '-I', str(t / 'goc/cong-cu/dong_goi.py'), '--du-an', 'dqtv', '--ra', str(t / 'dist.js')], check=True, stdout=subprocess.DEVNULL)
    dist = (t / 'dist.js').read_text(encoding='utf-8')
    assert 'window.__itaGioiHanO = ' in dist, 'bản đóng gói chưa kèm gioi-han-o.json'
    thu = dist.rstrip()[:-len('})();')] + 'window.__itaThu = { sangHTML };\n})();\n'
    (t / 'tool.js').write_text(thu, encoding='utf-8')
    (t / 'thu.html').write_text((GOC / 'kiem/thu_kiem_o.html').read_text(encoding='utf-8'), encoding='utf-8')
    so = socket.socket(); so.bind(('127.0.0.1', 0)); cong = so.getsockname()[1]; so.close()
    mc = subprocess.Popen([sys.executable, '-I', '-m', 'http.server', str(cong), '--bind', '127.0.0.1', '--directory', str(t)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(0.8)
        r = subprocess.run(['node', str(GOC / 'kiem/mo_chrome.mjs'), 'http://127.0.0.1:%d/thu.html' % cong, str(t / 'p'), '240'], capture_output=True, text=True, timeout=300)
    finally:
        mc.terminate()
assert r.stdout, 'Chrome không trả kết quả: ' + r.stderr[-500:]
k = json.loads(r.stdout)
print('gỡ lỗi:', k.get('go_loi')); print('lỗi chạy:', k['loi_chay'] or 'không', '| lỗi JS:', k['loi_js'], '| form đã mở:', k['form_da_mo'])
o = k['kiem_o']
assert isinstance(o, dict), o
print('đếm:', o['dem'])
for d in o['dong']: print('  ', d['kq'].ljust(13), d['name'].ljust(16), d['ca'].ljust(15), (d['gia_tri'] or '')[:34].ljust(34), '|', d['quan_sat'][:90])
kq = {(d['name'], d['ca']): d['kq'] for d in o['dong']}
dong = lambda ten, ca: [d for d in o['dong'] if d['name'] == ten and d['ca'] == ca]

# không gửi form, không lỗi, giá trị trả lại như cũ
assert not k['gui_form'] and k['loi_js'] == 'không' and not k['loi_chay']
assert k['gia_tri_sau'] == {'title': 'Tiêu đề cũ', 'note': 'Ghi chú cũ', 'decisionNumber': '', 'quantity': ''}, k['gia_tri_sau']
print('đạt: không bấm Lưu, không lỗi JS, mọi ô trả lại giá trị cũ')
# mỗi dòng có căn cứ trỏ về khai báo của app
assert o['dong'] and all(d['can_cu'].startswith('khai báo app «' + d['name'] + '»') and 'limits.gen.mjs @' in d['can_cu'] for d in o['dong'])
assert o['dem']['o_khong_name'] >= 1 and o['dem']['o_khong_khai'] >= 1
print('đạt: mỗi dòng có căn cứ là khai báo của app; ô không name / không có trong khai báo được đếm, không kết luận')
# so thuộc tính
assert kq[('title', 'KHAI_BAO')] == 'ĐẠT' and kq[('note', 'KHAI_BAO')] == 'KHÁC KHAI BÁO' and kq[('quantity', 'KHAI_BAO')] == 'KHÁC KHAI BÁO'
assert kq[('recoveredAmount', 'KHAI_BAO')] == 'ĐẠT' and ('decisionNumber', 'KHAI_BAO') not in kq   # 3 khai báo: chọn theo thuộc tính, không tự so
print('đạt: ô đúng khai báo → ĐẠT; ô thiếu maxlength / min-max → KHÁC KHAI BÁO; tên nhiều khai báo chọn theo thuộc tính trên ô')
# ký tự đặc biệt, mẫu, số
assert kq[('title', 'KY_TU_DAC_BIET')] == 'ĐẠT' and kq[('title', 'DUNG_TOI_DA')] == 'ĐẠT'
assert all(d['kq'] == 'ĐẠT' for d in dong('decisionNumber', 'DUNG_MAU') + dong('decisionNumber', 'SAI_MAU')) and len(dong('decisionNumber', 'SAI_MAU')) == 4
assert kq[('recoveredAmount', 'DUOI_MIN')] == kq[('recoveredAmount', 'TREN_MAX')] == kq[('recoveredAmount', 'SAI_BUOC')] == 'ĐẠT'
assert kq[('recoveredAmount', 'BIEN_MIN')] == kq[('recoveredAmount', 'BIEN_MAX')] == 'ĐẠT'
assert kq[('quantity', 'DUOI_MIN')] == kq[('quantity', 'TREN_MAX')] == 'KHÁC KHAI BÁO'
print('đạt: ký tự đặc biệt giữ nguyên; số quyết định nhận mẫu đúng, chặn 4 mẫu sai; ô số đúng khai báo chặn ngoài khoảng, ô số thiếu khai báo bị chỉ ra')
# quá dài, quá ngắn: phụ thuộc giả lập gõ phím được trên Chrome này
print('quá dài / quá ngắn:', {x: kq.get(x) for x in [('title', 'QUA_DAI'), ('note', 'QUA_DAI'), ('resultSummary', 'QUA_NGAN')]})
assert kq[('title', 'QUA_DAI')] == kq[('decisionNumber', 'QUA_DAI')] == kq[('decisionNumber', 'DUNG_TOI_DA')] == 'ĐẠT' and kq[('note', 'QUA_DAI')] == 'KHÁC KHAI BÁO'
assert kq[('resultSummary', 'QUA_NGAN')] == 'CHƯA KIỂM' and 'minlength=10 đúng khai báo' in dong('resultSummary', 'QUA_NGAN')[0]['quan_sat']
print('đạt: ô có maxlength cắt chữ khi gõ quá dài (cả ô số quyết định, chuỗi dài vẫn đúng mẫu); ô thiếu maxlength nhận quá dài → KHÁC KHAI BÁO; quá ngắn trên ô có minlength đúng → CHƯA KIỂM có lý do')
assert k['html_co_muc'] is True
print('đạt: báo cáo HTML có mục «Kiểm ô theo khai báo giới hạn của app»')
# [12] ca nhập ô (TC) tìm ô theo nhãn: bỏ đuôi «· không bắt buộc» app ghi sau nhãn ô tuỳ chọn; «không thấy ô» không khoá ca
print('ca nhập ô:', k['tc_nhap'])
tn = {x['ma']: x for x in k['tc_nhap']}
assert tn['MAU.B1.NHAP.note.HOP_LE']['kq'] == 'ĐẠT', tn
assert 'Ghi chú' in k['nhan_o'] and not any('không bắt buộc' in (n or '') for n in k['nhan_o']), k['nhan_o']
print('đạt: nhãn «Ghi chú · không bắt buộc» khớp ô «ghi chú» của TC; danh mục trường ghi nhãn không kèm đuôi')
assert tn['MAU.B1.NHAP.o_sau.HOP_LE']['kq'] == 'ĐẠT' and 'Mẫu hai' in tn['MAU.B1.NHAP.o_sau.HOP_LE']['man'], tn
assert sum(1 for x in k['tc_nhap'] if x['ma'] == 'MAU.B1.NHAP.o_sau.HOP_LE') == 1
print('đạt: form đầu không có ô → không khoá; form sau cùng chữ nút có ô → chạy lại, thay dòng «không thấy ô», không trùng dòng')
