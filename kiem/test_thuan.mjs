// Kiểm hàm thuần của bộ máy (may/05-thuan.js). Chạy: node --test kiem/test_thuan.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const { laPostDuocPhep, epChiDoc, cauHinhGoiAnToan, vaiCuaTaiKhoan, chamTheoMaTran, chamKhungChung, gopKetQua, csvMaTran, docCSVMaTran, kiemGoi, chuanLoc, chuoiBam } = createRequire(import.meta.url)('../may/05-thuan.js');
const DS = ['/api/session', '/api/search'];
const GOC = 'https://dqtv.linksafe.vn/';
const qua = (m, u) => laPostDuocPhep(m, u, DS, GOC);

test('cho qua đúng đường dẫn xác thực / tìm kiếm', () => {
  assert.equal(qua('POST', '/api/session'), true);
  assert.equal(qua('POST', 'https://dqtv.linksafe.vn/api/search?q=a'), true);
  assert.equal(qua('POST', '/api/search/'), true);
  assert.equal(qua('post', '/api/session#x'), true);
});

test('chặn lệnh ghi thật và đường dẫn chỉ bắt đầu giống', () => {
  for (const [m, u] of [
    ['POST', '/api/duty-registrations/1/extend-age'], ['POST', '/api/x/extend-deadline'],
    ['POST', '/api/session/extend'], ['POST', '/api/search-index/rebuild'],
    ['PUT', '/api/session'], ['DELETE', '/api/search'], ['PATCH', '/api/search'],
  ]) assert.equal(qua(m, u), false, m + ' ' + u);
});

test('thiếu danh sách hoặc địa chỉ hỏng thì chặn', () => {
  assert.equal(laPostDuocPhep('POST', '/api/session', [], GOC), false);
  assert.equal(laPostDuocPhep('POST', '/api/session', undefined, GOC), false);
  assert.equal(laPostDuocPhep('POST', 'http://[bad', DS, GOC), false);
  assert.equal(qua('POST', '//evil.test/api/session/x'), false);
});

test('danh sách không phải mảng (chuỗi) thì chặn hết', () => {
  assert.equal(laPostDuocPhep('POST', '/api', '/api/session', GOC), false);
  assert.equal(laPostDuocPhep('POST', '/', '/api/session', GOC), false);
  assert.equal(laPostDuocPhep('POST', '/api/session', '/api/session', GOC), false);
});

test('epChiDoc ép chỉ đọc, không đụng bản gốc', () => {
  const g = { mucQuyTrinh: 2, chanGhi: false, slowMs: 5 };
  assert.deepEqual(epChiDoc(g), { mucQuyTrinh: 1, chanGhi: true, slowMs: 5 });
  assert.equal(g.mucQuyTrinh, 2);
  assert.deepEqual(epChiDoc({ mucQuyTrinh: 3, chanGhi: true }), { mucQuyTrinh: 1, chanGhi: true });
  assert.deepEqual(epChiDoc({ mucQuyTrinh: 1, chanGhi: true }), { mucQuyTrinh: 1, chanGhi: true });
});

test('gói dự án không mở được chế độ ghi', () => {
  assert.deepEqual(cauHinhGoiAnToan({ slowMs: 3000, chanGhi: false, mucQuyTrinh: 3, moiTruongKiemThu: ['x'] }), { slowMs: 3000 });
  assert.deepEqual(cauHinhGoiAnToan(undefined), {});
});

test('epChiDoc: chanGhi falsy kiểu khác (0, null, rỗng, thiếu) vẫn thành true', () => {
  for (const v of [0, null, '', undefined]) assert.equal(epChiDoc({ chanGhi: v }).chanGhi, true, String(v));
  assert.equal(epChiDoc({}).chanGhi, true);
});

