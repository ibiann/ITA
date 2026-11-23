/* ============================================================= *
 * 4. CHỤP ẢNH MÀN LỖI (bước 19, bản 1.5)                          *
 * Chụp NGAY LÚC kiểm một màn, khi màn đó có lỗi mức cao / trung   *
 * bình, kèm khung đánh dấu chỗ lỗi. Bốn ma trận tách riêng, mỗi   *
 * ma trận một hàm, không gọi chéo nhau:                           *
 *   M1 kiểm (đã có, KHÔNG sửa ở đây): lỗi nào, mức nào            *
 *      → mucDo / mucCua (30-loi-kiem.js), căn cứ ở 10-la-chan.js  *
 *   M2 chụp hay không      → quyetChup                             *
 *   M3 đánh dấu cái gì     → TIM_DAU                               *
 *   M4 ảnh có sạch không   → anhSach (không lọt bảng công cụ)      *
 * Chụp là việc phụ: lỗi khi chụp bị nuốt và ghi vào CH.khong,     *
 * không đổi kết quả kiểm. Ảnh nằm trong window.__itaChup, KHÔNG    *
 * đưa vào bản ghi màn / điểm dừng / kết quả. Khung vẽ lên ảnh      *
 * (canvas), không vẽ vào trang. Hết lần chạy ảnh được LƯU vào kho  *
 * lớn của trình duyệt (theo tài khoản), KHÔNG tự tải: người dùng   *
 * bấm «📷 Tải ảnh lỗi» khi cần (bước 19b).                         *
 * ============================================================= */
const CHUP_TRAN = 30, CHUP_TRAN_TOI_DA = 60, CHUP_MAX_KHUNG = 5, CHUP_HONG_TOI_DA = 3;

/* ---------- Lưu ảnh (bước 19b) ----------
 * Ảnh nặng (~0,5 MB mỗi ảnh) nên ở kho lớn IndexedDB 'ita-anh', khoá theo tên miền + tài khoản. localStorage chỉ giữ số ảnh (nhỏ) để nút hiện ngay.
 * Sống qua việc app sập và trang tự tải lại; chạy tiếp thì nạp lại để gộp vào MỘT tệp. */
const KHO_ANH = 'ita-anh';
const khoaAnh = () => 'ita.anh.v1|' + location.origin + '|' + bam(taiKhoan() || '?');
const khoaAnhDem = () => 'ita.anhdem.v1|' + location.origin + '|' + bam(taiKhoan() || '?');
const tenTepAnh = () => 'ita-anh-loi-' + slugTK() + '-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.html';
async function luuAnh(CH) {
  const chu = JSON.stringify({ luc: new Date().toISOString(), bat_dau: CH.bat_dau, ngung: CH.ngung, anh: CH.anh, khong: CH.khong, da: [...CH.da] });
  await kho('readwrite', st => st.put({ ten: khoaAnh(), chu }), KHO_ANH);
  try { localStorage.setItem(khoaAnhDem(), JSON.stringify({ n: CH.anh.length, khong: CH.khong.length })); } catch (e) {}
}
async function docAnhLuu() {
  const x = await kho('readonly', st => st.get(khoaAnh()), KHO_ANH);
  try { return x ? JSON.parse(x.chu) : null; } catch (e) { return null; }
}
async function xoaAnhLuu() {
  try { await kho('readwrite', st => st.delete(khoaAnh()), KHO_ANH); } catch (e) {}
  try { localStorage.removeItem(khoaAnhDem()); } catch (e) {}
  capNhatNutAnh();
}
function demAnh() {
  const CH = window.__itaChup; if (CH) return { n: CH.anh.length, khong: CH.khong.length };
  try { const m = JSON.parse(localStorage.getItem(khoaAnhDem()) || 'null'); if (m) return { n: m.n || 0, khong: m.khong || 0 }; } catch (e) {}
  return { n: 0, khong: 0 };
}
function capNhatNutAnh() {
  if (typeof root === 'undefined' || !root) return;
  const b = root.getElementById('r-anh'), x = root.getElementById('r-xanh'); if (!b) return;
  const d = demAnh(), co = d.n > 0 || d.khong > 0;
  b.textContent = '📷 Tải ảnh lỗi (' + d.n + ')'; b.disabled = !co; if (x) x.disabled = !co;
}
// Tải tệp ảnh (đang chụp thì lấy từ bộ nhớ, không thì từ kho). Là lệnh người dùng bấm, nên không bị chặn tải.
async function taiAnhLoi() {
  let CH = window.__itaChup;
  if (!CH) { try { CH = await docAnhLuu(); } catch (e) { console.warn('[ita] Không đọc được ảnh đã lưu: ' + (e && e.message || e)); return false; } }
  if (!CH || (!(CH.anh || []).length && !(CH.khong || []).length)) { console.warn('[ita] Chưa có ảnh lỗi nào được lưu cho tài khoản này. Tick ô «📷 Chụp ảnh màn lỗi» rồi bấm Chạy.'); return false; }
  const ten = tenTepAnh(); taiTep(ten, trangAnhLoi(CH), 'text/html');
  console.log('[ita] Đã tải ' + ten + ' — ' + CH.anh.length + ' ảnh, ' + (CH.khong || []).length + ' màn lỗi không chụp được (có lý do trong tệp).');
  return true;
}

