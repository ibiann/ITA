# Ghép gói dự án + bộ máy thành một tệp dán Console / Tampermonkey.
import argparse, csv, hashlib, json, pathlib, re, sys

GOC = pathlib.Path(__file__).resolve().parent.parent
# thứ tự dòng dữ liệu như 3.26: đặc tả, quy tắc, rồi danh mục TC
DONG_DL = [('dac-ta.json', 'window.__itaDacTaNap = '), ('quy-tac.json', 'window.__itaQuyTac = ')]
DAU_DM = 'window.__itaDanhMucTC = '
CAC_COT = ['Mã TC', 'Mã UC', 'Loại kiểm thử', 'Ưu tiên', 'Vai', 'Bộ chạy đích', 'Loại ca tool', 'Trạng thái TC']
UU_TIEN = ['Cao', 'Trung bình', 'Thấp']
VAI_PHU_DINH = 'tài khoản cùng đơn vị, KHÔNG giữ vai:'
# AC-CHT (Tên) | AC-CHT Tên | AC-CHT: ghi chú mã vai của hệ thống, bỏ mã giữ tên
RE_AC_TEN = re.compile(r'^AC-[A-Za-z]+(?:\s*\((.+)\)|\s+(.+))$')
RE_AC = re.compile(r'^AC-[A-Za-z]+$')
# Tên (`mã`) | Tên (mã): mã kỹ thuật nối sau tên, bỏ mã giữ tên. Chú thích tiếng Việt ("người giữ vai ở cấp trên…") thì giữ
RE_TEN_MA = re.compile(r'^(.+?)\s*\((?:`[^`]+`|[A-Za-z][A-Za-z_-]*)\)\s*')


def bam(du_lieu):
    return hashlib.sha256(du_lieu).hexdigest()[:12]


def tach_vai(chuoi, tu_dien):
    """Một ô Vai -> danh sách vai chuẩn. tu_dien: mã AC -> tên (tự học từ chính cột Vai)."""
    ra = []
    for mau in chuoi.split(';'):
        mau = mau.strip()
        if mau in ('', '—'):
            continue
        if mau.startswith(VAI_PHU_DINH):
            ra.append(mau)  # vai phủ định: giữ nguyên chuỗi, không khớp tài khoản nào
            continue
        m = RE_AC_TEN.match(mau)
        if m:
            mau = (m.group(1) or m.group(2)).strip()
        mau = mau.strip('`')
        # `AC-CHT/AC-CTV/…` hoặc AC-CHT trơ: tra tên
        ma = [x.strip() for x in mau.split('/')]
        if all(RE_AC.match(x) and x in tu_dien for x in ma):
            ra += [tu_dien[x] for x in ma]
            continue
        # gỡ mã kỹ thuật nối sau tên, có thể hai lần: Tên (`mã`) (chú thích)
        while True:
            m = RE_TEN_MA.match(mau)
            if not m:
                break
            mau = (m.group(1) + ' ' + mau[m.end():]).strip()
        ra += tach_phay(mau, set(tu_dien.values()))
    return ra


def tach_phay(mau, biet):
    """'A, B' -> [A, B] chỉ khi mọi phần là vai đã biết (tên vai có thể chứa dấu phẩy, nên ghép dài nhất trước)."""
    if mau in biet or ', ' not in mau:
        return [mau]
    phan, ra, i = mau.split(', '), [], 0
    while i < len(phan):
        j = next((j for j in range(len(phan), i, -1) if ', '.join(phan[i:j]) in biet), None)
        if j is None:
            return [mau]
        ra.append(', '.join(phan[i:j]))
        i = j
    return ra


