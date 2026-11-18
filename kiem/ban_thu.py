# [GĐ 8] Dùng chung cho các test chạy bản đóng gói (dist/rieng/ita-<dự án>.js hoặc dong_goi.py --du-an) trên máy chủ thử 127.0.0.1.
# Từ bản 1.2 khoá tên miền CHỈ lấy từ hồ sơ dự án (ten_mien); ita.chay({ tenMienDuocChay: null }) / ita.dat bị bỏ qua.
# Nên bản thử phải đổi ten_mien trong hồ sơ đã đóng gói sang tên miền của máy chủ thử — chỉ trong bản thử, không đụng du-an/ hay dist/.
import re


def doi_ten_mien(dist, ten_mien='127.0.0.1'):
    dong = re.findall(r'^window\.__itaHoSo = \{.*$', dist, re.M)
    assert len(dong) == 1, 'bản đóng gói phải có đúng một dòng window.__itaHoSo (có %d)' % len(dong)
    moi, n = re.subn(r'"ten_mien":"[^"]*"', '"ten_mien":"%s"' % ten_mien, dong[0], count=1)
    assert n == 1, 'hồ sơ đóng gói không có ten_mien'
    return dist.replace(dong[0], moi, 1)