// Bật chụp cho lần chạy sắp tới. PHẢI gọi thẳng trong cú bấm chuột: trình duyệt chỉ cho xin quyền chia sẻ tab ngay sau thao tác thật,
// nên getDisplayMedia được gọi trước mọi await.
async function batChup(tran, moi) {   // moi: «chạy lại từ đầu» — bỏ ảnh đã lưu
  if (window.__itaChup) return true;
  const md = navigator.mediaDevices;
  if (!md || !md.getDisplayMedia) { console.warn('[ita] Trình duyệt này không hỗ trợ chụp tab: lần chạy này không có ảnh.'); return false; }
  let s;
  try { s = await md.getDisplayMedia({ video: { width: { ideal: Math.round(innerWidth * (window.devicePixelRatio || 1)) }, height: { ideal: Math.round(innerHeight * (window.devicePixelRatio || 1)) }, frameRate: 5 }, audio: false, preferCurrentTab: true, selfBrowserSurface: 'include' }); }
  catch (e) { console.warn('[ita] Không được cấp quyền chụp (' + (e && e.name) + '): lần chạy này không có ảnh. Tick ô «📷 Chụp ảnh màn lỗi», bấm Chạy, chọn tab hiện tại rồi «Chia sẻ».'); return false; }
  const v = document.createElement('video'); v.srcObject = s; v.muted = true; v.playsInline = true;
  try { await v.play(); } catch (e) {}
  const CH = { v, s, anh: [], khong: [], da: new Set(), tran: tran > 0 ? Math.min(+tran, CHUP_TRAN_TOI_DA) : CHUP_TRAN, bat_dau: new Date().toISOString(), ngung: '', hong: 0 };
  const t = s.getVideoTracks && s.getVideoTracks()[0];
  if (t && t.addEventListener) t.addEventListener('ended', () => { if (!CH.ngung) CH.ngung = 'chia sẻ tab đã bị tắt'; });
  // ảnh đã lưu của tài khoản này (lần chạy trước, trước khi app sập và trang tải lại): nạp lại để gộp vào một tệp; màn đã có ảnh không chụp lại
  try {
    if (moi) await xoaAnhLuu();
    else { const luu = await docAnhLuu(); if (luu) { CH.anh = luu.anh || []; CH.khong = luu.khong || []; CH.da = new Set(luu.da || []); if (luu.bat_dau) CH.bat_dau = luu.bat_dau; } }
  } catch (e) { console.warn('[ita] Không đọc được ảnh đã lưu (' + (e && e.message || e) + '): chụp từ đầu.'); }
  window.__itaChup = CH;
  capNhatNutAnh();
  console.log('%c[ita] Chụp ảnh màn lỗi: BẬT (màn lỗi mức cao / trung bình, mỗi màn một ảnh, trần ' + CH.tran + ' ảnh' + (CH.anh.length ? ', đã có ' + CH.anh.length + ' ảnh từ lần chạy trước' : '') + '). Không tắt chia sẻ tab cho tới hết lần chạy.', 'color:#06c;font-weight:bold');
  return true;
}

