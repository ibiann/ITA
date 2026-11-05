/* ============================================================= *
 * 0a. HÀM THUẦN — không đụng trang, kiểm được bằng node          *
 * ============================================================= */
// Một luật duy nhất cho "lệnh POST này có được đi không": method là POST và đường dẫn (bỏ query/hash,
// bỏ một dấu / cuối) bằng TRỌN một đường dẫn trong dsDuongDan. Không so một phần: /api/session/extend bị chặn.
function laPostDuocPhep(method, url, dsDuongDan, goc) {
  if (!/^POST$/i.test(method || '')) return false;
  let p; try { p = new URL(String(url), goc).pathname; } catch (e) { return false; }
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return Array.isArray(dsDuongDan) && dsDuongDan.includes(p);
}
// 3.31 (CT-03): chỉ đọc, luôn luôn. Trả bản sao cấu hình đã ép mucQuyTrinh về 1 và chanGhi về true.
function epChiDoc(cfg) {
  const c = Object.assign({}, cfg);
  if (c.mucQuyTrinh > 1) c.mucQuyTrinh = 1;
  c.chanGhi = true;   // vô điều kiện: 0, null, '' hay thiếu khoá cũng không được tắt chặn ghi
  return c;
}
// Gói dự án không được là đường mở ghi: bỏ các khoá điều khiển ghi khỏi du-an.json → cau_hinh.
const KHOA_GHI = ['chanGhi', 'mucQuyTrinh', 'moiTruongKiemThu'];
function cauHinhGoiAnToan(ch) {
  const c = Object.assign({}, ch && typeof ch === 'object' ? ch : {});
  for (const k of KHOA_GHI) delete c[k];
  return c;
}
/* ---- 3.31 (CT-06/07/08/15): chấm theo ma trận v7 ---- */
// Cùng cách chuẩn hoá chữ như chuanDT của 50-doi-chieu-dac-ta.js (bỏ *, gộp khoảng trắng, chữ thường).
const chuanChuThuan = s => String(s == null ? '' : s).replace(/\*/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const UU_TIEN_CHU = ['Cao', 'Trung bình', 'Thấp'];
const KQ_CHO_PM = 'Chờ PM quyết', KQ_CHUA_CHAY = 'Chưa chạy được', KQ_CHO_PL = 'Không đạt (chờ phân loại)';
// Càng cao càng nặng; chữ lạ xếp cuối.
// ≠ THU_TU_KQ của 50
const THU_TU_V7 = ['Không đạt', KQ_CHO_PL, 'Đạt', 'Chuyển bộ chạy R2/R3', KQ_CHUA_CHAY, KQ_CHO_PM];
const hangKQ = k => { const i = THU_TU_V7.indexOf(k); return i < 0 ? THU_TU_V7.length : i; };
// Nhóm nguyên nhân 3.26 (k.nhom) → phân loại CT-08.
const PHAN_LOAI_NHOM = { 'ỨNG DỤNG': 'lỗi app', 'AUTO': 'lỗi app', 'QUY TRÌNH': 'lệch tài liệu Bên B', 'TC': 'lệch tài liệu Bên B', 'CÔNG CỤ': 'dương tính giả', 'THIẾU': 'môi trường' };
const coGiaTri = v => v != null && String(v).trim() !== '';

// Mã quy trình của một mã TC — chép đúng luật ở phuDanhMucTC (50-doi-chieu-dac-ta.js dòng 324).
const maQuyTrinhCuaTC = id => String(id).slice(0, String(id).search(/\.(B\d+[a-z]?\.|XEM$|PHAM_VI$)/) >>> 0) || String(id).split('.B')[0];
const LA_VAI_PHU_DINH = v => v.startsWith('tài khoản cùng đơn vị, KHÔNG giữ vai') || v.includes('mọi vai ngoài quy trình');
// Chuỗi vai v của TC (quy trình qt) có áp dụng cho tài khoản theo vaiTheoQT không.
// Chuỗi vai chung của v7: áp cho mọi tài khoản (vd mọi KHUNG-CHUNG.* ghi `mọi vai có tài khoản`). So TRỌN chuỗi: `mọi vai ngoài quy trình` là loại khác.
const LA_VAI_MOI_TAI_KHOAN = v => v === 'mọi vai có tài khoản' || v === 'mọi vai';
function vaiMayKhop(v, qt, vaiTheoQT) {
  if (LA_VAI_MOI_TAI_KHOAN(v)) return true;
  if (!vaiTheoQT || !Object.prototype.hasOwnProperty.call(vaiTheoQT, qt)) return false;
  const co = vaiTheoQT[qt];
  if (co === null) return LA_VAI_PHU_DINH(v);
  if (!co) return false;   // undefined / rỗng = không có thông tin, không áp thêm gì
  // co là mã vai: tài khoản có vai trong quy trình này. «cùng cấp với đơn vị chủ hồ sơ» theo 3.26 (ap = !!vaiTheoQT[qt]).
  return v !== '' && (v === co || v === 'mọi vai từng có bước' || v === 'tài khoản cùng cấp với đơn vị chủ hồ sơ');
}

// Chỉ số các vai (trong dm.vai) khớp tài khoản: tài khoản (đã chuẩn hoá) chứa tên vai, tên vai dài hơn 3 ký tự.
function vaiCuaTaiKhoan(taiKhoan, dm) {
  const tk = chuanChuThuan(taiKhoan), ra = [];
  ((dm && dm.vai) || []).forEach((v, i) => { const t = chuanChuThuan(v); if (t.length > 3 && tk.includes(t)) ra.push(i); });
  return ra;
}

// ketQuaTool: [{ma, kq, dg, nhom?, nguyen_nhan?}] (kq của 3.26: ĐẠT|LỆCH|CẢNH BÁO|CHƯA KIỂM|LỚP 4; ca `.KHONG_VAO_MAN` coi là KHONG_VAO_MAN).
// dm: danh mục TC bản 2 (xem tc[] = [ma, ma_uc, txx, uu_tien, bo_chay_idx, loai_ca_idx, [vai_idx], nhom]). duAn: du-an.json.
// loc: {loai_kiem, uu_tien, bo_chay, quy_trinh} đều tuỳ chọn; mảng rỗng/thiếu = không lọc. Luôn chỉ lấy TC bộ chạy M1.
// vaiTheoQT (tuỳ chọn): {[maQuyTrinh]: mã vai máy | null} = vai tài khoản giữ trong quy trình đó (null = không giữ vai). Thiếu = chỉ khớp theo tên vai.
//   TC áp dụng khi: vai rỗng; HOẶC tên vai khớp tài khoản; HOẶC chuỗi vai == vaiTheoQT[qt] (mã vai máy, vd `personnel`);
//   HOẶC chuỗi vai là phủ định/chung chung («tài khoản cùng đơn vị, KHÔNG giữ vai…», «mọi vai ngoài quy trình») VÀ vaiTheoQT[qt] === null.
//   Mã quy trình qt = cùng luật phuDanhMucTC của 50-doi-chieu-dac-ta.js (hàm maQuyTrinhCuaTC).
// Trả {dong, ngoai_danh_muc, ngoai_pham_vi (mã có trong v7 nhưng ngoài vai/bộ chạy/lọc), dem, vai_idx, so_tc_theo_vai}.
function chamTheoMaTran(ketQuaTool, dm, duAn, taiKhoan, loc, vaiTheoQT) {
  loc = loc || {};
  const anhXa = (duAn && duAn.anh_xa_ket_qua) || {};
  const vaiTK = new Set(vaiCuaTaiKhoan(taiKhoan, dm));
  const coLoc = a => Array.isArray(a) && a.length > 0;
  const tenBoChay = i => String((dm.bo_chay || [])[i] || '');
  const dongTC = new Map();   // ma → hàng dm đạt điều kiện
  let soTheoVai = 0;
  for (const t of dm.tc || []) {
    const [ma, , txx, uuTien, boChay, , vai, nhom] = t;
    if (!/^M1\b/.test(tenBoChay(boChay))) continue;
    const tenV = v => String((dm.vai || [])[v] == null ? '' : dm.vai[v]).trim();
    const theoVai = vai.some(v => !LA_VAI_MOI_TAI_KHOAN(tenV(v)) && (vaiTK.has(v) || vaiMayKhop(tenV(v), maQuyTrinhCuaTC(ma), vaiTheoQT)));   // khớp vai cụ thể (không tính "mọi vai…")
    if (vai.length && !vai.some(v => vaiTK.has(v) || vaiMayKhop(tenV(v), maQuyTrinhCuaTC(ma), vaiTheoQT))) continue;
    if (coLoc(loc.loai_kiem) && !loc.loai_kiem.includes(txx)) continue;
    if (coLoc(loc.uu_tien) && !loc.uu_tien.includes(UU_TIEN_CHU[uuTien])) continue;
    if (coLoc(loc.bo_chay) && !loc.bo_chay.some(x => tenBoChay(boChay).startsWith(x))) continue;
    // loc.quy_trinh: cùng luật tách như maQuyTrinhCuaTC.
    if (coLoc(loc.quy_trinh) && !loc.quy_trinh.includes(maQuyTrinhCuaTC(ma))) continue;
    dongTC.set(ma, t);
    if (theoVai) soTheoVai++;
  }
  const tatCa = new Set((dm.tc || []).map(t => t[0]));
  const theoMa = new Map(), ngoaiDM = [], ngoaiPV = new Set();
  for (const k of ketQuaTool || []) {
    if (!tatCa.has(k.ma)) { ngoaiDM.push(Object.assign({ ma: k.ma, kq: k.kq }, k.dg != null ? { dg: k.dg } : {}, k.khoa ? { khoa: k.khoa } : {}, k.man ? { man: k.man } : {})); continue; }
    if (!dongTC.has(k.ma)) { ngoaiPV.add(k.ma); continue; }
    const d = doiKetQua(k, anhXa);
    const cu = theoMa.get(k.ma);
    if (!cu || hangKQ(d.ket_qua) < hangKQ(cu.ket_qua)) theoMa.set(k.ma, d);
  }
  const dong = [], dem = {};
  for (const [ma, t] of dongTC) {
    const d = t[7] === 1 ? { ket_qua: KQ_CHO_PM, phan_loai: '', ly_do: 'chờ PM quyết: không chấm, không tính phủ' }
      : theoMa.get(ma) || { ket_qua: KQ_CHUA_CHAY, phan_loai: '', ly_do: 'công cụ không sinh được kết quả' };
    dong.push({ ma_tc: ma, ma_uc: t[1], loai_kiem: t[2], ket_qua: d.ket_qua, phan_loai: d.phan_loai, ly_do: d.ly_do });
    if (d.ket_qua !== KQ_CHO_PM) dem[d.ket_qua] = (dem[d.ket_qua] || 0) + 1;
  }
  return { dong, ngoai_danh_muc: ngoaiDM, ngoai_pham_vi: [...ngoaiPV], dem, vai_idx: [...vaiTK], so_tc_theo_vai: soTheoVai };
}
// Một kết quả tool → {ket_qua, phan_loai, ly_do}. Tool "không thấy" ở ca .DUNG/.XEM không bao giờ thành Không đạt thẳng.
function doiKetQua(k, anhXa) {
  const kq = /\.KHONG_VAO_MAN$/.test(k.ma) ? 'KHONG_VAO_MAN' : k.kq;
  let ket_qua = anhXa[kq];
  if (ket_qua == null) return { ket_qua: KQ_CHUA_CHAY, phan_loai: '', ly_do: 'kết quả tool lạ «' + kq + '», chưa có trong ánh xạ' };
  const ly_do = [k.dg, k.nguyen_nhan].filter(coGiaTri).join(' — ');
  if (ket_qua === 'Đạt' || ket_qua === KQ_CHUA_CHAY || ket_qua === 'Chuyển bộ chạy R2/R3') return { ket_qua, phan_loai: '', ly_do };
  if (/\.(DUNG|XEM)(\.|$)/.test(k.ma) && /không thấy/i.test(String(k.dg || ''))) return { ket_qua: KQ_CHO_PL, phan_loai: 'cần xác nhận trên giao diện', ly_do };
  return { ket_qua, phan_loai: PHAN_LOAI_NHOM[k.nhom] || 'chưa phân loại', ly_do };
}

// Khoá của dòng màn (res[] của 30-loi-kiem.js) có giá trị nhưng không thuộc TC KHUNG-CHUNG nào → đề nghị PM thêm TC.
const KHOA_KHONG_TC = ['js_loi', 'phan_tram_vo_ly', 'nghi_ngo_so_lech', 'chuoi_dai_khong_ngat', 'dinh_dang_so_tron'];
const tenMan = m => String((m && (m.tab || m.man)) || '?');
const rutTen = (ds, n) => ds.slice(0, n).join('; ') + (ds.length > n ? ' (+' + (ds.length - n) + ' màn khác)' : '');
/**
 * Chấm các TC KHUNG-CHUNG.* từ kết quả quét giao diện của tool.
 * @param {object[]} dongMan  res[] của itaAudit (30-loi-kiem.js ~dòng 1231): mỗi màn có `tab` và các khoá như
 *                            tran_ngang, api_loi, cat_chu_khong_tooltip... (chuỗi rỗng = không lỗi). Rỗng = chưa kiểm màn nào.
 * @param {object[]} timThu   inputs[] của 30-loi-kiem.js (tryInputs ~dòng 1446): {man, o, loai: 'tìm · '+ten, loi}.
 *                            `ten` là giá trị `ten` trong cấu hình giaTriTim: 'không tồn tại' | 'thừa khoảng trắng' | 'không dấu'
 *                            (cũng có XSS / SQL / chuỗi rất dài, không có TC → vào dòng ma:null nếu có `loi`).
 * @param {object}   duAn     du-an.json; dùng duAn.luat_khung_chung = [{ma, khoa?: string[], nguon?: 'sap'|'thiet_ke'|'tim', ten?}].
 *                            Có `khoa` (khác rỗng): LỆCH khi có màn mà một khoá không rỗng. `khoa: []` và không có `nguon`: công cụ chưa có phép kiểm.
 * @param {object}  [nguonKhac] {
 *     sap:     {man, duong_dan?, bo_truoc?, loi_da_biet?: {ma}}[] — SAP của itaAudit (30-loi-kiem.js dòng 38-63). Mục không `bo_truoc` = sập thấy trong lần chạy → LỆCH;
 *              chỉ còn mục `bo_truoc` (bỏ qua màn đã biết sập theo sổ) → CHƯA KIỂM; mảng rỗng + đã kiểm màn → ĐẠT; thiếu → CHƯA KIỂM.
 *     thietKe: {vuot_chuan: string[]} — dsKq của itaAudit (tổng hợp thiết kế so với chuanDS). null/thiếu (tắt kiemThietKe) = CHƯA KIỂM.
 *   }
 * @returns {{ma: string|null, kq: 'ĐẠT'|'LỆCH'|'CẢNH BÁO'|'CHƯA KIỂM', dg: string}[]}  thêm dòng {ma: null, khoa, man: string[]} cho khoá mồ côi.
 *          Chuỗi ô tìm chỉ có «[cần xác nhận]» thì CẢNH BÁO (không LỆCH).
 */
function chamKhungChung(dongMan, timThu, duAn, nguonKhac) {
  dongMan = dongMan || []; timThu = timThu || []; nguonKhac = nguonKhac || {};
  const ra = [], chuaKiem = (ma, dg) => ra.push({ ma, kq: 'CHƯA KIỂM', dg });
  for (const lu of (duAn && duAn.luat_khung_chung) || []) {
    const { ma } = lu;
    if (lu.nguon === 'sap') {
      const sap = nguonKhac.sap, moi = Array.isArray(sap) ? sap.filter(x => !(x && x.bo_truoc)) : [], truoc = Array.isArray(sap) ? sap.filter(x => x && x.bo_truoc) : [];
      if (moi.length) ra.push({ ma, kq: 'LỆCH', dg: rutTen(moi.map(tenMan), 5) });   // sập thấy trong lần chạy này
      else if (truoc.length) chuaKiem(ma, 'không mở lại màn đã biết sập: ' + truoc.slice(0, 5).map(x => (x.duong_dan || tenMan(x)) + ' (' + ((x.loi_da_biet && x.loi_da_biet.ma) || '?') + ')').join('; '));
      else if (Array.isArray(sap) && dongMan.length) ra.push({ ma, kq: 'ĐẠT', dg: 'không màn nào sập' });
      else chuaKiem(ma, 'chưa có danh sách màn sập hoặc chưa kiểm màn nào');
    } else if (lu.nguon === 'thiet_ke') {
      const tk = nguonKhac.thietKe;
      if (!tk || !Array.isArray(tk.vuot_chuan) || !dongMan.length) chuaKiem(ma, 'chưa kiểm thiết kế (tắt kiemThietKe hoặc chưa kiểm màn nào)');
      else if (tk.vuot_chuan.length) ra.push({ ma, kq: 'LỆCH', dg: tk.vuot_chuan.slice(0, 5).join('; ') });
      else ra.push({ ma, kq: 'ĐẠT', dg: 'thiết kế trong chuẩn' });
    } else if (lu.nguon === 'tim') {
      const loai = 'tìm · ' + lu.ten, lan = timThu.filter(i => i && i.loai === loai);
      const loi = lan.filter(i => coGiaTri(i.loi));
      if (!lan.length) chuaKiem(ma, 'chưa thử ô tìm «' + lu.ten + '»');
      else if (!loi.length) ra.push({ ma, kq: 'ĐẠT', dg: 'đã thử ' + lan.length + ' lần, không lỗi' });
      else ra.push({ ma, kq: loi.every(i => /^\[cần xác nhận\]/.test(String(i.loi))) ? 'CẢNH BÁO' : 'LỆCH', dg: rutTen(loi.map(i => tenMan(i) + ' · ' + (i.o || '') + ': ' + i.loi), 5) });
    } else if (!Array.isArray(lu.khoa) || !lu.khoa.length) chuaKiem(ma, 'công cụ chưa có phép kiểm');
    else if (!dongMan.length) chuaKiem(ma, 'chưa kiểm màn nào');
    else {
      const xau = dongMan.filter(m => lu.khoa.some(kh => coGiaTri(m[kh])));
      if (xau.length) ra.push({ ma, kq: 'LỆCH', dg: rutTen(xau.map(m => tenMan(m) + ' [' + lu.khoa.filter(kh => coGiaTri(m[kh])).join(', ') + ']'), 5) });
      else ra.push({ ma, kq: 'ĐẠT', dg: dongMan.length + ' màn không lỗi' });
    }
  }
  for (const kh of KHOA_KHONG_TC) {
    const man = dongMan.filter(m => coGiaTri(m[kh])).map(m => tenMan(m) + ': ' + String(m[kh]).slice(0, 80));
    if (man.length) ra.push({ ma: null, khoa: kh, man });
  }
  const kho = {};
  for (const i of timThu) if (i && /^tìm · /.test(i.loai || '') && coGiaTri(i.loi) && !((duAn && duAn.luat_khung_chung) || []).some(l => l.nguon === 'tim' && 'tìm · ' + l.ten === i.loai)) (kho[i.loai] = kho[i.loai] || []).push(tenMan(i));
  for (const [kh, man] of Object.entries(kho)) ra.push({ ma: null, khoa: kh, man });
  return ra;
}

// Gộp theo ma_tc, giữ dòng nặng nhất (thứ tự THU_TU_V7).
function gopKetQua(...dsDong) {
  const m = new Map();
  for (const ds of dsDong) for (const d of ds || []) { const c = m.get(d.ma_tc); if (!c || hangKQ(d.ket_qua) < hangKQ(c.ket_qua)) m.set(d.ma_tc, d); }
  return [...m.values()];
}

/* ---- 3.31 (CT-07/15) ---- */
const COT_MA_TRAN = [['ma_tc', 'Mã TC'], ['ma_uc', 'Mã UC'], ['loai_kiem', 'Loại kiểm thử'], ['ket_qua', 'Kết quả chạy'], ['phan_loai', 'Phân loại'],
  ['ly_do', 'Lý do'], ['thoi_diem', 'Thời điểm'], ['tai_khoan', 'Tài khoản'], ['ban_tool', 'Bản tool'], ['bam', 'Mã băm gói']];
// Không che ở đây: cheChuoi che nhầm mã v7 (NT26.P2-10.10) → che ly_do/tai_khoan trước khi gọi
function csvMaTran(dong) {
  const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  return '\ufeff' + COT_MA_TRAN.map(c => '"' + c[1] + '"').join(',') + '\n' + (dong || []).map(d => COT_MA_TRAN.map(c => q(d[c[0]])).join(',')).join('\n');
}
// Đọc lại CSV của csvMaTran (chịu CRLF, đổi thứ tự cột); thiếu cột thì ném lỗi
function docCSVMaTran(s) {
  s = String(s == null ? '' : s).replace(/^\ufeff/, '');
  const hang = []; let o = [''], trong = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (trong) { if (c !== '"') o[o.length - 1] += c; else if (s[i + 1] === '"') { o[o.length - 1] += '"'; i++; } else trong = false; }
    else if (c === '"') trong = true;
    else if (c === ',') o.push('');
    else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; hang.push(o); o = ['']; }
    else o[o.length - 1] += c;
  }
  hang.push(o);
  const dau = hang.shift(), vt = COT_MA_TRAN.map(c => dau.indexOf(c[1]));
  if (vt.some(x => x < 0)) throw new Error('CSV thiếu cột: ' + COT_MA_TRAN.filter((c, j) => vt[j] < 0).map(c => c[1]).join(', '));
  return hang.map(h => Object.fromEntries(COT_MA_TRAN.map((c, j) => [c[0], h[vt[j]] == null ? '' : h[vt[j]]]))).filter(d => d.ma_tc.trim() !== '');
}
// '' = gói đủ để chấm ma trận v7, khác rỗng = lý do tắt
function kiemGoi(duAn, dm) {
  if (!duAn || typeof duAn !== 'object') return 'chưa nạp gói dự án';
  if (!dm || typeof dm !== 'object') return 'chưa nạp danh mục TC v7';
  if (dm.phien_ban !== 2) return 'gói cũ (danh mục TC không phải bản 2)';
  const thieu = ['anh_xa_ket_qua', 'luat_khung_chung', 'duong_dan_xac_thuc', 'bam'].filter(k => duAn[k] == null)
    .concat(['tc', 'vai', 'bo_chay'].filter(k => !Array.isArray(dm[k])).map(k => '__itaDanhMucTC.' + k));
  return thieu.length ? 'gói thiếu trường ' + thieu.join(', ') : '';
}
// Bộ lọc kế hoạch: 4 khoá chamTheoMaTran hiểu, mỗi khoá là mảng chuỗi
const KHOA_LOC = ['loai_kiem', 'uu_tien', 'bo_chay', 'quy_trinh'];
function chuanLoc(loc) {
  const r = {};
  for (const k of KHOA_LOC) { const v = loc && loc[k], a = (Array.isArray(v) ? v : v == null ? [] : [v]).map(x => String(x).trim()).filter(Boolean); if (a.length) r[k] = a; }
  return r;
}
// du-an.json → bam ({tệp: sha256 12 ký tự}) thành một dòng.
const chuoiBam = b => b && typeof b === 'object' ? Object.entries(b).map(([k, v]) => k + ' ' + v).join('; ') : String(b == null ? '' : b);

// Trình duyệt: gắn vào window. Node: xuất module (không đụng module.exports của trang nếu trang có sẵn `module`).
const THUAN = { laPostDuocPhep, epChiDoc, cauHinhGoiAnToan, vaiCuaTaiKhoan, chamTheoMaTran, chamKhungChung, gopKetQua, csvMaTran, docCSVMaTran, kiemGoi, chuanLoc, chuoiBam };
if (typeof window !== 'undefined') window.__itaThuan = THUAN;
else if (typeof module !== 'undefined' && module.exports) module.exports = THUAN;
