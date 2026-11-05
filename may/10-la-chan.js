/* ============================================================= *
 * 0. LÁ CHẮN — cài ngay khi nạp (bản 3.5)                         *
 * Bình thường cho qua hết (người dùng vẫn làm việc bình thường).   *
 * Chỉ chặn ghi khi: đang chạy kiểm, hoặc có lượt chạy dở sau khi   *
 * trang tải lại (chặn luôn cả lệnh ứng dụng gửi lúc tải trang).    *
 * ============================================================= */
if (!window.__itaLaChan) (function caiLaChan() {
  const LC = window.__itaLaChan = { som: document.readyState === 'loading', quyetDinh: null, chan: [], seen: new Set() };
  const abs = u => { try { return new URL(String(u), location.href).href; } catch (e) { return String(u); } };
  // 3.31: POST chỉ được đi khi đúng trọn một đường dẫn trong gói (window.__itaDuAn.duong_dan_xac_thuc); thiếu gói = chặn mọi POST
  const ghiChat = (m, u) => (!/^(GET|HEAD|OPTIONS)$/i.test(m || 'GET') && !laPostDuocPhep(m, u, (window.__itaDuAn || {}).duong_dan_xac_thuc, location.href)) ? 'block' : 'ok';
  LC.ghiChat = ghiChat;
  try { const r = JSON.parse(localStorage.getItem('ita.run.v50') || 'null'); if (r && Date.now() - r.ts < 6 * 3600e3) LC.quyetDinh = ghiChat; } catch (e) {}
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
    if (xet(m, url) === 'block') { const e = new TypeError('itaAudit: lá chắn chặn ' + m); e.__ita = true; return Promise.reject(e); }
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
const LC = window.__itaLaChan;

// 3.31 (CT-02): lá chắn tự kiểm. Bị chặn = ghiChat trả 'block' cho đúng lời gọi. Không gì ra mạng dù kênh hở: fetch có tín hiệu
// đã huỷ, XHR chưa open, form không gắn trang, sendBeacon/WS.send trên đối tượng giả. WebSocket chỉ báo, không tính vào dat.
const DUONG_TU_KIEM = '/__ita_tu_kiem__';
let KQ_TU_KIEM = null;
function tuKiemLaChan() {
  const chi_tiet = [], canh_bao = [], kq = (dat, ly_do) => (KQ_TU_KIEM = { dat, chi_tiet, canh_bao, ly_do, luc: new Date().toLocaleString('vi-VN') });
  try { const sw = navigator.serviceWorker && navigator.serviceWorker.controller; if (sw) canh_bao.push('có service worker ' + sw.scriptURL + ': lệnh nó gửi không qua lá chắn'); } catch (e) {}
  if (!LC || typeof LC.ghiChat !== 'function' || LC.ghiChat('POST', location.origin + '/api/session/extend') !== 'block') return kq(false, 'lá chắn bản cũ còn trên trang — tải lại trang rồi dán lại');
  if (CO.dangChay) return KQ_TU_KIEM || { dat: false, chi_tiet, canh_bao, ly_do: 'đang chạy kiểm' };
  const url = location.origin + DUONG_TU_KIEM, cu = LC.quyetDinh; let thay;
  const thu = (kenh, f, phu) => { thay = null; if (LC.ghiChat('POST', url) === 'block') try { f(); } catch (e) {}
    chi_tiet.push(Object.assign({ kenh, bi_chan: thay === 'block' }, phu && { tinh_dat: false, ghi_chu: phu })); };
  try {
    LC.quyetDinh = (m, u) => { const r = LC.ghiChat(m, u); if (String(u).includes(DUONG_TU_KIEM)) thay = r; return r; };
    thu('fetch', () => { const a = new AbortController(); a.abort(); const p = window.fetch(url, { method: 'POST', body: '', signal: a.signal }); if (p && p.catch) p.catch(() => {}); });
    thu('XMLHttpRequest', () => { const x = new XMLHttpRequest(); x.__lcM = x.__m = 'POST'; x.__lcU = x.__u = url; x.send(''); });
    thu('form.submit', () => { const f = document.createElement('form'); f.setAttribute('method', 'post'); f.action = url; f.submit(); });
    thu('navigator.sendBeacon', () => Navigator.prototype.sendBeacon.call(Object.create(Navigator.prototype), url, ''));
    thu('WebSocket.send', () => WebSocket.prototype.send.call(Object.create(WebSocket.prototype), ''), 'bộ máy chỉ chặn lúc mở form');
  } finally {
    LC.quyetDinh = cu; LC.seen.delete(url);
    for (let i = LC.chan.length - 1; i >= 0; i--) if (String(LC.chan[i]).includes(DUONG_TU_KIEM)) LC.chan.splice(i, 1);
  }
  const hong = chi_tiet.filter(x => x.tinh_dat !== false && !x.bi_chan).map(x => x.kenh);
  return kq(!hong.length, hong.length ? 'lá chắn không chặn được: ' + hong.join(', ') : '');
}
// '' = được chạy, khác rỗng = lý do khoá; lỗi = khoá
const loiTuKiem = () => { try { const t = tuKiemLaChan(); return t.dat ? '' : t.ly_do; } catch (e) { return (KQ_TU_KIEM = { dat: false, chi_tiet: [], canh_bao: [], ly_do: 'tự kiểm lỗi: ' + ((e && e.message) || e) }).ly_do; } };

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
  tran_ngang: 'WCAG 1.4.10 Reflow: không cuộn ngang cả trang', tieu_de_bi_cat: 'Không mất thông tin: tiêu đề bị cắt phải xem được đầy đủ',
  cat_chu_khong_tooltip: 'Không mất thông tin: chữ bị cắt "…" cần tooltip hoặc xuống dòng', chuoi_dai_khong_ngat: 'Layout chịu được dữ liệu xấu: chuỗi dài phải ngắt dòng',
  o_khong_nhan: 'WCAG 1.3.1 / 4.1.2: ô nhập cần nhãn', truong_loi: 'Kiểm kê trường: xem danh mục trường',
  dinh_dang_ngay_tron: 'Nhất quán: một định dạng ngày trong toàn hệ thống', dinh_dang_so_tron: 'Nhất quán: một kiểu phân cách hàng nghìn',
  tieu_de_lech_menu: 'Nhất quán điều hướng: tiêu đề màn khớp mục menu', nut_chinh_nhieu: 'Một hành động chính mỗi màn',
  chan_ghi: 'Màn chỉ xem không nên tự gửi lệnh ghi', o_nhap: 'Tìm kiếm/lọc phải trả đúng kết quả và báo trống rõ ràng',
};
// Khoá chỉ dùng trong lúc chạy, không lưu vào trình duyệt (mở ghi)
const KHONG_LUU = { chanGhi: 1, mucQuyTrinh: 1, moiTruongKiemThu: 1 };
const locLuu = o => { const r = {}; for (const k in (o || {})) if (!KHONG_LUU[k]) r[k] = o[k]; return r; };