// Hết lần chạy / dừng / sắp tải lại trang: tắt chia sẻ và LƯU ảnh (không tự tải: báo cáo chính tự tải, ảnh có nút riêng). Không lưu được thì tải về ngay để khỏi mất.
async function ketThucChup() {
  const CH = window.__itaChup; if (!CH) return;
  window.__itaChup = null;
  try { CH.s.getTracks().forEach(t => t.stop()); } catch (e) {}
  if (!CH.anh.length && !CH.khong.length) { console.log('[ita] Chụp ảnh: không có màn lỗi mức cao / trung bình nào.'); capNhatNutAnh(); return; }
  try { await luuAnh(CH); console.log('[ita] Chụp ảnh: đã lưu ' + CH.anh.length + ' ảnh, ' + CH.khong.length + ' màn lỗi không chụp được. Bấm «📷 Tải ảnh lỗi» trên bảng (hoặc ita.taiAnhLoi()) để lấy tệp ảnh.'); }
  catch (e) {
    console.warn('[ita] Không lưu được ảnh vào trình duyệt (' + (e && e.message || e) + ') — tải về ngay để không mất.');
    try { taiTep(tenTepAnh(), trangAnhLoi(CH), 'text/html'); } catch (x) { console.warn('[ita] Không tải được tệp ảnh: ' + x.message); }
  }
  capNhatNutAnh();
}

/* ---------- M2: chụp hay không ----------
 * Chỉ ĐỌC mức do M1 trả về, không tự tính mức. im = true: không chụp và không ghi gì (màn không lỗi, chỉ lỗi mức thấp, hoặc đã có ảnh). */
function quyetChup(muc, khoa, CH) {
  if (muc !== 'cao' && muc !== 'trung bình') return { chup: false, im: true };
  if (CH.da.has(khoa)) return { chup: false, im: true };
  if (CH.ngung) return { chup: false, ly_do: 'không chụp: ' + CH.ngung };
  if (CH.anh.length >= CH.tran) return { chup: false, ly_do: 'đã đủ trần ' + CH.tran + ' ảnh' };
  return { chup: true };
}
const ghiKhong = (CH, r, khoa, muc, ly) => { if (!CH.khong.some(x => x.khoa === khoa)) CH.khong.push({ khoa, man: r.tab, url: r.url, muc, ly_do: ly }); };

/* ---------- M3: đánh dấu cái gì ----------
 * Mỗi loại lỗi có phần tử trên màn một hàm tìm: trả mảng { ten, el }; mảng rỗng = loại lỗi này có nhưng không tìm được chỗ;
 * null = không liên quan tới ảnh này. Loại lỗi không có ở đây (lỗi API, JS, quy trình…) là lỗi cấp màn: ảnh không có khung. */
