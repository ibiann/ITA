# So hai báo cáo HTML của cùng một tài khoản (lần trước → lần này): số màn đã kiểm, màn có trước mà nay không có,
# mã ca / mã TC có kết quả trước mà nay không có, kết luận đổi. Chỉ đọc hai tệp, không ghi gì.
# Chạy: python3 -I cong-cu/so_truoc_sau.py <báo cáo trước.html> <báo cáo sau.html>
# Mã thoát 1 khi lần sau thiếu màn hoặc mất kết quả của mã ca / TC nào đó (lần chạy mới chưa «đủ như cũ»).
import html, re, sys

def bang(t):
    """Mỗi bảng → (tiêu đề cột, các dòng); dòng là danh sách ô đã bỏ thẻ."""
    ra = []
    for b in re.findall(r'<table>(.*?)</table>', t, flags=re.S):
        tieu_de = [html.unescape(re.sub(r'<[^>]+>', '', x)).strip() for x in re.findall(r'<th>(.*?)</th>', b, flags=re.S)]
        dong = [[html.unescape(re.sub(r'<[^>]+>', ' ', x)).strip() for x in re.findall(r'<td[^>]*>(.*?)</td>', r, flags=re.S)]
                for r in re.findall(r'<tr[^>]*>(.*?)</tr>', b, flags=re.S)]
        ra.append((tieu_de, [d for d in dong if d]))
    return ra

def doc(tep):
    t = open(tep, encoding='utf-8').read()
    t = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', t, flags=re.S)
    i = t.find('Các màn đã kiểm (')
    man = []
    for tieu_de, dong in bang(t[i:]) if i >= 0 else []:
        if 'Màn' in tieu_de and 'URL' in tieu_de:
            k = tieu_de.index('Màn') - (len(tieu_de) - len(dong[0])) if dong else 0
            man = [d[max(k, 0)] for d in dong]
            break
    ket_qua = {}
    for tieu_de, dong in bang(t):
        if 'Mã ca' in tieu_de and 'Kết quả' in tieu_de:
            lech = len(tieu_de) - len(dong[0]) if dong else 0
            a, b = tieu_de.index('Mã ca') - lech, tieu_de.index('Kết quả') - lech
            for d in dong: ket_qua.setdefault(d[a], d[b])
        elif 'Mã TC v7' in tieu_de and 'Theo mã' in tieu_de:   # TC v7 của bước đã dời: kết quả theo mã đề xuất
            for d in dong: ket_qua.setdefault(d[0], d[2])
    tk = re.search(r'<b>Tài khoản:</b> ([^<·]*)', t)
    phu = re.search(r'TC áp cho vai này: <b>(\d+)</b> · có kết quả: <b>(\d+)</b>', t)
    return {'tk': html.unescape(tk.group(1)).strip() if tk else '?', 'man': man, 'kq': ket_qua, 'phu': phu.groups() if phu else None}

def so(truoc, sau):
    a, b = doc(truoc), doc(sau)
    if a['tk'] != b['tk']: print('CHÚ Ý: hai báo cáo khác tài khoản:', a['tk'], '/', b['tk'])
    print('Tài khoản:', b['tk'])
    thieu_man = [m for m in a['man'] if m not in set(b['man'])]
    print('Màn đã kiểm: trước %d → sau %d; màn có trước mà nay không có: %d' % (len(a['man']), len(b['man']), len(thieu_man)))
    for m in thieu_man[:40]: print('   -', m)
    if a['phu'] and b['phu']: print('TC áp cho vai / có kết quả: trước %s/%s → sau %s/%s' % (a['phu'][0], a['phu'][1], b['phu'][0], b['phu'][1]))
    mat = sorted(set(a['kq']) - set(b['kq']))
    print('Mã ca / TC có kết quả trước mà nay không có: %d' % len(mat))
    for m in mat[:60]: print('   -', m, '(trước:', a['kq'][m] + ')')
    doi = {}
    for m in set(a['kq']) & set(b['kq']):
        if a['kq'][m] != b['kq'][m]: doi[a['kq'][m] + ' → ' + b['kq'][m]] = doi.get(a['kq'][m] + ' → ' + b['kq'][m], 0) + 1
    if doi: print('Kết luận đổi:', ', '.join('%s: %d' % x for x in sorted(doi.items(), key=lambda x: -x[1])))
    return len(mat), len(thieu_man)

if __name__ == '__main__':
    if len(sys.argv) != 3: sys.exit('Dùng: python3 -I cong-cu/so_truoc_sau.py <báo cáo trước.html> <báo cáo sau.html>')
    mat, thieu = so(sys.argv[1], sys.argv[2])
    sys.exit(1 if mat or thieu else 0)
