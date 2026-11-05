# Sinh du-an/<dự án>/trang-thai-quy-trinh.json: tài liệu quy trình (du-an/<dự án>/quy-trinh/) đối chiếu khai báo quy trình của app
# (core/processes/*/workflow/*.yaml), kèm số báo cáo rà soát có nhắc tới từng mục (thư mục hoặc tệp zip báo cáo 196–235).
# Chỉ so điều đọc được chắc chắn từ hai bên; không suy app sai hay tài liệu sai.
#   - tai_lieu_app_khong_co: tài liệu trỏ tới tệp khai báo app không còn
#   - buoc_app_khong_co: mã bước của tài liệu không có trong khai báo app (theo tên bước app, hoặc «useCase: sổ <mã> · step:<mã bước>»)
#   - chang_khac_app: «Từ chặng» của bước trong tài liệu khác «from» trong tệp khai báo của chính tài liệu
#   - app_chua_co_tai_lieu: tệp khai báo app không tài liệu nào trỏ tới
# Chạy: python3 -I cong-cu/sinh_trang_thai_qt.py [--app ~/dqtv/dqtv-app] [--ra-soat ~/Downloads/RA-QT-TOAN-BO.zip] [--du-an dqtv]
import argparse, datetime, json, pathlib, re, subprocess, zipfile
import yaml

GOC = pathlib.Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser()
ap.add_argument('--app', default=str(pathlib.Path.home() / 'dqtv/dqtv-app'))
ap.add_argument('--ra-soat', default=str(pathlib.Path.home() / 'Downloads/RA-QT-TOAN-BO.zip'))
ap.add_argument('--du-an', default='dqtv')
a = ap.parse_args()
APP = pathlib.Path(a.app)
QP = APP / 'core/processes'

def git(*x):
    try: return subprocess.run(['git', '-C', str(APP), *x], capture_output=True, text=True).stdout.strip()
    except Exception: return ''

# 1. khai báo app
tep_app, theo_uc, theo_ten = {}, {}, {}
for f in sorted(QP.glob('*/workflow/*.yaml')):
    rel = str(f.relative_to(QP))
    y = yaml.safe_load(f.read_text(encoding='utf-8')) or {}
    ts = [t for t in (y.get('transitions') or []) if isinstance(t, dict)]
    tep_app[rel] = {'entity': y.get('entity'), 'buoc': [t.get('action') for t in ts]}
    for t in ts:
        t = dict(t, __tep=rel)
        theo_ten.setdefault(t.get('action'), []).append(t)
        for m in re.finditer(r'sổ\s+(\S+)\s*·\s*step:(\w+)', str(t.get('useCase', ''))):
            theo_uc.setdefault((m.group(1), m.group(2)), []).append(t)

# 2. tài liệu (bảng máy sinh mục 7)
def bang_buoc(chu):
    a0 = chu.find('<!-- máy sinh: buoc -->')
    if a0 < 0: return []
    khoi = chu[a0:chu.find('<!-- hết: buoc -->', a0)].split('\n')
    cot, ra = None, []
    for l in khoi[1:]:
        if not l.startswith('|'):
            if cot: break
            continue
        if re.match(r'^\|[\s:|-]+\|?\s*$', l): continue
        o = [x.strip() for x in l.strip().strip('|').split(' | ')]
        if cot is None: cot = o; continue
        ra.append(dict(zip(cot, o)))
    return ra

tai_lieu = {}
for f in sorted((GOC / 'du-an' / a.du_an / 'quy-trinh').rglob('*.md')):
    chu = f.read_text(encoding='utf-8')
    if '<!-- máy sinh: buoc -->' not in chu: continue
    so = re.match(r'# (\S+)', chu).group(1)
    m = re.search(r'khai báo của app: `(?:dqtv-app/)?core/processes/([^`]+)`', chu)
    tai_lieu[so] = {'tep': f.name, 'tep_app': m.group(1) if m else None, 'buoc': bang_buoc(chu)}

ma = lambda so: so[3:] if so.startswith('qt-') else so   # khớp cột «Quy trình» của v7 và mã của bộ đọc quy-trinh-md
ds_from = lambda t: sorted([t.get('from')] if isinstance(t.get('from'), str) else (t.get('from') or []))
ra = {'tai_lieu_app_khong_co': [], 'buoc_app_khong_co': {}, 'chang_khac_app': {}, 'app_chua_co_tai_lieu': []}
for so, d in tai_lieu.items():
    if d['tep_app'] and d['tep_app'] not in tep_app:
        ra['tai_lieu_app_khong_co'].append({'ma': ma(so), 'tep': d['tep'], 'tep_app': d['tep_app'], 'so_buoc': len(d['buoc'])})
        continue
    for b in d['buoc']:
        mb = b.get('Mã bước', '').strip('`')
        ts = theo_uc.get((so, mb)) or [t for t in theo_ten.get(mb, []) if t['__tep'] == d['tep_app']] or theo_ten.get(mb, [])
        if not ts:
            ra['buoc_app_khong_co'].setdefault(ma(so), []).append({'so': b.get('#'), 'ma_buoc': mb, 'ten': b.get('Bước', '')})
            continue
        rieng = [t for t in ts if t['__tep'] == d['tep_app']]   # chỉ so chặng với tệp khai báo của chính tài liệu
        if not rieng: continue
        tu = b.get('Từ chặng', '')
        tu_tl = [] if tu.startswith('—') else sorted(re.findall(r'`(\w+)`', tu))
        if not any(ds_from(t) == tu_tl for t in rieng):
            ra['chang_khac_app'].setdefault(ma(so), []).append({'so': b.get('#'), 'ma_buoc': mb, 'tu_tai_lieu': tu_tl, 'tu_app': ds_from(rieng[0]), 'tep_app': rieng[0]['__tep']})