function phanTuChuKhop(goc, re, env) {
  const ra = [], thay = new Set();
  if (!goc) return ra;
  const w = document.createTreeWalker(goc, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n && ra.length < CHUP_MAX_KHUNG; n = w.nextNode()) {
    re.lastIndex = 0; if (!re.test(n.nodeValue)) continue;
    const el = n.parentElement; if (!el || thay.has(el) || el.closest('#' + env.PANEL) || !env.vis(el)) continue;
    thay.add(el); ra.push(el);
  }
  return ra;
}
const TIM_DAU = {
  // axe: chỉ nhóm nghiêm trọng nhất / nghiêm trọng (là nhóm làm màn lên mức cao / trung bình); không có tham chiếu thì không liên quan
  wcag_loi: (r, ng) => {
    if (!(ng.axe || []).length) return null;
    const ra = [];
    for (const v of ng.axe) for (const el of v.els) ra.push({ ten: v.id + ' — ' + v.help + (v.sc.length ? ' (WCAG ' + v.sc.join('/') + ')' : ''), el });
    return ra;
  },
  du_lieu_nhay_cam: (r, ng, env) => {
    const ra = [];
    for (const [loai, re] of MAU_NHAY_CAM) {
      if (!String(r.du_lieu_nhay_cam).includes(loai)) continue;
      for (const el of phanTuChuKhop(ng.goc, re, env)) ra.push({ ten: loai, el });
    }
    return ra;
  },
  so_dong_vuot_tong: (r, ng, env) => { const b = env.bangChinh(); return b ? [{ ten: 'bảng có số dòng vượt tổng (' + r.so_dong_vuot_tong + ')', el: b }] : []; },
};
function timDauChoMan(r, ng, env) {
  const dau = [];
  for (const k of Object.keys(TIM_DAU)) {
    if (!r[k] || !env.coCC(r, k)) continue;
    let ds; try { ds = TIM_DAU[k](r, ng, env); } catch (e) { ds = []; }
    if (ds) for (const d of ds) dau.push({ loai: k, ten: d.ten, el: d.el });
  }
  return dau;
}
// khung theo px CSS đã cắt theo khung nhìn; null = không vẽ được (ẩn, kích thước 0, ngoài khung nhìn, bị lớp khác che, chiếm gần cả màn)
function chuNhatKhung(el, env) {
  if (!el || !el.isConnected || !env.vis(el)) return null;
  const b = el.getBoundingClientRect();
  const x1 = Math.max(0, b.left), y1 = Math.max(0, b.top), x2 = Math.min(innerWidth, b.right), y2 = Math.min(innerHeight, b.bottom);
  if (x2 - x1 < 4 || y2 - y1 < 4) return null;
  if ((x2 - x1) * (y2 - y1) > 0.9 * innerWidth * innerHeight) return null;
  const top = document.elementFromPoint ? document.elementFromPoint((x1 + x2) / 2, (y1 + y2) / 2) : null;
  if (top && !(el.contains(top) || top.contains(el))) return null;
  return { x1, y1, x2, y2 };
}
const trongKhungNhin = el => { if (!el || !el.isConnected) return true; const b = el.getBoundingClientRect(); return b.bottom > 0 && b.top < innerHeight && b.right > 0 && b.left < innerWidth; };

/* ---------- M4: ảnh sạch ----------
 * Luồng chia sẻ trả khung hình TRỄ: ẩn bảng xong chụp ngay thì ảnh còn bảng (lỗi thật đã gặp, ảnh đầu tiên của lần chụp 11/11).
 * Nên: ẩn bảng, chờ một khung hình tạo SAU lúc ẩn, và vùng bảng trong khung hình phải đổi hẳn so với lúc bảng còn hiện.
 * Không chắc thì trả ok:false, KHÔNG chụp. Người gọi phải trả lại host.style.display. */
