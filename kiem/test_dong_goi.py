# Kiểm bước tách/ghép: tách 3.26 vào thư mục tạm, ghép lại, phải trùng từng byte từ dòng 3.
import csv, functools, json, pathlib, subprocess, sys, tempfile

GOC = pathlib.Path(__file__).resolve().parent.parent
BAN_326 = pathlib.Path.home() / 'Downloads' / 'dqtv-kiem-tra-dacta-3.26.js'
TC_CSV = pathlib.Path.home() / 'Downloads/MaTran_UC_TC_DQTV_02112026_v7/tc_all.csv'
DAU_DM = 'window.__dqtvDanhMucTC = '


def chay(*lenh):
    return subprocess.run([sys.executable, '-I', *map(str, lenh)], capture_output=True, text=True)


def test_ghep_lai_y_nguyen():
    with tempfile.TemporaryDirectory() as tam:
        tam = pathlib.Path(tam)
        r = chay(GOC / 'cong-cu/tach_326.py', BAN_326, '--may', tam / 'may', '--goi', tam / 'goi')
        assert r.returncode == 0, r.stderr
        r = chay(GOC / 'cong-cu/dong_goi.py', '--goi', tam / 'goi', '--may', tam / 'may',
                 '--ra', tam / 'x.js', '--dm-cu', BAN_326)
        assert r.returncode == 0, r.stderr
        moi = (tam / 'x.js').read_bytes().split(b'\n', 2)[2]
        cu = BAN_326.read_bytes().split(b'\n', 2)[2]
        assert moi == cu, 'ghép lại lệch: %d byte so với %d byte' % (len(moi), len(cu))
        r = subprocess.run(['node', '--check', str(tam / 'x.js')], capture_output=True, text=True)
        assert r.returncode == 0, r.stderr


def test_thieu_moc_thi_dung():
    with tempfile.TemporaryDirectory() as tam:
        tam = pathlib.Path(tam)
        hong = tam / 'hong.js'
        hong.write_text('//a\n//b\nwindow.__dqtvDanhMucTC = {};\nwindow.__dqtvDacTaNap = [];\nwindow.__dqtvQuyTac = {};\nx\n', encoding='utf-8')
        r = chay(GOC / 'cong-cu/tach_326.py', hong, '--may', tam / 'may', '--goi', tam / 'goi')
        assert r.returncode != 0 and '0. LÁ CHẮN' in r.stderr, r.stderr


@functools.lru_cache(maxsize=1)
def dong_goi_tc():
    """Đóng gói thật với tc_all.csv v7; trả về (danh mục TC, dòng __dqtvDuAn, dòng __dqtvHieuNang)."""
    tam = pathlib.Path(tempfile.mkdtemp())
    r = chay(GOC / 'cong-cu/dong_goi.py', '--tc', TC_CSV, '--ra', tam / 'x.js')
    assert r.returncode == 0, r.stderr
    dong = (tam / 'x.js').read_text(encoding='utf-8').split('\n')
    lay = lambda dau: next(d for d in dong if d.startswith(dau))
    dm = json.loads(lay(DAU_DM)[len(DAU_DM):].rstrip(';'))
    return dm, lay('window.__dqtvDuAn = '), lay('window.__dqtvHieuNang = ')


def test_dem_tc():
    dm = dong_goi_tc()[0]
    assert dm['phien_ban'] == 2 and dm['meta']['so_tc'] == 44124 and len(dm['tc']) == 44124
    assert sum(1 for t in dm['tc'] if t[7] == 1) == 8710
    assert len(dm['tc']) == len({t[0] for t in dm['tc']})


def test_giu_6():
    dm = dong_goi_tc()[0]
    with open(TC_CSV, encoding='utf-8-sig', newline='') as f:
        ma_giu = {r['Mã TC'] for r in csv.DictReader(f) if 'GIỮ đến khi lỗi đóng' in r['Trạng thái TC']}
    assert len(ma_giu) == 6, len(ma_giu)
    nhom = {t[0]: t[7] for t in dm['tc']}
    assert [m for m in ma_giu if nhom[m] != 0] == []


def test_vai_m1():
    dm = dong_goi_tc()[0]
    tc = {t[0]: t for t in dm['tc']}
    with open(TC_CSV, encoding='utf-8-sig', newline='') as f:
        m1 = [r for r in csv.DictReader(f) if r['Bộ chạy đích'].startswith('M1')]
    # 18 TC M1 của PM để trống cột Vai (ô tìm, trợ năng, tương thích, xem, đảo): không có vai để khớp, báo ở báo cáo
    co_vai = [r for r in m1 if r['Vai'].strip() not in ('', '—')]
    assert len(co_vai) >= len(m1) - 18, (len(co_vai), len(m1))
    hong = [r['Mã TC'] for r in co_vai if not tc[r['Mã TC']][6]]
    assert hong == [], hong[:10]
    bo = dm['bo_chay']
    assert all(bo[tc[r['Mã TC']][4]].startswith('M1') for r in m1)


def test_bam_va_hieu_nang():
    _, du_an, hieu_nang = dong_goi_tc()
    bam = json.loads(du_an[len('window.__dqtvDuAn = '):].rstrip(';'))['bam']
    assert set(bam) == {'tc_all.csv', 'du-an.json', 'dac-ta.json', 'quy-tac.json', 'hieu-nang.json'}
    assert all(len(v) == 12 for v in bam.values())
    goc = json.loads((GOC / 'goi-du-an/dqtv/hieu-nang.json').read_text(encoding='utf-8'))
    assert json.loads(hieu_nang[len('window.__dqtvHieuNang = '):].rstrip(';')) == goc


def _csv_mau(tam, bo_cot=None, lap_ma=False):
    cot = ['Mã TC', 'Mã UC', 'Loại kiểm thử', 'Ưu tiên', 'Vai', 'Bộ chạy đích', 'Loại ca tool', 'Trạng thái TC']
    hang = [['A.1', 'A', 'T01', 'Cao', 'Trợ lý Quân lực', 'M1 x', 'XEM', 'ok'],
            ['A.1' if lap_ma else 'A.2', 'A', 'T01', 'Thấp', '', 'M2 x', 'GHI', 'ok']]
    i = cot.index(bo_cot) if bo_cot else None
    tep = tam / 'mau.csv'
    with open(tep, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f)
        for h in [cot] + hang:
            w.writerow([v for j, v in enumerate(h) if j != i])
    return tep


def test_thieu_cot():
    with tempfile.TemporaryDirectory() as tam:
        tam = pathlib.Path(tam)
        r = chay(GOC / 'cong-cu/dong_goi.py', '--tc', _csv_mau(tam, 'Mã UC'), '--ra', tam / 'x.js')
        assert r.returncode != 0 and 'Mã UC' in r.stderr, r.stderr
        assert not (tam / 'x.js').exists()


def test_trung_ma():
    with tempfile.TemporaryDirectory() as tam:
        tam = pathlib.Path(tam)
        r = chay(GOC / 'cong-cu/dong_goi.py', '--tc', _csv_mau(tam, lap_ma=True), '--ra', tam / 'x.js')
        assert r.returncode != 0 and 'A.1' in r.stderr, r.stderr


if __name__ == '__main__':
    for ten, ham in list(globals().items()):
        if ten.startswith('test_'):
            ham()
            print('đạt:', ten)
