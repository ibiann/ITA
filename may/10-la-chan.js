/* ============================================================= *
 * 0. LÁ CHẮN — cài ngay khi nạp (bản 3.5)                         *
 * Bình thường cho qua hết (người dùng vẫn làm việc bình thường).   *
 * Chỉ chặn ghi khi: đang chạy kiểm, hoặc có lượt chạy dở sau khi   *
 * trang tải lại (chặn luôn cả lệnh ứng dụng gửi lúc tải trang).    *
 * ============================================================= */
// Lệnh POST được để đi khi đang chặn ghi: đúng các đường dẫn khai ở hồ sơ dự án (post_cho_qua), cùng tên miền,
// so cả đường dẫn (bỏ phần ?…). Không có hồ sơ thì không POST nào được đi. PUT/PATCH/DELETE luôn chặn.
const postDuocDi = (m, u) => {
  if (!/^POST$/i.test(m || '')) return false;
  let x; try { x = new URL(String(u), location.href); } catch (e) { return false; }
  return x.origin === location.origin && ((window.__dqtvHoSo || {}).post_cho_qua || []).includes(x.pathname.replace(/\/+$/, ''));
};
if (!window.__dqtvLaChan) (function caiLaChan() {
  const LC = window.__dqtvLaChan = { som: document.readyState === 'loading', quyetDinh: null, chan: [], seen: new Set() };
  const abs = u => { try { return new URL(String(u), location.href).href; } catch (e) { return String(u); } };
  const ghiChat = (m, u) => (!/^(GET|HEAD|OPTIONS)$/i.test(m || 'GET') && !postDuocDi(m, u)) ? 'block' : 'ok';
  LC.ghiChat = ghiChat;
  try { const r = JSON.parse(localStorage.getItem('dqtv.run.v3261') || 'null'); if (r && Date.now() - r.ts < 6 * 3600e3) LC.quyetDinh = ghiChat; } catch (e) {}
  const xet = (m, u) => {
    LC.seen.add(abs(u)); const f = LC.quyetDinh; if (!f) return 'ok';
    let r; try { r = f(m || 'GET', String(u)); } catch (e) { r = 'block'; }
    if (r === 'block') { LC.chan.push(String(m).toUpperCase() + ' ' + String(u).replace(location.origin, '').slice(0, 80)); if (LC.chan.length > 200) LC.chan.shift(); }
    return r;
  };
  LC.xet = xet;
  const F0 = window.fetch;
  if (F0) window.fetch = function (input, init) {
    const url = String((input && input.url) || input), m = (init && init.method) || (input && input.method) || 'GET';
    if (xet(m, url) === 'block') { const e = new TypeError('dqtvAudit: lá chắn chặn ' + m); e.__dqtv = true; return Promise.reject(e); }
    return F0.apply(this, arguments);
  };
  const XO0 = XMLHttpRequest.prototype.open, XS0 = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u) { this.__lcM = m; this.__lcU = String(u); return XO0.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function () {
    if (xet(this.__lcM, this.__lcU) === 'block') {
      try { Object.defineProperty(this, 'readyState', { value: 4, configurable: true }); Object.defineProperty(this, 'status', { value: 0, configurable: true }); } catch (e) {}
      setTimeout(() => { try { this.dispatchEvent(new Event('readystatechange')); this.dispatchEvent(new Event('error')); this.dispatchEvent(new Event('loadend')); } catch (e) {} }, 0);
      return;
    }
    return XS0.apply(this, arguments);
  };
  const NB0 = window.Navigator && Navigator.prototype.sendBeacon;
  if (NB0) Navigator.prototype.sendBeacon = function (u) { if (xet('POST', u) === 'block') return false; return NB0.apply(this, arguments); };
  const FS0 = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function () { if (xet(this.getAttribute('method') || 'get', this.action || location.href) === 'block') return; return FS0.apply(this, arguments); };
  window.addEventListener('submit', e => { const f = e.target; if (!f || f.tagName !== 'FORM') return;
    if (xet(f.getAttribute('method') || 'get', f.action || location.href) === 'block') { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
})();
const LC = window.__dqtvLaChan;

// Chuẩn hoá chữ để so: NFC, chữ thường, kiểu bỏ dấu mới (xóa→xoá, hủy→huỷ, khóa→khoá)
const DAU_CU_MOI = [['òa', 'oà'], ['óa', 'oá'], ['ỏa', 'oả'], ['õa', 'oã'], ['ọa', 'oạ'], ['òe', 'oè'], ['óe', 'oé'], ['ỏe', 'oẻ'], ['õe', 'oẽ'], ['ọe', 'oẹ'],
  ['ùy', 'uỳ'], ['úy', 'uý'], ['ủy', 'uỷ'], ['ũy', 'uỹ'], ['ụy', 'uỵ']];
function canon(s) { let t = String(s == null ? '' : s).normalize('NFC').toLowerCase(); for (const [a, b] of DAU_CU_MOI) if (t.includes(a)) t = t.split(a).join(b); return t; }
// 3.6: nguyên tắc vi phạm của từng loại lỗi (hiện trong "mẫu lỗi")
const NGUYEN_TAC = {
  du_lieu_nhay_cam: 'Bảo mật: không hiển thị thông tin hạ tầng, câu lệnh, mật khẩu/token',
  api_loi: 'Lỗi hệ thống — Bên B sửa', js_loi: 'Lỗi hệ thống — Bên B sửa', api_cham: 'Phản hồi chậm — cần trạng thái đang tải/skeleton',
  quy_trinh_loi: 'Đúng nghiệp vụ & phân quyền: vai nào ở trạng thái nào thấy nút nào',
  chu_la: 'Hiển thị nhãn cho người đọc, không lộ biến kỹ thuật', ma_enum_lo: 'Hiển thị nhãn cho người đọc, không lộ mã trạng thái',
  phan_tram_vo_ly: 'Đúng dữ liệu: phần trăm trong khoảng 0–100', so_dong_vuot_tong: 'Đúng dữ liệu: số dòng không vượt tổng', nghi_ngo_so_lech: 'Đúng dữ liệu: số trên thẻ khớp nguồn',
  rong_nhung_api_loi: 'Trạng thái lỗi phải khác trạng thái trống', van_dang_tai: 'Hiển thị trạng thái hệ thống: không treo ở "đang tải"',
  tran_ngang: 'Không cuộn ngang cả trang (WCAG 1.4.10 chỉ xét ở khổ 320px)', tieu_de_bi_cat: 'Không mất thông tin: tiêu đề bị cắt phải xem được đầy đủ',
  cat_chu_khong_tooltip: 'Không mất thông tin: chữ bị cắt "…" cần tooltip hoặc xuống dòng', chuoi_dai_khong_ngat: 'Layout chịu được dữ liệu xấu: chuỗi dài phải ngắt dòng',
  o_khong_nhan: 'WCAG 1.3.1 / 4.1.2: ô nhập cần nhãn', wcag_loi: 'WCAG 2.2 A/AA (axe-core): mỗi luật vi phạm một dòng, kèm mục WCAG', gio_khong_chuan: 'Nhất quán: ngày giờ dạng dd/mm/yyyy hh:mm, không hiện chuỗi máy', truong_loi: 'Kiểm kê trường: xem danh mục trường',
  dinh_dang_ngay_tron: 'Nhất quán: một định dạng ngày trong toàn hệ thống', dinh_dang_so_tron: 'Nhất quán: một kiểu phân cách hàng nghìn',
  tieu_de_lech_menu: 'Nhất quán điều hướng: tiêu đề màn khớp mục menu', nut_chinh_nhieu: 'Một hành động chính mỗi màn',
  chan_ghi: 'Màn chỉ xem không nên tự gửi lệnh ghi', o_nhap: 'Tìm kiếm/lọc phải trả đúng kết quả và báo trống rõ ràng',
};
// [3.26.1] Căn cứ của từng phép kiểm giao diện chung. Chỉ «sự việc», «chuẩn», «đặc tả» được tính mức (cao / trung bình / thấp).
// «tự đặt» = ngưỡng hay luật do người viết công cụ đặt, chưa có tài liệu dự án nào nói: chỉ GHI NHẬN, không tính là lỗi.
const SU_VIEC = 'sự việc', CHUAN = 'chuẩn', DAC_TA = 'đặc tả', TU_DAT = 'tự đặt', TC_PM = 'TC v7';   // [11b] TC_PM: phép kiểm làm đúng thao tác + kết quả mong đợi của một TC KHUNG-CHUNG
const CHU_LOI_MAY = /\b(NaN|undefined|null|\[object Object\]|Infinity|Invalid Date)\b/;
const CAN_CU_KIEM = {
  api_loi: [SU_VIEC, 'máy chủ trả mã lỗi (HTTP ≥ 400) hoặc lỗi mạng'],
  js_loi: [SU_VIEC, 'trang báo lỗi JavaScript'],
  du_lieu_nhay_cam: [SU_VIEC, 'màn hiện thông tin hạ tầng, câu lệnh, mật khẩu hoặc khoá'],
  rong_nhung_api_loi: [SU_VIEC, 'máy chủ báo lỗi nhưng màn hiện «trống»'],
  so_dong_vuot_tong: [SU_VIEC, 'số dòng hiện ra lớn hơn tổng do chính màn đó ghi'],
  chu_la: v => CHU_LOI_MAY.test(v) ? [SU_VIEC, 'màn hiện giá trị lỗi của máy (NaN, undefined, [object Object]…)'] : /[a-z][A-Z]|\b[A-Z]+_[A-Z]/.test(v) ? [TC_PM, 'KHUNG-CHUNG.MA_CHUA_DICH: không có giá trị dạng mã máy (CHỮ_HOA_GẠCH, camelCase)'] : [TU_DAT, 'chữ giống tên biến ({…}): công cụ đoán'],
  ma_enum_lo: [TC_PM, 'KHUNG-CHUNG.MA_CHUA_DICH: không có giá trị dạng mã máy (CHỮ_HOA_GẠCH, camelCase)'],
  cat_chu_khong_tooltip: [TC_PM, 'KHUNG-CHUNG.CHU_CAT: chữ bị cắt «…» phải rê chuột thấy đủ, hoặc xuống dòng'],
  tieu_de_lech_menu: [TC_PM, 'KHUNG-CHUNG.TIEU_DE_MENU: tiêu đề màn trùng tên mục menu'],
  van_dang_tai: [TC_PM, 'KHUNG-CHUNG.KHONG_TREO_TAI: không còn phần tử đang tải sau 10 giây'],
  dinh_dang_ngay_tron: [TC_PM, 'KHUNG-CHUNG.THOI_DIEM: ngày giờ dạng dd/mm/yyyy hh:mm'],
  gio_khong_chuan: [TC_PM, 'KHUNG-CHUNG.THOI_DIEM: ngày giờ dạng dd/mm/yyyy hh:mm, không có chuỗi ISO thô'],
  quy_trinh_loi: [DAC_TA, 'luật khai trong cấu hình dacTa'],
  o_khong_nhan: [CHUAN, 'WCAG 2.2 SC 1.3.1, 4.1.2: ô nhập phải có tên đọc được bằng máy (label, aria-label, title)'],
  wcag_loi: () => [CHUAN, 'WCAG 2.2 mức A/AA, đo bằng axe-core ' + ((window.axe || {}).version || '') + ' (bộ luật wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa)'],
  tran_ngang: () => innerWidth <= 320 ? [CHUAN, 'WCAG 2.2 SC 1.4.10 (khổ ' + innerWidth + 'px)'] : [1366, 1920].includes(innerWidth) ? [TC_PM, 'KHUNG-CHUNG.TRAN_NGANG: trang không rộng hơn cửa sổ (khổ ' + innerWidth + 'px)'] : [TU_DAT, 'cuộn ngang ở khổ ' + innerWidth + 'px; WCAG 1.4.10 xét ở 320px, TC KHUNG-CHUNG.TRAN_NGANG ở 1366 và 1920px'],
};
const canCuKiem = (k, v) => { const x = CAN_CU_KIEM[k]; return (typeof x === 'function' ? x(v) : x) || [TU_DAT, 'ngưỡng hoặc luật do công cụ đặt, chưa có tài liệu dự án']; };
const coCanCu = (k, v) => canCuKiem(k, v)[0] !== TU_DAT;
// Khoá chỉ dùng trong lúc chạy, không lưu vào trình duyệt (mở ghi)
const KHONG_LUU = { chanGhi: 1, mucQuyTrinh: 1, moiTruongKiemThu: 1 };
const locLuu = o => { const r = {}; for (const k in (o || {})) if (!KHONG_LUU[k]) r[k] = o[k]; return r; };