async function anhSach(CH, host, env) {
  const v = CH.v, w = v.videoWidth, h = v.videoHeight;
  if (!w || !h) return { ok: false, hong: true, ly_do: 'luồng chia sẻ không có khung hình (đã dừng chia sẻ?)' };
  const tl = w / innerWidth;
  const hc = host && host.style.display !== 'none' ? host.getBoundingClientRect() : null;
  const vung = hc && hc.width > 4 && hc.height > 4 ? { x: Math.max(0, Math.floor(hc.left * tl)), y: Math.max(0, Math.floor(hc.top * tl)), w: Math.min(w, Math.ceil(hc.width * tl)), h: Math.min(h, Math.ceil(Math.min(hc.height, innerHeight) * tl)) } : null;
  const mau = () => { if (!vung) return null; const c = document.createElement('canvas'); c.width = 48; c.height = 48; const g = c.getContext('2d'); g.drawImage(v, vung.x, vung.y, vung.w, vung.h, 0, 0, 48, 48); try { return g.getImageData(0, 0, 48, 48).data; } catch (e) { return null; } };
  const khac = (a, b) => { if (!a || !b) return null; let t = 0; for (let k = 0; k < a.length; k += 4) t += Math.abs(a[k] - b[k]) + Math.abs(a[k + 1] - b[k + 1]) + Math.abs(a[k + 2] - b[k + 2]); return t / (a.length / 4 * 3); };
  // chờ một khung hình tạo sau mốc t (theo thời điểm chụp của khung nếu trình duyệt báo; không thì theo thời điểm hiện > t + 500ms)
  const khungSau = (t, toiDa) => new Promise(ok => {
    if (!v.requestVideoFrameCallback) { setTimeout(() => ok('khong-ho-tro'), toiDa); return; }
    let xong = false; const het = setTimeout(() => { xong = true; ok(false); }, toiDa);
    const cb = (now, md) => { if (xong) return; const moi = md && md.captureTime ? md.captureTime > t : now > t + 500; if (moi) { xong = true; clearTimeout(het); ok(true); } else v.requestVideoFrameCallback(cb); };
    v.requestVideoFrameCallback(cb);
  });
  const truoc = mau();
  if (host) host.style.display = 'none';
  const tAn = performance.now();
  let lyDo = '';
  for (let lan = 0; lan < 4; lan++) {
    if (CO.dung) return { ok: false, ly_do: 'đang dừng lần chạy' };
    const k = await khungSau(tAn, 2000);
    if (k === false) { lyDo = 'không nhận được khung hình mới sau khi ẩn bảng công cụ'; continue; }
    if (k === 'khong-ho-tro') lyDo = 'trình duyệt không báo thời điểm khung hình';
    if (!vung) { if (k === true) return { ok: true, w, h }; continue; }   // bảng đang thu nhỏ / đóng: chỉ cần khung hình mới
    const d = khac(truoc, mau());
    if (d != null && d > 6) return { ok: true, w, h };
    lyDo = 'vùng bảng công cụ trong ảnh chưa đổi (khung hình còn cũ)'; await env.sleep(300);
  }
  return { ok: false, hong: true, ly_do: 'KHÔNG chụp để tránh lộ bảng công cụ: ' + (lyDo || 'không xác nhận được ảnh sạch') };
}