// ---- Việc 4: chấm theo ma trận (dữ liệu giả nhỏ dựng tại chỗ) ----
const DU_AN = {
  anh_xa_ket_qua: { 'ĐẠT': 'Đạt', 'LỆCH': 'Không đạt', 'CẢNH BÁO': 'Không đạt (chờ phân loại)', 'CHƯA KIỂM': 'Chưa chạy được', 'LỚP 4': 'Chuyển bộ chạy R2/R3', 'KHONG_VAO_MAN': 'Chưa chạy được' },
  luat_khung_chung: [
    { ma: 'KHUNG-CHUNG.TRAN_NGANG', khoa: ['tran_ngang'] },
    { ma: 'KHUNG-CHUNG.CHU_CAT', khoa: ['cat_chu_khong_tooltip', 'tieu_de_bi_cat'] },
    { ma: 'KHUNG-CHUNG.MAN_KHONG_SAP', nguon: 'sap' },
    { ma: 'KHUNG-CHUNG.QUY_CHUAN_GIAO_DIEN', nguon: 'thiet_ke' },
    { ma: 'KHUNG-CHUNG.TIM.KHONG_CO', nguon: 'tim', ten: 'không tồn tại' },
    { ma: 'KHUNG-CHUNG.CCCD_12', khoa: [] },
  ],
};
// vai: 0 Chỉ huy trưởng Ban CHQS xã · 1 Trợ lý Tác huấn. bo_chay: 0 là M1, 1 là M2. uu_tien: 0 Cao 1 TB 2 Thấp
const DM = {
  phien_ban: 2, meta: { tep: 'x', so_tc: 6, bam: 'x' },
  vai: ['Chỉ huy trưởng Ban CHQS xã', 'Trợ lý Tác huấn', 'mọi vai có tài khoản'],
  loai_ca: ['DUNG', 'KHAC'],
  bo_chay: ['M1 Tool chỉ đọc (mức 1)', 'M2 Tool ghi (mức 2)'],
  tc: [
    ['1.B1.DUNG', '1.B1', 'T07', 0, 0, 0, [0], 0],
    ['1.B1.TRUONG', '1.B1', 'T01', 1, 0, 1, [0], 0],
    ['1.B2.DUNG', '1.B2', 'T07', 2, 0, 0, [1], 0],
    ['1.B3.GHI', '1.B3', 'T07', 0, 1, 1, [0], 0],
    ['2.B1.CHO', '2.B1', 'T07', 0, 0, 1, [0], 1],
    ['KHUNG-CHUNG.TRAN_NGANG', 'KHUNG-CHUNG', 'T20', 1, 0, 1, [2], 0],
  ],
};
const TK = 'Chỉ huy trưởng Ban CHQS xã Thạch Hà';
const dongCua = (r, ma) => r.dong.find(d => d.ma_tc === ma);

test('vaiCuaTaiKhoan khớp theo chuẩn 3.26, vai ngắn không khớp bừa', () => {
  assert.deepEqual(vaiCuaTaiKhoan('**Chỉ  huy trưởng Ban CHQS xã** Thạch Hà', DM), [0]);
  assert.deepEqual(vaiCuaTaiKhoan('Trợ lý Tác huấn Tỉnh', DM), [1]);
  assert.deepEqual(vaiCuaTaiKhoan('', DM), []);
  assert.deepEqual(vaiCuaTaiKhoan('abc xyz', { vai: ['abc'] }), []);
});

test('cho_pm_khong_cham: TC chờ PM có kết quả ĐẠT vẫn là Chờ PM quyết, không vào dem', () => {
  const r = chamTheoMaTran([{ ma: '2.B1.CHO', kq: 'ĐẠT', dg: 'ok' }], DM, DU_AN, TK);
  assert.equal(dongCua(r, '2.B1.CHO').ket_qua, 'Chờ PM quyết');
  assert.equal(r.dem['Chờ PM quyết'], undefined);
  assert.equal(Object.values(r.dem).reduce((a, b) => a + b, 0), r.dong.length - 1);
});

test('dung_khong_thay: .DUNG mà tool "không thấy" thì chờ phân loại, không bao giờ Không đạt thẳng', () => {
  const r = chamTheoMaTran([{ ma: '1.B1.DUNG', kq: 'LỆCH', dg: 'không thấy nút «Gửi»', nhom: 'ỨNG DỤNG' }], DM, DU_AN, TK);
  const d = dongCua(r, '1.B1.DUNG');
  assert.equal(d.ket_qua, 'Không đạt (chờ phân loại)');
  assert.equal(d.phan_loai, 'cần xác nhận trên giao diện');
  assert.equal(d.ma_uc, '1.B1');
  assert.equal(d.loai_kiem, 'T07');
  // cùng dg nhưng không phải .DUNG thì theo nhóm bình thường
  const r2 = chamTheoMaTran([{ ma: '1.B1.TRUONG', kq: 'LỆCH', dg: 'không thấy ô', nhom: 'ỨNG DỤNG' }], DM, DU_AN, TK);
  assert.equal(dongCua(r2, '1.B1.TRUONG').ket_qua, 'Không đạt');
});

