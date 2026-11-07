# Ghép may/*.js (+ gói dự án, nếu có) thành một tệp dán Console: dist/ita.js (chỉ máy kiểm) hoặc dist/ita-<dự án>.js (gói sẵn dự án)
# Đóng gói sẵn (bước 7d): du-an/<dự án>/quy-trinh/**/*.md và tc/** (*.csv; *.zip → các tệp .csv bên trong, chỉ giữ cột tool đọc),
# nén gzip + base64 vào window.__itaGoiSan; lúc khởi động tool giải nén và cho qua bộ đọc như tệp đã nạp.
# Thư mục du-an/<dự án>/ trống thì vẫn ra tệp chạy được.
# Thứ tự ghép: may/ có số < 90, rồi bo-doc/*.js (bộ đọc, nằm trong cùng khối mã), rồi may/ từ 90 (khởi động, đóng khối).
# [bước 11] thu-vien/axe-core-<bản>/axe.min.js (Deque, MPL-2.0, giữ nguyên dòng giấy phép) đặt trước khối mã: kiểm trợ năng WCAG 2.2 AA, không tải gì từ mạng lúc chạy.
# Chạy: python3 -I cong-cu/dong_goi.py [--du-an <tên thư mục trong du-an/>] [--ra <tệp ra>]
import argparse, base64, csv, datetime, gzip, hashlib, io, json, pathlib, re, sys, zipfile

GOC = pathlib.Path(__file__).resolve().parent.parent
# cột của tc_all.csv mà bo-doc/30-v7-tc-csv.js và bo-doc/90-ghep-v7-tai-lieu.js đọc; giữ đủ dòng (phần ghép học tên vai từ mọi dòng)
COT_TC = ['Mã TC', 'Mã UC', 'Quy trình', 'Bước', 'Loại ca tool', 'Bộ chạy đích', 'Vai', 'Màn', 'Thao tác', 'Dữ liệu nhập',
          'Kết quả mong đợi', 'Căn cứ đặc tả Bên B', 'Trạng thái TC', 'Ưu tiên']


def rut_gon_csv(chu):
    csv.field_size_limit(10 ** 9)
    r = csv.DictReader(io.StringIO(chu.lstrip('﻿')))
    if not all(c in r.fieldnames for c in COT_TC):
        return chu   # không phải khuôn v7: giữ nguyên, bộ đọc tự quyết
    o = io.StringIO()
    w = csv.DictWriter(o, fieldnames=COT_TC, extrasaction='ignore', lineterminator='\n')
    w.writeheader()
    for d in r:
        w.writerow(d)
    return o.getvalue()


def goi_san(du_an):
    goc = GOC / 'du-an' / du_an
    tep = []   # (tên, chữ, lúc)
    for p in sorted((goc / 'quy-trinh').rglob('*.md')):
        tep.append((str(p.relative_to(goc)), p.read_text(encoding='utf-8'), p.stat().st_mtime))
    for p in sorted((goc / 'tc').rglob('*')):
        if p.suffix == '.csv':
            tep.append((str(p.relative_to(goc)), rut_gon_csv(p.read_text(encoding='utf-8')), p.stat().st_mtime))
        elif p.suffix == '.zip':
            with zipfile.ZipFile(p) as z:
                for n in z.namelist():
                    if n.endswith('.csv'):
                        tep.append((str(p.relative_to(goc)) + '/' + n, rut_gon_csv(z.read(n).decode('utf-8')), p.stat().st_mtime))
    ra = []
    for ten, chu, mt in tep:
        b = chu.encode('utf-8')
        ra.append({'ten': ten, 'gz': base64.b64encode(gzip.compress(b, 9, mtime=0)).decode('ascii'), 'bam': hashlib.sha256(b).hexdigest()[:12],
                   'luc': datetime.datetime.fromtimestamp(mt).strftime('%d/%m/%Y %H:%M')})
    return ra


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--du-an', default='', help='không ghi: chỉ máy kiểm, nạp gói dự án bằng nút «Nạp thư mục»')
    ap.add_argument('--ra', help='tệp ra; mặc định dist/ita.js hoặc dist/ita-<dự án>.js')
    a = ap.parse_args()
    may = sorted((GOC / 'may').glob('*.js'))
    if not may:
        sys.exit('may/ trống: chạy cong-cu/tach.py trước')
    truoc = [p for p in may if p.name[:2] < '90']
    sau = [p for p in may if p.name[:2] >= '90']
    bo_doc = sorted((GOC / 'bo-doc').glob('*.js'))
    ma = ''.join(p.read_text(encoding='utf-8') for p in truoc + bo_doc + sau)
    ban = re.search(r"const PHIEN_BAN = '([^']+)'", ma)
    if not ban:
        sys.exit('Không thấy PHIEN_BAN trong may/')
    ban = ban.group(1)
    luc = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds')
    gs = goi_san(a.du_an) if a.du_an else []
    dau = ['// ITA — máy kiểm giao diện, bản %s, đóng gói %s; gói dự án: %s; kèm sẵn %d tệp tài liệu / TC (nén)\n' % (ban, luc, a.du_an or 'không (nạp bằng «Nạp thư mục»)', len(gs))]
    # tệp nào trong du-an/<dự án>/ có thì đóng gói kèm, thiếu thì bỏ qua (máy kiểm vẫn chạy)
    for ten, bien in (('ho-so.json', '__itaHoSo'), ('loi-da-biet.json', '__itaQuyTac'), ('gioi-han-o.json', '__itaGioiHanO'),
                      ('trang-thai-quy-trinh.json', '__itaTrangThaiQT')):
        tep = GOC / 'du-an' / a.du_an / ten
        if a.du_an and tep.exists():
            dl = json.loads(tep.read_text(encoding='utf-8'))
            dau.append('window.%s = %s;\n' % (bien, json.dumps(dl, ensure_ascii=False, separators=(',', ':'))))
            print('kèm', tep.relative_to(GOC))
    for axe in sorted((GOC / 'thu-vien').glob('axe-core-*/axe.min.js'))[-1:]:
        dau.append('if (!window.axe) {\n' + axe.read_text(encoding='utf-8') + '\n}\n')   # dán lại lần nữa: không nạp axe hai lần
        print('kèm', axe.relative_to(GOC))
    if gs:
        dau.append('window.__itaGoiSan = %s;\n' % json.dumps(gs, separators=(',', ':')))
        print('kèm sẵn %d tệp quy trình / TC (nén %d byte)' % (len(gs), sum(len(x['gz']) for x in gs)))
    ra = pathlib.Path(a.ra) if a.ra else GOC / 'dist' / (('ita-%s.js' % a.du_an) if a.du_an else 'ita.js')
    ra.parent.mkdir(exist_ok=True)
    ra.write_text(''.join(dau) + ma, encoding='utf-8')
    print('Đã ghi %s (%d byte)' % (ra, ra.stat().st_size))


main()