def doc_tc(tep):
    """tc_all.csv -> danh mục TC bản 2. Thiếu cột hoặc trùng mã thì dừng."""
    du_lieu = tep.read_bytes()
    with open(tep, encoding='utf-8-sig', newline='') as f:
        rd = csv.DictReader(f)
        thieu = [c for c in CAC_COT if c not in (rd.fieldnames or [])]
        if thieu:
            sys.exit('Thiếu cột trong ' + tep.name + ': ' + ', '.join(thieu))
        hang = list(rd)
    ma_thay = {}
    for h in hang:
        if h['Mã TC'] in ma_thay:
            sys.exit('Mã TC trùng trong ' + tep.name + ': ' + h['Mã TC'])
        ma_thay[h['Mã TC']] = 1
    tu_dien = {}
    for h in hang:
        for mau in h['Vai'].split(';'):
            m = RE_AC_TEN.match(mau.strip())
            if m and not mau.strip().startswith(VAI_PHU_DINH):
                tu_dien[mau.strip().split()[0].split('(')[0]] = (m.group(1) or m.group(2)).strip()
    ds = {'vai': {}, 'loai_ca': {}, 'bo_chay': {}}
    idx = lambda k, v: ds[k].setdefault(v, len(ds[k]))
    tc = []
    for h in hang:
        if h['Ưu tiên'] not in UU_TIEN:
            sys.exit('Ưu tiên lạ ở ' + h['Mã TC'] + ': ' + h['Ưu tiên'])
        vai = sorted({idx('vai', v) for v in tach_vai(h['Vai'], tu_dien)})
        tc.append([h['Mã TC'], h['Mã UC'], h['Loại kiểm thử'], UU_TIEN.index(h['Ưu tiên']),
                   idx('bo_chay', h['Bộ chạy đích']), idx('loai_ca', h['Loại ca tool']), vai,
                   1 if 'chờ PM quyết' in h['Trạng thái TC'] else 0])
    return {'phien_ban': 2, 'meta': {'tep': tep.name, 'so_tc': len(tc), 'bam': bam(du_lieu)},
            'vai': list(ds['vai']), 'loai_ca': list(ds['loai_ca']), 'bo_chay': list(ds['bo_chay']), 'tc': tc}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--goi', default=GOC / 'goi-du-an/dqtv')
    ap.add_argument('--may', default=GOC / 'may')
    ap.add_argument('--ra', required=True)
    ap.add_argument('--tc', help='tc_all.csv của PM: sinh danh mục TC bản 2')
    ap.add_argument('--dm-cu', help='tệp 3.26: lấy nguyên dòng danh mục TC (chỉ để chứng minh ghép y nguyên)')
    a = ap.parse_args()
    goi, may = pathlib.Path(a.goi), pathlib.Path(a.may)

    ra = ['// ITA — công cụ kiểm giao diện + đặc tả quy trình, bản 5.0 (ghép từ gói + bộ máy)\n',
          '// Nguồn: ' + goi.parent.name + '/' + goi.name + ' + may/\n']
    # hồ sơ dự án đứng đầu phần dữ liệu: lá chắn đọc nó ngay khi nạp (gói cũ chưa có thì bỏ qua = chặn mọi POST)
    if a.tc and a.dm_cu:
        sys.exit('--tc và --dm-cu loại trừ nhau')
    dm_tc = doc_tc(pathlib.Path(a.tc)) if a.tc else None
    dong_dl = ([('du-an.json', 'window.__itaDuAn = ')] if (goi / 'du-an.json').exists() else []) + DONG_DL
    hn = goi / 'hieu-nang.json'
    for ten, tt in dong_dl:
        du = json.loads((goi / ten).read_text(encoding='utf-8'))
        if ten == 'du-an.json':  # mã băm ghi lúc đóng gói, không sửa tệp nguồn
            du['bam'] = {t: bam((goi / t).read_bytes()) for t in ['du-an.json', 'dac-ta.json', 'quy-tac.json', 'hieu-nang.json'] if (goi / t).exists()}
            if dm_tc:
                du['bam']['tc_all.csv'] = dm_tc['meta']['bam']
        ra.append(tt + json.dumps(du, ensure_ascii=False, separators=(',', ':')) + ';\n')
    if dm_tc:
        ra.append(DAU_DM + json.dumps(dm_tc, ensure_ascii=False, separators=(',', ':')) + ';\n')
    elif a.dm_cu:
        with open(a.dm_cu, encoding='utf-8', newline='') as f:
            dm = next((d for d in f.read().split('\n')[:5] if d.startswith(DAU_DM)), None)
        if dm is None:
            sys.exit('Không thấy dòng ' + DAU_DM.strip() + ' trong ' + a.dm_cu)
        ra.append(dm + '\n')
    else:
        print('Chưa có danh mục TC (--tc hoặc --dm-cu): bỏ dòng này', file=sys.stderr)
    if hn.exists():
        ra.append('window.__itaHieuNang = ' + json.dumps(json.loads(hn.read_text(encoding='utf-8')), ensure_ascii=False, separators=(',', ':')) + ';\n')
    tep = sorted(may.glob('*.js'))
    if not tep:
        sys.exit('Không có tệp .js nào trong ' + str(may))
    for t in tep:
        with open(t, encoding='utf-8', newline='') as f:
            ra.append(f.read())
    out = pathlib.Path(a.ra)
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, 'w', encoding='utf-8', newline='') as f:
        f.write(''.join(ra))
    print('Đã ghép', out)


main()