test('anh_xa_chu: chữ kết quả theo sheet Ánh xạ kết quả; không có kết quả thì Chưa chạy được', () => {
  const r = chamTheoMaTran([
    { ma: '1.B1.DUNG', kq: 'ĐẠT', dg: 'ok' },
    { ma: '1.B1.TRUONG', kq: 'LỆCH', dg: 'sai', nhom: 'QUY TRÌNH' },
    { ma: '1.B3.GHI', kq: 'LỚP 4', dg: 'cần bấm Lưu' },
  ], DM, DU_AN, TK);
  assert.equal(dongCua(r, '1.B1.DUNG').ket_qua, 'Đạt');
  assert.equal(dongCua(r, '1.B1.TRUONG').ket_qua, 'Không đạt');
  assert.equal(dongCua(r, '1.B1.TRUONG').phan_loai, 'lệch tài liệu Bên B');
  assert.equal(dongCua(r, '1.B3.GHI'), undefined, 'M2 không thuộc M1');
  const r2 = chamTheoMaTran([{ ma: '1.B1.TRUONG', kq: 'CẢNH BÁO', dg: 'lạ' }, { ma: '1.B1.DUNG', kq: 'LỚP 4', dg: '' }], DM, DU_AN, TK);
  assert.equal(dongCua(r2, '1.B1.TRUONG').ket_qua, 'Không đạt (chờ phân loại)');
  assert.equal(dongCua(r2, '1.B1.DUNG').ket_qua, 'Chuyển bộ chạy R2/R3');
  const trong = dongCua(chamTheoMaTran([], DM, DU_AN, TK), '1.B1.DUNG');
  assert.equal(trong.ket_qua, 'Chưa chạy được');
  assert.equal(trong.ly_do, 'công cụ không sinh được kết quả');
  const vm = chamTheoMaTran([{ ma: '1.B1.DUNG', kq: 'KHONG_VAO_MAN', dg: 'không vào được màn' }], DM, DU_AN, TK);
  assert.equal(dongCua(vm, '1.B1.DUNG').ket_qua, 'Chưa chạy được');
});

test('anh_xa_chu: nhóm nguyên nhân 3.26 sang phân loại CT-08', () => {
  const pl = nhom => dongCua(chamTheoMaTran([{ ma: '1.B1.TRUONG', kq: 'LỆCH', dg: 'x', nhom }], DM, DU_AN, TK), '1.B1.TRUONG').phan_loai;
  assert.equal(pl('ỨNG DỤNG'), 'lỗi app');
  assert.equal(pl('AUTO'), 'lỗi app');
  assert.equal(pl('QUY TRÌNH'), 'lệch tài liệu Bên B');
  assert.equal(pl('TC'), 'lệch tài liệu Bên B');
  assert.equal(pl('CÔNG CỤ'), 'dương tính giả');
  assert.equal(pl('THIẾU'), 'môi trường');
});

test('ngoai_danh_muc: mã không có trong v7 không thành dòng, không bịa mã', () => {
  const r = chamTheoMaTran([{ ma: '9.B9.DUNG', kq: 'LỆCH', dg: 'x' }, { ma: '1.B1.DUNG', kq: 'ĐẠT', dg: '' }], DM, DU_AN, TK);
  assert.deepEqual(r.ngoai_danh_muc.map(x => [x.ma, x.kq]), [['9.B9.DUNG', 'LỆCH']]);
  assert.ok(!r.dong.some(d => d.ma_tc === '9.B9.DUNG'));
});

test('vai_khong_co: vai ngoài v7 thì 0 TC theo vai nhưng KHUNG-CHUNG vẫn có kết quả', () => {
  const tk = 'BC Ban Chỉ huy Phòng thủ khu vực Tỉnh Hà Tĩnh';
  assert.deepEqual(vaiCuaTaiKhoan(tk, DM), []);
  const man = [{ tab: 'Màn A', tran_ngang: '' }];
  const kg = chamKhungChung(man, [], DU_AN, { sap: [], thietKe: null });
  const r = chamTheoMaTran(kg, DM, DU_AN, tk);
  assert.equal(r.so_tc_theo_vai, 0);
  assert.deepEqual(r.dong.map(d => d.ma_tc), ['KHUNG-CHUNG.TRAN_NGANG']);
  assert.equal(r.dong[0].ket_qua, 'Đạt');
  assert.equal(kg.filter(x => x.ma).length, DU_AN.luat_khung_chung.length);
});

