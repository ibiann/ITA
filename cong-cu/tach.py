# Cắt phần mã của bản 3.26 (từ dòng 6 tới hết) thành may/*.js. Chạy một lần, không đổi chữ nào.
# Dòng 1-5 của 3.26 (chú thích + dữ liệu đặc tả, sổ quy tắc, danh mục TC) KHÔNG lấy.
# Nguồn: cong-cu/tach_326.py của thư mục 3.31, bỏ phần ghi dữ liệu ra json.
# Chạy: python3 -I cong-cu/tach.py ~/Downloads/dqtv-kiem-tra-dacta-3.26.js
import argparse, pathlib, sys

GOC = pathlib.Path(__file__).resolve().parent.parent

# (tệp, chuỗi mốc bắt đầu, mốc có dòng banner "/* ===" ngay trên không). Tệp 00 bắt đầu ở dòng 6.
MOC = [
    ('10-la-chan.js', '0. LÁ CHẮN', True),
    ('20-cau-hinh.js', '1. CẤU HÌNH MẶC ĐỊNH', True),
    ('30-loi-kiem.js', '4. LÕI KIỂM', True),
    ('40-bang-dieu-khien.js', '5. BẢNG ĐIỀU KHIỂN', True),
    ('50-doi-chieu-dac-ta.js', 'ĐẶC TẢ QUY TRÌNH (UC)', True),
    ('60-bao-cao.js', '/* <<DACTA-HET>> */', False),  # bắt đầu SAU dòng này
    ('90-khoi-dong.js', '6. NẠP CẤU HÌNH MẪU', True),
]


def tim(dong, mau, tu):
    for i in range(tu, len(dong)):
        if mau in dong[i]:
            return i
    sys.exit('Không thấy mốc: ' + mau)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('nguon')
    ap.add_argument('--may', default=GOC / 'may')
    a = ap.parse_args()
    may = pathlib.Path(a.may)
    with open(a.nguon, encoding='utf-8', newline='') as f:   # newline='' giữ nguyên ký tự xuống dòng
        dong = f.read().split('\n')
    dong = [d + '\n' for d in dong[:-1]] + ([dong[-1]] if dong[-1] else [])
    may.mkdir(parents=True, exist_ok=True)

    diem, tu = [], 5
    for ten, mau, banner in MOC:
        i = tim(dong, mau, tu)
        if banner:
            if not dong[i - 1].startswith('/* ===='):
                sys.exit('Mốc không có dòng banner phía trên: ' + mau)
            i -= 1
        else:
            i += 1
        diem.append((ten, i))
        tu = i + 1
    diem = [('00-mo-dau.js', 5)] + diem
    for k, (ten, i) in enumerate(diem):
        j = diem[k + 1][1] if k + 1 < len(diem) else len(dong)
        with open(may / ten, 'w', encoding='utf-8', newline='') as f:
            f.write(''.join(dong[i:j]))
    print('Đã tách %d tệp vào %s' % (len(diem), may))


main()
