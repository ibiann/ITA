# Đổi tên công cụ DQTV kiểm tra 3.31 → ITA 5.0. Chạy MỘT lần trên bản sao.
# Chỉ đổi TÊN CÔNG CỤ. Giữ nguyên DỮ LIỆU DỰ ÁN DQTV (tên miền, tuyến /dqtv/…, goi-du-an/dqtv,
# khoá localStorage cũ để dọn), và giữ lệnh dqtv.* làm tên phụ.
import pathlib, re, sys

GOC = pathlib.Path(__file__).resolve().parent.parent
TEP = sorted((GOC / 'may').glob('*.js')) + [GOC / 'cong-cu/dong_goi.py', GOC / 'kiem/test_thuan.mjs', GOC / 'kiem/test_dong_goi.py']

# (mẫu, thay) — thứ tự có ý nghĩa: cụm dài trước cụm ngắn
LUAT = [
    (r'__DQTV_AUDIT', '__ITA_AUDIT'),
    (r'\bDQTV_(CONFIG|MAC_DINH|AUTORUN)\b', r'ITA_\1'),
    (r'__dqtv', '__ita'),                                  # window.__dqtvX, e.__dqtv, reason.__dqtv
    (r'\bdqtvAudit\b', 'itaAudit'),
    (r'\bdqtvMenu\b', 'itaMenu'),
    (r'data-dqtv-menu', 'data-ita-menu'),
    (r'dqtv-panel-host', 'ita-panel-host'),
    (r"'dqtv-", "'ita-"),                                     # tên tệp xuất: 'dqtv-…' → 'ita-…'
    (r'CÁC LỆNH dqtv\.\*', 'CÁC LỆNH ita.* (tên phụ dqtv.*)'),
    (r'đối tượng lệnh dqtv ', 'đối tượng lệnh ita (tên phụ dqtv) '),
    (r'\[dqtv\]', '[ita]'),
    (r"'dqtv: ", "'ita: "),
    (r"'dqtv\.(\w+)\.v3(25|31)'", r"'ita.\1.v50'"),        # khoá lưu của bản đang chạy (không đụng 'dqtv.dacta.v1' và KHOA_CU)
    (r'\bdqtv\.(?=[a-zA-Z]+\()', 'ita.'),                    # dqtv.lenh( trong chữ hướng dẫn
    (r'^window\.dqtv = \{', 'window.ita = window.dqtv = {'),  # lệnh chính ita.*, giữ dqtv.* làm tên phụ
    (r'DQTV · kiểm giao diện v3', 'ITA · kiểm giao diện v5'),
    (r'<title>DQTV kết quả kiểm', '<title>ITA kết quả kiểm'),
    (r'<h1>DQTV — kết quả', '<h1>ITA — kết quả'),
    (r'^ \* DQTV — kiểm giao diện, đối chiếu đặc tả, chấm theo ma trận TC v7 của PM\. Bản 3\.31\.',
     ' * ITA — kiểm giao diện, đối chiếu đặc tả, chấm theo ma trận TC v7. Bản 5.0 (tách từ DQTV kiểm tra 3.31).'),
    (r"^const PHIEN_BAN = '3\.31';", "const PHIEN_BAN = '5.0';"),
    (r"// DQTV — công cụ kiểm giao diện \+ đặc tả quy trình, bản 3\.31", '// ITA — công cụ kiểm giao diện + đặc tả quy trình, bản 5.0'),
    (r"dist/dqtv-kiem-tra-3\.31\.js", 'dist/ita-dqtv-5.0.js'),
]

tong = {}
for t in TEP:
    s = t.read_text(encoding='utf-8')
    for mau, thay in LUAT:
        s, n = re.subn(mau, thay, s, flags=re.M)
        if n:
            tong[mau] = tong.get(mau, 0) + n
    t.write_text(s, encoding='utf-8')

for mau, _ in LUAT:
    print('%5d  %s' % (tong.get(mau, 0), mau))
thieu = [m for m, _ in LUAT if not tong.get(m)]
if thieu:
    sys.exit('Luật không khớp chỗ nào (kiểm lại): ' + ', '.join(thieu))