test('khung_chung: một màn tràn ngang thì LỆCH; 0 màn thì CHƯA KIỂM; khoá mồ côi ra ma null', () => {
  const man = [{ tab: 'Màn A', tran_ngang: '30px' }, { tab: 'Màn B', tran_ngang: '', phan_tram_vo_ly: '250%' }];
  const kg = chamKhungChung(man, [], DU_AN, { sap: [], thietKe: null });
  const tn = kg.find(x => x.ma === 'KHUNG-CHUNG.TRAN_NGANG');
  assert.equal(tn.kq, 'LỆCH');
  assert.match(tn.dg, /Màn A/);
  assert.doesNotMatch(tn.dg, /Màn B/);
  assert.equal(kg.find(x => x.ma === 'KHUNG-CHUNG.CHU_CAT').kq, 'ĐẠT');
  assert.equal(kg.find(x => x.ma === 'KHUNG-CHUNG.CCCD_12').kq, 'CHƯA KIỂM');
  assert.equal(kg.find(x => x.ma === 'KHUNG-CHUNG.CCCD_12').dg, 'công cụ chưa có phép kiểm');
  const mo = kg.filter(x => x.ma === null);
  assert.deepEqual(mo.map(x => [x.khoa, x.man]), [['phan_tram_vo_ly', ['Màn B: 250%']]]);
  // giá trị lỗi đi kèm tên màn (vd 4580,3% phải còn trong mục «ngoài danh mục»), cắt ở 80 ký tự
  const mo2 = chamKhungChung([{ tab: 'Tổng quan', phan_tram_vo_ly: '4580,3%' }, { tab: 'X', chuoi_dai_khong_ngat: 'a'.repeat(200) }], [], DU_AN).filter(x => x.ma === null);
  assert.deepEqual(mo2.find(x => x.khoa === 'phan_tram_vo_ly').man, ['Tổng quan: 4580,3%']);
  assert.equal(mo2.find(x => x.khoa === 'chuoi_dai_khong_ngat').man[0], 'X: ' + 'a'.repeat(80));
  // 0 màn
  const kg0 = chamKhungChung([], [], DU_AN, { sap: [], thietKe: null });
  assert.ok(kg0.filter(x => x.ma).every(x => x.kq === 'CHƯA KIỂM'));
  assert.equal(kg0.filter(x => x.ma === null).length, 0);
  // dg tối đa 5 màn
  const nhieu = Array.from({ length: 8 }, (_, i) => ({ tab: 'M' + i, tran_ngang: '9px' }));
  const dg = chamKhungChung(nhieu, [], DU_AN).find(x => x.ma === 'KHUNG-CHUNG.TRAN_NGANG').dg;
  assert.equal((dg.match(/M\d/g) || []).length, 5);
});

test('khung_chung: màn sập, thiết kế, ô tìm lấy từ tham số riêng', () => {
  const man = [{ tab: 'A' }];
  const f = (them, tim) => Object.fromEntries(chamKhungChung(man, tim || [], DU_AN, them).filter(x => x.ma).map(x => [x.ma, x]));
  assert.equal(f({ sap: [{ man: 'Màn X' }], thietKe: { vuot_chuan: ['9 cỡ chữ (chuẩn ≤ 8)'] } })['KHUNG-CHUNG.MAN_KHONG_SAP'].kq, 'LỆCH');
  assert.match(f({ sap: [{ man: 'Màn X' }] })['KHUNG-CHUNG.MAN_KHONG_SAP'].dg, /Màn X/);
  assert.equal(f({ sap: [], thietKe: { vuot_chuan: ['9 cỡ chữ'] } })['KHUNG-CHUNG.QUY_CHUAN_GIAO_DIEN'].kq, 'LỆCH');
  assert.equal(f({ sap: [], thietKe: { vuot_chuan: [] } })['KHUNG-CHUNG.QUY_CHUAN_GIAO_DIEN'].kq, 'ĐẠT');
  assert.equal(f({ sap: [] })['KHUNG-CHUNG.QUY_CHUAN_GIAO_DIEN'].kq, 'CHƯA KIỂM');
  assert.equal(f()['KHUNG-CHUNG.MAN_KHONG_SAP'].kq, 'CHƯA KIỂM');
  const tim = l => [{ man: 'A', o: 'Tìm', loai: 'tìm · không tồn tại', loi: l }];
  assert.equal(f({ sap: [] }, tim(''))['KHUNG-CHUNG.TIM.KHONG_CO'].kq, 'ĐẠT');
  assert.equal(f({ sap: [] }, tim('chuỗi không tồn tại vẫn ra 3 dòng'))['KHUNG-CHUNG.TIM.KHONG_CO'].kq, 'LỆCH');
  assert.equal(f({ sap: [] }, tim('[cần xác nhận] nội dung màn giống hệt'))['KHUNG-CHUNG.TIM.KHONG_CO'].kq, 'CẢNH BÁO');
  assert.equal(f({ sap: [] }, [{ man: 'A', o: 'Tìm', loai: 'tìm · không dấu', loi: '' }])['KHUNG-CHUNG.TIM.KHONG_CO'].kq, 'CHƯA KIỂM');
});