dung = {d['tep_app'] for d in tai_lieu.values() if d['tep_app']}
for rel, x in tep_app.items():
    if rel not in dung: ra['app_chua_co_tai_lieu'].append({'tep_app': rel, 'entity': x['entity'], 'buoc': x['buoc']})

# 3. báo cáo rà soát nhắc tới mục nào (số báo cáo + mã dòng nếu dòng bảng bắt đầu bằng mã)
bc = {}
p = pathlib.Path(a.ra_soat)
if p.is_dir(): bc = {f.name: f.read_text(encoding='utf-8') for f in sorted(p.glob('*.md'))}
elif p.suffix == '.zip' and p.exists():
    with zipfile.ZipFile(p) as z: bc = {n: z.read(n).decode('utf-8') for n in sorted(z.namelist()) if n.endswith('.md')}
def nhac(*tu):
    out = []
    for ten, chu in bc.items():
        so_bc = ten.split('_')[0]
        for l in chu.split('\n'):
            if any(re.search(r'(?<![\w.-])' + re.escape(t) + r'(?![\w-])', l) for t in tu if t):
                m = re.match(r'\|\s*([KLAXNI]-\d+)\b', l)
                k = so_bc + (' ' + m.group(1) if m else '')
                if k not in out: out.append(k)
    return sorted(out, key=lambda x: (x.split()[0], x))[:6]
for x in ra['tai_lieu_app_khong_co']: x['ra_soat'] = nhac(x['tep'][:-3], x['tep_app'])
for q, ds in ra['buoc_app_khong_co'].items():
    for x in ds: x['ra_soat'] = nhac(x['ma_buoc'])
for q, ds in ra['chang_khac_app'].items():
    for x in ds: x['ra_soat'] = nhac(x['ma_buoc'])
for x in ra['app_chua_co_tai_lieu']: x['ra_soat'] = nhac(x['tep_app'].split('/')[-1], *[b for b in x['buoc'] if b])

ra['_nguon'] = {
    'app': 'dqtv-app nhánh %s @ %s (%s)' % (git('rev-parse', '--abbrev-ref', 'HEAD'), git('rev-parse', '--short', 'HEAD'), git('log', '-1', '--format=%cs')),
    'app_core_processes_giong_dev': git('rev-parse', '--short', 'origin/dev') if not git('diff', '--stat', 'origin/dev', 'HEAD', '--', 'core/processes') else '',
    'tai_lieu': 'du-an/%s/quy-trinh (%d tài liệu có bảng bước)' % (a.du_an, len(tai_lieu)),
    'ra_soat': p.name if bc else '',
    'sinh_luc': datetime.datetime.now().isoformat(timespec='seconds'),
    'ghi_chu': 'So máy móc hai bên. «Không có trong khai báo app» chưa chứng minh app không làm việc ấy (vd bước hệ thống app làm bằng mã riêng); dùng để tool không chấm các TC đó, không phải kết luận lỗi.',
}
tep = GOC / 'du-an' / a.du_an / 'trang-thai-quy-trinh.json'
tep.write_text(json.dumps(ra, ensure_ascii=False, indent=1), encoding='utf-8')
print('Đã ghi', tep.relative_to(GOC), '—', len(tai_lieu), 'tài liệu ·', len(tep_app), 'tệp khai báo app')
print('  tài liệu app không có:', [x['ma'] for x in ra['tai_lieu_app_khong_co']])
print('  bước app không có:', sum(len(v) for v in ra['buoc_app_khong_co'].values()), 'ở', len(ra['buoc_app_khong_co']), 'tài liệu')
print('  chặng nguồn khác app:', sum(len(v) for v in ra['chang_khac_app'].values()), 'bước ở', len(ra['chang_khac_app']), 'tài liệu')
print('  app chưa có tài liệu:', [x['tep_app'] for x in ra['app_chua_co_tai_lieu']])
print('  nguồn:', ra['_nguon']['app'], '| core/processes giống origin/dev:', ra['_nguon']['app_core_processes_giong_dev'] or 'KHÔNG')
