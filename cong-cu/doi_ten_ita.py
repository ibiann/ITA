# Đổi tên công cụ «DQTV kiểm tra» 3.26.6 → ITA (bước 13a). Chạy MỘT lần: python3 -I cong-cu/doi_ten_ita.py
# Chỉ đổi TÊN CÔNG CỤ (lệnh, biến window, khoá lưu, bảng, tên tệp xuất). Không đụng DỮ LIỆU DỰ ÁN DQTV
# (du-an/dqtv/, tên miền, đường dẫn mã app dqtv-app) và không giữ tên phụ dqtv.* (người dùng chốt 07/11).
# kiem/test_dong_goi.py dùng lại doi() để đổi tên bản 3.26 gốc trước khi so dòng.
import pathlib, re, sys

GOC = pathlib.Path(__file__).resolve().parent.parent

# (mẫu, thay) — thứ tự có ý nghĩa: cụm dài trước cụm ngắn
LUAT = [
    (r'__DQTV_AUDIT', '__ITA_AUDIT'),
    (r'\bDQTV_(CONFIG|MAC_DINH|AUTORUN)\b', r'ITA_\1'),
    (r'__dqtv', '__ita'),                                   # window.__dqtvX, e.__dqtv, '__dqtvX'
    (r'\bdqtvAudit\b', 'itaAudit'),
    (r'\bdqtvMenu\b', 'itaMenu'),
    (r'data-dqtv-menu', 'data-ita-menu'),
    (r'dqtv-panel-host', 'ita-panel-host'),
    (r"'dqtv-kiem-tra-ckpt'", "'ita-ckpt'"),               # kho IndexedDB điểm dừng
    (r"'dqtv-kiem-tra'", "'ita'"),                         # kho IndexedDB dữ liệu đã nạp
    (r"'dqtv-(?!app\b|kiem-tra)", "'ita-"),                 # tên tệp xuất 'dqtv-…' → 'ita-…'
    (r'\[dqtv\]', '[ita]'),
    (r"'dqtv: ", "'ita: "),
    (r"'dqtv\.(cfg|ckpt|last|truongtay|sap|run|nk|dacta)\.v3261'", r"'ita.\1.v1'"),   # khoá lưu của bản đang chạy
    (r'\bwindow\.dqtv\b', 'window.ita'),
    (r'\bdqtv\.(?=[a-zA-Z]+\()', 'ita.'),                   # dqtv.lenh( trong mã và chữ hướng dẫn
    (r'DQTV · kiểm giao diện v3', 'ITA · kiểm giao diện'),
    (r'<title>DQTV kết quả kiểm', '<title>ITA kết quả kiểm'),
    (r'<h1>DQTV — kết quả', '<h1>ITA — kết quả'),
]


def doi(s, dem=None):
    for mau, thay in LUAT:
        s, n = re.subn(mau, thay, s, flags=re.M)
        if dem is not None and n:
            dem[mau] = dem.get(mau, 0) + n
    return s


if __name__ == '__main__':
    TEP = (sorted((GOC / 'may').glob('*.js')) + sorted((GOC / 'bo-doc').glob('*.js')) + [GOC / 'cong-cu/dong_goi.py']
           + sorted((GOC / 'kiem').glob('*.py')) + sorted((GOC / 'kiem').glob('*.mjs')) + sorted((GOC / 'kiem').glob('*.html')))
    dem = {}
    for t in TEP:
        s = t.read_text(encoding='utf-8')
        m = doi(s, dem)
        if m != s:
            t.write_text(m, encoding='utf-8')
    for mau, _ in LUAT:
        print('%5d  %s' % (dem.get(mau, 0), mau))
    thieu = [m for m, _ in LUAT if not dem.get(m)]
    if thieu:
        sys.exit('Luật không khớp chỗ nào (kiểm lại): ' + ', '.join(thieu))
