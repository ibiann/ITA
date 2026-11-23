// [bước 14 / bản 1.1] Test hồi quy không cần Chrome: chạy bản dựng trên app giả lập (jsdom) tái hiện các tình huống đã gặp ở PMS
// (thẻ điều hướng nhanh, ô lịch, tab trùng nội dung, 401 dịch vụ phụ, nút gửi ngay, hai mục menu cùng đường dẫn, hồ sơ mẫu).
// Chạy: bash kiem/test_buoc14.sh   (cần jsdom: npm i jsdom@24 trong một thư mục rồi đặt NODE_PATH=<thư mục>/node_modules)
// Tham số: node kiem/test_buoc14.mjs <bản dựng> [day-du | thuan | thuan-khong | matphien]. Sai điều kiện nào thì mã thoát 1.
import { createRequire } from 'module'; const { JSDOM } = createRequire(process.cwd() + '/')('jsdom');
// [GĐ 8] trình duyệt chỉ ghi cảnh báo khi một lời hứa bị từ chối mà không ai bắt; Node thì dừng cả tiến trình. Lệnh ITA cố ý làm hỏng (giả lỗi đọc, chặn ghi — lỗi mang cờ __ita) mà app giả lập không bắt thì bỏ qua; lỗi khác vẫn làm test trượt.
process.on('unhandledRejection', e => { if (e && e.__ita) return; console.error(e); process.exit(1); });
import fs from 'fs';
const [, , tep, cheDo0] = process.argv; const cheDo = cheDo0 || 'day-du';
const html = `<!doctype html><html><head><style>button.active{background-color:rgb(29,78,216);color:rgb(255,255,255)}</style></head><body>
<nav class="sidenav"><a href="/87">LANCS NETWORKS</a><a href="/87">Trang chủ</a><a href="/87/agenda">Chương trình nghị sự</a><a href="/87/assignments">Bình bầu</a><a href="/87/mediafiles">Kho tài liệu</a></nav>
<span id="acct" title="ita.thuky">ita.thuky</span>
<main class="content"><div id="view"></div></main></body></html>`;
const dom = new JSDOM(html, { url: 'https://app.thu/87', runScripts: 'outside-only', pretendToBeVisual: true });
const w = dom.window; const NAV = w.document.querySelector('nav').outerHTML;
// --- giả lập trình duyệt thật: kích thước phần tử, innerText, fetch, các API jsdom thiếu ---
w.HTMLElement.prototype.getBoundingClientRect = function () { const n = this.closest && this.closest('nav'); return n ? { left: 0, top: 0, width: 200, height: 600, right: 200, bottom: 600, x: 0, y: 0 } : { left: 260, top: 100, width: 600, height: 30, right: 860, bottom: 130, x: 260, y: 100 }; };
Object.defineProperty(w.HTMLElement.prototype, 'innerText', { get() { return this.textContent; } });
w.HTMLElement.prototype.scrollIntoView = function () {};
for (const k of ['Response', 'Blob', 'DecompressionStream', 'TextDecoder', 'TextEncoder']) if (!w[k]) w[k] = globalThis[k];
w.confirm = () => cheDo !== 'thuan-khong'; w.CSS = w.CSS || { escape: s => String(s).replace(/"/g, '\\"') };
const NHAT = []; let MAT = false;
w.fetch = async (u, init = {}) => {
  const d = new URL(u, w.location.href).pathname, m = (init.method || 'GET').toUpperCase();
  NHAT.push(m + ' ' + d);
  const tl = (s, j) => new w.Response(JSON.stringify(j || {}), { status: s, headers: { 'content-type': 'application/json' } });
  if (cheDo === 'matphien' && MAT) return tl(401, { error: 'expired' });
  if (d.startsWith('/drive-proxy/')) return tl(401, { error: 'unauthorized' });
  if (d.startsWith('/system/')) return tl(200, { ok: true });
  return tl(200, {});
};
// --- app giả lập (SPA) ---
const $ = s => w.document.querySelector(s);
let loc = 'tatca';
const goi = p => w.fetch('/system/autoupdate?k=' + p);
function render() {
  const p = w.location.pathname, v = $('#view');
  goi(p);
  if (p === '/87') v.innerHTML = `<h1>Trang chủ</h1>
    <div class="quick-nav"><a href="/87/agenda">Chương trình nghị sự</a> <a href="/87/assignments">Bình bầu</a> <a href="/87/mediafiles">Kho tài liệu</a> <a href="/87/assignments?loc=mo">Bình bầu đang mở</a></div>
    <div class="p-datepicker">${[1, 2, 3, 4, 5].map(n => `<button aria-pressed="false">${n}</button>`).join('')}</div>
    <button id="bat-dau">Bắt đầu phiên họp</button>`;
  else if (p === '/87/agenda') { v.innerHTML = `<h1>Chương trình nghị sự</h1><ul><li>Mục 1 Khai mạc</li><li>Mục 2 Báo cáo</li></ul>`;
    if (cheDo === 'matphien') setTimeout(() => { MAT = true; w.document.querySelector('nav').remove(); v.innerHTML = '<h1>Đăng nhập</h1><input type="password" name="pw">'; goi('sau-het-han'); }, 30); }
  else if (p === '/87/assignments') {
    const chon = k => loc === k || (k === 'mo' && loc === 'molink'); const nut = (k, t, cl) => `<button aria-pressed="${chon(k)}" class="${chon(k) ? 'active' : ''}" data-loc="${k}">${t}</button>`;
    const rows = loc === 'bophieu' ? '<p>Chưa có bình bầu</p>' : loc === 'molink' ? '<table><tbody><tr><td>Bầu thư ký</td><td>Mở</td></tr></tbody></table>' : '<table><thead><tr><th>Tên</th><th>Trạng thái</th></tr></thead><tbody><tr><td>Bầu thư ký</td><td>Mở</td></tr><tr><td>Bầu tổ trưởng</td><td>Mở</td></tr></tbody></table>';
    v.innerHTML = `<h1>Bình bầu</h1><div class="chips">${nut('bophieu', 'BỎ PHIẾU 0 Đang diễn ra')}</div>
      <div class="filter-tabs">${nut('tatca', 'Tất cả 2')}${nut('bophieu', 'Bỏ phiếu 0')}${nut('mo', 'Mở 2')}</div>${rows}`;
  }
  else if (p === '/87/mediafiles') { v.innerHTML = `<h1>Kho tài liệu</h1><p>Tệp của cuộc họp</p>`; w.fetch('/drive-proxy/api/v1/files/starred').then(r => r.json()); setTimeout(() => goi('sau-drive'), 50); }
  else if (p === '/87/motions/5') v.innerHTML = `<h1>Kiến nghị 5</h1><dl><dt>Trạng thái</dt><dd>Đã nộp</dd></dl>`;
  else if (p.startsWith('/87/motions/')) { w.history.replaceState({}, '', '/87'); render(); }
  else v.innerHTML = '<h1>Không tìm thấy</h1>';
}
w.document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (a && !a.closest('#ita-panel-host')) { const h = a.getAttribute('href'); if (/loc=mo/.test(h)) loc = 'molink'; else if (/\/87\/assignments$/.test(h)) loc = 'tatca'; e.preventDefault(); w.history.pushState({}, '', a.getAttribute('href')); render(); return; }
  const b = e.target.closest('button[data-loc]'); if (b) { loc = b.dataset.loc; render(); return; }
  if (e.target.id === 'bat-dau') w.fetch('/api/v1/meetings/87/session/start', { method: 'POST' }).catch(() => w.console.error("Couldn't start the meeting"));
});
w.addEventListener('popstate', render);
render();
// --- nạp bản dựng, chạy ---
w.console.warn = () => {}; w.console.info = () => {}; const logGoc = w.console.log; w.console.log = () => {}; w.console.table = () => {};
w.eval(fs.readFileSync(tep, 'utf8'));
await new Promise(r => setTimeout(r, 800));
// [1.2] cấu hình: thử các cách phá khoá an toàn / bộ cấu hình trước khi chạy
const saiCH = [];
if (cheDo === 'cauhinh') {
  const c0 = w.ita.dat({ tenMienDuocChay: new w.RegExp('.*'), cheNhayCam: false, boQuaNut: new w.RegExp('^$'),   // RegExp phải tạo trong cửa sổ jsdom (khác realm thì bị từ chối vì sai kiểu, thử không có ý nghĩa)
    maxTabMoiMan: -1, chanGhi: false, mucQuyTrinh: 3, doSauTab: 3 }).cauHinh();
  const dCH = (dk, ten) => { if (!dk) saiCH.push(ten); };
  dCH(c0.tenMienDuocChay instanceof w.RegExp && c0.tenMienDuocChay.test('app.thu') && !c0.tenMienDuocChay.test('he-thong-that.vn'), 'ita.dat không gỡ được khoá tên miền (vẫn theo hồ sơ)');
  dCH(c0.cheNhayCam === true, 'ita.dat không tắt được che dữ liệu nhạy cảm');
  dCH(c0.boQuaNut.test('Xoá') && c0.boQuaNut.test('Đăng xuất'), 'boQuaNut chỉ cộng thêm: «Xoá», «Đăng xuất» vẫn bị cấm bấm');
  dCH(c0.maxTabMoiMan === 25, 'giá trị ngoài khoảng (maxTabMoiMan -1) bị bỏ');
  dCH(!('chanGhi' in c0) && !('mucQuyTrinh' in c0), 'khoá cũ (chanGhi, mucQuyTrinh) bị từ chối');
  dCH(c0.doSauTab === 3 && c0.__nguon?.doSauTab === 'đã lưu (ita.dat)', 'khoá hợp lệ đã lưu vẫn dùng, ghi nguồn «đã lưu»');
  dCH(c0.mauManLoi.test('Màn hình thử đã hỏng') && c0.mauManLoi.test('Unexpected Application Error'), 'chữ màn báo lỗi = mẫu chung + mau_man_loi của hồ sơ');
  const c1 = w.ita.hoSo('nhanh').cauHinh();
  dCH(c1.__bo === 'nhanh' && c1.doSauTab === 1 && c1.moFormDeKiemKe === false && c1.__nguon?.doSauTab === 'bộ «nhanh»', 'bộ «nhanh» thắng giá trị đã lưu, ghi nguồn bộ');
  const c2 = w.ita.hoSo('bao-mat').cauHinh();
  dCH(c2.__bo === 'bao-mat' && c2.moFormDeKiemKe === true && c2.thuBaoMat === true && c2.doSauTab === 2, 'đổi bộ không cộng dồn bộ trước');
  dCH(!/doSauTab|nhanh|bao-mat/.test(w.localStorage.getItem('ita.cfg.v1') || '') || JSON.parse(w.localStorage.getItem('ita.cfg.v1')).doSauTab === 3, 'chọn bộ không ghi vào cấu hình đã lưu');
  const c3 = w.ita.cauHinh.call(w.ita); dCH(c3.__bo === 'bao-mat', 'bộ đã chọn giữ trong trang');
  w.ita.hoSo('nhanh');
}
const kq = await w.ita.chay({ kiemTroNang: false, idle: 60, waitMax: 2500, tuTaiBaoCao: false });
const sai = [], dat = (dk, ten) => { if (!dk) sai.push(ten); };
sai.push(...saiCH);
if (cheDo === 'cauhinh') {
  const ch = kq && kq.cau_hinh; dat(ch && ch.bo === 'nhanh', 'báo cáo ghi bộ cấu hình đã dùng');
  dat(ch && ch.khac_mac_dinh.some(x => x.khoa === 'doSauTab' && /bộ «nhanh»/.test(x.nguon)) && ch.da_luu.includes('doSauTab'), 'báo cáo ghi khoá khác mặc định kèm nguồn, và cấu hình đã lưu từ trước');
  dat(kq && !kq.dung_giua_chung, 'chạy xong với bộ «nhanh»');
  console.log((sai.length ? 'TRƯỢT' : 'ĐẠT') + ' [cauhinh]' + (sai.length ? ':\n  - ' + sai.join('\n  - ') : '')); process.exit(sai.length ? 1 : 0);
}
if (cheDo === 'thuan-khong') { dat(!kq && !w.__itaHoSo, 'người dùng từ chối kiểm giao diện thuần thì không được chạy'); }
else {
  const man = (kq.man_da_kiem || []).map(r => r.tab), boQua = (kq.bo_qua_khong_bam || []).map(x => x.chu + ' | ' + x.ly_do);
  if (cheDo === 'matphien') {
    dat(kq.dung_giua_chung && /\/system\//.test(kq.mat_phien || ''), 'mất phiên thật (dịch vụ chính 401 + về màn đăng nhập) phải dừng');
    dat(/màn đăng nhập/.test(kq.mat_phien_can_cu || '') && /KHÔNG tự chạy tiếp/.test(kq.ly_do_dung || ''), 'báo cáo ghi căn cứ mất phiên và «không tự chạy tiếp»');
    dat(!kq.mat_phien_lap_lai, 'lần mất phiên đầu không bị ghi là lặp lại');
    await new Promise(r => setTimeout(r, 3500));
    dat(w.ita.nhatKy(400).filter(x => x.loai === 'bắt đầu chạy').length === 1 && !w.localStorage.getItem('ita.run.v1'), 'mất phiên: không tự chạy tiếp, đã xoá cờ đang chạy');
    // người dùng đăng nhập lại rồi tự bấm Chạy: mất phiên lần nữa ĐÚNG màn cũ → báo cáo ghi LẶP LẠI
    MAT = false; w.document.body.insertAdjacentHTML('afterbegin', NAV); w.history.pushState({}, '', '/87'); render();
    const kq2 = await w.ita.chay({ kiemTroNang: false, idle: 60, waitMax: 2500, tuTaiBaoCao: false });
    dat(kq2 && kq2.dung_giua_chung && kq2.mat_phien_lap_lai && /LẶP LẠI/.test(kq2.ly_do_dung || ''), 'mất phiên lặp lại ở cùng màn: dừng và ghi «LẶP LẠI»');
  } else {
    dat(!kq.dung_giua_chung && !kq.mat_phien, '401 của dịch vụ phụ không được làm dừng lần chạy');
    dat((kq.menu_chua_chay || []).length === 0, 'chạy đủ mọi mục menu');
    dat((kq.dich_vu_401 || []).some(x => x.dv === '/drive-proxy' && x.phien_chinh_con && /dịch vụ phụ|vẫn trả/.test(x.ly_do || '')), 'ghi /drive-proxy 401, phiên chính còn, kèm căn cứ');
    // [GĐ 8] từ b0fcecf (GĐ 7): 401 ở dịch vụ phụ khi phiên chính còn là điều ITA KHÔNG chắc → hạ «ghi nhận» / «Cần xem», kèm lý do; vẫn ghi ở đúng màn
    dat((kq.van_de || []).some(r => r.tab === 'Kho tài liệu' && /401 \/drive-proxy/.test(r.api_loi || '') && r.muc_do === 'ghi nhận' && r.ket_luan === 'Cần xem' && /401 ở dịch vụ phụ, phiên chính vẫn còn/.test(r.can_xac_nhan || '')), '401 dịch vụ phụ vẫn ghi ở đúng màn (không bỏ qua), mức «ghi nhận» / «Cần xem» kèm lý do');
    dat(!man.some(t => /› [1-5]$/.test(t)), 'ô lịch chỉ có số không phải tab');
    dat(!man.some(t => /^LANCS NETWORKS › (Bình bầu|Kho tài liệu|Chương trình nghị sự)( ›|$)/.test(t)), 'link thẻ điều hướng nhanh (trùng mục menu) không phải tab');
    dat(man.includes('LANCS NETWORKS › Bình bầu đang mở'), 'link có tham số lọc (khác mục menu) vẫn được kiểm như tab');
    dat(man.includes('Chương trình nghị sự'), 'mục «Chương trình nghị sự» được kiểm (chữ «trình» giữa nhãn link không làm bỏ qua)');
    dat((kq.bo_qua_khong_bam || []).filter(x => x.man === 'Bình bầu' && /nội dung trùng màn/.test(x.ly_do)).length >= 2, 'gộp tab trùng nội dung ở Bình bầu');
    dat(boQua.some(x => /^Trang chủ \| mục menu cùng đường dẫn/.test(x)), 'mục menu cùng đường dẫn không kiểm lại');
    if (cheDo === 'thuan') {   // [GĐ 8] từ 30e73d5 (GĐ 7): giao diện thuần không bấm nút nghiệp vụ
      dat(kq.nut_nghiep_vu_da_bat === false, 'giao diện thuần: nút nghiệp vụ tắt');
      dat(!boQua.some(x => /^Bắt đầu phiên họp/.test(x)) && !(kq.van_de || []).some(r => /công cụ bấm «Bắt đầu phiên họp»/.test(r.chan_ghi || '')), 'giao diện thuần: không bấm «Bắt đầu phiên họp»');
    } else {
      dat(boQua.filter(x => /^Bắt đầu phiên họp/.test(x)).length === 1, 'nút gửi ngay chỉ bị bấm một lần');
      dat((kq.van_de || []).some(r => /^\[công cụ bấm «Bắt đầu phiên họp»\]/.test(r.chan_ghi || '')), 'lệnh ghi bị chặn ghi rõ do công cụ bấm');
    }
    dat(!(kq.van_de || []).some(r => r.js_loi), 'lỗi JS ngay sau lệnh bị chặn không tính là lỗi app');
    dat(!(kq.van_de || []).some(r => r.tieu_de_lech_menu), 'không báo «tiêu đề lệch menu» cho mục trùng đường dẫn');
    dat(!(((kq.he_thong_thiet_ke || {}).nut_cung_nhan_khac_kieu) || []).length, 'nút đang chọn không tính «cùng nhãn khác kiểu»');
    dat(Array.isArray(kq.thao_tac_cuoi) && Array.isArray(kq.man_sap), 'kết quả còn đủ trường thao_tac_cuoi, man_sap');
    if (cheDo === 'thuan') dat(kq.giao_dien_thuan === true, 'báo cáo ghi chế độ giao diện thuần');
    else {
      const hm = Object.fromEntries((kq.ho_so_mau || []).map(x => [x.ma, x.ket_qua]));
      dat(hm['HSM-KN-5'] === 'đã mở' && man.some(t => /^\[hồ sơ mẫu\] HSM-KN-5 › «Đã nộp»$/.test(t)), 'hồ sơ mẫu mở được thì kiểm như một màn');
      dat(hm['HSM-KN-999'] === 'không mở được', 'hồ sơ mẫu bị app chuyển hướng thì ghi «không mở được»');
      dat(hm['HSM-KHAC-TK'] === 'không mở', 'hồ sơ mẫu của tài khoản khác thì không mở');
      dat(!('' in hm) && Object.keys(hm).length === 3, 'mục hồ sơ mẫu sai định dạng bị loại');
    }
  }
}
if (process.env.ITA_IN && kq) console.log(JSON.stringify({ man: (kq.man_da_kiem || []).map(r => r.tab), bo_qua: (kq.bo_qua_khong_bam || []).map(x => x.man + ' | ' + x.chu + ' | ' + x.ly_do) }, null, 1));
console.log((sai.length ? 'TRƯỢT' : 'ĐẠT') + ' [' + cheDo + ']' + (sai.length ? ':\n  - ' + sai.join('\n  - ') : ''));
process.exit(sai.length ? 1 : 0);