// Gắn vào lõi kiểm: env là các hàm của lõi (PANEL, sleep, nk, vis, bangChinh, mucDo, mucCua, CHECK, coCC). Trả { chupNeuLoi }.
function taoChup(env) {
  async function chupNeuLoi(r, ng) {
    const CH = window.__itaChup; if (!CH || !r) return;
    let khoa = '', muc = '';
    try {
      muc = env.mucDo(r); khoa = r.tab + '\u0001' + r.url;   // cùng khoá với bước gộp các bản ghi trùng màn
      const q = quyetChup(muc, khoa, CH);
      if (!q.chup) { if (!q.im) ghiKhong(CH, r, khoa, muc, q.ly_do); return; }
    } catch (e) { return; }
    const host = document.getElementById(env.PANEL), dispGoc = host ? host.style.display : '', cx = window.scrollX, cy = window.scrollY;
    try {
      const loi = env.CHECK.filter(k => r[k] && env.coCC(r, k)).map(k => k + ': ' + String(r[k]).slice(0, 160));
      const dau = timDauChoMan(r, ng || {}, env);
      // chỗ lỗi đầu tiên nằm ngoài khung nhìn thì cuộn tới đó (khung hình mới sau cuộn do M4 chờ)
      const d0 = dau.find(d => d.el && d.el.isConnected);
      if (d0 && !trongKhungNhin(d0.el)) { try { d0.el.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (e) {} await env.sleep(250); }
      const sach = await anhSach(CH, host, env);   // ẩn bảng + chờ khung hình sạch (M4)
      if (!sach.ok) {
        ghiKhong(CH, r, khoa, muc, sach.ly_do);
        if (sach.hong && ++CH.hong >= CHUP_HONG_TOI_DA) CH.ngung = 'luồng chia sẻ ' + CHUP_HONG_TOI_DA + ' lần liền không cho ảnh sạch — dừng chụp để không làm chậm lần kiểm';
        return;
      }
      CH.hong = 0;
      // khung: tính ngay lúc ảnh đã sạch, màn đã yên
      const ve = [], ngoai = [];
      for (const d of dau) {
        const k = chuNhatKhung(d.el, env);
        if (k && ve.length < CHUP_MAX_KHUNG) ve.push({ so: ve.length + 1, loai: d.loai, ten: d.ten, k }); else ngoai.push(d.ten + ' — không vẽ được khung');
      }
      const { w, h } = sach, sx = w / innerWidth, sy = h / innerHeight;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d'); g.drawImage(CH.v, 0, 0, w, h);
      // khung phải thấy được trên MỌI nền (DQTV nền đỏ, nền trắng): viền đen ngoài + vàng trong; phần tử nhỏ (số trên nút, biểu tượng) nới cho đủ lớn
      for (const d of ve) {
        let x1 = d.k.x1 - 4, y1 = d.k.y1 - 4, x2 = d.k.x2 + 4, y2 = d.k.y2 + 4;
        if (x2 - x1 < 28) { const m = (x1 + x2) / 2; x1 = m - 14; x2 = m + 14; }
        if (y2 - y1 < 28) { const m = (y1 + y2) / 2; y1 = m - 14; y2 = m + 14; }
        const x = x1 * sx, y = y1 * sy, rw = (x2 - x1) * sx, rh = (y2 - y1) * sy;
        g.lineJoin = 'round';
        g.lineWidth = Math.max(5, 5.5 * sx); g.strokeStyle = '#000'; g.strokeRect(x, y, rw, rh);
        g.lineWidth = Math.max(3, 3 * sx); g.strokeStyle = '#ffd600'; g.strokeRect(x, y, rw, rh);
        const rad = Math.max(11, 12 * sx), bx = Math.min(Math.max(x, rad), w - rad), by = Math.min(Math.max(y, rad), h - rad);
        g.fillStyle = '#ffd600'; g.beginPath(); g.arc(bx, by, rad, 0, Math.PI * 2); g.fill();
        g.lineWidth = Math.max(2, 2 * sx); g.strokeStyle = '#000'; g.stroke();
        g.fillStyle = '#000'; g.font = 'bold ' + Math.round(rad * 1.3) + 'px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(d.so), bx, by);
      }
      // lỗi mức cao / trung bình của màn mà ảnh không có khung (lỗi cấp màn, hoặc không xác định được vị trí)
      const coKhung = new Set(ve.map(d => d.loai));
      const capMan = env.CHECK.filter(k => r[k] && env.coCC(r, k) && (env.mucCua(k, r[k]) === 'cao' || env.mucCua(k, r[k]) === 'trung bình') && !coKhung.has(k));
      CH.anh.push({ man: r.tab, url: r.url, muc, loi, dau: ve.map(d => ({ so: d.so, ten: d.ten })), ngoai, cap_man: capMan, luc: new Date().toISOString(),
        kho_css: innerWidth + '×' + innerHeight, kho_anh: w + '×' + h, png: c.toDataURL('image/png') });
      CH.da.add(khoa); CH.khong = CH.khong.filter(x => x.khoa !== khoa);   // màn đã chụp được thì bỏ dòng «không chụp» của lần trước
      env.nk('chụp màn lỗi', r.tab + ' (' + muc + (ve.length ? ', ' + ve.length + ' khung' : '') + ')');
    } catch (e) { ghiKhong(CH, r, khoa, muc, 'lỗi khi chụp: ' + (e && e.message || e)); }
    finally { if (host) host.style.display = dispGoc; try { window.scrollTo(cx, cy); } catch (e) {} }
  }
  return { chupNeuLoi };
}

// trang HTML gom ảnh màn lỗi: mỗi ảnh kèm màn, đường dẫn, mức, chỗ đánh dấu (số trong ảnh), lỗi cấp màn
function trangAnhLoi(CH) {
  const e = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const the = CH.anh.map((a, i) => `<figure id="a${i + 1}"><figcaption><b>${i + 1}. ${e(cheChuoi(a.man))}</b> <span class="m ${a.muc === 'cao' ? 'cao' : 'tb'}">${e(a.muc)}</span>
<div class=nho>${e(a.url)} · khổ ${e(a.kho_css)} (ảnh ${e(a.kho_anh)}) · ${e(a.luc.replace('T', ' ').slice(0, 19))}</div>
${a.dau.length ? '<p class=t>Chỗ đánh dấu trong ảnh:</p><ol class=d>' + a.dau.map(d => `<li value="${d.so}">${e(cheChuoi(d.ten))}</li>`).join('') + '</ol>' : ''}
${a.cap_man.length || a.ngoai.length ? '<p class=t>Lỗi không có khung (lỗi cấp màn, hoặc không xác định được vị trí):</p><ul>' + a.cap_man.map(k => '<li>' + e(k) + '</li>').join('') + a.ngoai.map(t => '<li>' + e(cheChuoi(t)) + '</li>').join('') + '</ul>' : ''}
<details><summary>Mọi lỗi có căn cứ của màn này (${a.loi.length})</summary><ul>${a.loi.map(l => '<li>' + e(cheChuoi(l)) + '</li>').join('')}</ul></details></figcaption>
<img alt="ảnh màn ${i + 1}" src="${a.png}"></figure>`).join('');
  const khong = CH.khong.length ? '<h2>Màn lỗi mức cao / trung bình không chụp được (' + CH.khong.length + ')</h2><table><tr><th>Màn</th><th>Mức</th><th>Lý do</th></tr>' + CH.khong.map(x => '<tr><td>' + e(cheChuoi(x.man)) + '</td><td>' + e(x.muc) + '</td><td>' + e(x.ly_do) + '</td></tr>').join('') + '</table>' : '';
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ảnh màn lỗi</title><style>
body{font:14px/1.5 system-ui,sans-serif;margin:24px;color:#1a1a1a;background:#fafafa}h1{font-size:20px;margin:0 0 4px}h2{font-size:16px;margin-top:28px}
.canh{background:#fff4e5;border:1px solid #f0b46b;padding:10px 12px;border-radius:6px;margin:12px 0}.nho{color:#666;font-size:12px}.t{margin:8px 0 2px;font-weight:600}
figure{margin:20px 0;padding:12px;background:#fff;border:1px solid #ddd;border-radius:8px}figcaption ul,figcaption ol{margin:4px 0 8px;padding-left:22px;font-size:13px}
img{max-width:100%;height:auto;border:1px solid #ccc;display:block;margin-top:8px}.m{padding:1px 8px;border-radius:10px;font-size:12px;color:#fff}.cao{background:#c62828}.tb{background:#ef6c00}
table{border-collapse:collapse;background:#fff}td,th{border:1px solid #ddd;padding:6px 8px;text-align:left;font-size:13px}
</style></head><body><h1>Ảnh màn lỗi ${e(typeof PHIEN_BAN !== 'undefined' ? PHIEN_BAN : '')}</h1>
<div class=nho>Tài khoản ${e(cheChuoi(TK || ''))} · chụp từ ${e(CH.bat_dau.replace('T', ' ').slice(0, 19))}${CH.ngung ? ' · DỪNG CHỤP: ' + e(CH.ngung) : ''}</div>
<div class=canh><b>Ảnh KHÔNG che dữ liệu cá nhân — chỉ dùng nội bộ.</b> Mỗi ảnh chụp ngay lúc công cụ kiểm màn và thấy lỗi mức cao / trung bình; khung vàng viền đen và số trong ảnh khớp danh sách «Chỗ đánh dấu» dưới ảnh. Ảnh chỉ gồm phần đang hiện trên màn. Màn chỉ có lỗi mức thấp không được chụp (đã có đường dẫn trong báo cáo).</div>
<p>${CH.anh.length} ảnh · ${CH.khong.length} màn lỗi không chụp được</p>${the}${khong}</body></html>`;
}
