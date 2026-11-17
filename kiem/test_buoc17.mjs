// [bước 17 / bản 1.4] Test không cần Chrome: chạy bản dựng CHUNG (dist/chung/ita.js, kiểm giao diện thuần) trên app giả lập (jsdom).
// App giả lập: KHÔNG có menu trái. Chế độ:
//   tren      — thanh điều hướng trên, không có <main>; màn «Danh sách» (sắp xếp, phân trang, tìm, form có ô khai giới hạn, ô chọn tuỳ biến tốt)
//               và «Danh sách lỗi» (sắp xếp không tác dụng, trang trùng dòng, tổng sai, xoá từ khoá không về danh sách cũ, ô chọn tuỳ biến thiếu vai trò / phím)
//   lien-ket  — không có thanh điều hướng; trang đầu chỉ có link (kèm link «Xoá hồ sơ», «Đăng xuất» phải bị loại)
//   khong     — không menu, không link: chỉ kiểm màn hiện tại
// Chạy: bash kiem/test_buoc17.sh   (cần jsdom: NODE_PATH=<thư mục>/node_modules). Tham số: node kiem/test_buoc17.mjs <bản dựng> <chế độ> [doi-chung]
// «doi-chung»: chạy bản cũ, chỉ in kết quả (không kết luận) — dùng để chứng minh bản trước 1.4 trượt.
import { createRequire } from 'module'; const { JSDOM } = createRequire(process.cwd() + '/')('jsdom');
import fs from 'fs';
const [, , tep, cheDo = 'tren', doiChung] = process.argv;
const NAV = cheDo === 'tren' ? `<header class="topbar"><a href="/app" class="logo">ITA Thử</a><nav class="navbar"><a href="/app">Tổng quan</a><a href="/app/ds">Danh sách</a><a href="/app/loi">Danh sách lỗi</a><a href="/app/thoat">Đăng xuất</a></nav></header>` : '';
const VUNG = cheDo === 'tren' ? '<div id="view"></div>' : '<main class="content"><div id="view"></div></main>';
const html = `<!doctype html><html><head><title>App thử</title></head><body>${NAV}<span id="acct" title="ita.thu">ita.thu</span>${VUNG}</body></html>`;
const dom = new JSDOM(html, { url: 'https://app.thu/app', runScripts: 'outside-only', pretendToBeVisual: true });
const w = dom.window;
// --- kích thước: thanh trên rộng, nằm trên cùng; còn lại là vùng nội dung ---
w.HTMLElement.prototype.getBoundingClientRect = function () {
  if (this.closest && this.closest('header')) return { left: 0, top: 0, width: 1200, height: 56, right: 1200, bottom: 56, x: 0, y: 0 };
  return { left: 260, top: 100, width: 600, height: 30, right: 860, bottom: 130, x: 260, y: 100 };
};
Object.defineProperty(w.HTMLElement.prototype, 'innerText', { get() { return this.textContent; } });
w.HTMLElement.prototype.scrollIntoView = function () {};
for (const k of ['Response', 'Blob', 'DecompressionStream', 'TextDecoder', 'TextEncoder']) if (!w[k]) w[k] = globalThis[k];
w.confirm = () => true; w.CSS = w.CSS || { escape: s => String(s).replace(/"/g, '\\"') };
const NHAT = [];
w.fetch = async (u, init = {}) => { NHAT.push((init.method || 'GET').toUpperCase() + ' ' + new URL(u, w.location.href).pathname); return new w.Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }); };
// --- dữ liệu ---
const DL = [['Giang', 5, '03/01/2026'], ['Anh', 12, '15/02/2026'], ['Đức', '1.200', '01/03/2026'], ['Bình', 40, '20/12/2025'], ['Em', 7, '11/11/2025'], ['Chi', 300, '05/05/2026'], ['Dũng', 18, '30/06/2026']];
const so = x => typeof x === 'number' ? x : +String(x).replace(/\./g, '');
const S = { sap: null, chieu: 0, trang: 1, tu: '', loiTu: '', loiTrang: 1 };
const $ = s => w.document.querySelector(s);
const bang = (ths, rows) => `<table><thead><tr>${ths}</tr></thead><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table>`;
const thSap = (k, ten) => `<th aria-sort="${S.sap === k ? (S.chieu > 0 ? 'ascending' : 'descending') : 'none'}"><button data-sap="${k}">${ten}</button></th>`;
const pager = (trang, soTrang, attr) => `<div class="pagination"><button data-${attr}="truoc" ${trang === 1 ? 'disabled' : ''}>‹</button>${Array.from({ length: soTrang }, (_, k) => `<button data-${attr}="${k + 1}">${k + 1}</button>`).join('')}<button aria-label="Trang sau" data-${attr}="sau" ${trang === soTrang ? 'disabled' : ''}>›</button></div>`;
const goodCombo = `<div class="filter-bar"><div class="cb" role="combobox" aria-label="Trạng thái" aria-haspopup="listbox" aria-expanded="false" tabindex="0">Tất cả</div></div>`;
const badCombo = `<div class="filter-bar"><div class="loai-select__control" aria-label="Loại hồ sơ">Chọn loại</div></div>`;
let daDung = '';
function render() {
  const p = w.location.pathname, v = $('#view'); w.fetch('/api/xem' + p);
  if ((p === '/app/ds' || p === '/app/loi') && daDung === p && $('#ds')) { $('#ds').innerHTML = phanDS(p); return; }
  daDung = p;
  if (p === '/app') v.innerHTML = `<h1>Tổng quan</h1><p>Chào mừng.</p>` + (cheDo === 'lien-ket' ? `<div class="links"><a href="/app/ds">Danh sách</a> <a href="/app/loi">Danh sách lỗi</a> <a href="/app/xoa/1">Xoá hồ sơ</a> <a href="/app/thoat">Đăng xuất</a></div>` : '');
  else if (p === '/app/ds') v.innerHTML = `<h1>Danh sách</h1>${goodCombo}<input type="search" aria-label="Tìm kiếm" value=""><button id="them">Thêm mới</button><div id="ds">${phanDS(p)}</div>`;
  else if (p === '/app/loi') v.innerHTML = `<h1>Danh sách lỗi</h1>${badCombo}<input type="search" aria-label="Tìm kiếm" value=""><div id="ds">${phanDS(p)}</div>`;
  else v.innerHTML = '<h1>Không tìm thấy</h1>';
}
function phanDS(p) {
  if (p === '/app/ds') {
    let ds = DL.filter(r => !S.tu || r[0].toLowerCase().includes(S.tu.toLowerCase()));
    if (S.sap != null) { const k = S.sap; ds = ds.slice().sort((a, b) => S.chieu * (k === 0 ? a[0].localeCompare(b[0], 'vi') : so(a[1]) - so(b[1]))); }
    const soTrang = Math.max(1, Math.ceil(ds.length / 3)); if (S.trang > soTrang) S.trang = soTrang;
    return `${bang(thSap(0, 'Tên') + thSap(1, 'Số lượng') + '<th>Ngày</th>', ds.slice((S.trang - 1) * 3, S.trang * 3))}<p>Tổng ${ds.length} bản ghi</p>${pager(S.trang, soTrang, 'trang')}`;
  }
  {
    const trang = [[DL[1], DL[3], DL[5]], [DL[5], DL[6], DL[4]], [DL[0], DL[2]]][S.loiTrang - 1];   // trang 2 lặp dòng «Chi» của trang 1
    const rows = S.loiTu === '#loc' ? [DL[1]] : trang;   // xoá từ khoá vẫn giữ danh sách đã lọc (lỗi)
    return `${bang('<th class="sortable"><button data-khong>Tên</button></th><th>Số lượng</th><th>Ngày</th>', rows)}<p>Tổng 8 bản ghi</p>${pager(S.loiTrang, 3, 'ltrang')}`;
  }
}
// ô chọn tuỳ biến
const dongPop = () => { w.document.querySelectorAll('.cb-pop,.loai-select__menu').forEach(x => x.remove()); w.document.querySelectorAll('.cb').forEach(c => c.setAttribute('aria-expanded', 'false')); };
const moTot = c => { dongPop(); c.setAttribute('aria-expanded', 'true'); w.document.body.insertAdjacentHTML('beforeend', '<ul class="cb-pop" role="listbox"><li role="option">Tất cả</li><li role="option">Đang xử lý</li><li role="option">Đã xong</li></ul>'); };
const moXau = () => { dongPop(); w.document.body.insertAdjacentHTML('beforeend', '<div class="loai-select__menu"><div class="loai-select__option">Hồ sơ A</div><div class="loai-select__option">Hồ sơ B</div></div>'); };
w.document.addEventListener('mousedown', e => {
  const t = e.target;
  if (t.closest && t.closest('.cb')) { const c = t.closest('.cb'); c.getAttribute('aria-expanded') === 'true' ? dongPop() : moTot(c); return; }
  if (t.closest && t.closest('.loai-select__control')) { moXau(); return; }
  if (t.closest && t.closest('.cb-pop,.loai-select__menu')) return;
  dongPop();
});
w.document.addEventListener('keydown', e => {
  const c = e.target.closest && e.target.closest('.cb');
  if (e.key === 'Escape') { if (w.document.querySelector('.cb-pop')) dongPop(); return; }   // ô chọn xấu: Esc không đóng (chỉ ô tốt nghe Esc)
  if (c && (e.key === 'ArrowDown' || e.key === ' ')) moTot(c);
});
// form «Thêm mới»: hộp thoại có ô khai giới hạn
const FORM = `<div role="dialog" class="dlg"><h2>Thêm mới</h2>
  <div class="form-group"><label for="ten">Tên *</label><input id="ten" name="ten" required maxlength="10"></div>
  <div class="form-group"><label for="sl">Số lượng</label><input id="sl" name="sl" type="number" min="1" max="100"></div>
  <div class="form-group"><label for="tuoi">Tuổi</label><input id="tuoi" name="tuoi" type="number" min="1" max="100"></div>
  <div class="form-group"><label for="ma">Mã</label><input id="ma" name="ma" pattern="[A-Z]{3}[0-9]{2}"></div>
  <div class="form-group"><label for="em">Email</label><input id="em" name="em" type="email"></div>
  <div class="form-group"><label for="gc">Ghi chú</label><input id="gc" name="gc"></div>
  <button id="luu">Lưu</button><button id="huy">Hủy</button></div>`;