test('loc: loai_kiem T07 chỉ còn TC T07; các bộ lọc khác', () => {
  const ma = loc => chamTheoMaTran([], DM, DU_AN, TK, loc).dong.map(d => d.ma_tc);
  assert.deepEqual(ma({ loai_kiem: ['T07'] }), ['1.B1.DUNG', '2.B1.CHO']);
  assert.deepEqual(ma({ uu_tien: ['Cao'] }), ['1.B1.DUNG', '2.B1.CHO']);
  assert.deepEqual(ma({ quy_trinh: ['2'] }), ['2.B1.CHO']);
  assert.deepEqual(ma({ bo_chay: ['M1'] }), ma());
  assert.deepEqual(ma(), ['1.B1.DUNG', '1.B1.TRUONG', '2.B1.CHO', 'KHUNG-CHUNG.TRAN_NGANG']);
});

test('gop: cùng mã lấy kết quả nặng nhất; tổng mã bằng hợp các mã', () => {
  const d = (ma_tc, ket_qua) => ({ ma_tc, ma_uc: '', loai_kiem: '', ket_qua, phan_loai: '', ly_do: '' });
  const g = gopKetQua(
    [d('A', 'Đạt'), d('B', 'Chưa chạy được'), d('C', 'Chờ PM quyết')],
    [d('A', 'Không đạt'), d('B', 'Đạt'), d('D', 'Không đạt (chờ phân loại)')],
    [d('D', 'Đạt'), d('C', 'Chưa chạy được')],
  );
  const kq = Object.fromEntries(g.map(x => [x.ma_tc, x.ket_qua]));
  assert.deepEqual(kq, { A: 'Không đạt', B: 'Đạt', C: 'Chưa chạy được', D: 'Không đạt (chờ phân loại)' });
  assert.equal(g.length, 4);
  assert.deepEqual(gopKetQua(), []);
});

