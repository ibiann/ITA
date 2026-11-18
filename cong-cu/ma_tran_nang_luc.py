# [GĐ 8] Ma trận năng lực: mỗi dòng một năng lực, mỗi cột một bản dựng. Soát lại mỗi lần gộp hoặc nâng bản (roadmap, quy tắc 2).
# Mỗi năng lực là một mẫu tìm cụ thể trong MÃ của bản dựng (bỏ khối axe nhúng và các dòng dữ liệu window.__ita… / window.__dqtv…),
# nên ai cũng chạy lại kiểm được. Mẫu chỉ chứng minh mã CÓ phần đó, không chứng minh phần đó chạy đúng — muốn biết chạy đúng thì xem test.
# Chạy: python3 -I cong-cu/ma_tran_nang_luc.py <tên>=<tệp.js> [<tên>=<tệp.js> ...]  → in bảng Markdown
import re, sys

NANG_LUC = [   # (nhóm, năng lực, mẫu phải CÓ, mẫu KHÔNG được có)
    ('An toàn', 'Chặn ghi qua fetch và XHR', [r'window\.fetch\s*=', r'XMLHttpRequest\.prototype\.send\s*='], []),
    ('An toàn', 'Chặn form.submit()', [r'HTMLFormElement\.prototype\.submit\s*='], []),
    ('An toàn', 'Chặn sendBeacon', [r'navigator\.sendBeacon\s*='], []),
    ('An toàn', 'WebSocket bị chặn suốt lần chạy (không chỉ lúc bấm nút)', [r'WebSocket\.prototype\.send\s*='], [r'chanGhi && DANG_MO_NUT\) \{ BLOCK\.push\(\'WS send\'\)']),
    ('An toàn', 'Khoá tên miền được chạy (tenMienDuocChay)', [r'tenMienDuocChay'], []),
    ('An toàn', 'Danh sách tên miền cấm (tenMienCam, từ v4)', [r'tenMienCam'], []),
    ('Khám phá', 'Chạy được khi không có menu trái', [r'thanhTren\s*\(', r'NGUON_MENU'], []),
    ('Khám phá', 'Lệnh Thăm dò có thật (ita.thamDo / dqtv.thamDo)', [r'(?:async\s+)?thamDo\s*\(\s*\)\s*\{'], []),
    ('Kiểm', 'Kiểm kê trường (mở form để đọc trường)', [r'kiemKeTruong'], []),
    ('Kiểm', 'WCAG bằng axe-core', [r'axe\.run\s*\('], []),
    ('Kiểm', 'Thử biên ô theo thuộc tính DOM', [r'thuBienDom'], []),
    ('Kiểm', 'Bất biến lọc / sắp xếp / phân trang', [r'kiemDanhSach'], []),
    ('Kiểm', 'Giả lỗi đọc dữ liệu từng màn', [r'thuLoiDoc'], []),
    ('Đặc tả', 'Đối chiếu đặc tả quy trình', [r'doiChieuDacTa'], []),
    ('Đặc tả', 'Đọc danh mục TC ma trận v7', [r'__(?:ita|dqtv)DanhMucTC|tc_all'], []),
    ('Dự án', 'Hồ sơ dự án nạp được (__itaHoSo)', [r'__itaHoSo'], []),
    ('Dự án', 'Nạp cả thư mục dự án', [r'webkitdirectory'], []),
    ('Bền', 'Điểm dừng lưu ở IndexedDB khi quá lớn', [r'indexedDB\.open'], []),
    ('Bền', 'Đo thời gian chờ theo mục menu', [r'tgMuc'], []),
    ('Báo cáo', 'Bốn chữ kết luận (Sai / Lệch chuẩn / Không thống nhất / Cần xem)', [r'Lệch chuẩn', r'Không thống nhất'], []),
    ('Vết', 'KHÔNG còn vết Tampermonkey / userscript', [], [r'__itaNguon', r'__dqtvNguon', r'(?i)userscript']),
]


def ma(t):
    """Chỉ giữ mã máy kiểm: bỏ khối axe nhúng (dòng rất dài) và các dòng gán dữ liệu dự án."""
    return '\n'.join(l for l in t.split('\n') if len(l) < 20000 and not re.match(r'window\.__(?:ita|dqtv)\w* = [\[{"]', l))


def main():
    ban = []
    for a in sys.argv[1:]:
        ten, tep = a.split('=', 1)
        ban.append((ten, ma(open(tep, encoding='utf-8', errors='replace').read())))
    if not ban:
        sys.exit(__doc__ or 'cách chạy: xem đầu tệp')
    print('| Nhóm | Năng lực | ' + ' | '.join(t for t, _ in ban) + ' |')
    print('|---|---|' + '---|' * len(ban))
    for nhom, ten, co, khong in NANG_LUC:
        o = ['có' if all(re.search(p, m) for p in co) and not any(re.search(p, m) for p in khong) else '—' for _, m in ban]
        print('| %s | %s | %s |' % (nhom, ten, ' | '.join(o)))


main()