w.document.addEventListener('focusout', e => {
  const i = e.target; if (!i.closest || !i.closest('.dlg')) return;
  const hop = i.closest('.form-group'); hop.querySelectorAll('.error').forEach(x => x.remove());
  let loi = '';
  if (i.id === 'ten' && !i.value) loi = 'Vui lòng nhập tên';
  if (i.id === 'tuoi' && i.value !== '' && +i.value < 5) loi = 'Tuổi phải từ 5';   // app tự đặt ngưỡng khác khai báo trên ô (min=1)
  if (loi) hop.insertAdjacentHTML('beforeend', `<div class="error">${loi}</div>`);
});
w.document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (a && !a.closest('#ita-panel-host')) { e.preventDefault(); w.history.pushState({}, '', a.getAttribute('href')); S.trang = 1; S.loiTrang = 1; S.tu = ''; S.loiTu = ''; S.sap = null; S.chieu = 0; daDung = ''; render(); return; }
  const sb = e.target.closest('button[data-sap]'); if (sb) { const k = +sb.dataset.sap; if (S.sap !== k) { S.sap = k; S.chieu = 1; } else if (S.chieu > 0) S.chieu = -1; else { S.sap = null; S.chieu = 0; } S.trang = 1; render(); return; }
  const tb = e.target.closest('button[data-trang]'); if (tb && !tb.disabled) { const x = tb.dataset.trang; S.trang = x === 'sau' ? S.trang + 1 : x === 'truoc' ? S.trang - 1 : +x; render(); return; }
  const lb = e.target.closest('button[data-ltrang]'); if (lb && !lb.disabled) { const x = lb.dataset.ltrang; S.loiTrang = x === 'sau' ? S.loiTrang + 1 : x === 'truoc' ? S.loiTrang - 1 : +x; render(); return; }
  if (e.target.id === 'them') { w.document.body.insertAdjacentHTML('beforeend', FORM); return; }
  if (e.target.id === 'huy') { const d = $('.dlg'); if (d) d.remove(); return; }
  if (e.target.id === 'luu') w.fetch('/api/luu', { method: 'POST' }).catch(() => {});
});
w.document.addEventListener('input', e => {
  if (e.target.type !== 'search') return;
  if (w.location.pathname === '/app/ds') { S.tu = e.target.value; S.trang = 1; render(); }
  else if (w.location.pathname === '/app/loi') { if (e.target.value) S.loiTu = '#loc'; render(); }
});
w.addEventListener('popstate', () => { daDung = ''; render(); });
render();
// --- nạp bản dựng, chạy ---
w.console.warn = () => {}; w.console.info = () => {}; w.console.log = () => {}; w.console.table = () => {};
let kq = null, loiChay = '';
try {
  w.eval(fs.readFileSync(tep, 'utf8'));
  await new Promise(r => setTimeout(r, 800));
  kq = await w.ita.chay({ kiemTroNang: false, idle: 60, waitMax: 2500, tuTaiBaoCao: false });
} catch (e) { loiChay = String(e && e.message || e); }
if (doiChung) {
  console.log('[đối chứng ' + cheDo + '] ' + (kq ? 'chạy được: ' + ((kq.man_da_kiem || []).length) + ' màn, nguồn menu ' + (kq.nguon_menu || '(không ghi)') + ', bất biến ' + (kq.bat_bien_ds || []).length + ', biên DOM ' + ((kq.bien_o_dom || {}).dong || []).length + ', ô chọn ' + (kq.o_chon_tuy_bien || []).length
    : 'không chạy: ' + (loiChay || 'ita.chay trả rỗng')));
  process.exit(0);
}
const sai = [], dat = (dk, ten) => { if (!dk) sai.push(ten); };
if (!kq) { console.log('TRƯỢT [' + cheDo + ']: không chạy — ' + loiChay); process.exit(1); }
const man = (kq.man_da_kiem || []).map(r => r.tab);
const bb = kq.bat_bien_ds || [], kd = (kq.bien_o_dom || {}).dong || [], ct = kq.o_chon_tuy_bien || [];
const co = (a, f) => a.some(f), tim = (a, f) => a.find(f) || {};
dat(!kq.dung_giua_chung && (kq.menu_khong_mo_duoc || []).length === 0, 'chạy hết, không mục menu nào không mở được');
dat(!NHAT.some(x => /^(POST|PUT|PATCH|DELETE) /.test(x) && !/who-am-i/.test(x)) || kq.giao_dien_thuan, 'không lệnh ghi nào đi ra (giao diện thuần chặn mọi POST)');
if (cheDo === 'tren') {
  dat(kq.nguon_menu === 'thanh điều hướng trên', 'nguồn menu = thanh điều hướng trên (có: ' + kq.nguon_menu + ')');
  dat(['Danh sách', 'Danh sách lỗi'].every(t => man.includes(t)) && (man.includes('ITA Thử') || man.includes('Tổng quan')), 'kiểm đủ 3 màn của thanh trên (có: ' + man.join(', ') + ')');
  dat((kq.bo_qua_khong_bam || []).some(x => /mục menu cùng đường dẫn/.test(x.ly_do)), 'logo và «Tổng quan» cùng đường dẫn: chỉ kiểm một lần');
  dat(!man.some(t => / › (Tổng quan|Danh sách|Danh sách lỗi|ITA Thử|Đăng xuất)$/.test(t)), 'link của thanh trên không bị coi là tab');
  dat(!man.some(t => /Đăng xuất/.test(t)), 'không bấm «Đăng xuất»');
  // 17c — màn tốt
  const sTen = tim(bb, x => x.man === 'Danh sách' && x.phep === 'sắp xếp' && /Tên/.test(x.doi_tuong)), sSo = tim(bb, x => x.man === 'Danh sách' && x.phep === 'sắp xếp' && /Số lượng/.test(x.doi_tuong));
  dat(sTen.kq === 'ĐẠT', 'sắp xếp cột chữ tiếng Việt đúng → ĐẠT (có: ' + sTen.kq + ' ' + (sTen.quan_sat || '') + ')');
  dat(sSo.kq === 'ĐẠT', 'sắp xếp cột số (1.200) đúng → ĐẠT (có: ' + sSo.kq + ' ' + (sSo.quan_sat || '') + ')');
  const pt = tim(bb, x => x.man === 'Danh sách' && x.phep === 'phân trang');
  dat(pt.kq === 'ĐẠT' && /3 trang, cộng 7 dòng = tổng 7/.test(pt.quan_sat || ''), 'phân trang đúng: 3 trang cộng 7 = tổng 7 (có: ' + pt.kq + ' ' + (pt.quan_sat || '') + ')');
  const lc = tim(bb, x => x.man === 'Danh sách' && x.phep === 'lọc');
  dat(lc.kq === 'ĐẠT', 'xoá từ khoá về đúng danh sách cũ → ĐẠT (có: ' + lc.kq + ' ' + (lc.quan_sat || '') + ')');
  // 17c — màn lỗi
  const lTen = tim(bb, x => x.man === 'Danh sách lỗi' && x.phep === 'sắp xếp');
  dat(lTen.kq === 'LỆCH' && /không đổi/.test(lTen.quan_sat || ''), 'nút sắp xếp không tác dụng → LỆCH (có: ' + lTen.kq + ' ' + (lTen.quan_sat || '') + ')');
  const lPt = tim(bb, x => x.man === 'Danh sách lỗi' && x.phep === 'phân trang');
  dat(lPt.kq === 'LỆCH' && /trang 2 đã có ở trang trước/.test(lPt.quan_sat || ''), 'trang 2 lặp dòng trang 1 → LỆCH (có: ' + lPt.kq + ' ' + (lPt.quan_sat || '') + ')');
  const lLc = tim(bb, x => x.man === 'Danh sách lỗi' && x.phep === 'lọc');
  dat(lLc.kq === 'LỆCH', 'xoá từ khoá không về danh sách cũ → LỆCH (có: ' + lLc.kq + ')');
  dat(bb.every(x => x.can_cu), 'mọi dòng bất biến có căn cứ');
  // 17b
  const kq1 = (o, ca) => tim(kd, x => x.o === o && x.ca === ca).kq;
  dat(kq1('Tên', 'BAT_BUOC_TRONG') === 'ĐẠT', 'ô bắt buộc để trống, app báo ngay → ĐẠT (có: ' + kq1('Tên', 'BAT_BUOC_TRONG') + ')');
  dat(kq1('Tên', 'QUA_DAI') === 'CHƯA KIỂM' || kq1('Tên', 'QUA_DAI') === 'ĐẠT', 'maxlength: không gõ phím thật được thì CHƯA KIỂM, không kết luận lệch (có: ' + kq1('Tên', 'QUA_DAI') + ')');
  dat(kq1('Số lượng', 'BIEN_MIN') === 'ĐẠT' && kq1('Số lượng', 'BIEN_MAX') === 'ĐẠT', 'số đúng biên min / max → ĐẠT');
  dat(kq1('Số lượng', 'DUOI_MIN') === 'GHI NHẬN' && kq1('Số lượng', 'TREN_MAX') === 'GHI NHẬN', 'số ngoài khoảng, chỉ trình duyệt đánh dấu → GHI NHẬN (có: ' + kq1('Số lượng', 'DUOI_MIN') + ', ' + kq1('Số lượng', 'TREN_MAX') + ')');
  dat(kq1('Tuổi', 'BIEN_MIN') === 'KHÁC KHAI BÁO', 'app báo lỗi giá trị hợp lệ theo khai báo của ô (min=1, app đòi ≥ 5) → KHÁC KHAI BÁO (có: ' + kq1('Tuổi', 'BIEN_MIN') + ')');
  dat(kq1('Mã', 'SAI_MAU') === 'GHI NHẬN', 'sai pattern, chỉ trình duyệt đánh dấu → GHI NHẬN (có: ' + kq1('Mã', 'SAI_MAU') + ')');
  dat(kq1('Email', 'SAI_EMAIL') === 'GHI NHẬN', 'sai email → GHI NHẬN (có: ' + kq1('Email', 'SAI_EMAIL') + ')');
  dat(kq1('Ghi chú', 'KHONG_KHAI') === 'GHI NHẬN', 'ô không khai giới hạn → GHI NHẬN «không có căn cứ» (có: ' + kq1('Ghi chú', 'KHONG_KHAI') + ')');
  dat(kd.filter(x => x.ca !== 'KHONG_KHAI').every(x => /^thuộc tính trên ô: /.test(x.can_cu)), 'mọi dòng biên DOM có căn cứ thuộc tính trên ô');
  dat(!kd.some(x => x.kq === 'KHÁC KHAI BÁO' && x.o !== 'Tuổi'), 'không KHÁC KHAI BÁO giả ở ô khác (có: ' + kd.filter(x => x.kq === 'KHÁC KHAI BÁO').map(x => x.o + ' ' + x.ca).join(', ') + ')');
  // 17d
  const c1 = ca => tim(ct, x => x.o === 'Trạng thái' && x.ca === ca).kq, c2 = ca => tim(ct, x => x.o === 'Loại hồ sơ' && x.ca === ca).kq;
  dat(['VAI_TRO', 'TOI_BANG_PHIM', 'TRANG_THAI', 'VAI_LUA_CHON', 'ESC_DONG', 'MO_BANG_PHIM'].every(ca => c1(ca) === 'ĐẠT'), 'ô chọn tuỳ biến làm đúng → 6 phép ĐẠT (có: ' + ['VAI_TRO', 'TOI_BANG_PHIM', 'TRANG_THAI', 'VAI_LUA_CHON', 'ESC_DONG', 'MO_BANG_PHIM'].map(c1).join(', ') + ')');
  dat(c2('VAI_TRO') === 'LỆCH' && c2('TOI_BANG_PHIM') === 'LỆCH', 'ô chọn thiếu vai trò, không tới được bằng phím → LỆCH 4.1.2 / 2.1.1 (có: ' + c2('VAI_TRO') + ', ' + c2('TOI_BANG_PHIM') + ')');
  dat(c2('TRANG_THAI') === 'GHI NHẬN' && c2('ESC_DONG') === 'GHI NHẬN' && !c2('MO_BANG_PHIM'), 'ô xấu: thiếu aria-expanded / Esc không đóng chỉ ghi nhận; không thử phím khi không tới được');
  dat(!w.document.querySelector('.cb-pop,.loai-select__menu,.dlg'), 'không để lại danh sách / hộp thoại đang mở');
  dat(!NHAT.includes('POST /api/luu'), 'không bấm Lưu');
}
if (cheDo === 'lien-ket') {
  dat(/^link nội bộ/.test(kq.nguon_menu || ''), 'nguồn menu = link nội bộ (có: ' + kq.nguon_menu + ')');
  dat(['Tổng quan', 'Danh sách', 'Danh sách lỗi'].every(t => man.includes(t)), 'kiểm trang đầu + 2 link (có: ' + man.join(', ') + ')');
  dat(!man.some(t => /Xoá|Đăng xuất/.test(t)) && (kq.bo_qua_khong_bam || []).some(x => x.chu === 'Xoá hồ sơ' && /link hành động/.test(x.ly_do)), 'link «Xoá hồ sơ» không dùng làm mục menu, có ghi lý do');
  dat(!NHAT.some(x => /\/app\/xoa|\/app\/thoat/.test(x)), 'không mở /app/xoa, /app/thoat');
}
if (cheDo === 'khong') {
  dat(/^chỉ màn hiện tại/.test(kq.nguon_menu || ''), 'nguồn menu = chỉ màn hiện tại (có: ' + kq.nguon_menu + ')');
  dat(man.length === 1 && man[0] === 'Tổng quan', 'kiểm đúng 1 màn (có: ' + man.join(', ') + ')');
}
if (process.env.ITA_IN) console.log(JSON.stringify({ man, nguon: kq.nguon_menu, bb, kd, ct, bo_qua: kq.bo_qua_khong_bam, thieu: kq.menu_khong_mo_duoc }, null, 1));
console.log((sai.length ? 'TRƯỢT' : 'ĐẠT') + ' [' + cheDo + ']' + (sai.length ? ':\n  - ' + sai.join('\n  - ') : ''));
process.exit(sai.length ? 1 : 0);