test('du-an.json: bảng ánh xạ chữ và luật KHUNG-CHUNG đúng dạng', async () => {
  const { readFileSync } = await import('node:fs');
  const du = JSON.parse(readFileSync(new URL('../goi-du-an/dqtv/du-an.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(du.anh_xa_ket_qua).sort(), ['CHƯA KIỂM', 'CẢNH BÁO', 'KHONG_VAO_MAN', 'LỆCH', 'LỚP 4', 'ĐẠT'].sort());
  const ma = du.luat_khung_chung.map(x => x.ma);
  assert.equal(new Set(ma).size, ma.length);
  assert.ok(ma.every(m => /^KHUNG-CHUNG\./.test(m)));
  assert.ok(du.luat_khung_chung.every(x => Array.isArray(x.khoa) || ['sap', 'thiet_ke', 'tim'].includes(x.nguon)));
  assert.deepEqual(du.duong_dan_xac_thuc, ['/api/session', '/api/search']);
});

// ---- Bổ sung vaiTheoQT: vai là mã máy / phủ định ----
const DM2 = {
  phien_ban: 2, meta: { tep: 'x', so_tc: 4, bam: 'x' },
  vai: ['personnel', 'mọi vai ngoài quy trình', 'tài khoản cùng đơn vị, KHÔNG giữ vai: AC-CHT (Chỉ huy trưởng Ban CHQS xã)', 'Trợ lý Tác huấn'],
  loai_ca: ['K'], bo_chay: ['M1 Tool chỉ đọc (mức 1)'],
  tc: [
    ['12b.B1.MAY', '12b.B1', 'T01', 0, 0, 0, [0], 0],
    ['12b.B1.CHUNG', '12b.B1', 'T01', 0, 0, 0, [1], 0],
    ['12b.B1.PHUDINH', '12b.B1', 'T01', 0, 0, 0, [2], 0],
    ['12b.B1.TEN', '12b.B1', 'T01', 0, 0, 0, [3], 0],
  ],
};
const ap = (qt, tk = 'Nhân viên lạ') => chamTheoMaTran([], DM2, DU_AN, tk, undefined, qt).dong.map(d => d.ma_tc);

test('vai_ma_may: vai là mã máy chỉ áp khi vaiTheoQT khớp', () => {
  assert.deepEqual(ap({ '12b': 'personnel' }), ['12b.B1.MAY']);
  assert.deepEqual(ap({ '12b': 'commander' }), []);
  assert.deepEqual(ap({ '99': 'personnel' }), [], 'quy trình khác: không áp');
});

test('vai_phu_dinh: vai phủ định/chung chỉ áp khi tài khoản không giữ vai trong quy trình', () => {
  assert.deepEqual(ap({ '12b': null }), ['12b.B1.CHUNG', '12b.B1.PHUDINH']);
  assert.deepEqual(ap({ '12b': 'personnel' }), ['12b.B1.MAY']);
  assert.deepEqual(ap({}), [], 'quy trình chưa biết (undefined) không bằng null');
});

test('khong_co_vaiTheoQT: hành vi cũ, chỉ khớp theo tên vai', () => {
  assert.deepEqual(ap(undefined), []);
  assert.deepEqual(ap(undefined, 'Trợ lý Tác huấn Tỉnh'), ['12b.B1.TEN']);
  assert.deepEqual(ap({ '12b': 'commander' }, 'Trợ lý Tác huấn Tỉnh'), ['12b.B1.TEN'], 'tên vai vẫn khớp khi có vaiTheoQT');
});

test('maQuyTrinh: quy_trinh lọc dùng cùng luật tách như engine', () => {
  const r = chamTheoMaTran([], DM2, DU_AN, 'x', { quy_trinh: ['12b'] }, { '12b': 'personnel' });
  assert.deepEqual(r.dong.map(d => d.ma_tc), ['12b.B1.MAY']);
});

// ---- Fix vòng 1: vai chung "mọi vai…", MAN_KHONG_SAP, js_loi ----
test('vai_moi_vai: ba chuỗi vai chung của v7', () => {
  const dm = { phien_ban: 2, meta: {}, vai: ['mọi vai có tài khoản', 'mọi vai', 'mọi vai từng có bước', 'mọi vai ngoài quy trình'], loai_ca: ['K'], bo_chay: ['M1 Tool chỉ đọc (mức 1)'],
    tc: [['KHUNG-CHUNG.A', 'KHUNG-CHUNG', 'T18', 0, 0, 0, [0], 0], ['CHUNG.B', '', 'T18', 0, 0, 0, [1], 0], ['9.B13c.DA_GO.KHONG_NUT', '9.B13c', 'T18', 0, 0, 0, [2], 0], ['11.B1.SAI_VAI', '11.B1', 'T18', 0, 0, 0, [3], 0]] };
  const ap = qt => chamTheoMaTran([], dm, DU_AN, 'Nhân viên lạ', undefined, qt).dong.map(d => d.ma_tc);
  assert.deepEqual(ap(undefined), ['KHUNG-CHUNG.A', 'CHUNG.B'], 'không có vaiTheoQT: hai chuỗi chung vẫn áp, "từng có bước" thì không');
  assert.deepEqual(ap({}), ['KHUNG-CHUNG.A', 'CHUNG.B']);
  assert.deepEqual(ap({ '9': 'personnel' }), ['KHUNG-CHUNG.A', 'CHUNG.B', '9.B13c.DA_GO.KHONG_NUT']);
  assert.deepEqual(ap({ '9': null }), ['KHUNG-CHUNG.A', 'CHUNG.B'], 'không giữ vai thì "từng có bước" không áp');
  assert.deepEqual(ap({ '11': null }), ['KHUNG-CHUNG.A', 'CHUNG.B', '11.B1.SAI_VAI'], '"mọi vai ngoài quy trình" vẫn chỉ áp khi null');
});

test('vai_cung_cap: «cùng cấp với đơn vị chủ hồ sơ» áp khi tài khoản có mã vai trong quy trình; undefined = không thông tin', () => {
  const dm = { phien_ban: 2, meta: {}, vai: ['tài khoản cùng cấp với đơn vị chủ hồ sơ', 'mọi vai từng có bước'], loai_ca: ['K'], bo_chay: ['M1 Tool chỉ đọc (mức 1)'],
    tc: [['9.B1.PHAM_VI', '9.B1', 'T18', 0, 0, 0, [0], 0], ['9.B2.TUNG', '9.B2', 'T18', 0, 0, 0, [1], 0]] };
  const ap = qt => chamTheoMaTran([], dm, DU_AN, 'Nhân viên lạ', undefined, qt).dong.map(d => d.ma_tc);
  assert.deepEqual(ap({ '9': 'personnel' }), ['9.B1.PHAM_VI', '9.B2.TUNG']);
  assert.deepEqual(ap({ '9': null }), []);
  assert.deepEqual(ap({}), []);
  assert.deepEqual(ap(undefined), []);
  assert.deepEqual(ap({ '9': undefined }), [], 'khoá riêng giá trị undefined = không thông tin');
});

test('danh mục thật (từ dist): vai ngoài v7 vẫn nhận đủ 28 KHUNG-CHUNG; vai có trong v7 có TC theo vai', async () => {
  const { existsSync, readFileSync } = await import('node:fs');
  const f = fileURLToPath(new URL('../dist/ita-dqtv-5.0.js', import.meta.url));
  if (!existsSync(f)) return console.log('BỎ QUA: chưa đóng gói dist — chạy cong-cu/dong_goi.py');
  const dong = readFileSync(f, 'utf8').split('\n').find(l => l.startsWith('window.__itaDanhMucTC = '));
  assert.ok(dong, 'dist không có dòng window.__itaDanhMucTC');
  const dm = JSON.parse(dong.slice('window.__itaDanhMucTC = '.length).replace(/;\s*$/, ''));
  const r = chamTheoMaTran([], dm, DU_AN, 'BC Ban Chỉ huy Phòng thủ khu vực Tỉnh Hà Tĩnh', undefined, {});
  const kc = r.dong.filter(d => d.ma_tc.startsWith('KHUNG-CHUNG.'));
  assert.equal(kc.length, 28);
  assert.equal(new Set(kc.map(d => d.ma_tc)).size, 28);
  assert.equal(r.so_tc_theo_vai, 0);
  const tk = 'Chỉ huy trưởng Ban CHQS xã';
  const khongQT = chamTheoMaTran([], dm, DU_AN, tk);
  const coQT = chamTheoMaTran([], dm, DU_AN, tk, undefined, { '1': 'personnel' });
  assert.ok(khongQT.so_tc_theo_vai > 0);
  assert.ok(coQT.so_tc_theo_vai >= khongQT.so_tc_theo_vai);
});

test('man_khong_sap: 4 trường hợp (0 màn / sập mới / chỉ bỏ trước / sạch)', () => {
  const luat = { luat_khung_chung: [{ ma: 'KHUNG-CHUNG.MAN_KHONG_SAP', nguon: 'sap' }] };
  const cham = (man, sap) => chamKhungChung(man, [], luat, { sap })[0];
  const botruoc = { man: '(không mở — lỗi đã biết trong sổ)', duong_dan: '/dqtv/x', bo_truoc: true, loi_da_biet: { ma: 'UI-01' } };
  assert.equal(cham([], [botruoc]).kq, 'CHƯA KIỂM');
  assert.equal(cham([], []).kq, 'CHƯA KIỂM');
  const moi = cham([{ tab: 'A' }], [botruoc, { man: 'Màn Sập', duong_dan: '/dqtv/y', loi_da_biet: null }]);
  assert.equal(moi.kq, 'LỆCH');
  assert.match(moi.dg, /Màn Sập/);
  assert.doesNotMatch(moi.dg, /không mở/);
  const chiBo = cham([{ tab: 'A' }], [botruoc]);
  assert.equal(chiBo.kq, 'CHƯA KIỂM');
  assert.equal(chiBo.dg, 'không mở lại màn đã biết sập: /dqtv/x (UI-01)');
  assert.equal(cham([{ tab: 'A' }], []).kq, 'ĐẠT');
});

test('js_loi đi vào ngoài danh mục; truong_loi/quy_trinh_loi/chan_ghi thì không', () => {
  const r = chamKhungChung([{ tab: 'A', js_loi: 'TypeError x', truong_loi: '2 trường', quy_trinh_loi: 'x', chan_ghi: 'POST /a' }], [], DU_AN);
  assert.deepEqual(r.filter(x => x.ma === null).map(x => x.khoa), ['js_loi']);
});

// ---- Việc 5: CSV ket-qua-ma-tran, kiểm gói khi nạp, bộ lọc kế hoạch ----
const DONG_CSV = [
  { ma_tc: 'KHUNG-CHUNG.TRAN_NGANG', ma_uc: 'KC', loai_kiem: 'T01', ket_qua: 'Không đạt', phan_loai: 'lỗi app', ly_do: 'màn "A", B', thoi_diem: '03/11/2026 10:00', tai_khoan: 'CB x', ban_tool: '3.31', bam: 'du-an.json abc; tc_all.csv def' },
  { ma_tc: '1.B1.SAI_VAI', ma_uc: '1.B1', loai_kiem: 'T08', ket_qua: 'Đạt', phan_loai: '', ly_do: 'hai\ndòng', thoi_diem: 't', tai_khoan: 'CB x', ban_tool: '3.31', bam: 'h' },
];
test('csv_ma_tran: BOM, đúng 10 cột theo thứ tự, đọc lại ra y nguyên', () => {
  const s = csvMaTran(DONG_CSV);
  assert.ok(s.startsWith('\ufeff'));
  assert.equal(s.split('\n')[0], '\ufeff"Mã TC","Mã UC","Loại kiểm thử","Kết quả chạy","Phân loại","Lý do","Thời điểm","Tài khoản","Bản tool","Mã băm gói"');
  assert.deepEqual(docCSVMaTran(s), DONG_CSV);
  assert.deepEqual(docCSVMaTran(s.replace(/\n/g, '\r\n')).map(d => d.ma_tc), ['KHUNG-CHUNG.TRAN_NGANG', '1.B1.SAI_VAI']);
});
test('csv_ma_tran: mã TC giữ nguyên ký tự (không che), dấu phẩy/ngoặc kép/xuống dòng đọc lại đúng', () => {
  const d = Object.assign({}, DONG_CSV[0], { ma_tc: 'NT26.P2-10.10', ly_do: 'a,"b"\r\nc' });
  assert.deepEqual(docCSVMaTran(csvMaTran([d])), [d]);
});
test('doc_csv: thiếu cột thì báo, dòng trống và dòng không mã TC bị bỏ', () => {
  assert.throws(() => docCSVMaTran('"Mã TC","Kết quả chạy"\n"x","Đạt"'), /thiếu cột.*Mã UC/i);
  const s = csvMaTran(DONG_CSV) + '\n\n' + csvMaTran([Object.assign({}, DONG_CSV[0], { ma_tc: '' })]).split('\n')[1];
  assert.equal(docCSVMaTran(s).length, 2);
});
test('gop_csv: hai tệp CSV gộp theo mã, giữ kết quả nặng nhất', () => {
  const a = csvMaTran([Object.assign({}, DONG_CSV[1], { ket_qua: 'Đạt' })]), b = csvMaTran([Object.assign({}, DONG_CSV[1], { ket_qua: 'Không đạt (chờ phân loại)', tai_khoan: 'CB y' })]);
  const g = gopKetQua(docCSVMaTran(a), docCSVMaTran(b));
  assert.equal(g.length, 1); assert.equal(g[0].ket_qua, 'Không đạt (chờ phân loại)'); assert.equal(g[0].tai_khoan, 'CB y');
});
test('kiem_goi: thiếu gói / gói cũ / thiếu trường / đủ', () => {
  const DA = { anh_xa_ket_qua: {}, luat_khung_chung: [], duong_dan_xac_thuc: [], bam: {} }, DM = { phien_ban: 2, tc: [], vai: [], bo_chay: [] };
  assert.match(kiemGoi(undefined, DM), /chưa nạp gói dự án/);
  assert.match(kiemGoi(DA, undefined), /chưa nạp danh mục TC/);
  assert.match(kiemGoi(DA, { meta: {}, vai: [], loai: [], tc: [] }), /gói cũ/);
  assert.match(kiemGoi(Object.assign({}, DA, { luat_khung_chung: undefined }), DM), /gói thiếu trường luat_khung_chung/);
  assert.match(kiemGoi(DA, Object.assign({}, DM, { bo_chay: undefined })), /gói thiếu trường __itaDanhMucTC\.bo_chay/);
  assert.equal(kiemGoi(DA, DM), '');
});
test('chuan_loc: chỉ giữ 4 khoá, chuỗi lẻ thành mảng, rỗng bỏ', () => {
  assert.deepEqual(chuanLoc({ loai_kiem: 'T07', uu_tien: ['Cao', ''], bo_chay: [], la: ['x'], quy_trinh: [1] }), { loai_kiem: ['T07'], uu_tien: ['Cao'], quy_trinh: ['1'] });
  assert.deepEqual(chuanLoc(null), {});
});
test('chuoi_bam: đối tượng mã băm thành một dòng', () => {
  assert.equal(chuoiBam({ 'du-an.json': 'abc', 'tc_all.csv': 'def' }), 'du-an.json abc; tc_all.csv def');
  assert.equal(chuoiBam(undefined), '');
});

test('xem_khong_thay: .XEM mà giao diện "không thấy màn" thì chờ phân loại; ĐẠT giữ nguyên', () => {
  const dm = Object.assign({}, DM, { tc: DM.tc.concat([['1.XEM', '1.XEM', 'T07', 0, 0, 1, [0], 0]]) });
  const d = dongCua(chamTheoMaTran([{ ma: '1.XEM', kq: 'LỆCH', dg: 'đặc tả cho xem, giao diện không thấy màn «Kế hoạch»', nhom: 'ỨNG DỤNG' }], dm, DU_AN, TK), '1.XEM');
  assert.equal(d.ket_qua, 'Không đạt (chờ phân loại)');
  assert.equal(d.phan_loai, 'cần xác nhận trên giao diện');
  assert.equal(dongCua(chamTheoMaTran([{ ma: '1.XEM', kq: 'ĐẠT', dg: 'không thấy màn: đúng đặc tả' }], dm, DU_AN, TK), '1.XEM').ket_qua, 'Đạt');
  // "không thấy" giữa câu ở ca .DUNG cũng chờ phân loại
  assert.equal(dongCua(chamTheoMaTran([{ ma: '1.B1.DUNG', kq: 'LỆCH', dg: 'đã mở màn, không thấy nút «Gửi»' }], DM, DU_AN, TK), '1.B1.DUNG').ket_qua, 'Không đạt (chờ phân loại)');
});
