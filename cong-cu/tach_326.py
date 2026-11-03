# Cắt bản 3.26 thành may/*.js + goi/dac-ta.json + goi/quy-tac.json (chạy một lần, không đổi logic).
import argparse, json, pathlib, sys

GOC = pathlib.Path(__file__).resolve().parent.parent
TIEN_TO = {'dac-ta.json': 'window.__dqtvDacTaNap = ', 'quy-tac.json': 'window.__dqtvQuyTac = '}

# (tệp, chuỗi mốc bắt đầu, mốc có dòng banner "/* ===" ngay trên không). Mốc đầu của 00 là dòng 6.
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
    ap.add_argument('--goi', default=GOC / 'goi-du-an/dqtv')
    a = ap.parse_args()
    may, goi = pathlib.Path(a.may), pathlib.Path(a.goi)
    # newline='' giữ nguyên ký tự xuống dòng
    with open(a.nguon, encoding='utf-8', newline='') as f:
        dong = f.read().split('\n')
    dong = [d + '\n' for d in dong[:-1]] + ([dong[-1]] if dong[-1] else [])

    may.mkdir(parents=True, exist_ok=True)
    goi.mkdir(parents=True, exist_ok=True)

    # dòng 3 = danh mục TC (không tách, do dòng v7 thay sau); dòng 4, 5 = đặc tả, quy tắc
    for ten, tt in TIEN_TO.items():
        d = next((x for x in dong[2:5] if x.startswith(tt)), None)
        if d is None:
            sys.exit('Không thấy dòng dữ liệu: ' + tt.strip())
        than = d[len(tt):].rstrip('\n')
        if not than.endswith(';'):
            sys.exit('Dòng dữ liệu không kết thúc bằng ";": ' + tt.strip())
        (goi / ten).write_text(json.dumps(json.loads(than[:-1]), ensure_ascii=False), encoding='utf-8')

    # tìm mọi mốc theo chuỗi, đi tuần tự từ dòng 6 (chỉ số 5)
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
