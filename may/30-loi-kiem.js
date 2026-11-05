/* ============================================================= *
 * 4. LÕI KIỂM                                                   *
 * ============================================================= */
async function itaAudit(over, trangThaiTiep) {
  const C = cfgHienTai(over);
  if (C.tenMienDuocChay && !C.tenMienDuocChay.test(location.hostname)) {
    console.warn('%c[ita] KHÔNG CHẠY: tên miền "' + location.hostname + '" không khớp tenMienDuocChay ' + C.tenMienDuocChay + '. Nếu đây đúng là môi trường kiểm thử: ita.dat({ tenMienDuocChay: /^' + location.hostname.replace(/\./g, '\\.') + '$/ })', 'color:#fff;background:#c62828;font-weight:bold;padding:4px 8px');
    throw new Error('ita: tên miền không được phép chạy');
  }
  window.__itaKhongChe = !C.cheNhayCam;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  // bản 3.5: so trên chữ đã chuẩn hoá (Xóa/Xoá, NFD)
  const W = s => { const re = new RegExp('(?<![\\p{L}\\d])(' + canon(s) + ')(?![\\p{L}\\d])', 'iu'); return { test: x => re.test(canon(x)), source: re.source }; };
  const SKIP = W('đăng xuất|thoát|xoá|xóa|ký|trình ký|trình|gửi|lưu|duyệt|phê duyệt|tạo|thêm|thêm mới|xuất|tải về|tải xuống|in|huỷ|hủy|từ chối|trả lại|rút về|nộp|đồng ý|xác nhận|chuyển|giao việc|cập nhật|sửa|nhập|import|export|download|delete|remove|save|submit|create|add|approve|sign|logout|reset|đặt lại|khôi phục|khoá|mở khoá|đóng hồ sơ|kết thúc|hoàn thành');
  const NAV_SKIP = W('đăng xuất|thoát|logout|sign out');
  const EMPTY = /Chưa có|Không có (dữ liệu|kết quả|bản ghi|việc|hồ sơ)|Không tìm thấy|Không có .{0,20}khớp|0 kết quả/i;
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();

  // Môi trường có được phép ghi không (mức >=2 và origin khớp)
  const host = location.hostname;
  // bản 3.5: so tên máy chủ CHÍNH XÁC (3.4 dùng "chứa chuỗi": khai 'dqtv' là khớp cả hệ thống thật)
  const choGhiMoiTruong = C.mucQuyTrinh >= 2 && (C.moiTruongKiemThu || []).some(x => x instanceof RegExp ? x.test(host) : String(x).toLowerCase() === host.toLowerCase());
  const chanGhi = C.chanGhi && !choGhiMoiTruong;

  /* ---------- theo dõi mạng + lỗi ---------- */
  const LOG = [], ERR = [], BLOCK = [];
  const res = (trangThaiTiep && trangThaiTiep.res) || [];
  const inputs = (trangThaiTiep && trangThaiTiep.inputs) || [];
  const scen = [], skipped = [], missing = [];
  const VISITED = new Set((trangThaiTiep && trangThaiTiep.visited) || []);
  const DA_XONG = new Set((trangThaiTiep && trangThaiTiep.xong) || []);
  let DEM_API = 0, DEM_NETERR = 0;   // đếm lệnh gọi máy chủ và số lần mất kết nối trong một mục (để phát hiện mất mạng)
  // Màn làm ứng dụng báo lỗi nặng / sập màn hình (lưu cả qua tải lại trang). Lần chạy tiếp sẽ bỏ qua đúng màn đó.
  // [S1] Màn sập: nhớ theo ĐƯỜNG DẪN (chữ menu có nhãn động như "của tôi" nên không dùng làm khóa).
  // Lưu ở khóa nhỏ riêng KEY_SAP để không mất khi điểm dừng lớn không lưu được.
  const sapKey = () => KEY_SAP + '|' + location.origin + '|' + bam(TK || '?');
  const docSapLuu = () => { try { return doChuoi(localStorage.getItem(sapKey()) || '[]') || []; } catch (e) { return []; } };
  const SAP = [];
  for (const x of [].concat((trangThaiTiep && trangThaiTiep.sap) || [], docSapLuu())) if (x && !SAP.some(y => y.man === x.man && y.duong_dan === x.duong_dan)) SAP.push(x);
  if (trangThaiTiep) SAP.forEach(x => missing.push(x.man + ' (màn sập ở lần chạy trước — ' + (x.duong_dan || '') + (x.loi_da_biet ? ' — LỖI ĐÃ BIẾT ' + x.loi_da_biet.ma + (x.loi_da_biet.yc ? '/' + x.loi_da_biet.yc : '') : ' — lỗi mới, cần báo') + ')'));
  const SAP_TEN = new Set(SAP.map(x => x.man));
  const chuanTuyen = u => String(u || '').replace(/^https?:\/\/[^/]+/, '').split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  const SAP_TUYEN = new Set(SAP.map(x => x.duong_dan).filter(Boolean));
  if (!C.thuLaiLoiDaBiet) for (const q of ((window.__itaQuyTac || {}).loi_sap || []).filter(x => x.duong_dan && x.trang_thai !== 'Đóng')) {
    const tu = chuanTuyen(q.duong_dan);
    if (!SAP_TUYEN.has(tu)) { SAP.push({ man: '(không mở — lỗi đã biết trong sổ)', duong_dan: tu, url: tu, loi: q.mo_ta || '', cach_nhan: 'bỏ trước theo sổ yêu cầu', vai_tren_giao_dien: TK || '', luc: new Date().toLocaleString('vi-VN'), loi_da_biet: { ma: q.ma, yc: q.yc || '', mo_ta: q.mo_ta || '' }, bo_truoc: true }); SAP_TUYEN.add(tu); }
  }
  const luuSap = () => { try { localStorage.setItem(sapKey(), hoaChuoi(SAP.slice(-200))); } catch (e) {} };
  const loiDaBiet = tuyen => ((window.__itaQuyTac || {}).loi_sap || []).find(q => q.duong_dan && (tuyen === chuanTuyen(q.duong_dan) || tuyen.startsWith(chuanTuyen(q.duong_dan) + '/')));
  const SAP_MAN = { __itaSapMan: true };   // lỗi điều khiển: thoát khỏi màn vừa sập, chạy tiếp mục sau
  let SAP_MOI = null, VUA_PHUC_HOI = '', CKPT_GON = false;
  let HIENTAI = '';   // màn / tab công cụ vừa bấm vào
  const LOI_NANG = /màn hình hỏng|componentDidCatch|Uncaught|TypeError|ReferenceError|RangeError|Cannot read|is not a function|is not defined|Minified React error|^Error: |\bError: /i;
  const LOI_SAP_CONSOLE = /màn hình hỏng|componentDidCatch|Minified React error|The above error occurred/i;
  function danhDauSap(loi, cach) {
    const tuyen = chuanTuyen(location.pathname), man = HIENTAI || CO.tienDo || tuyen;
    if (SAP_MOI) return;
    const biet = loiDaBiet(tuyen);
    const rec = { man, duong_dan: tuyen, url: location.pathname + location.search, loi: String(loi).replace(/\s+/g, ' ').slice(0, 400), cach_nhan: cach,
      vai_tren_giao_dien: TK || '', luc: new Date().toLocaleString('vi-VN'),
      loi_da_biet: biet ? { ma: biet.ma, yc: biet.yc || '', mo_ta: biet.mo_ta || '' } : null };
    SAP_MOI = rec;
    if (!SAP.some(y => y.duong_dan === tuyen && y.man === man)) { SAP.push(rec); SAP_TEN.add(man); SAP_TUYEN.add(tuyen); luuSap(); try { luuCkpt(); } catch (e) {} }
    nk('màn sập', man + ' — ' + tuyen + (biet ? ' — LỖI ĐÃ BIẾT ' + biet.ma : ''));
    console.warn('%c[ita] MÀN SẬP: ' + man + ' (' + tuyen + ')' + (biet ? ' — LỖI ĐÃ BIẾT ' + biet.ma + (biet.yc ? ' / ' + biet.yc : '') : '') + '. Bỏ qua màn này, chạy tiếp mục sau.', 'color:#fff;background:#c62828;padding:2px 6px');
  }
  function ghiSap(msg) {
    if (!LOI_NANG.test(msg) || /itaAudit/.test(msg)) return;
    nk('lỗi JS', (HIENTAI || CO.tienDo || location.pathname) + ' — ' + msg);
    // chỉ coi là màn sập khi có dấu hiệu sập thật; lỗi JS thường chỉ ghi vào nhật ký/báo cáo, không bỏ qua màn
    if (LOI_SAP_CONSOLE.test(msg)) danhDauSap(msg, 'console');
  }
  // dò chữ của màn báo lỗi trên giao diện (không dò trong bảng điều khiển của công cụ)
  function coManLoi() {
    const re = C.mauManLoi; if (!(re instanceof RegExp)) return false;
    const vung = document.querySelector('main') || document.body; if (!vung) return false;
    const t = vung.textContent || ''; if (!re.test(t)) return false;
    const host = document.getElementById('ita-panel-host');
    return !(host && vung === document.body && re.test(host.textContent || '') && !re.test(t.replace(host.textContent || '', '')));
  }
  function kiemManLoi() {
    if (SAP_MOI) throw SAP_MAN;
    if (!coManLoi()) return;
    // vừa thoát màn sập, chưa sang được mục sau: vòng chính tự xét app có kẹt màn báo lỗi không
    if (VUA_PHUC_HOI) return;
    danhDauSap('màn báo lỗi hiện trên giao diện', 'giao_dien');
    throw SAP_MAN;
  }
  let DANG = '';   // mục menu đang kiểm (lưu vào điểm dừng: trang tự tải lại ở mục nào thì biết mục đó)
  const BO_DO_TAI_LAI = (trangThaiTiep && trangThaiTiep.boQuaDoTaiLai) || [];
  BO_DO_TAI_LAI.forEach(t => missing.push(t + ' (bỏ qua: trang tự tải lại giữa chừng nhiều lần ở mục này)'));
  let inflight = 0, pendingJson = 0, lastNet = Date.now();

  // 3.31: cùng một luật với lá chắn — POST chỉ đi khi đúng trọn đường dẫn xác thực trong gói
  const isWrite = (m, url) => chanGhi && !/^(GET|HEAD|OPTIONS)$/i.test(m || 'GET') && !laPostDuocPhep(m, url, (window.__itaDuAn || {}).duong_dan_xac_thuc, location.href);
  // Mã 401 = mất phiên đăng nhập → dừng gọn ở thao tác kế tiếp (ứng dụng sắp đẩy về trang đăng nhập).
  // Mã 403 = giao diện cho vào nhưng máy chủ cấm → ghi lại, đây là lỗi phân quyền cần báo Bên B.
  const MA403 = [];
  function ghiMaQuyen(s, u) {
    const duong = String(u).replace(location.origin, '').split('?')[0];
    if (s === 401 || s === 419 || s === 440) {
      nk('mất phiên', s + ' ' + duong);
      if (C.dungKhiMatPhien && !MAT_PHIEN) { MAT_PHIEN = s + ' ' + duong + ' (đang ở: ' + (CO.tienDo || location.pathname) + ')'; CO.dung = true; }
    } else if (s === 403) { nk('bị cấm (403)', duong); MA403.push({ man: CO.tienDo || location.pathname, api: duong }); }
  }

  // fetch — SỬA LỖI 1: trả promise ngay, không await thân JSON (không chặn ứng dụng)
  // Bản Tampermonkey cài sẵn "cổng" fetch từ lúc trang bắt đầu tải (__itaFetchGoc / __itaFetchCong):
  // mã ứng dụng lỡ giữ tham chiếu fetch cũ vẫn phải đi qua bộ chặn này.
  const of = window.__itaFetchGoc || window.fetch;
  const QUA_MOC = new Set(), DI_VONG = [];
  const ghiQua = u => { try { QUA_MOC.add(new URL(u, location.href).href); } catch (e) {} };
  const moFetch = function (input, init) {
    const url = String((input && input.url) || input), m = (init && init.method) || (input && input.method) || 'GET';
    ghiQua(url);
    if (isWrite(m, url)) { BLOCK.push(m + ' ' + url.replace(location.origin, '')); nk('chặn ghi', m + ' ' + url.replace(location.origin, '')); const e = new TypeError('itaAudit: chặn ' + m); e.__ita = true; return Promise.reject(e); }
    const t0 = performance.now(); inflight++;
    const p = of.apply(this, arguments);
    p.then(r => {
      const entry = { u: url, s: r.status, ms: performance.now() - t0, j: null };
      LOG.push(entry); pendingJson++; DEM_API++;
      ghiMaQuyen(r.status, url);
      r.clone().json().then(j => { entry.j = j; }).catch(() => {}).finally(() => { pendingJson--; });
    }, () => { LOG.push({ u: url, s: 'NETERR', ms: performance.now() - t0 }); DEM_API++; DEM_NETERR++; })
      .finally(() => { inflight--; lastNet = Date.now(); });
    return p;   // ứng dụng nhận promise gốc, không bị can thiệp
  };
  window.fetch = moFetch; window.__itaCong = moFetch;

  const XO = XMLHttpRequest.prototype.open, XS = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u) { this.__m = m; this.__u = String(u); ghiQua(u); return XO.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function () {
    if (isWrite(this.__m, this.__u)) {
      BLOCK.push(this.__m + ' ' + this.__u.replace(location.origin, '')); nk('chặn ghi', this.__m + ' ' + this.__u.replace(location.origin, ''));
      // SỬA LỖI 5: giả readyState=4 rồi phát đủ sự kiện để thư viện không treo ở "đang tải"
      try { Object.defineProperty(this, 'readyState', { value: 4, configurable: true }); } catch (e) {}
      try { Object.defineProperty(this, 'status', { value: 0, configurable: true }); } catch (e) {}
      setTimeout(() => { try { this.dispatchEvent(new Event('readystatechange')); this.dispatchEvent(new Event('error')); this.dispatchEvent(new Event('loadend')); } catch (e) {} }, 0);
      return;
    }
    const t0 = performance.now(); inflight++;
    this.addEventListener('loadend', () => {
      inflight--; lastNet = Date.now();
      let j = null; try { j = this.responseType === 'json' ? this.response : JSON.parse(this.responseText); } catch (e) {}
      LOG.push({ u: this.__u, s: this.status || 'NETERR', ms: performance.now() - t0, j }); DEM_API++; if (!this.status) DEM_NETERR++;
      ghiMaQuyen(this.status, this.__u);
    });
    return XS.apply(this, arguments);
  };

  const oe = console.error;
  console.error = function () { const m = [...arguments].map(a => (a && a.stack) ? (a.name || 'Error') + ': ' + (a.message || '') : String(a)).join(' '); ERR.push(m.slice(0, 160)); try { ghiSap(m); } catch (e) {} return oe.apply(this, arguments); };
  // SỬA LỖI 2: lỗi do công cụ tự gây ra (chặn ghi) KHÔNG tính là lỗi ứng dụng
  const onErr = e => {
    const msg = (e.message || (e.reason && (e.reason.message || e.reason)) || '') + '';
    if ((e.reason && e.reason.__ita) || msg.includes('itaAudit')) return;
    ERR.push('JS: ' + msg); try { ghiSap('Uncaught ' + msg); } catch (x) {}
  };
  window.addEventListener('error', onErr); window.addEventListener('unhandledrejection', onErr);

  // Chặn thêm các đường ghi ngoài fetch/XHR, vì công cụ sẽ bấm nút nghiệp vụ để mở form:
  //  - form HTML gửi kiểu POST (gửi thẳng bằng chuyển trang, fetch/XHR không bắt được)
  //  - navigator.sendBeacon
  //  - WebSocket.send (chỉ chặn trong lúc đang mở form nghiệp vụ, để không làm đứt kết nối thường)
  let DANG_MO_NUT = false;
  const onSubmit = e => {
    if (!chanGhi) return;
    const f = e.target, m = ((f && f.getAttribute && f.getAttribute('method')) || 'get').toLowerCase();
    if (m !== 'get') { e.preventDefault(); e.stopImmediatePropagation(); BLOCK.push('FORM ' + m.toUpperCase() + ' ' + String(f.action || '').replace(location.origin, '')); }
  };
  document.addEventListener('submit', onSubmit, true);
  // bản 3.5: chặn cả form.submit() gọi thẳng (không phát sự kiện submit)
  const FS1 = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function () {
    const m = (this.getAttribute('method') || 'get').toLowerCase();
    if (chanGhi && m !== 'get') { BLOCK.push('FORM ' + m.toUpperCase() + ' ' + String(this.action || '').replace(location.origin, '')); nk('chặn ghi', 'form.submit ' + m); return; }
    return FS1.apply(this, arguments);
  };
  const SB0 = navigator.sendBeacon;
  if (SB0) navigator.sendBeacon = function (u) { ghiQua(u); if (chanGhi) { BLOCK.push('BEACON ' + String(u).replace(location.origin, '')); return true; } return SB0.apply(navigator, arguments); };
  const WS0 = window.WebSocket && WebSocket.prototype.send;
  if (WS0) WebSocket.prototype.send = function () { if (chanGhi && DANG_MO_NUT) { BLOCK.push('WS send'); return; } return WS0.apply(this, arguments); };

  // Phát hiện yêu cầu mạng KHÔNG đi qua móc (ứng dụng giữ tham chiếu fetch cũ, thư viện riêng…):
  // nếu có, bộ chặn ghi có thể không bảo vệ hết → cảnh báo to và ghi vào báo cáo.
  let PO = null, DUNG_BAM = false;
  const T_MOC = performance.now();   // thời điểm cài móc: yêu cầu bắt đầu trước mốc này (đang dở lúc bấm Chạy) không tính là đi vòng
  const NGUNG_BAM_TRUOC = !!(trangThaiTiep && trangThaiTiep.ngungBam);   // phần đã chạy trước khi tải lại có ở chế độ ngừng bấm không
  const coCong = !!window.__itaFetchGoc && !!window.__itaCongSom;   // bản Tampermonkey: có cổng fetch cài từ đầu → tham chiếu cũ vẫn bị chặn
  try {
    PO = new PerformanceObserver(l => {
      for (const e of l.getEntries()) {
        if (!/^(fetch|xmlhttprequest|beacon)$/.test(e.initiatorType)) continue;
        if (e.startTime < T_MOC) continue;   // yêu cầu đã gửi trước khi công cụ bắt đầu chạy, chỉ kết thúc sau đó
        const u = e.name.split('#')[0];
        if (QUA_MOC.has(u) || DI_VONG.some(x => x.url === u)) continue;
        if (DI_VONG.length >= 50) continue;
        const rec = { url: u, ngan: u.replace(location.origin, ''), loai: e.initiatorType, man: CO.tienDo || location.pathname, luc: new Date().toLocaleTimeString('vi-VN') };
        DI_VONG.push(rec); nk('đi vòng bộ chặn', rec.loai + ' ' + rec.ngan);
        // bản dán Console không chặn được lối đi vòng → ngừng bấm nút nghiệp vụ cho tới hết lần chạy (chỉ đọc)
        if (!coCong && chanGhi && !DUNG_BAM) { DUNG_BAM = true; console.warn('%c[ita] ĐÃ NGỪNG BẤM NÚT NGHIỆP VỤ / MỞ FORM cho tới hết lần chạy này (để không lọt lệnh ghi). Các màn vẫn được đọc. Muốn kiểm đủ form: dùng bản Tampermonkey.', 'color:#fff;background:#c62828;font-weight:bold;padding:4px 8px'); }
        if (DI_VONG.length === 1) console.warn('%c[ita] CÓ YÊU CẦU MẠNG KHÔNG ĐI QUA BỘ CHẶN: ' + rec.loai + ' ' + rec.ngan + '\nỨng dụng gọi mạng bằng tham chiếu cũ — bộ chặn ghi có thể không bảo vệ hết. Nên dùng bản Tampermonkey (cài móc từ lúc trang bắt đầu tải).', 'color:#fff;background:#c62828;font-weight:bold;padding:4px 8px');
      }
    });
    PO.observe({ type: 'resource', buffered: false });
  } catch (e) { PO = null; }

  // Gỡ toàn bộ móc theo dõi, trả trang về như cũ
  const goHook = () => {
    if (goHook.xong) return; goHook.xong = true;
    window.fetch = window.__itaFetchCong || of; window.__itaCong = null; try { PO && PO.disconnect(); } catch (e) {} XMLHttpRequest.prototype.open = XO; XMLHttpRequest.prototype.send = XS; console.error = oe;
    window.removeEventListener('error', onErr); window.removeEventListener('unhandledrejection', onErr);
    document.removeEventListener('submit', onSubmit, true);
    if (SB0) navigator.sendBeacon = SB0;
    if (WS0) WebSocket.prototype.send = WS0;
    HTMLFormElement.prototype.submit = FS1;
    if (LC) LC.quyetDinh = null;
    if (PO36) { try { PO36.disconnect(); } catch (e) {} }
    window.__itaGoHook = null;
  };
  // bản 3.5: lá chắn dùng chung quyết định của lần chạy này (lệnh qua đường giữ sẵn cũng bị xét)
  if (LC) LC.quyetDinh = (m, u) => isWrite(m, u) ? 'block' : 'ok';
  window.__itaGoHook = goHook;   // lỗi ở bất cứ đâu: ita.chay() gọi lại để gỡ móc
  // bản 3.5: phát hiện lệnh mạng đi vòng mọi lớp chặn (thư viện giữ fetch gốc từ trước khi dán Console)
  const BYPASS = []; let PO36 = null;
  try {
    PO36 = new PerformanceObserver(list => { for (const en of list.getEntries()) {
      if (/^(fetch|xmlhttprequest|beacon)$/.test(en.initiatorType) && LC && !LC.seen.has(en.name)) BYPASS.push(en.initiatorType + ' ' + en.name.replace(location.origin, '').split('?')[0].slice(0, 70));
    } });
    PO36.observe({ type: 'resource', buffered: false });
  } catch (e) {}
  // bản 3.5: nút nghiệp vụ chỉ bấm khi lá chắn có từ đầu trang và chưa thấy lệnh đi vòng
  // [gộp 3.23 + 3.6] Nút nghiệp vụ (gồm nút của các bước trong đặc tả) cần được mở để đọc form.
  //  - Tampermonkey (lá chắn từ đầu trang): mở như 3.6.
  //  - Dán Console: 3.6 tắt hẳn; 3.23 vẫn mở nhưng NGỪNG ngay khi thấy một lệnh mạng đi vòng bộ chặn.
  //    Giữ cách của 3.23 (không có thì gần hết ca đặc tả thành CHƯA KIỂM). Muốn an toàn tuyệt đối: ita.chay({ moNutKhiDanConsole: false }).
  const nvOk = () => !!(C.moNutNghiepVu && !BYPASS.length && !DUNG_BAM && !NGUNG_BAM_TRUOC && ((LC && LC.som) || C.moNutKhiDanConsole !== false));
  if (C.moNutNghiepVu && !(LC && LC.som)) console.warn('[ita] Dán Console: lá chắn cài muộn. Vẫn mở nút nghiệp vụ để đọc form (lệnh ghi bị chặn); thấy lệnh mạng đi vòng thì tự ngừng bấm. Muốn tắt hẳn: ita.chay({ moNutKhiDanConsole: false }).');
  const resetLog = () => { LOG.length = 0; ERR.length = 0; };
  const apiErrs = () => LOG.filter(l => l.s === 'NETERR' || l.s >= 400).map(l => l.s + ' ' + l.u.replace(location.origin, '').split('?')[0].slice(0, 60));

  /* ---------- tiện ích DOM ---------- */
  const PANEL = 'ita-panel-host';
  const vis = e => { if (!e || !e.getBoundingClientRect) return false; if (e.closest && e.closest('#' + PANEL)) return false; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const txt = e => (e.innerText || e.textContent || '').trim().replace(/\s+/g, ' ');
  const cls = e => (e.getAttribute && e.getAttribute('class')) || '';
  let SB = null;
  const side = () => {
    if (SB && SB.isConnected && vis(SB)) return SB;
    const c = [...document.querySelectorAll('nav, aside, [class*=sidebar], [class*=Sidebar], [class*=side-nav], [class*=sidenav], [role=navigation]')]
      .filter(e => vis(e) && e.getBoundingClientRect().left < 200 && e.getBoundingClientRect().width < 420)
      .sort((a, b) => b.querySelectorAll('a,button').length - a.querySelectorAll('a,button').length)[0];
    if (c && c.querySelectorAll('a,button').length >= 3) return (SB = c);
    let best = null, n = 0;
    for (const el of document.querySelectorAll('div,ul')) {
      if (el.closest('#' + PANEL)) continue;
      const r = el.getBoundingClientRect();
      if (r.left > 40 || r.width > 420 || r.width < 120 || r.height < 300) continue;
      const k = el.querySelectorAll('a,button').length; if (k > n) { n = k; best = el; }
    }
    return (SB = best);
  };
  const mainEl = () => document.querySelector('main, [role=main], #main, [class*=main-content], [class*=page-content]') || document.body;
  // Hộp thoại / ngăn kéo (drawer) của các bộ thư viện giao diện thường gặp
  const DIALOG_SEL = 'dialog[open],[role=dialog],[role=alertdialog],.ant-modal-content,.ant-drawer-content,.el-dialog,.el-drawer,.MuiDialog-paper,.MuiDrawer-paper,.modal.show .modal-content,.p-dialog,.v-dialog,.v-navigation-drawer--temporary';
  const inDialog = e => !!e.closest(DIALOG_SEL.replace('dialog[open]', 'dialog'));
  const topDialog = () => [...document.querySelectorAll(DIALOG_SEL)].filter(vis).pop() || null;
  const viNum = s => { const c = String(s).replace(/[^\d.,\-]/g, ''); if (!c) return NaN; return parseFloat(/,\d+$/.test(c) || /\.\d{3}(\D|$)/.test(c) ? c.replace(/\./g, '').replace(',', '.') : c.replace(/,/g, '')); };
  const labelOf = el => {
    const l = (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]')) || el.closest('label');
    const by = el.getAttribute('aria-labelledby'); const byT = by && by.split(/\s+/).map(i => document.getElementById(i)).filter(Boolean).map(txt).join(' ');
    return (el.getAttribute('aria-label') || byT || (l && txt(l)) || el.placeholder || el.title || el.name || '').trim();
  };
  const pointer = el => { for (let e = el, i = 0; e && i < 4; e = e.parentElement, i++) { if (e.matches && e.matches('a[href],button,[role=button],[role=link],[onclick],[tabindex]')) return true; if (getComputedStyle(e).cursor === 'pointer') return true; } return false; };
  const isLoading = () => {
    const m = mainEl();
    if ([...m.querySelectorAll('[aria-busy=true],[class*=spinner],[class*=Spinner],[class*=skeleton],[class*=Skeleton]')].some(vis)) return true;
    const w = document.createTreeWalker(m, NodeFilter.SHOW_TEXT); let n, k = 0;
    while ((n = w.nextNode()) && k++ < 3000) { const t = n.nodeValue.trim(); if (t.length < 40 && /^(Đang tải|Loading)/i.test(t) && vis(n.parentElement)) return true; }
    return false;
  };

  // Lỗi điều khiển để thoát sớm khi bấm Dừng
  const DUNG = { __itaDung: true };
  async function kiemCo() {
    while (CO.tamDung && !CO.dung) { CO.tienDo = '⏸ Tạm dừng'; await sleep(250); }
    if (CO.dung) throw DUNG;
    kiemManLoi();
  }
  async function settle(extra = 0) {
    await kiemCo();
    const t0 = Date.now(); await sleep(250 + extra);
    while (Date.now() - t0 < C.waitMax) {
      if (!(inflight > 0 || pendingJson > 0 || Date.now() - lastNet < C.idle || isLoading())) break;
      await sleep(150); await kiemCo();
    }
    return Date.now() - t0;
  }

  function setVal(el, v) {
    el.focus();
    const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
    if (el.tagName !== 'SELECT') {
      ['keydown', 'keypress', 'keyup'].forEach(t => el.dispatchEvent(new KeyboardEvent(t, { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true })));
      const f = el.form; if (f && (f.getAttribute('method') || 'get').toLowerCase() === 'get' && f.requestSubmit) { try { f.requestSubmit(); } catch (e) {} }
    }
  }

  function output() {
    const m = mainEl();
    const t = [...m.querySelectorAll('table')].filter(x => vis(x) && !inDialog(x)).sort((a, b) => b.rows.length - a.rows.length)[0];
    let rows = [];
    if (t) rows = [...t.querySelectorAll('tbody tr')].filter(r => vis(r) && !(r.cells.length === 1 && r.cells[0].colSpan > 1) && !r.classList.contains('hang-tong') && !/^\s*Σ/.test(r.innerText || ''));   // [3.30] bỏ dòng tổng Σ
    else rows = [...m.querySelectorAll('[role=row]')].filter(r => vis(r) && !r.querySelector('[role=columnheader]'));
    const text = m.innerText || '';
    const tot = text.match(/(?:tổng(?: cộng| số)?\s*:?\s*|hiện\s*\d[\d.]*\s*\/\s*|trên\s*tổng\s*)(\d[\d.]*)|(\d[\d.]*)\s*(?:kết quả|bản ghi)\b/i);
    // 3.6: nhận thông báo trống rộng hơn (câu tự khai, dòng gộp trong bảng, khối chữ ngay sau bảng) + dấu vân tay để so trước/sau
    const empty = EMPTY.test(text) || cauTrongKhop(text) || (!rows.length && !!t && !!emptyNear(t));
    return { rows: rows.length, rowText: rows.slice(0, 50).map(txt), total: tot ? viNum(tot[1] || tot[2]) : null, empty, text, sig: sigOf(m) };
  }
  const strange = text => [...new Set([
    ...(text.match(/\b(NaN|undefined|null|\[object Object\]|Infinity|Invalid Date)\b/g) || []),
    ...(text.match(/\{[\p{L}\w .]{1,30}\}/gu) || []),
    ...(text.match(/(?<![\p{L}\d])[a-z]{2,}(?:[A-Z][a-z\d]+)+(?:\.[a-z]\w*)?(?![\p{L}\d])/gu) || []),
  ])].slice(0, 6).join(', ');

  /* ================================================================
   * BỔ SUNG 3.6 — phép kiểm lấy từ bản v4. CHỈ ĐỌC: không bấm, không gửi lệnh mạng.
   * Ghi vào trường MỚI; không đổi trường / mức độ của 3.5.
   * ================================================================ */
  const chuanDS = Object.assign({}, MAC_DINH.chuanDS, C.chuanDS || {});
  const cut = (x, n = 80) => { x = String(x == null ? '' : x).replace(/\s+/g, ' ').trim(); return x.length > n ? x.slice(0, n) + '…' : x; };
  const cauTrongKhop = text => (C.cauTrongThem || []).some(p => (p instanceof RegExp ? p.test(text) : canon(text).includes(canon(p))));
  // bảng 0 dòng: tìm dòng thông báo trong bảng (1 ô gộp) hoặc khối chữ ngắn ngay sau bảng
  function emptyNear(t) {
    const one = [...t.querySelectorAll('tbody tr')].find(r => vis(r) && r.cells.length === 1 && txt(r));
    if (one) return txt(one);
    let p = t;
    for (let i = 0; p && i < 3; i++, p = p.parentElement) {
      for (let x = p.nextElementSibling, k = 0; x && k < 3; x = x.nextElementSibling, k++) {
        if (!vis(x) || x.querySelector('button,select,input,a[href],nav')) continue;
        const v = txt(x);
        if (v && v.length <= 150 && /\p{L}{3}/u.test(v) && !/trang|hiển thị|page|showing|\d+\s*[-–\/]\s*\d+|per page|rows/i.test(v)) return v;
      }
    }
    return '';
  }
  // "dấu vân tay" phần nhìn thấy của màn (bỏ giờ phút) — để so trước/sau khi tìm / lọc
  const sigOf = m => (m.innerText || '').replace(/\d{1,2}:\d{2}(:\d{2})?/g, '').replace(/\s+/g, ' ').trim();
  const NHAY_CAM = [
    ['dấu nhắc lệnh terminal', /[\w.-]+@[\w.-]+:[~\/][^\s$#]*[$#]/],
    ['lệnh quản trị máy chủ', /\[sudo\][^\n]{0,30}|\bsudo\s+[\w-]+(\s+[\w-]+)?|\bsystemctl\s+[\w-]+(\s+[\w.-]+)?|\bchmod\s+\d+|\bkubectl\s+[\w-]+/],
    ['IP / cổng nội bộ', /\b(?:127\.0\.0\.1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})\b|\blocalhost:\d{2,5}/],
    ['đường dẫn máy chủ', /(?:^|[\s"'(=])\/(?:home|opt|etc|var|tmp|root|usr|srv)\/[\w.\/-]+|\b[A-Z]:\\(?:Users|Windows|inetpub)\\/],
    ['câu lệnh SQL', /\bSELECT\b[\s\S]{1,200}?\bFROM\b|\bINSERT\s+INTO\b|\bUPDATE\s+\w+\s+SET\b|\bDELETE\s+FROM\b|\bDROP\s+TABLE\b/],
    ['stack trace / lỗi máy chủ', /\bat\s+[\w$.<>]+\s+\([^)]*:\d+:\d+\)|Traceback \(most recent call last\)|Exception in thread|\bat\s+[\w.$]+\(\w+\.java:\d+\)|SQLSTATE\[|ORA-\d{5}/],
    ['mật khẩu / khoá bí mật', /\b(?:password|passwd|pwd|secret|api[_-]?key|access[_-]?token)\s*[:=]\s*\S{4,}|mật khẩu\s*[:=]\s*\S{4,}|\bBearer\s+[\w-]{20,}|\beyJ[\w-]{10,}\.eyJ[\w-]{10,}/i],
  ];
  const che = x => { x = String(x); return x.length <= 8 ? x.slice(0, 2) + '…' : x.slice(0, 8) + '…(' + x.length + ' ký tự)'; };   // che bớt, không chép lại dữ liệu nhạy cảm vào báo cáo
  const sensitive = text => NHAY_CAM.map(([ten, re]) => { const m = text.match(re); return m ? ten + ' «' + che(m[0].trim()) + '»' : ''; }).filter(Boolean).join(' | ');
  const DINH_DANG_NGAY = [['dd/mm/yyyy', /\b(?:0?[1-9]|[12]\d|3[01])\/(?:0?[1-9]|1[0-2])\/\d{4}\b/], ['yyyy-mm-dd', /\b\d{4}-\d{2}-\d{2}\b/], ['dd-mm-yyyy', /\b\d{1,2}-\d{1,2}-\d{4}\b/], ['dd.mm.yyyy', /\b\d{1,2}\.\d{1,2}\.\d{4}\b/], ['mm/dd/yyyy (Mỹ)', /\b(?:0?[1-9]|1[0-2])\/(?:1[3-9]|2\d|3[01])\/\d{4}\b/]];
  const ENUM_RE = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$|^(PENDING|APPROVED|REJECTED|DRAFT|SERVING|ACTIVE|INACTIVE|CLOSED|CANCELLED|CANCELED|COMPLETED|SUBMITTED|PROCESSING|ARCHIVED|DELETED)$/;
  const TU_NGOAI = /^(save|cancel|delete|edit|submit|search|search\.\.\.|loading|loading\.\.\.|close|back|next|previous|settings|dashboard|logout|login|sign in|confirm|update|create|add|add new|remove|filter|reset|export|import|download|upload|view|details|actions?|status|no data|select|choose|apply|clear)$/i;
  // chữ ký thành phần (thẻ + 2 class có nghĩa) để gom lỗi theo component
  const kyHieu = e => {
    const ks = (e.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).map(c => c.replace(/__[\w-]+$/, '').replace(/[-_][a-z0-9]{5,}$/i, ''))
      .filter(c => /^[a-z][\w-]{1,30}$/i.test(c) && !/^(css|sc|jsx|tw)-/i.test(c)).slice(0, 2);
    return e.tagName.toLowerCase() + (ks.length ? '.' + ks.join('.') : '');
  };
  const DS = (trangThaiTiep && trangThaiTiep.ds) || { coChu: {}, mauChu: {}, mauNen: {}, boGoc: {}, doBong: {}, lechLuoi: {}, nut: {} };
  const NT = (trangThaiTiep && trangThaiTiep.nt) || { tu: {}, nhan: {}, ngoai: {}, nfd: {}, ngay: {} };
  const themDS = (bangGT, gt, man) => { const o = bangGT[gt] || (bangGT[gt] = { n: 0, so_man: 0, man: [] }); o.n++; if (o._l !== man) { o._l = man; o.so_man++; if (o.man.length < 4) o.man.push(man); } };
  const trongSuot = c => !c || c === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(c);
  const doBao = c => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return 0; const v = m[1].split(',').map(parseFloat); if (v.length > 3 && v[3] < 0.5) return 0; return Math.max(v[0], v[1], v[2]) - Math.min(v[0], v[1], v[2]); };
  function thuThapThietKe(main, man) {
    const els = [...main.querySelectorAll('*')].slice(0, 6000).filter(e => !inDialog(e) && vis(e)).slice(0, chuanDS.mauMoiMan || 900);
    let nutChinh = 0;
    for (const e of els) {
      const cs = getComputedStyle(e);
      if ([...e.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim())) { themDS(DS.coChu, Math.round(parseFloat(cs.fontSize) * 2) / 2 + 'px', man); themDS(DS.mauChu, cs.color, man); }
      if (!trongSuot(cs.backgroundColor)) themDS(DS.mauNen, cs.backgroundColor, man);
      if (cs.borderRadius && cs.borderRadius !== '0px') themDS(DS.boGoc, cs.borderRadius, man);
      if (cs.boxShadow && cs.boxShadow !== 'none') themDS(DS.doBong, cut(cs.boxShadow, 60), man);
      const luoi = chuanDS.luoi || 4;
      for (const pr of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'rowGap', 'columnGap']) { const v = parseFloat(cs[pr]); if (v > 2 && Math.abs(v / luoi - Math.round(v / luoi)) > 0.01 && !(chuanDS.khoangCach || []).includes(Math.round(v * 2) / 2)) themDS(DS.lechLuoi, v + 'px', man); }
      if (e.matches('button,[role=button],input[type=submit],input[type=button],a[class*=btn],a[class*=button]') && !e.disabled && e.getAttribute('aria-disabled') !== 'true') {
        const nhan = (e.textContent || e.value || '').trim().replace(/\s+/g, ' ');
        if (nhan && nhan.length <= 30 && !e.closest('table,[role=grid],nav,aside')) {
          const kieu = [cs.backgroundColor, cs.color, cs.borderTopColor, cs.borderRadius, Math.round(e.getBoundingClientRect().height) + 'px'].join(' · ');
          const o = DS.nut[canon(nhan)] || (DS.nut[canon(nhan)] = { nhan, kieu: {} }); themDS(o.kieu, kieu, man);
          if (doBao(cs.backgroundColor) >= 60) nutChinh++;
        }
      }
    }
    return nutChinh;
  }
  function thuThapNgonTu(main, man) {
    const sb = side();
    const nodes = [...main.querySelectorAll('button,a,th,label,h1,h2,h3,h4,[role=tab],legend,[role=menuitem]'), ...(sb ? sb.querySelectorAll('a,button,[role=menuitem]') : [])].filter(e => vis(e) && !inDialog(e));
    const ds = nodes.map(e => (e.textContent || '').trim().replace(/\s+/g, ' ')).filter(t => t.length >= 2 && t.length <= 40);
    main.querySelectorAll('input[placeholder],textarea[placeholder]').forEach(e => { if (vis(e)) ds.push(e.placeholder.trim()); });
    for (const t of ds) {
      if (t !== t.normalize('NFC')) themDS(NT.nfd, t.normalize('NFC'), man);
      const raw = t.normalize('NFC');
      const o = NT.nhan[canon(raw)] || (NT.nhan[canon(raw)] = {}); themDS(o, raw, man);
      for (const w of raw.match(/\p{L}+/gu) || []) { if (w.length < 2) continue; const o2 = NT.tu[canon(w)] || (NT.tu[canon(w)] = {}); themDS(o2, w.toLowerCase(), man); }
      if (TU_NGOAI.test(raw)) themDS(NT.ngoai, raw, man);
    }
    const text = main.innerText || '';
    for (const [ten, re] of DINH_DANG_NGAY) if (re.test(text)) themDS(NT.ngay, ten, man);
  }
  // Các trường mới của một màn (gọi trong audit, trước khi ghi kết quả màn)
  function kiemThem(name, text) {
    const main = mainEl();
    const all = [...main.querySelectorAll('*')].filter(e => !e.closest('#' + PANEL));
    const leaves = all.filter(e => e.children.length === 0 && vis(e));
    const titleEls = [...main.querySelectorAll('h1,h2,h3,[class*=title]')].filter(e => vis(e) && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible').slice(0, 3);
    const coGoiY = e => { for (let p = e, i = 0; p && i < 3; p = p.parentElement, i++) if (p.title || p.getAttribute('aria-label') || p.getAttribute('data-tooltip') || p.getAttribute('aria-describedby') || p.getAttribute('data-bs-original-title') || p.getAttribute('data-original-title')) return true; return false; };
    const catChu = all.filter(e => { if (titleEls.includes(e) || e.matches('h1,h2,h3,[class*=title]') || !vis(e)) return false;
      const cs = getComputedStyle(e); const cat = cs.textOverflow === 'ellipsis' || (cs.webkitLineClamp && cs.webkitLineClamp !== 'none');
      return cat && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1) && txt(e) && !coGoiY(e); });
    const dai = leaves.map(e => { const m = txt(e).match(/\S{40,}/); return m ? { e, s: cut(m[0], 40) } : null; }).filter(Boolean);
    const enumEls = leaves.filter(e => !e.closest('code,pre,script,style') && ENUM_RE.test((e.textContent || '').trim()));   // textContent: bỏ qua chữ in hoa do CSS
    const ngay = DINH_DANG_NGAY.filter(([, re]) => re.test(text)).map(([t]) => t);
    const soCham = /\b\d{1,3}(?:\.\d{3})+(?![\d.]|,\d)/.test(text), soPhay = /\b\d{1,3}(?:,\d{3})+(?![\d,]|\.\d)/.test(text);
    let lechMenu = '';
    let laMenu = false; try { laMenu = menuItems.some(m => m.ten === name); } catch (e) {}
    if (laMenu) { const h = [...main.querySelectorAll('h1')].find(vis) || [...main.querySelectorAll('h2')].find(vis);
      if (h) { const a = new Set(canon(name.split(' › ').pop()).match(/\p{L}{2,}/gu) || []), b = new Set(canon(txt(h)).match(/\p{L}{2,}/gu) || []);
        const chung = [...a].filter(x => b.has(x)).length; if (a.size && b.size && chung / Math.min(a.size, b.size) < 0.5) lechMenu = 'menu "' + cut(name.split(' › ').pop(), 40) + '" ≠ tiêu đề "' + cut(txt(h), 40) + '"'; } }
    let nutChinh = 0;
    if (C.kiemThietKe) { try { nutChinh = thuThapThietKe(main, name); } catch (e) {} }
    if (C.kiemNgonTu) { try { thuThapNgonTu(main, name); } catch (e) {} }
    const r = {
      du_lieu_nhay_cam: sensitive(text),
      cat_chu_khong_tooltip: catChu.length ? catChu.length + ' chỗ: ' + catChu.slice(0, 2).map(e => cut(txt(e), 40)).join(' | ') : '',
      chuoi_dai_khong_ngat: dai.length ? dai.length + ' chỗ: ' + [...new Set(dai.map(x => x.s))].slice(0, 2).join(' | ') : '',
      ma_enum_lo: [...new Set(enumEls.map(e => e.textContent.trim()))].slice(0, 5).join(', '),
      dinh_dang_ngay_tron: ngay.length > 1 ? ngay.join(' + ') : '',
      dinh_dang_so_tron: soCham && soPhay ? 'có cả 1.000 và 1,000' : '',
      tieu_de_lech_menu: lechMenu,
      nut_chinh_nhieu: nutChinh > (chuanDS.nutChinhToiDa || 1) ? nutChinh + ' nút nền màu đậm' : '',
    };
    const tp = { tieu_de_bi_cat: titleEls.map(kyHieu), cat_chu_khong_tooltip: catChu.map(kyHieu), chuoi_dai_khong_ngat: dai.map(x => kyHieu(x.e)), ma_enum_lo: enumEls.map(kyHieu) };
    return { r, tp };
  }

  /* ================================================================
   * KIỂM KÊ TRƯỜNG — quét đủ mọi trường trên giao diện
   *   - ô nhập gốc (input/select/textarea) VÀ ô tuỳ biến (Ant, Element, MUI, PrimeNG, Vuetify, react-select…)
   *   - đi xuyên Shadow DOM mở và iframe cùng nguồn
   *   - mở mục thu gọn / "Xem thêm" / "Tìm kiếm nâng cao"
   *   - mở form Thêm mới / Sửa (chỉ đọc, lệnh ghi vẫn bị chặn) và từng tab trong form, hồ sơ
   *   - mở ô chọn tuỳ biến để đọc danh sách lựa chọn (kể cả danh sách cuộn ảo)
   *   - ghi cột bảng và trường hiển thị dạng "Nhãn: giá trị"
   * ================================================================ */
  const TRUONG = (trangThaiTiep && trangThaiTiep.truong) || [];
  const DA_GHI_TRUONG = new Set(TRUONG.map(f => f.khoa));
  const FIELD_SEL = [
    'input:not([type=hidden]):not([type=button]):not([type=submit]):not([type=reset]):not([type=image])', 'select', 'textarea',
    '[contenteditable=""]', '[contenteditable=true]',
    '[role=combobox]', '[role=textbox]', '[role=spinbutton]', '[role=switch]', '[role=slider]', '[role=radiogroup]',
    '.ant-select', '.ant-picker', '.ant-cascader', '.ant-input-number', '.ant-radio-group', '.ant-checkbox-group', '.ant-upload', '.ant-tree-select',
    '.el-select', '.el-date-editor', '.el-cascader', '.el-input-number', '.el-radio-group', '.el-checkbox-group', '.el-upload',
    '.MuiSelect-root', '.MuiAutocomplete-root', '.v-select', '.v-autocomplete',
    '[class*=select__control]', '.ng-select', '.p-dropdown', '.p-multiselect', '.p-calendar', '.choices', '.select2-container', '.flatpickr-input',
  ].join(',');
  const OPT_SEL = '[role=option],.ant-select-item-option,.ant-cascader-menu-item,.el-select-dropdown__item,.el-cascader-node,.MuiAutocomplete-option,.MuiMenuItem-root,.p-dropdown-item,.p-multiselect-item,[class*=select__option],.ng-option,.select2-results__option,.choices__item--choice';
  const POPUP_SEL = '.ant-select-dropdown,.ant-cascader-dropdown,.ant-picker-dropdown,.el-select-dropdown,.el-popper,.MuiAutocomplete-popper,.MuiPopover-root,.p-dropdown-panel,.p-multiselect-panel,[class*=select__menu],.ng-dropdown-panel,.select2-dropdown,[role=listbox]';
  const FORM_ITEM = '.ant-form-item,.el-form-item,.MuiFormControl-root,.form-group,.form-item,.v-input,.p-field,[class*=form-item],[class*=FormItem],[class*=form-group],[class*=FormGroup],[class*=form-field],[class*=FormField],[class*=field-row]';
  const TAB_SEL = '[role=tab],.ant-tabs-tab,.el-tabs__item,.MuiTab-root,.nav-tabs .nav-link,.p-tabview-nav li,.v-tab';
  const MO_RONG_CHU = /^(xem thêm|mở rộng|hiện thêm|hiển thị thêm|thông tin thêm|xem đầy đủ|chi tiết hơn|tìm kiếm nâng cao|lọc nâng cao|nâng cao|bộ lọc nâng cao|hiện bộ lọc|mở bộ lọc|bộ lọc)$/i;
  const CAM_FORM = W('xoá|xóa|ký|trình ký|trình|gửi|lưu|duyệt|phê duyệt|xuất|tải về|tải xuống|in|nhập|import|export|download|đăng xuất|từ chối|trả lại|rút về|nộp|đồng ý|xác nhận|hoàn thành|kết thúc|đóng hồ sơ|khoá|mở khoá|khôi phục|đặt lại|chuyển|giao việc|reset|delete|remove|save|submit|approve|sign');
  const HUY = /^(hủy|huỷ|hủy bỏ|huỷ bỏ|đóng|quay lại|trở lại|thoát|cancel|close|back|×|✕)$/i;
  const chuNut = e => (txt(e) || e.getAttribute('title') || e.getAttribute('aria-label') || '').trim();
  // nút chỉ có biểu tượng (✎, +) thì xét cả title / aria-label / tooltip
  const khopNut = (e, re) => [txt(e), e.getAttribute('title'), e.getAttribute('aria-label'), e.getAttribute('data-original-title'), e.getAttribute('data-tooltip')]
    .some(x => x && x.trim().length < 60 && (re.test(x.trim()) || re.test(canon(x.trim()))));
  const tenNut = e => { for (const x of [txt(e), e.getAttribute('title'), e.getAttribute('aria-label')]) if (x && /\p{L}/u.test(x)) return x.trim(); return chuNut(e); };
  const trongMenu = e => { const s = side(); return !!(s && s.contains(e)); };

  // querySelectorAll xuyên Shadow DOM mở và iframe cùng nguồn
  function deepAll(root, sel) {
    const out = [];
    const visit = r => {
      r.querySelectorAll(sel).forEach(e => out.push(e));
      r.querySelectorAll('*').forEach(e => {
        if (e.shadowRoot) visit(e.shadowRoot);
        if (e.tagName === 'IFRAME') { try { const d = e.contentDocument; if (d && d.body) visit(d.body); } catch (x) {} }
      });
    };
    visit(root); return out;
  }
  const innerInput = e => e.matches('input,select,textarea') ? e : e.querySelector('input:not([type=hidden]),select,textarea');
  const visField = (e, i) => vis(e) || (i && (i.type === 'checkbox' || i.type === 'radio') && vis(i.closest('label') || i.parentElement));

  function kieuOf(e, i) {
    const c = cls(e), r = e.getAttribute('role') || '', t = (i && i.type) || '';
    if (/radio-group/i.test(c) || r === 'radiogroup' || t === 'radio') return 'chọn một (radio)';
    if (/checkbox-group/i.test(c)) return 'đánh dấu nhiều';
    if (t === 'checkbox' || r === 'switch' || /switch/i.test(c)) return 'đánh dấu';
    if (/upload/i.test(c) || t === 'file') return 'tệp đính kèm';
    if (/picker|date-editor|calendar|flatpickr/i.test(c) || /^(date|time|datetime-local|month|week)$/.test(t)) return 'ngày/giờ';
    if (/cascader|tree-select/i.test(c)) return 'chọn nhiều cấp';
    if (e.tagName === 'SELECT' || (i && i.tagName === 'SELECT')) return (i || e).multiple ? 'chọn nhiều' : 'chọn';
    if (/select|autocomplete|dropdown|multiselect|choices|select2|ng-select/i.test(c) || r === 'combobox' || r === 'listbox')
      return /multiple|multi|tags/i.test(c) || e.getAttribute('aria-multiselectable') === 'true' ? 'chọn nhiều' : 'chọn';
    if (/number|spin/i.test(c) || t === 'number' || r === 'spinbutton') return 'số';
    if (e.tagName === 'TEXTAREA' || (i && i.tagName === 'TEXTAREA')) return 'văn bản dài';
    if (e.isContentEditable) return 'soạn thảo';
    if (r === 'slider') return 'thanh trượt';
    return t && t !== 'text' && t !== 'search' ? t : 'chữ';
  }

  // Nhãn của trường + nguồn lấy nhãn + có dấu * không
  let cont0 = null;   // vùng đang quét, để nhanTruong không leo ra ngoài
  function nhanTruong(e, i) {
    i = i || e;
    const by = i.getAttribute('aria-labelledby') || e.getAttribute('aria-labelledby');
    const byT = by ? by.split(/\s+/).map(x => document.getElementById(x)).filter(Boolean).map(txt).join(' ') : '';
    const lf = i.id && document.querySelector('label[for="' + CSS.escape(i.id) + '"]');
    const fi = e.closest(FORM_ITEM);
    const fiLab = fi && [...fi.querySelectorAll('label,.ant-form-item-label,.el-form-item__label,.MuiFormLabel-root,legend,[class*=label],[class*=Label]')]
      .find(x => txt(x) && !x.contains(e) && !e.contains(x));
    const aria = i.getAttribute('aria-label') || e.getAttribute('aria-label') || '';
    const cl = e.closest('label');
    // chữ đứng ngay trước ô; chỉ leo lên khung bọc khi khung đó chỉ chứa riêng ô này (tránh lấy nhầm tiêu đề trang, menu)
    let prev = '';
    for (let p = e, k = 0; p && k < 3 && !prev; k++, p = p.parentElement) {
      if (k > 0 && p.querySelectorAll('input:not([type=hidden]),select,textarea').length > 1) break;
      if (k > 0 && p === cont0) break;
      const s = p.previousElementSibling;
      if (s && txt(s) && txt(s).length < 50 && !s.matches('h1,h2,h3,nav,aside,header,' + FIELD_SEL) && !s.querySelector('input,select,textarea,button,a')) prev = txt(s);
    }
    const ph = i.placeholder || e.getAttribute('placeholder') || (e.querySelector('[class*=placeholder]') ? txt(e.querySelector('[class*=placeholder]')) : '');
    let t = '', nguon = '';
    if (byT) { t = byT; nguon = 'aria-labelledby'; }
    else if (lf && txt(lf)) { t = txt(lf); nguon = 'label for'; }
    else if (fiLab) { t = txt(fiLab); nguon = 'nhãn nhóm trường'; }
    else if (aria) { t = aria; nguon = 'aria-label'; }
    else if (cl && txt(cl)) { t = txt(cl); nguon = 'label bọc'; }
    else if (prev) { t = prev; nguon = 'chữ đứng trước'; }
    else if (ph) { t = ph; nguon = 'chỉ placeholder'; }
    else if (i.name) { t = i.name; nguon = 'chỉ name'; }
    // [3.30] dấu * do CSS vẽ (::after/::before): app DQTV tự mọc dấu theo thuộc tính required (styles.css, BUG-091)
    const labEl = lf || fiLab || cl;
    const saoCss = !!labEl && ['::after', '::before'].some(g => /\*/.test((getComputedStyle(labEl, g) || {}).content || ''));
    const sao = saoCss || /\*/.test(t) || !!(fi && fi.querySelector('.ant-form-item-required,.el-form-item.is-required,[class*=required],.required,.text-danger'))
      || /is-required|required/i.test(fi ? cls(fi) : '');
    t = t.replace(/\*/g, ' ').replace(/[:：]\s*$/, '').replace(/\s+/g, ' ').trim().slice(0, 60);
    return { t, nguon, sao, ph: ph.slice(0, 40) };
  }

  // Mở ô chọn tuỳ biến, đọc lựa chọn (cuộn danh sách ảo), rồi đóng — không chọn gì
  async function docLuaChon(e, i) {
    const trig = e.querySelector('.ant-select-selector,[class*=select__control],.el-select__wrapper,.el-input__wrapper,.p-dropdown-trigger,.p-multiselect-trigger,.select2-selection,.ng-select-container') || i || e;
    const popupHien = () => [...document.querySelectorAll(POPUP_SEL)].some(p => vis(p) && !trongMenu(p));
    const layDs = () => [...document.querySelectorAll(OPT_SEL)].filter(o => vis(o) && !trongMenu(o) && !o.closest('#' + PANEL)).map(txt).filter(Boolean);
    // đóng ô đang mở dở (nếu có) để không lẫn lựa chọn
    if (popupHien()) { document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); await sleep(150); }
    trig.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await sleep(150);
    if (!popupHien()) { trig.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); trig.click(); }
    await settle(0);
    if (!popupHien()) return null;      // không mở được
    let ds = layDs();
    // danh sách cuộn ảo: cuộn để nạp thêm
    const o1 = [...document.querySelectorAll(OPT_SEL)].find(vis);
    let sc = o1 && o1.parentElement;
    while (sc && sc !== document.body && !(sc.scrollHeight > sc.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
    if (sc && sc !== document.body && sc !== document.documentElement) {
      for (let k = 0; k < 15 && ds.length < C.maxLuaChon; k++) {
        const cu = new Set(ds); sc.scrollTop += Math.max(sc.clientHeight - 10, 50); await sleep(160);
        let moi = 0; for (const x of layDs()) if (!cu.has(x)) { ds.push(x); cu.add(x); moi++; }   // sau khi cuộn chỉ thêm mục mới
        if (!moi) break;
      }
    }
    // đóng: rời ô + bấm ra ngoài. Không gửi Esc vào trong hộp thoại để khỏi đóng luôn form
    if (i && i.blur) i.blur();
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await sleep(150);
    if (popupHien()) {
      const p = [...document.querySelectorAll(POPUP_SEL)].filter(vis).pop();
      if (p) p.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
      await sleep(150);
    }
    return ds;   // giữ nguyên mục trùng để báo "lựa chọn trùng"
  }

  // Ghi một trường; trùng với lần quét trước thì bỏ, trùng trong cùng lần quét thì giữ (để bắt nhãn trùng)
  function ghiTruong(f, local) {
    // khoá theo đúng màn (cả đường tab), không theo nhóm menu — tránh gộp nhầm trường cùng tên ở màn khác
    f.khoa = [f.man, f.vung, f.nhan || ('#' + (f.ten_ma || TRUONG.length)), f.loai].map(norm).join('|');
    if (DA_GHI_TRUONG.has(f.khoa) && !local.has(f.khoa)) return false;
    local.add(f.khoa); DA_GHI_TRUONG.add(f.khoa); TRUONG.push(f); return true;
  }
  let GOC = '';      // mục menu đang kiểm (đủ cả tên nhóm, vd "QUÂN LỰC › Chiến sĩ")
  let SO_CHON_COT = 0;   // số ô đánh dấu thuộc bảng "chọn cột hiển thị" — không tính là trường
  const mkTruong = (man, vung, o) => Object.assign({ goc: GOC || man.split(' › ')[0], man, vung, nhan: '', nguon_nhan: '', loai: '', bat_buoc: '', gia_tri: '', so_lua_chon: '', lua_chon: '', ten_ma: '', loi: '', ghi_chu: '' }, o);

  // Ô nhập / ô chọn
  async function quetTruong(cont, man, vungGoc) {
    const laMain = cont === mainEl();
    cont0 = cont;
    let ds = deepAll(cont, FIELD_SEL).filter(e => !(laMain && inDialog(e)) && !trongMenu(e) && !e.closest(POPUP_SEL) && !e.closest('#' + PANEL)
      && !e.closest('thead,[role=columnheader]')                                                       // ô chọn tất cả ở tiêu đề bảng
      && !(e.matches('input[type=checkbox],input[type=radio],.ant-checkbox,[role=checkbox]') && e.closest('tbody,[role=row]')));   // ô chọn dòng
    const S = new Set(ds);
    ds = ds.filter(e => { for (let p = e.parentElement, k = 0; p && k < 6; p = p.parentElement, k++) if (S.has(p)) return false; return true; });  // bỏ ô con nằm trong ô bọc
    const daRadio = new Set(), local = new Set(), cuaVung = {};
    let moChon = 0;
    // Nhận ra bảng "chọn cột hiển thị": nhóm ≥3 ô đánh dấu mà phần lớn nhãn trùng tiêu đề cột bảng
    const tieuDe = new Set([...document.querySelectorAll('thead th,[role=columnheader]')].map(x => norm(x.textContent || '')).filter(Boolean));
    const laChonCot = new Set(), hop = new Map();
    for (const e of ds) {
      const i = innerInput(e) || e; if (i.type !== 'checkbox' && e.getAttribute('role') !== 'checkbox') continue;
      let p = e.parentElement; for (let k = 0; p && k < 6; k++, p = p.parentElement) if (p.querySelectorAll('input[type=checkbox],[role=checkbox]').length >= 3) break;
      if (p) { if (!hop.has(p)) hop.set(p, []); hop.get(p).push(e); }
    }
    for (const arr of hop.values()) {
      const khop = arr.filter(e => { const t = norm(nhanTruong(e, innerInput(e) || e).t); return tieuDe.has(t) || /trong o trang nay|cot hien thi|an cot|hien cot/.test(t); }).length;
      // dấu hiệu thứ hai của bảng chọn cột: gần như tất cả đã đánh dấu và có ô bị khoá (cột bắt buộc hiện)
      const ii = arr.map(e => innerInput(e) || e);
      const daChon = ii.filter(i => i.checked || i.getAttribute('aria-checked') === 'true').length;
      const coKhoa = ii.some(i => i.disabled || i.getAttribute('aria-disabled') === 'true');
      if (arr.length >= 3 && (khop >= arr.length * 0.5 || (coKhoa && daChon >= arr.length * 0.8))) arr.forEach(e => laChonCot.add(e));
    }
    for (const e of ds) {
      await kiemCo();
      if (laChonCot.has(e)) { SO_CHON_COT++; continue; }
      const i = innerInput(e) || e;
      if (!visField(e, i)) continue;
      if (i.type === 'radio' && i.name) { if (daRadio.has(i.name)) continue; daRadio.add(i.name); }
      const kieu = kieuOf(e, i), nh = nhanTruong(e, i);
      const tuDong = e.closest('[class*=filter],[class*=Filter],[class*=search-bar],[class*=SearchBar],[class*=toolbar],[class*=Toolbar],[role=search]') ? 'bộ lọc' : e.closest('form') ? 'form trên màn' : 'màn';
      const vung = laMain ? (vungGoc ? vungGoc + ' · ' : '') + tuDong : (vungGoc || 'hộp thoại');
      const batBuoc = !!(i.required || i.getAttribute('aria-required') === 'true' || e.getAttribute('aria-required') === 'true');
      const khoa = !!(i.disabled || i.readOnly || e.getAttribute('aria-disabled') === 'true' || /(^|[\s-])(disabled|is-disabled)(\s|$)/i.test(cls(e)));
      let luaChon = null, khongMo = false;
      if (/chọn|đánh dấu nhiều/.test(kieu)) {
        if ((i.tagName === 'SELECT')) luaChon = [...i.options].map(o => txt(o) || o.label).filter(Boolean);
        else if (i.type === 'radio' && i.name) luaChon = [...cont.querySelectorAll('input[type=radio][name="' + CSS.escape(i.name) + '"]')].map(r => txt(r.closest('label') || r.parentElement)).filter(Boolean);
        else if (/radio-group|checkbox-group/i.test(cls(e)) || e.getAttribute('role') === 'radiogroup') luaChon = [...e.querySelectorAll('label,[role=radio]')].map(txt).filter(Boolean);
        else if (i.list) luaChon = [...i.list.options].map(o => o.value);
        else if (C.moDropdownTuyBien && !khoa && moChon < C.maxMoChon) { moChon++; try { luaChon = await docLuaChon(e, i); if (luaChon === null) khongMo = true; } catch (x) { if (x === DUNG || x === SAP_MAN) throw x; } }
      }
      let gt = '';
      if (i.type === 'password') gt = '(ẩn)';
      else if (i.type === 'checkbox' || i.type === 'radio') gt = i.checked ? 'đã chọn' : '';
      else if (e !== i) { const s = e.querySelector('.ant-select-selection-item,[class*=singleValue],[class*=single-value],.el-select__selected-item,.p-dropdown-label,.select2-selection__rendered,.ant-select-selection-overflow'); gt = s ? txt(s) : (i.value || ''); }
      // ô chọn gốc: ghi CHỮ của lựa chọn đang chọn (người dùng thấy), kèm mã giá trị để đối chiếu
      else if (i.tagName === 'SELECT') { const o = i.options[i.selectedIndex]; gt = o ? (txt(o) || o.label) + (o.value && o.value !== (txt(o) || o.label) ? ' [mã: ' + o.value + ']' : '') : ''; }
      else gt = i.value || (e.isContentEditable ? txt(e) : '');
      gt = String(gt).slice(0, 60);
      const loi = [], ghiChu = [];
      if (!nh.t) loi.push('không có nhãn, không có placeholder');
      else if (/^chỉ /.test(nh.nguon)) loi.push('thiếu nhãn (' + nh.nguon + ')');
      if (luaChon) {
        if (!luaChon.length) loi.push('ô chọn không có lựa chọn nào' + (khoa ? '' : ' (có thể phụ thuộc ô khác)'));
        const dup = luaChon.filter((x, k) => luaChon.indexOf(x) !== k);
        if (dup.length) loi.push('lựa chọn trùng: ' + [...new Set(dup)].slice(0, 3).join(', '));
      }
      // bỏ phần "[mã: …]" do công cụ tự thêm, chỉ kiểm chữ người dùng thực sự thấy
      const la = strange([nh.t, gt.replace(/\s*\[mã: [^\]]*\]?$/, ''), ...(luaChon || [])].join(' \n ')); if (la) loi.push('chữ lạ: ' + la);
      if (khongMo) ghiChu.push('không mở được danh sách lựa chọn');
      if (nh.sao && !batBuoc) ghiChu.push('có dấu * nhưng mã không khai bắt buộc — cần thử máy chủ có chặn không');
      if (batBuoc && !nh.sao) ghiChu.push('bắt buộc nhưng nhãn không có dấu *');
      if (khoa) ghiChu.push('đang khoá / chỉ đọc');
      if (nh.ph && nh.ph !== nh.t) ghiChu.push('placeholder: ' + nh.ph);
      const f = mkTruong(man, vung, {
        nhan: nh.t, nguon_nhan: nh.nguon, loai: kieu, bat_buoc: (batBuoc || nh.sao) ? 'Có' : '', gia_tri: gt,
        so_lua_chon: luaChon ? luaChon.length : '', lua_chon: luaChon ? luaChon.slice(0, C.maxLuaChon).join('; ').slice(0, 800) : '',
        ten_ma: (i.name || i.id || '').slice(0, 40), loi: loi.join(' | '), ghi_chu: ghiChu.join(' | '),
      });
      if (ghiTruong(f, local)) (cuaVung[vung] = cuaVung[vung] || []).push(f);
    }
    // nhãn trùng trong cùng vùng
    for (const arr of Object.values(cuaVung)) {
      const dem = {}; arr.forEach(f => { const k = norm(f.nhan); if (k) dem[k] = (dem[k] || 0) + 1; });
      arr.forEach(f => { if (f.nhan && dem[norm(f.nhan)] > 1 && !/đánh dấu/.test(f.loai)) f.loi = (f.loi ? f.loi + ' | ' : '') + 'nhãn trùng trong cùng vùng'; });
    }
  }

  // Cột bảng
  function quetCot(cont, man, vungGoc) {
    const laMain = cont === mainEl(), local = new Set();
    const ths = [...cont.querySelectorAll('thead th, [role=columnheader]')].filter(e => vis(e) && !(laMain && inDialog(e)) && !/scrollbar/i.test(cls(e)));
    ths.forEach((th, k) => {
      // lấy chữ gốc (textContent), không lấy chữ đã bị CSS đổi thành IN HOA
      const t = (th.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
      const coCheck = !!th.querySelector('input[type=checkbox],[role=checkbox],.ant-checkbox,.el-checkbox');
      if (!t && (coCheck || k === 0 || k === ths.length - 1)) return;   // cột chọn dòng / cột thao tác
      const loi = [];
      if (!t) loi.push('cột không có tiêu đề');
      const la = strange(t); if (la) loi.push('chữ lạ: ' + la);
      ghiTruong(mkTruong(man, (vungGoc ? vungGoc + ' · ' : '') + 'cột bảng', { nhan: t, nguon_nhan: 'tiêu đề cột', loai: 'cột bảng', loi: loi.join(' | ') }), local);
    });
  }

  // Trường hiển thị (hồ sơ chi tiết): dt/dd, descriptions, bảng dọc th–td, "Nhãn: giá trị"
  function quetChiTiet(cont, man, vungGoc) {
    const laMain = cont === mainEl(), cap = [], daLay = new Set(), local = new Set();
    const ok = e => vis(e) && !(laMain && inDialog(e)) && !trongMenu(e) && !e.closest('thead,[role=columnheader],' + POPUP_SEL);
    const them = (l, v) => { if (!daLay.has(l)) { daLay.add(l); cap.push([l, v]); } };
    cont.querySelectorAll('dt').forEach(dt => { const dd = dt.nextElementSibling; if (ok(dt) && dd && dd.tagName === 'DD') them(dt, dd); });
    cont.querySelectorAll('.ant-descriptions-item-label,.el-descriptions__label,[class*=descriptions__label],[class*=info-label],[class*=field-label],[class*=detail-label],[class*=InfoLabel],[class*=DetailLabel],[class*=label-col]')
      .forEach(l => { const v = l.nextElementSibling; if (ok(l) && v && !v.querySelector('input,select,textarea')) them(l, v); });
    cont.querySelectorAll('tbody tr').forEach(tr => {
      const c = tr.children; if (!ok(tr)) return;
      if (c.length === 2 && c[0].tagName === 'TH' && c[1].tagName === 'TD') them(c[0], c[1]);
      if (c.length === 4 && c[0].tagName === 'TH' && c[2].tagName === 'TH') { them(c[0], c[1]); them(c[2], c[3]); }
    });
    cont.querySelectorAll('div,p,li').forEach(el => {
      if (el.children.length !== 2 || !ok(el) || el.querySelector('input,select,textarea,table')) return;
      const a = txt(el.children[0]);
      if (a.length > 1 && a.length < 45 && /[:：]\s*$/.test(a) && txt(el.children[1]).length < 200) them(el.children[0], el.children[1]);
    });
    for (const [l, v] of cap) {
      const nhan = txt(l).replace(/\*/g, '').replace(/[:：]\s*$/, '').trim().slice(0, 60); if (!nhan) continue;
      const gt = txt(v).slice(0, 80), loi = [];
      const la = strange(gt); if (la) loi.push('chữ lạ: ' + la);
      ghiTruong(mkTruong(man, (vungGoc ? vungGoc + ' · ' : '') + 'trường hiển thị', {
        nhan, nguon_nhan: 'nhãn hiển thị', loai: 'hiển thị', gia_tri: gt, loi: loi.join(' | '),
        ghi_chu: (!gt || /^[-–—]+$/.test(gt)) ? 'đang trống' : '',
      }), local);
    }
  }

  // Mở mục thu gọn, "Xem thêm", "Tìm kiếm nâng cao"… để lộ trường ẩn
  const DA_MO_RONG = new WeakSet();
  async function moRong(cont) {
    if (!C.moRongMuc || !cont) return;
    const laMain = cont === mainEl();
    for (let vong = 0; vong < 2; vong++) {
      const ds = [...cont.querySelectorAll('[aria-expanded=false],button,a,[role=button]')].filter(e => vis(e) && !DA_MO_RONG.has(e)
        && !(laMain && inDialog(e)) && !trongMenu(e)
        && !e.closest('table,[role=grid],header,nav,[role=combobox],.ant-select,.el-select,[class*=select__control],[role=menu],[role=menubar],[role=tree],.ant-tree,' + POPUP_SEL)
        && !e.matches('[role=combobox],[aria-haspopup=listbox],[aria-haspopup=menu],[aria-haspopup=true],[aria-haspopup=dialog],[role=tab]')
        && !/^\d*\s*cột|^lọc|^bộ lọc/i.test(tenNut(e))    // nút Cột (chọn cột hiển thị) bỏ qua; nút Lọc để moBoLoc xử lý
        && !SKIP.test(txt(e))
        && (e.getAttribute('aria-expanded') === 'false' || MO_RONG_CHU.test(txt(e)))
        && !(e.tagName === 'A' && e.getAttribute('href') && !/^(#|javascript:)/i.test(e.getAttribute('href'))));
      if (!ds.length) break;
      for (const e of ds.slice(0, 15)) { DA_MO_RONG.add(e); try { e.click(); } catch (x) {} await sleep(150); }
      await settle(0);
    }
  }

  async function quetVung(cont, man, vung) {
    if (!C.kiemKeTruong || !cont) return;
    await moRong(cont);
    await quetTruong(cont, man, vung);
    quetCot(cont, man, vung);
    quetChiTiet(cont, man, vung);
  }

  // Quét một vùng rồi lần lượt từng tab con bên trong (form nhiều tab, hồ sơ nhiều tab)
  async function quetCoTab(layCont, man, vung) {
    let cont = layCont(); if (!cont) return;
    await quetVung(cont, man, vung);
    const tenTab = e => txt(e).replace(/\s\d[\d.]*$/, '');
    // tab là điều hướng nên chỉ chặn chữ đăng xuất (tab "Quá trình…" không phải nút "Trình")
    const lay = c => [...c.querySelectorAll(TAB_SEL)].filter(e => vis(e) && !(c === mainEl() && inDialog(e)) && !NAV_SKIP.test(txt(e)));
    const ten = [...new Set(lay(cont).filter(e => e.getAttribute('aria-selected') !== 'true' && !/(^|\s)(active|is-active|Mui-selected|ant-tabs-tab-active|v-tab--selected)(\s|$)/.test(cls(e))).map(tenTab))]
      .filter(Boolean).slice(0, C.maxTabMoiMan);
    for (const t of ten) {
      await kiemCo();
      cont = layCont(); if (!cont) break;
      const e = lay(cont).find(x => tenTab(x) === t); if (!e) continue;
      e.click(); await settle(150);
      cont = layCont(); if (!cont) break;
      await quetVung(cont, man, (vung ? vung + ' › ' : 'tab ') + '«' + t + '»');
    }
  }

  // Đóng form / hộp thoại không lưu; xác nhận "bỏ thay đổi" nếu được hỏi; quay lại màn cũ nếu đã chuyển trang
  // Hộp hỏi "bỏ thay đổi chưa lưu?" — chỉ nhận đúng câu hỏi này, KHÔNG nhận hộp xác nhận nghiệp vụ
  // ("Xác nhận phê duyệt?", "Trả lại hồ sơ?"…) để không bao giờ bấm Đồng ý cho một hành động
  const HOI_BO_THAY_DOI = /(bỏ|hủy bỏ|huỷ bỏ)\s+(các\s+|mọi\s+)?thay đổi|chưa (được )?lưu|không lưu|rời (khỏi )?(trang|màn)|thoát (mà )?không/i;
  async function dongForm(before, mid, path) {
    const dlgGoc = topDialog();
    for (let k = 0; k < 4; k++) {
      const dlg = topDialog(); if (!dlg) break;
      if (dlg !== dlgGoc && txt(dlg).length < 300 && HOI_BO_THAY_DOI.test(txt(dlg))) {
        const ok = [...dlg.querySelectorAll('button')].filter(vis).find(b => /^(đồng ý|có|ok|rời đi|thoát|bỏ thay đổi|không lưu|yes)$/i.test(txt(b)));
        if (ok) { ok.click(); await sleep(350); continue; }
      }
      const nut = dlg.querySelector('.ant-modal-close,.ant-drawer-close,.el-dialog__headerbtn,.el-drawer__close-btn,[aria-label=Close],[aria-label=close],[aria-label="Đóng"],.btn-close,.close')
        || [...dlg.querySelectorAll('button,[role=button],a')].filter(vis).find(b => HUY.test(chuNut(b)));
      if (nut) nut.click(); else dlg.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
      await sleep(350);
      if (topDialog() === dlg) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true })); await sleep(250); }
    }
    if (location.href !== before) {
      // mid = null: đang ở trang hồ sơ (không có mục menu để mở lại) → lùi một bước trong ứng dụng
      const ok = mid ? await restore(mid, path) : false;
      if (!ok) { try { history.back(); } catch (x) {} await settle(); }
    }
    else await settle(0);
  }

  // Bấm nút mở form, quét trường (cả các tab trong form), rồi đóng không lưu
  async function moVaQuetForm(e, mid, path, man, vung) {
    const before = location.href, dl0 = topDialog(), tenBam = tenNut(e);
    const chan0 = BLOCK.length;
    // nút đang bị khoá: ghi lại lý do (title/tooltip) — đây là thông tin quy trình (điều kiện để được làm bước này)
    if (e.disabled || e.getAttribute('aria-disabled') === 'true' || /(^|\s)(disabled|is-disabled)(\s|$)/.test(cls(e))) {
      const lyDo = e.getAttribute('title') || e.getAttribute('data-tooltip') || e.getAttribute('aria-description') || (e.parentElement && e.parentElement.getAttribute('title')) || '';
      ghiTruong(mkTruong(man, 'nút «' + tenNut(e) + '»', { nhan: tenNut(e), loai: 'nút đang khoá', ghi_chu: lyDo ? 'lý do hiện trên nút: ' + lyDo : 'không ghi lý do vì sao bị khoá' }), new Set());
      skipped.push({ man, chu: tenNut(e), ly_do: 'nút đang khoá' + (lyDo ? ' — ' + lyDo : ' — không ghi lý do') });
      return;
    }
    if (DUNG_BAM) { skipped.push({ man, chu: tenNut(e), ly_do: 'không bấm: ứng dụng có yêu cầu mạng đi vòng bộ chặn, bản dán Console không chặn được — dùng bản Tampermonkey' }); return; }
    const oTruoc = new Set(deepAll(document.body, FIELD_SEL).filter(x => visField(x, innerInput(x) || x)));
    const popTruoc = new Set([...document.querySelectorAll(POP_MO)].filter(vis));
    resetLog(); DANG_MO_NUT = true;
    HIENTAI = man + ' › ' + vung;
    nk('bấm nút', man + ' › ' + tenNut(e));
    try { e.click(); await settle(300); } finally { DANG_MO_NUT = false; }
    // nút mở ra menu con (vd "Thêm mới ▾"): chọn mục đầu tiên không phải hành động
    if (topDialog() === dl0 && location.href === before) {
      const mn = [...document.querySelectorAll('[role=menu] [role=menuitem],[role=menuitem],.ant-dropdown-menu-item,.el-dropdown-menu__item,.MuiMenuItem-root,[class*=dropdown-item],[class*=menu-item]')]
        .filter(x => vis(x) && !CAM_FORM.test(txt(x)) && !trongMenu(x) && !x.closest('#' + PANEL) && ![...popTruoc].some(p => p.contains(x)));
      if (mn.length) { vung += ' › ' + txt(mn[0]).slice(0, 30); DANG_MO_NUT = true; try { mn[0].click(); await settle(300); } finally { DANG_MO_NUT = false; } }
    }
    let dlg = topDialog(); const moTrang = location.href !== before;
    // form mở ngay trên màn (không phải hộp thoại, không đổi trang): lấy khung chung của các ô mới hiện ra
    let khungTai = null;
    if (!(dlg && dlg !== dl0) && !moTrang) {
      const moi = deepAll(document.body, FIELD_SEL).filter(x => !oTruoc.has(x) && visField(x, innerInput(x) || x) && !trongMenu(x) && !x.closest('#' + PANEL));
      if (moi.length) { let c = moi[0].parentElement; while (c && c !== document.body && !moi.every(x => c.contains(x))) c = c.parentElement; khungTai = c || mainEl(); }
    }
    if (khungTai) {
      await quetCoTab(() => khungTai.isConnected ? khungTai : null, man, vung + ' (mở tại chỗ)');
      try { await chayTC(khungTai, man, tenBam); } catch (x) { if (x === DUNG || x === SAP_MAN) throw x; }
      // đóng: tìm nút Hủy/Đóng trong khung, không có thì bấm lại nút mở
      const huy = [...khungTai.querySelectorAll('button,[role=button],a')].filter(vis).find(b => HUY.test(chuNut(b)));
      if (huy) huy.click(); else if (e.isConnected) e.click();
      await settle(150);
      return;
    }
    if (!(dlg && dlg !== dl0) && !moTrang) {
      // bấm là gửi lệnh ghi ngay, không có bước xác nhận → đây là điểm cần xem về quy trình
      const guiNgay = BLOCK.length > chan0 ? BLOCK.slice(chan0, chan0 + 2).join(' | ') : '';
      skipped.push({ man, chu: tenNut(e), ly_do: guiNgay ? 'bấm là gửi lệnh ghi ngay, không hỏi xác nhận, không mở form (đã chặn: ' + guiNgay + ')' : (e.hasAttribute('aria-expanded') || e.hasAttribute('aria-haspopup') ? 'nút mở menu phụ / gập nội dung, không phải nút mở form' : 'bấm nhưng không thấy form mở') });
      // gán lệnh ghi bị chặn cho đúng màn đang kiểm (trước đây bị dồn sang màn kế tiếp)
      if (guiNgay) { const r0 = [...res].reverse().find(r => r.tab === man); if (r0) { r0.chan_ghi = [r0.chan_ghi, BLOCK.splice(chan0).slice(0, 2).join(' | ')].filter(Boolean).join(' | '); } }
      if (guiNgay) ghiTruong(mkTruong(man, 'nút «' + tenNut(e) + '»', { nhan: tenNut(e), loai: 'nút gửi ngay', loi: 'bấm là gửi lệnh ghi ngay, không có hộp xác nhận / form nhập (đã chặn: ' + guiNgay + ')' }), new Set());
      await dongForm(before, mid, path);   // trường hợp nút mở menu nhỏ hoặc đổi trang ngầm
      return;
    }
    const ae = apiErrs(), je = ERR.slice();
    if (ae.length || je.length) ghiTruong(mkTruong(man, vung, { nhan: '(lỗi khi mở form)', loai: 'form', loi: [ae[0] && 'API lỗi: ' + ae[0], je[0] && 'JS lỗi: ' + je[0].slice(0, 80)].filter(Boolean).join(' | ') }), new Set());
    const layCont = () => (dlg && dlg !== dl0 && dlg.isConnected && vis(dlg)) ? dlg : (moTrang ? mainEl() : null);
    await quetCoTab(layCont, man, vung);
    try { await chayTC(layCont(), man, tenBam); } catch (x) { if (x === DUNG || x === SAP_MAN) throw x; }
    await dongForm(before, mid, path);
  }

  // Các nút mở form trên thanh công cụ của màn (không nằm trong bảng, không nằm ở menu)
  // header nằm TRONG vùng chính (thanh tiêu đề trang có nút Thêm) vẫn được xét; chỉ bỏ header chung của ứng dụng
  const ngoaiHeaderChung = e => { const h = e.closest('header'); return !h || (mainEl() !== document.body && mainEl().contains(h)); };
  // Nút có số đếm ở cuối ("Chờ duyệt 0") là tab lọc; thẻ a có đường dẫn thật là điều hướng — cả hai do phần duyệt tab lo
  const laTabHayLink = e => /\s\d[\d.]*$/.test(txt(e)) || e.matches('[role=tab],[aria-pressed],[aria-selected]')
    || (e.tagName === 'A' && e.getAttribute('href') && !/^(#|javascript:)/i.test(e.getAttribute('href')));
  // Liên kết mang tên một bước nghiệp vụ ("Phê duyệt kế hoạch huấn luyện", "Nhận công văn báo xuất ngũ"…) cũng là chỗ mở form
  const DONG_TU = /^(phê duyệt|duyệt|ghi nhận|ghi |nhất trí|xác minh|thẩm định|chọn |chỉ huy trưởng tự duyệt|tự duyệt|gửi|xác nhận|ký|trình|trả lại|chuyển|phân công|giao|ra lệnh|mở việc|mở đợt|ban hành|nhận|tiếp nhận|lập|soạn|đính|cập nhật|sửa|thêm|tạo|đề nghị|đăng ký|bổ sung|khép|kết thúc|hoàn thành|đối chiếu|bàn giao|phân phối|cấp|công nhận|quyết định|báo cáo kết quả)/iu;
  const laLinkNghiepVu = e => e.tagName === 'A' && e.getAttribute('href') && !/^(#|javascript:)/i.test(e.getAttribute('href')) && !/\s\d[\d.]*$/.test(txt(e)) && DONG_TU.test(tenNut(e)) && !duongNguyHiem(e);
  // bản 3.5: đường dẫn hành động (đoạn đường dẫn đúng bằng một từ hành động)
  const DUONG_HD = new Set(['xoa', 'delete', 'remove', 'destroy', 'ky', 'ky-so', 'sign', 'approve', 'phe-duyet', 'duyet', 'trinh', 'trinh-ky', 'submit', 'huy', 'cancel', 'reject', 'tu-choi', 'tra-lai', 'rut-ve', 'lock', 'khoa', 'logout', 'dang-xuat', 'signout', 'export', 'xuat', 'download', 'tai-ve', 'publish', 'phat-hanh']);
  const DUONG_NGUY = new Set(['xoa', 'delete', 'remove', 'destroy', 'huy', 'cancel', 'lock', 'khoa', 'logout', 'dang-xuat', 'signout', 'export', 'xuat', 'download', 'tai-ve']);
  const phanDuong = e => { const h = e.getAttribute && e.getAttribute('href'); if (!h) return []; let u; try { u = new URL(h, location.href); } catch (x) { return []; }
    return [...u.pathname.split('/'), ...u.searchParams.values()].map(x => { try { return norm(decodeURIComponent(x)).replace(/\s+/g, '-'); } catch (y) { return ''; } }); };
  function duongHanhDong(e) { return phanDuong(e).some(x => DUONG_HD.has(x)); }
  function duongNguyHiem(e) { return phanDuong(e).some(x => DUONG_NGUY.has(x)); }
  // Nút GỬI của một form đang mở trên trang (trang "Lập hồ sơ…", "Tạo tờ trình…"): không phải nút mở form → không bấm.
  // Nhận ra: nút submit / nằm trong thẻ form / hoặc mang chữ lưu-gửi-lập… mà ngay khung bao quanh có từ 2 ô nhập trở lên.
  const O_NHAP = 'input:not([type=hidden]):not([type=search]):not([type=checkbox]):not([type=radio]),select,textarea,[role=combobox],[contenteditable=true]';
  const CHU_GUI = /^(lưu|lưu dự thảo|lưu nháp|gửi|lập|tạo|ghi nhận|xác nhận|trình|phát động|tiếp nhận|cập nhật|hoàn tất|hoàn thành|đồng ý|mở đợt|mở hồ sơ|thêm)( |$)/i;
  const laNutGuiForm = e => {
    if ((e.getAttribute('type') || '').toLowerCase() === 'submit' || e.closest('form')) return true;
    if (!CHU_GUI.test(tenNut(e))) return false;
    for (let p = e.parentElement, k = 0; p && p !== document.body && k < 4; p = p.parentElement, k++) {
      // khung có bảng dữ liệu = màn danh sách (nút trên thanh công cụ cạnh ô lọc), không phải form đang nhập
      if (p.querySelector('table tbody tr, [role=grid], [role=row]')) return false;
      const n = [...p.querySelectorAll(O_NHAP)].filter(x => vis(x) && !x.closest('[class*=filter],[class*=Filter],[role=search]')).length;
      if (n >= 2) return true;
    }
    return false;
  };
  const nutForm = root => { const tabs = new Set(tabCands()); return [...root.querySelectorAll('button,a,[role=button]')].filter(e => vis(e) && !inDialog(e) && !e.closest('table,[role=grid],nav') && ngoaiHeaderChung(e) && !trongMenu(e)
    && !tabs.has(e) && !laNutGuiForm(e) && (!laTabHayLink(e) || (nvOk() && laLinkNghiepVu(e))) && !khopNut(e, C.boQuaNut) && !khopNut(e, NAV_SKIP)
    && (khopNut(e, C.nutMoForm) && !khopNut(e, CAM_FORM)                       // nút mở form thông thường
      || (nvOk() && /\p{L}{2,}/u.test(tenNut(e)) && tenNut(e).length < 60))); };   // nút nghiệp vụ
  const DA_MO_FORM = new Set();
  // nút có trong bảng đặc tả đã nạp: luôn mở để đọc form (không tính vào maxFormMoiMan)
  const NUT_DACTA = new Set(docDacTa().flatMap(d => (d.buoc || []).map(b => b.nut).filter(Boolean)).map(norm));
  // ---- Ca nhập ô (TC …NHAP…) của bộ TC: chạy trong form vừa mở, chỉ gõ rồi rời ô, KHÔNG bấm Lưu, trả lại giá trị cũ ----
  const TC_NHAP = new Map(), TC_KQ = [], TC_DA = new Set();
  {
    for (const d of docDacTa()) {
      if (!Array.isArray(d.tc_nhap) || !d.tc_nhap.length) continue;
      const vaiTK = new Set((d.vai || []).filter(v => khopTK(TK, v.nhan_dang_nhap)).map(v => v.ma));
      if (!vaiTK.size) continue;
      const buoc = Object.fromEntries((d.buoc || []).map(b => [b.ma, b]));
      for (const c of d.tc_nhap) {
        const b = buoc[c.buoc]; if (!b || !(b.vai || []).some(v => vaiTK.has(v))) continue;
        const k = norm(b.nut || c.nut || ''); if (!TC_NHAP.has(k)) TC_NHAP.set(k, []);
        TC_NHAP.get(k).push(Object.assign({ quy_trinh: (d.dinh_danh || {}).ma_ben_b || (d.dinh_danh || {}).ma_qt, ten_buoc: b.ma + ' ' + (b.ten || '') }, c));
      }
    }
  }
  const hai = n => String(n).padStart(2, '0');
  const ngayGT = (i, d) => i.type === 'date' ? d.getFullYear() + '-' + hai(d.getMonth() + 1) + '-' + hai(d.getDate()) : hai(d.getDate()) + '/' + hai(d.getMonth() + 1) + '/' + d.getFullYear();
  function giaTriTC(i, g) {
    const nay = new Date();
    if (g === '@hom_nay') return ngayGT(i, nay);
    if (g === '@ngay_mai') return ngayGT(i, new Date(nay.getTime() + 864e5));
    if (g === '@ngay_sai') return i.type === 'date' ? nay.getFullYear() + '-02-31' : '31/02/' + nay.getFullYear();
    const m = /^@dai:(\d+)$/.exec(g || ''); if (m) return 'a'.repeat(+m[1]);
    const cs = /^@chu_so:(\d+)$/.exec(g || ''); if (cs) return '1234567890'.repeat(Math.ceil(+cs[1] / 10)).slice(0, +cs[1]);   // [S7]
    return g == null ? '' : String(g);
  }
  // gõ giá trị như người dùng: không phát phím Enter (Enter trong form có thể là gửi)
  function datGT(i, v) {
    try { i.focus(); } catch (x) {}
    const proto = i.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    try { Object.getOwnPropertyDescriptor(proto, 'value').set.call(i, v); } catch (x) { i.value = v; }
    i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true }));
    try { i.blur(); } catch (x) {} i.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  }
  const HOP_O = '.ant-form-item,.MuiFormControl-root,.MuiTextField-root,.el-form-item,.form-group,.v-input,.field,[class*=form-item],[class*=FormItem],[class*=form-field],[class*=FormField],[class*=form-row]';
  function docLoi(e, i) {
    const hop = i.closest(HOP_O) || (e.parentElement && e.parentElement.parentElement) || e;
    const nodes = [...hop.querySelectorAll('[class*=error],[class*=Error],[class*=invalid],[class*=explain],[class*=helper],[class*=Helper],[class*=feedback],[role=alert]')]
      .filter(x => !x.matches('input,select,textarea') && vis(x) && txt(x).trim());
    const vb = [...new Set(nodes.map(x => txt(x).trim()))].join(' | ').slice(0, 160);
    const aria = i.getAttribute('aria-invalid') === 'true' || /(^|\s)(has-error|is-invalid|Mui-error|ant-form-item-has-error|el-form-item--error|is-error|error)(\s|$)/.test(cls(hop));
    const tn = i.validity && !i.validity.valid ? ['valueMissing', 'typeMismatch', 'patternMismatch', 'tooLong', 'tooShort', 'rangeUnderflow', 'rangeOverflow', 'stepMismatch', 'badInput', 'customError'].filter(k => i.validity[k]) : [];
    return { vb, aria, tn };
  }
  async function chayTC(cont, man, nut) {
    const ds = TC_NHAP.get(norm(nut || '')); if (!ds || !cont || !cont.isConnected) return;
    const o = deepAll(cont, FIELD_SEL).map(e => ({ e, i: innerInput(e) || e })).filter(x => visField(x.e, x.i));
    const theoNhan = new Map(); for (const x of o) { const n = String(nhanTruong(x.e, x.i).t || '').replace(/\*/g, '').replace(/\s+/g, ' ').trim().toLowerCase(); if (n && !theoNhan.has(n)) theoNhan.set(n, x); }
    for (const c of ds) {
      if (TC_DA.has(c.ma)) continue;
      await kiemCo();
      const ghiKQ = (kq, dg) => { TC_DA.add(c.ma); TC_KQ.push({ ma: c.ma, quy_trinh: c.quy_trinh, muc: c.ten_buoc, truong: c.nhan, gia_tri: c.gia_tri, mong_doi: c.mong_doi, kq, dg, nguon: c.nguon, man }); };
      const x = theoNhan.get(String(c.nhan || '').replace(/\*/g, '').replace(/\s+/g, ' ').trim().toLowerCase());
      if (!x) { ghiKQ('CHƯA KIỂM', 'không thấy ô «' + c.nhan + '» trên form (có thể ở tab khác của form)'); continue; }
      const { e, i } = x;
      if (!/^(INPUT|TEXTAREA)$/.test(i.tagName) || /^(checkbox|radio|file|hidden|button|submit)$/i.test(i.type || '')) { ghiKQ('CHƯA KIỂM', 'ô «' + c.nhan + '» không phải ô gõ chữ (' + (i.type || i.tagName.toLowerCase()) + '): kiểm thủ công'); continue; }
      if (i.disabled || i.readOnly) { ghiKQ('CHƯA KIỂM', 'ô «' + c.nhan + '» đang khoá, không gõ được'); continue; }
      const goc = i.value, v = giaTriTC(i, c.gia_tri), l0 = docLoi(e, i);
      datGT(i, v); await settle(150);
      const sau = i.value, l1 = docLoi(e, i);
      const dau = [];
      if (v !== '' && sau === '' ) dau.push('ô không nhận giá trị gõ vào');
      else if (v !== '' && sau.length < v.length && v.startsWith(sau)) dau.push('ô cắt còn ' + sau.length + ' ký tự');
      if (l1.vb && l1.vb !== l0.vb) dau.push('báo lỗi: "' + l1.vb + '"');
      else if (l1.aria && !l0.aria) dau.push('ô được đánh dấu lỗi');
      if (l1.tn.length) dau.push('trình duyệt báo không hợp lệ (' + l1.tn.join(', ') + ')');
      const bao = dau.length > 0, lechTC = nguonDaDuyet(c.nguon) ? 'LỆCH' : 'CẢNH BÁO', hien = v === '' ? 'để trống' : '«' + (v.length > 30 ? v.slice(0, 12) + '…(' + v.length + ' ký tự)' : v) + '»';
      if (c.mong_doi === 'khong_hop_le') {
        if (bao) ghiKQ('ĐẠT', hien + ': ' + dau.join('; '));
        else if (v === '') ghiKQ(i.required ? 'ĐẠT' : 'CHƯA KIỂM', i.required ? 'ô có thuộc tính bắt buộc' : 'để trống, rời ô: không thấy báo lỗi. Ứng dụng có thể chỉ báo khi bấm Lưu; công cụ không bấm Lưu');
        else ghiKQ(lechTC, hien + ': ô nhận giá trị, rời ô không thấy báo lỗi');
      } else ghiKQ(bao ? lechTC : 'ĐẠT', hien + (bao ? ': giá trị hợp lệ nhưng ' + dau.join('; ') : ': ô nhận, không báo lỗi'));
      datGT(i, goc); await settle(80);
    }
  }
  // mid = null khi đang ở trang hồ sơ chi tiết (quay lại bằng lùi trang)
  async function moCacForm(mid, path, man) {
    if (!(C.kiemKeTruong && C.moFormDeKiemKe && chanGhi)) return;    // chỉ mở form khi đang chặn ghi
    await moBoLoc(man);
    const goc = GOC || man.split(' › ')[0];
    const trangGoc = location.href;
    const tatCaNut = [...new Set(nutForm(mainEl()).map(tenNut))].filter(t => !DA_MO_FORM.has(goc + '|' + norm(t)));
    const nuts = [...tatCaNut.filter(t => NUT_DACTA.has(norm(t))), ...tatCaNut.filter(t => !NUT_DACTA.has(norm(t))).slice(0, C.maxFormMoiMan)];
    for (const t of nuts) {
      await kiemCo();
      DA_MO_FORM.add(goc + '|' + norm(t));
      let e = nutForm(mainEl()).find(x => tenNut(x) === t);
      if (!e && location.href !== trangGoc) { if (mid) await restore(mid, path); else { try { history.back(); } catch (x) {} await settle(); } e = nutForm(mainEl()).find(x => tenNut(x) === t); }
      if (!e) continue;
      const laThuong = khopNut(e, C.nutMoForm) && !khopNut(e, CAM_FORM);
      const vungF = (laThuong ? 'form «' : 'form nghiệp vụ «') + t + '»';
      if (SAP_TEN.has(man + ' › ' + vungF)) { skipped.push({ man, chu: t, ly_do: 'lần trước form này làm ứng dụng báo lỗi / tải lại — bỏ qua' }); continue; }
      try { await moVaQuetForm(e, mid, path, man, vungF); }
      catch (x) { if (x === DUNG || x === SAP_MAN) throw x; skipped.push({ man, chu: t, ly_do: 'lỗi khi mở form: ' + x.message }); }
    }
  }

  // Nút "Lọc", "Lọc theo xã", "Trạng thái: …", "Diện" mở bảng lọc nổi → quét trường trong đó rồi đóng
  const LOC = /^(lọc|bộ lọc|lọc .{1,30}|diện|trạng thái: .{1,50}|tìm kiếm nâng cao|lọc nâng cao)$/i;
  const POP_MO = DIALOG_SEL + ',' + POPUP_SEL + ',[role=menu],[class*=popover],[class*=Popover],[class*=dropdown-menu],[class*=DropdownMenu],[data-radix-popper-content-wrapper],[class*=popper],[class*=Popper],[class*=filter-panel],[class*=FilterPanel]';
  const DA_MO_LOC = new Set();
  const LOC_COT = /^((\d+\s*)?cột( ẩn)?|\d+\s*cột ẩn|chọn cột|hiển thị cột)$/i;

  // Bấm nút mở bảng nổi; trả về khung bảng nổi (hoặc null nếu không thấy)
  async function moPop(e) {
    const truoc = new Set([...document.querySelectorAll(POP_MO)].filter(vis));
    const oTruoc = new Set(deepAll(document.body, FIELD_SEL).filter(x => visField(x, innerInput(x) || x)));
    e.click(); await settle(150);
    let pop = [...document.querySelectorAll(POP_MO)].filter(p => vis(p) && !truoc.has(p) && !trongMenu(p) && !p.closest('#' + PANEL)).pop();
    if (!pop) {
      // thư viện lạ: các ô mới hiện ra sau khi bấm → khung chung nhỏ nhất chứa chúng
      const moi = deepAll(document.body, FIELD_SEL).filter(x => !oTruoc.has(x) && visField(x, innerInput(x) || x) && !trongMenu(x) && !x.closest('#' + PANEL));
      if (moi.length) { let c = moi[0].parentElement; while (c && c !== document.body && !moi.every(x => c.contains(x))) c = c.parentElement; if (c && c !== document.body && !c.contains(mainEl())) pop = c; }
    }
    return pop || null;
  }
  async function dongPop(pop, e) {
    if (!pop || !pop.isConnected || !vis(pop)) return;
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
    await sleep(200);
    if (pop.isConnected && vis(pop) && e && e.isConnected) { e.click(); await sleep(200); }
  }
  // Các mục chọn trong bảng nổi — mỗi mục tính một lần (ô đánh dấu nằm trong nhãn, nhãn nằm trong mục menu…)
  const layMuc = pop => {
    const els = [...pop.querySelectorAll('input[type=checkbox],input[type=radio],[role=menuitemcheckbox],[role=menuitemradio],[role=menuitem],[role=option]')]
      .filter(x => vis(x) || vis(x.closest('label') || x.parentElement))
      .map(x => x.closest('[role=menuitemcheckbox],[role=menuitemradio],[role=menuitem],[role=option]') || x.closest('label') || x);
    const uniq = [...new Set(els)];
    return uniq.filter(a => !uniq.some(b => b !== a && b.contains(a)));
  };

  async function moBoLoc(man) {
    if (!C.kiemKeTruong || !C.moRongMuc) return;
    const lay = re => [...mainEl().querySelectorAll('button,[role=button]')].filter(e => vis(e) && !inDialog(e) && !trongMenu(e) && !e.closest('table,[role=grid]') && re.test(tenNut(e)));
    // 1) bảng lọc
    for (const t of [...new Set(lay(LOC).map(tenNut))].slice(0, 6)) {
      await kiemCo();
      const k = man + '|' + norm(t); if (DA_MO_LOC.has(k)) continue; DA_MO_LOC.add(k);
      const e = lay(LOC).find(x => tenNut(x) === t); if (!e) continue;
      const href0 = location.href;
      const pop = await moPop(e);
      if (pop) {
        // bảng lọc chỉ gồm các mục chọn → ghi thành MỘT trường lọc có danh sách lựa chọn
        const muc = layMuc(pop);
        const coONhap = pop.querySelector('input[type=text],input[type=search],input:not([type]),select,textarea,input[type=date]');
        if (muc.length >= 2 && !coONhap) {
          const ds = muc.map(x => txt(x)).filter(Boolean);
          const dup = ds.filter((x, i) => ds.indexOf(x) !== i);
          ghiTruong(mkTruong(man, 'bộ lọc', { nhan: t.replace(/:.*/, ''), nguon_nhan: 'chữ trên nút lọc', loai: 'chọn (bảng lọc)', so_lua_chon: ds.length, lua_chon: ds.slice(0, C.maxLuaChon).join('; ').slice(0, 800), gia_tri: /:/.test(t) ? t.split(':').slice(1).join(':').trim() : '', loi: [dup.length && 'lựa chọn trùng tên: ' + [...new Set(dup)].slice(0, 3).join(', '), strange(ds.join(' \n ')) && 'chữ lạ: ' + strange(ds.join(' \n '))].filter(Boolean).join(' | ') }), new Set());
        } else await quetVung(pop, man, 'bộ lọc «' + t + '»');
        await dongPop(pop, e);
      } else {
        await quetVung(mainEl(), man, null);    // bảng lọc mở ngay trên màn: chỉ thêm trường mới lộ ra
        if (location.href !== href0) { try { history.back(); } catch (x) {} await settle(); }
      }
    }
    // 2) bảng chọn cột: cột đang ẩn vẫn là trường của danh sách → ghi lại
    for (const t of [...new Set(lay(LOC_COT).map(tenNut))].slice(0, 2)) {
      await kiemCo();
      const k = man + '|cot|' + norm(t); if (DA_MO_LOC.has(k)) continue; DA_MO_LOC.add(k);
      const e = lay(LOC_COT).find(x => tenNut(x) === t); if (!e) continue;
      const pop = await moPop(e); if (!pop) continue;
      const local = new Set();
      for (const m of layMuc(pop)) {
        const inp = m.matches('input') ? m : m.querySelector('input[type=checkbox]');
        const dang = inp ? inp.checked : m.getAttribute('aria-checked') === 'true';
        const ten = txt(m).replace(/\s*trống ở trang này\s*$/i, '').trim();
        if (!ten) continue;
        ghiTruong(mkTruong(man, 'cột bảng', { nhan: ten, nguon_nhan: 'bảng chọn cột', loai: 'cột bảng', ghi_chu: dang ? 'đang hiện' : 'cột có sẵn nhưng đang ẩn' + (/trống ở trang này/i.test(txt(m)) ? ' (trống ở trang này)' : '') }), local);
      }
      await dongPop(pop, e);
    }
  }

  // Mở một hồ sơ cho MỖI trạng thái (theo nút lọc trạng thái có số đếm) — mỗi trạng thái có nút và form khác nhau
  const DEM = /^(.*?)\s+(\d[\d.]*)$/;
  const LOC_TT = /^(lọc|lọc trạng thái|trạng thái: .{1,50})$/i;
  const DA_TT = new Set();
  async function moHoSoTheoTrangThai(mid, path, man) {
    if (!C.kiemKeTruong || !C.moHoSoMoiTrangThai || !C.moHoSoDau) return;
    const nutLoc = () => [...mainEl().querySelectorAll('button,[role=button]')].find(e => vis(e) && !inDialog(e) && !trongMenu(e) && !e.closest('table,[role=grid]') && LOC_TT.test(tenNut(e)));
    let n = nutLoc(); if (!n) return;
    // cùng một danh sách (cùng đường dẫn) chỉ duyệt trạng thái một lần, dù đi tới từ menu hay từ tab
    const khoaTT = location.pathname + '|' + norm(tenNut(n));
    if (DA_TT.has(khoaTT)) return; DA_TT.add(khoaTT);
    let pop = await moPop(n); if (!pop) return;
    const opts = layMuc(pop).map(m => { const k = DEM.exec(txt(m)); return k ? { ten: k[1].trim(), dem: viNum(k[2]) } : null; })
      .filter(o => o && o.dem > 0 && !/^(toàn bộ|tất cả|mọi)/i.test(o.ten));
    await dongPop(pop, n);
    if (opts.length < 2) return;          // chỉ một trạng thái có dữ liệu: hồ sơ đầu đã đại diện
    for (const o of opts.slice(0, C.maxTrangThai)) {
      await kiemCo();
      await restore(mid, path);           // về danh sách gốc, bỏ lọc cũ
      n = nutLoc(); if (!n) break;
      pop = await moPop(n); if (!pop) break;
      const m = layMuc(pop).find(x => norm(txt(x)).startsWith(norm(o.ten)));
      if (!m) { await dongPop(pop, n); continue; }
      const inp = m.matches('input') ? m : m.querySelector('input');
      (inp || m).click(); await settle(300);
      await dongPop(pop, nutLoc());
      CO.tienDo = man + ' › trạng thái «' + o.ten + '»';
      try { await openFirstRow(mid, man + ' › «' + o.ten + '»', path); } catch (e) { if (e === DUNG || e === SAP_MAN) throw e; }
      // lọc kiểu đánh dấu nhiều lựa chọn: bỏ đánh dấu lại để lần sau không cộng dồn
      if (inp && inp.type === 'checkbox') {
        const n2 = nutLoc(); const p2 = n2 && await moPop(n2);
        const m2 = p2 && layMuc(p2).find(x => norm(txt(x)).startsWith(norm(o.ten)));
        const i2 = m2 && (m2.matches('input') ? m2 : m2.querySelector('input'));
        if (i2 && i2.checked) { i2.click(); await settle(200); }
        if (p2) await dongPop(p2, n2);
      }
    }
    await restore(mid, path);
  }

  /* --- 3.6: chế độ thăm dò — chỉ xem công cụ nhận ra cấu trúc thế nào, không bấm gì --- */
  if (C.__thamDo) {
    try {
      const rows = [], add = (muc, ket_qua, ok, goi_y) => rows.push({ '': ok ? '✔' : '⚠', muc, ket_qua, goi_y: ok ? '' : goi_y });
      const mo = e => !e ? '(không có)' : e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + ((e.getAttribute('class') || '').trim() ? '.' + e.getAttribute('class').trim().split(/\s+/).slice(0, 2).join('.') : '');
      const sb = side(), mucMenu = sb ? [...sb.querySelectorAll('a[href],[role=link],[role=menuitem]')].filter(vis) : [];
      add('Lá chắn', LC && LC.som ? 'có từ đầu trang (Tampermonkey)' : 'cài lúc dán Console', !!(LC && LC.som), 'Nút nghiệp vụ và tự chạy tiếp sẽ tắt; lệnh đi vòng (nếu có) được ghi lại');
      add('Thanh menu', sb ? mo(sb) + ' · ' + mucMenu.length + ' mục · vd: ' + mucMenu.slice(0, 4).map(txt).filter(Boolean).map(x => cut(x, 18)).join(', ') : '(không thấy)', !!sb && mucMenu.length >= 3, 'Công cụ sẽ không chạy được — báo lại để chỉnh cách dò menu');
      const m = mainEl(); add('Vùng chính', mo(m), m !== document.body, 'Đang dùng cả trang — menu/header có thể bị tính vào nội dung');
      const t = [...m.querySelectorAll('table')].filter(x => vis(x) && !inDialog(x)).sort((a, b) => b.rows.length - a.rows.length)[0];
      add('Bảng dữ liệu', t ? 'table · ' + t.querySelectorAll('tbody tr').length + ' dòng' : '(màn này không có)', true, '');
      const boxes = [...m.querySelectorAll('input[type=search],input[type=text],input:not([type])')].filter(e => vis(e) && /tìm|lọc|search|tra cứu|họ tên|mã|số/i.test(labelOf(e)));
      add('Ô tìm', boxes.length ? boxes.map(b => '"' + cut(labelOf(b), 30) + '"').join(', ') : '(màn này không có)', true, '');
      const tk = taiKhoan(); add('Tài khoản', tk || '(không nhận ra)', !!tk, 'Khai ita.dat({ dacTa: { vaiChon: "selector ô tên vai" } }) để kết quả tách đúng theo tài khoản');
      if (C.dacTa) add('Đặc tả quy trình', (C.dacTa.trangThai || []).length + ' trạng thái · ' + (C.dacTa.quyTac || []).length + ' quy tắc', true, '');
      add('Kiểm thiết kế / ngôn từ', (C.kiemThietKe ? 'bật' : 'tắt') + ' / ' + (C.kiemNgonTu ? 'bật' : 'tắt'), true, '');
      return rows;
    } finally { goHook(); }
  }

  /* --- chế độ quét tay: chỉ màn / hộp thoại đang mở, không duyệt menu --- */
  if (C.__chiManNay) {
    try {
      const dlg = topDialog();
      GOC = C.__tenMan || ('màn ' + location.pathname);
      await quetCoTab(() => (dlg && dlg.isConnected && vis(dlg)) ? dlg : mainEl(), GOC, dlg ? 'hộp thoại' : null);
    } finally { goHook(); }
    return TRUONG;
  }

  /* ---------- LỚP KIỂM QUY TRÌNH (chỉ đọc) ---------- */
  // Nhận ra vai đang đăng nhập
  function doccVai() {
    const d = C.dacTa; if (!d) return '';
    if (d.vaiChon) { const e = document.querySelector(d.vaiChon); if (e && vis(e)) return txt(e).slice(0, 60); }
    if (d.vaiText) { const m = (document.body.innerText || '').match(d.vaiText); if (m) return (m[1] || m[0]).trim().slice(0, 60); }
    return '';
  }
  // Trạng thái hồ sơ đang mở = từ khớp danh mục, ưu tiên chip/nhãn ngắn
  function doccTrangThai() {
    const d = C.dacTa; if (!d || !d.trangThai) return { tt: '', la: '' };
    const m = mainEl();
    const chips = [...m.querySelectorAll('[class*=status],[class*=Status],[class*=badge],[class*=tag],[class*=chip],[class*=label],[class*=state]')].filter(vis);
    for (const c of chips) { const t = txt(c); const hit = d.trangThai.find(s => norm(t) === norm(s) || norm(t).includes(norm(s))); if (hit) return { tt: hit, la: '' }; if (t && t.length < 24) { } }
    // không thấy trong chip: tìm trong toàn văn
    const text = m.innerText || '';
    const found = d.trangThai.find(s => new RegExp('(?<![\\p{L}])' + s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\p{L}])', 'iu').test(text));
    // phát hiện chip trạng thái mang chữ KHÔNG nằm trong danh mục
    let la = '';
    for (const c of chips) { const t = txt(c); if (t && t.length < 24 && /trạng thái|status/i.test((c.className || '') + ' ' + (c.previousElementSibling ? txt(c.previousElementSibling) : '')) && !d.trangThai.some(s => norm(t).includes(norm(s)))) { la = t; break; } }
    return { tt: found || '', la };
  }
  // Nút hành động đang hiện trong vùng chính (không bấm)
  function nutHanhDong() {
    return [...mainEl().querySelectorAll('button,a[href],[role=button]')]
      .filter(e => vis(e) && !inDialog(e) && SKIP.test(txt(e)) && txt(e).length < 30)
      .map(txt);
  }
  function kiemQuyTrinh(label) {
    const d = C.dacTa; if (!d) return null;
    const vai = doccVai(), st = doccTrangThai();
    const nut = nutHanhDong();
    const loi = [];
    if (st.la) loi.push('trạng thái "' + st.la + '" không có trong danh mục');
    if (d.quyTac && st.tt) {
      const ap = d.quyTac.filter(q => norm(q.trangThai) === norm(st.tt) && (!q.vai || (q.vai instanceof RegExp ? q.vai.test(vai) : norm(vai).includes(norm(q.vai)))));
      for (const q of ap) {
        for (const b of (q.phaiCo || [])) if (!nut.some(n => norm(n).includes(norm(b)))) loi.push('thiếu nút "' + b + '" (' + st.tt + (vai ? ' · ' + vai : '') + ')');
        for (const b of (q.khongDuocCo || [])) if (nut.some(n => norm(n).includes(norm(b)))) loi.push('⚠ thừa nút "' + b + '" — vai này ở trạng thái này không được làm (' + st.tt + (vai ? ' · ' + vai : '') + ')');
      }
      if (!ap.length && d.quyTac.some(q => norm(q.trangThai) === norm(st.tt))) loi.push('có quy tắc cho "' + st.tt + '" nhưng không khớp vai "' + vai + '"');
    }
    if (d.quaHan && d.quaHan.nhan) {
      const text = mainEl().innerText || '';
      if (/quá hạn|trễ hạn|chậm/i.test(text) && !d.quaHan.nhan.test(text)) loi.push('hồ sơ có dấu hiệu trễ hạn nhưng không thấy nhãn quá hạn');
    }
    return { vai, trangThai: st.tt, nut: nut.join(', '), loi: loi.join(' | ') };
  }

  /* ---------- kiểm một màn ---------- */
  async function audit(name, ms, coTab) {
    const main = mainEl(), text = main.innerText || '';
    const ae = apiErrs();
    const pct = [...new Set((text.match(/-?\d[\d.,]*\s?%/g) || []).filter(p => { const n = viNum(p); return n > 100 || n < 0; }))].slice(0, 4).join(', ');
    const nums = new Set();
    const walk = (o, d) => {
      if (d > 8 || o == null) return;
      if (typeof o === 'number') { nums.add(o); nums.add(Math.round(o)); }
      else if (typeof o === 'string' && /^-?\d+(\.\d+)?$/.test(o)) nums.add(+o);
      else if (Array.isArray(o)) { nums.add(o.length); o.slice(0, 500).forEach(x => walk(x, d + 1)); }
      else if (typeof o === 'object') Object.values(o).forEach(x => walk(x, d + 1));
    };
    LOG.forEach(l => walk(l.j, 0));
    const big = [...main.querySelectorAll('*')].filter(e => e.children.length === 0 && vis(e) && /^-?[\d.,]+$/.test(txt(e)) && parseFloat(getComputedStyle(e).fontSize) >= 22);
    const labOf = e => { let p = e.parentElement; for (let i = 0; p && p !== main && i < 4; p = p.parentElement, i++) { const t = txt(p); if (t.length > txt(e).length + 2) return t.slice(0, 45); } return ''; };
    const lech = big.map(e => ({ v: txt(e), n: viNum(txt(e)), lab: labOf(e) })).filter(k => !isNaN(k.n) && k.n >= 10 && LOG.length && !nums.has(k.n));
    const charts = [...main.querySelectorAll('svg')].filter(s => vis(s) && s.getBoundingClientRect().width > 80 && s.querySelectorAll('path,rect,circle').length >= 2);
    const chartClick = charts.filter(s => [...s.querySelectorAll('path,rect,circle')].some(pointer) || [...(s.parentElement.parentElement || s.parentElement).querySelectorAll('li,[class*=legend] *')].some(pointer)).length;
    const overflowTitles = [...main.querySelectorAll('h1,h2,h3,[class*=title]')].filter(e => vis(e) && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible').map(txt).slice(0, 3);
    const noLabel = [...main.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,textarea')].filter(e => vis(e) && !inDialog(e) && !(e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.title || (e.id && document.querySelector('label[for="' + CSS.escape(e.id) + '"]')) || e.closest('label')));
    const out = output();
    const qt = kiemQuyTrinh(name);
    VISITED.add(location.pathname + location.search);
    // kiểm kê trường của màn (hoặc hộp thoại đang mở); coTab = quét cả tab con trong hồ sơ
    let soTruong = '', loiTruong = '';
    if (C.kiemKeTruong) {
      try {
        const n0 = TRUONG.length, dlg = topDialog();
        const layCont = () => (dlg && dlg.isConnected && vis(dlg)) ? dlg : mainEl();
        if (coTab || dlg) await quetCoTab(layCont, name, dlg ? 'hộp thoại' : null); else await quetVung(mainEl(), name, null);
        const moi = TRUONG.slice(n0); soTruong = moi.length || ''; loiTruong = moi.filter(f => f.loi).length || '';
      } catch (e) { if (e === DUNG || e === SAP_MAN) throw e; }
    }
    // dữ liệu nhạy cảm hiện trên màn (ghi bản đã che)
    const ncam = timNhayCam(text);
    let them36 = { r: {}, tp: {} }; try { them36 = kiemThem(name, text); } catch (e) {}   // 3.6
    res.push(Object.assign({
      tab: name, url: location.pathname + location.search, tai_ms: ms, api: LOG.length,
      du_lieu_nhay_cam: ncam.map(x => x.loai + ' «' + cheMot(x.mau) + '»' + (x.so > 1 ? ' ×' + x.so : '')).join(' | '),
      api_loi: ae.slice(0, 4).join(' | '),
      api_cham: LOG.filter(l => l.ms > C.slowMs).map(l => Math.round(l.ms) + 'ms ' + l.u.replace(location.origin, '').split('?')[0].slice(0, 50)).slice(0, 3).join(' | '),
      chan_ghi: BLOCK.splice(0).slice(0, 3).join(' | '),
      js_loi: ERR.slice(0, 2).join(' | ').slice(0, 220),
      chu_la: strange(text), phan_tram_vo_ly: pct,
      rong_nhung_api_loi: ae.length && out.empty ? 'Hiện "trống" trong khi API lỗi' : '',
      van_dang_tai: isLoading() ? 'Có' : '',
      tran_ngang: document.documentElement.scrollWidth > innerWidth + 2 ? (document.documentElement.scrollWidth - innerWidth) + 'px' : '',
      tieu_de_bi_cat: overflowTitles.join(' | '),
      o_khong_nhan: noLabel.length ? noLabel.length + ' ô: ' + noLabel.slice(0, 3).map(e => e.placeholder || e.name || e.tagName.toLowerCase()).join(', ') : '',
      bieu_do: charts.length ? chartClick + '/' + charts.length + ' bấm được' : '',
      so_dong: out.rows || '',
      so_dong_vuot_tong: (out.total != null && out.rows > out.total) ? out.rows + ' > ' + out.total : '',
      // SỬA LỖI 6: đổi tên, hạ xuống "nghi ngờ", không tính là lỗi nặng
      nghi_ngo_so_lech: lech.map(k => k.lab + ' = ' + k.v).slice(0, 5).join(' | ').slice(0, 260),
      // lớp quy trình
      quy_trinh_vai: qt ? qt.vai : '',
      quy_trinh_trang_thai: qt ? qt.trangThai : '',
      quy_trinh_loi: qt ? qt.loi : '',
      // kiểm kê trường
      so_truong: soTruong,
      truong_loi: loiTruong ? loiTruong + ' trường có lỗi (xem danh mục trường)' : '',
      // các nút đang hiện trên màn — để biết vì sao form không được mở (tên nút khác dự kiến, hoặc vai không có quyền)
      nut_tren_man: [...new Set([...mainEl().querySelectorAll('button,[role=button],a[class*=btn],a[class*=button]')]
        .filter(e => vis(e) && !inDialog(e) && !trongMenu(e) && !e.closest('table,[role=grid],nav')).map(tenNut).filter(x => x && x.length < 40))].slice(0, 20).join(' · '),
    }, them36.r));
    Object.defineProperty(res[res.length - 1], '__tp', { value: them36.tp, enumerable: false });   // 3.6: thành phần — để gom theo mẫu lỗi
    if (window.__itaShot) { try { res[res.length - 1].anh = await window.__itaShot(name); } catch (e) {} }
  }

  /* ---------- tìm tab con ---------- */
  const TABCLS = /(^|[\s_-])(tabs?|tab-?(bar|list|nav|group|s)|segment(ed)?(-?control)?|chips?|pills?|filter-?(bar|chips|tabs|group)|toggle-?group|btn-group|button-group|sub-?nav|subnav)([\s_-]|$)/i;
  function tabCands() {
    const m = mainEl(), set = new Set();
    m.querySelectorAll('[role=tab],[aria-pressed],[role=tablist] a,[role=tablist] button').forEach(e => set.add(e));
    m.querySelectorAll('[class]').forEach(c => { if (TABCLS.test(cls(c))) c.querySelectorAll(':scope > a, :scope > button, :scope > [role=button], :scope > li > a, :scope > li > button, :scope > div > a, :scope > div > button').forEach(e => set.add(e)); });
    m.querySelectorAll('a[href]').forEach(a => { let u; try { u = new URL(a.href, location.href); } catch (e) { return; } if (u.origin !== location.origin || a.closest('table,[role=grid],[role=row],[role=rowgroup]')) return; if ((u.pathname === location.pathname && u.search !== location.search) || u.pathname.startsWith(location.pathname.replace(/\/$/, '') + '/')) set.add(a); });
    m.querySelectorAll('button').forEach(b => { if (/\s\d[\d.]*$/.test(txt(b)) && b.parentElement.querySelectorAll(':scope > button').length >= 2) set.add(b); });
    return [...set].filter(e => vis(e) && !inDialog(e) && !e.closest('table,thead,[role=grid]'));
  }
  const keyOf = e => txt(e) + '|' + (e.getAttribute('href') || '');
  const findCand = k => tabCands().find(e => keyOf(e) === k);

  /* ---------- menu — SỬA LỖI 3: định danh theo đường dẫn, không theo chữ ---------- */
  const sb = side();
  if (!sb) throw new Error('Không tìm thấy thanh menu bên trái');
  const expandAll = async () => { for (let k = 0; k < 3; k++) { const closed = [...side().querySelectorAll('[aria-expanded=false]')].filter(vis); if (!closed.length) break; for (const g of closed) { try { g.click(); } catch (e) {} await sleep(120); } } };
  await expandAll();
  const MENU_SEL = 'a[href],[role=link],[role=menuitem],button,[class*=nav-item],[class*=menu-item],li';

  // Gắn mã định danh cho từng mục menu, kèm tên nhóm cha (để phân biệt mục trùng tên)
  const menuItems = [];
  (function chuanBiMenu() {
    let cand = [...side().querySelectorAll('a[href]')];
    if (cand.length < 3) cand = [...side().querySelectorAll(MENU_SEL)].filter(e => !e.querySelector('a,button,[role=menuitem]') || e.matches('a,button'));
    const seen = new Set(); let id = 0;
    for (const e of cand) {
      const t = txt(e).replace(/\s\d+$/, '');
      if (!t || t.length > 60 || NAV_SKIP.test(t) || e.getAttribute('aria-expanded') !== null) continue;
      if (C.chiMenu && !C.chiMenu.test(t)) continue; if (C.boQuaMenu && C.boQuaMenu.test(t)) continue;
      // tên nhóm cha gần nhất (nếu menu có nhóm)
      let nhom = ''; for (let p = e.parentElement, i = 0; p && p !== side() && i < 6; p = p.parentElement, i++) { const h = p.querySelector(':scope > [aria-expanded], :scope > .group-title, :scope > [class*=group], :scope > [class*=heading]'); if (h && h !== e) { nhom = txt(h).replace(/\s\d+$/, '').replace(/\s*của tôi\s*$/i, '').trim(); break; } }   // [S1] bỏ nhãn động
      const ten = nhom && nhom !== t ? nhom + ' › ' + t : t;
      const key = (e.getAttribute('href') || '') + '|' + ten;
      if (seen.has(key)) continue; seen.add(key);
      const mid = 'm' + (id++); try { e.dataset.itaMenu = mid; } catch (x) {}
      menuItems.push({ mid, ten, href: e.getAttribute('href') || '' });
    }
  })();
  const findByMid = mid => side().querySelector('[data-ita-menu="' + mid + '"]') || document.querySelector('[data-ita-menu="' + mid + '"]');
  async function openMenu(mid) {
    let it = findByMid(mid); if (!it) { await expandAll(); it = findByMid(mid); } if (!it) return false;
    it.scrollIntoView({ block: 'center' }); nk('mở menu', txt(it).slice(0, 80)); it.click();
    // ứng dụng hỏi "rời trang khi chưa lưu?" (do form vừa mở để kiểm kê) → đồng ý rời, không lưu
    await sleep(200);
    const d = topDialog();
    if (d && txt(d).length < 300 && /rời|thoát|chưa lưu|không lưu|thay đổi/i.test(txt(d))) {
      const ok = [...d.querySelectorAll('button')].filter(vis).find(b => /^(đồng ý|có|ok|rời đi|thoát|bỏ thay đổi|không lưu|yes)$/i.test(txt(b)));
      if (ok) { ok.click(); await sleep(250); }
    }
    return true;
  }
  async function restore(mid, path) { if (!(await openMenu(mid))) return false; await settle(); for (const k of path) { const e = findCand(k); if (!e) return false; e.click(); await settle(); } return true; }

  /* ---------- duyệt tab nhiều tầng ---------- */
  async function explore(mid, path, label, depth, known) {
    const here = tabCands(); const keys = [];
    for (const e of here) {
      const k = keyOf(e), t = txt(e);
      if (known.has(k)) continue; known.add(k);
      if (!t || t.length > 50) continue;
      // bản 3.5: link không còn được miễn; chỉ tab trạng thái ("Đã huỷ 2", role=tab…) được vào dù có chữ hành động
      const laTabTT = e.matches('[role=tab]') || !!e.closest('[role=tablist]') || /^(đã|chờ|đang|chưa|quá hạn|sắp|hết|bị|tất cả)(\s|$)/i.test(canon(t)) || /\s\d[\d.]*$/.test(t);
      if (NAV_SKIP.test(t)) { skipped.push({ man: label, chu: t, ly_do: 'đăng xuất' }); continue; }
      if (duongHanhDong(e)) { skipped.push({ man: label, chu: t, ly_do: 'đường dẫn hành động' }); continue; }
      if (SKIP.test(t) && !laTabTT) { skipped.push({ man: label, chu: t, ly_do: 'nút/link hành động' }); continue; }
      const href = e.getAttribute('href'); if (href) { try { const u = new URL(href, location.href); if (VISITED.has(u.pathname + u.search)) continue; } catch (x) {} }
      if (e.getAttribute('aria-selected') === 'true' || e.getAttribute('aria-pressed') === 'true' || e.getAttribute('aria-current')) continue;
      keys.push(k);
    }
    if (keys.length > C.maxTabMoiMan) keys.splice(C.maxTabMoiMan).forEach(k => skipped.push({ man: label, chu: k.split('|')[0], ly_do: 'vượt maxTabMoiMan' }));
    for (const k of keys) {
      let e = findCand(k);
      if (!e) { await restore(mid, path); e = findCand(k); }
      if (!e) { skipped.push({ man: label, chu: k.split('|')[0], ly_do: 'không tìm lại được' }); continue; }
      const t0 = k.split('|')[0], hf = k.split('|')[1];
      const name = label + ' › ' + (/^(xem|xem danh sách|xem tất cả|chi tiết)$/i.test(t0) && hf ? t0 + ' (' + hf.replace(/^\/dqtv/, '') + ')' : t0);
      if (SAP_TEN.has(name) || (hf && SAP_TUYEN.has(chuanTuyen(hf)))) { const sx = SAP.find(x => x.man === name || x.duong_dan === chuanTuyen(hf)) || {}; skipped.push({ man: label, chu: t0, ly_do: 'màn sập ở lần trước (' + (sx.duong_dan || '') + ')' + (sx.loi_da_biet ? ' — LỖI ĐÃ BIẾT ' + sx.loi_da_biet.ma : '') + ' — bỏ qua' }); continue; }
      HIENTAI = name;
      resetLog(); nk('mở tab', name); e.click(); const ms = await settle(); await audit(name, ms); CO.tienDo = name;
      await closeDialog();
      await moCacForm(mid, [...path, k], name);   // form riêng của tab (nếu có)
      // mở hồ sơ đầu của tab (tab "Chờ duyệt 3", "Bị trả lại 1"… có nút và form khác tab chính); bỏ tab đếm 0
      if (C.kiemKeTruong && C.moHoSoMoiTrangThai && C.moHoSoDau && !/\s0$/.test(t0)) {
        try { await openFirstRow(mid, name, [...path, k]); } catch (x) { if (x === DUNG || x === SAP_MAN) throw x; }
        // tab có nút lọc trạng thái riêng (vd "Vụ việc ứng phó", "Văn bản đi"): mở thêm hồ sơ theo từng trạng thái
        try { await moHoSoTheoTrangThai(mid, [...path, k], name); } catch (x) { if (x === DUNG || x === SAP_MAN) throw x; }
      }
      if (depth < C.doSauTab) await explore(mid, [...path, k], name, depth + 1, known);
    }
  }
  async function closeDialog() { if (topDialog()) await dongForm(location.href, null, []); }

  /* ---------- mở hồ sơ đầu tiên — SỬA LỖI 4: quay lại bằng restore, không history.back ---------- */
  // path: chuỗi tab để trở lại đúng danh sách (mở hồ sơ ở từng tab / từng trạng thái)
  // Cột trạng thái của danh sách (Trạng thái / Tình trạng / Chặng): dùng để mở thêm một hồ sơ cho mỗi trạng thái khi màn không có nút lọc trạng thái
  const COT_TT = /^(trạng thái|tình trạng|chặng|trạng thái hồ sơ)$/i;
  const bangChinh = () => [...mainEl().querySelectorAll('table')].filter(x => vis(x) && !inDialog(x)).sort((a, b) => b.rows.length - a.rows.length)[0];
  const cotTT = t => { if (!t) return -1; const th = [...t.querySelectorAll('thead th, thead td')]; return th.findIndex(x => COT_TT.test(txt(x).trim())); };
  // chỉ lấy dòng đầu của ô (ô trạng thái hay có thêm dòng loại hồ sơ bên dưới: "Đã nộp đơn / Ốm đau")
  const ttDong = (r, i) => { if (i < 0 || !r.cells[i]) return ''; const c = r.cells[i]; const t = String(c.innerText || c.textContent || '').split(/\n/).map(x => x.trim()).filter(Boolean)[0] || ''; return t.replace(/\s+/g, ' ').slice(0, 60); };
  async function openFirstRow(mid, label, path = [], chiTT = null) {
    const layDong = () => {
      const t = bangChinh();
      const ds = t ? [...t.querySelectorAll('tbody tr')].filter(r => vis(r) && r.cells.length > 1) : [];
      if (chiTT == null) return ds[0];
      const i = cotTT(t); return ds.find(r => ttDong(r, i) === chiTT);
    };
    let row = layDong();
    if (!row) return;
    // ghi trạng thái của hồ sơ vào tên màn («…»), để đối chiếu đặc tả biết hồ sơ đang ở chặng nào
    const iTT = cotTT(bangChinh()), ttRow = ttDong(row, iTT);
    const labelGoc = label;
    if (ttRow && !/«[^»]+»$/.test(label)) label = label + ' › «' + ttRow + '»';
    // form Sửa của dòng đầu (thường có trường khác form Thêm mới và có giá trị điền sẵn)
    if (C.kiemKeTruong && C.moFormDeKiemKe && chanGhi) {
      const sua = [...row.querySelectorAll('button,a,[role=button],[title],[aria-label]')].find(e => vis(e) && khopNut(e, /^(sửa|chỉnh sửa|cập nhật|sửa thông tin|edit)$/i));
      if (sua) {
        try { await moVaQuetForm(sua, mid, path, label, 'form «' + tenNut(sua) + '» dòng đầu'); } catch (e) { if (e === DUNG || e === SAP_MAN) throw e; }
        row = layDong(); if (!row) { await restore(mid, path); row = layDong(); }
        if (!row) return;
      }
    }
    const link = [...row.querySelectorAll('a[href]')].find(a => !SKIP.test(txt(a)) && !duongHanhDong(a));
    const target = link || (pointer(row.cells[0]) || pointer(row) ? (row.cells[1] || row.cells[0]) : null);
    if (!target) return;
    if (SAP_TEN.has(label + ' › [hồ sơ đầu]')) { skipped.push({ man: label, chu: '[hồ sơ đầu]', ly_do: 'lần trước hồ sơ này làm ứng dụng báo lỗi / tải lại — bỏ qua' }); return; }
    HIENTAI = label + ' › [hồ sơ đầu]';
    const before = location.href; resetLog(); nk('mở hồ sơ', label + ' — ' + txt(target).slice(0, 60)); target.click(); const ms = await settle();
    if (location.href === before && !topDialog()) return;
    await audit(label + ' › [hồ sơ đầu]', ms, true); CO.tienDo = label + ' › [hồ sơ đầu]';   // true: quét cả các tab trong hồ sơ
    // nút trên trang hồ sơ (Sửa thông tin…, Ghi nhận…, Phê duyệt, Trả lại…) — mở form từng bước rồi đóng
    if (location.href !== before && !topDialog()) { try { await moCacForm(null, [], label + ' › [hồ sơ đầu]'); } catch (e) { if (e === DUNG || e === SAP_MAN) throw e; } }
    await closeDialog();
    // về lại danh sách: lùi một bước (giữ bộ lọc đang chọn); không được thì mở lại bằng menu + tab
    if (location.href !== before) { try { history.back(); } catch (x) {} await settle(); }
    if (location.href !== before) await restore(mid, path);
    // danh sách có cột trạng thái mà không có nút lọc trạng thái: mở thêm một hồ sơ cho mỗi trạng thái khác (tối đa maxTrangThai)
    // màn có nút lọc trạng thái thì moHoSoTheoTrangThai đã mở theo từng trạng thái: không mở lặp
    const coLocTT = [...mainEl().querySelectorAll('button,[role=button]')].some(e => vis(e) && !inDialog(e) && !trongMenu(e) && LOC_TT.test(tenNut(e)));
    if (chiTT == null && iTT >= 0 && C.moHoSoMoiTrangThai && !coLocTT && !/«[^»]+»$/.test(labelGoc)) {
      const t = bangChinh(), i = cotTT(t);
      const cacTT = [...new Set((t ? [...t.querySelectorAll('tbody tr')] : []).filter(r => vis(r) && r.cells.length > 1).map(r => ttDong(r, i)).filter(Boolean))]
        .filter(x => x !== ttRow).slice(0, Math.max(0, (C.maxTrangThai || 6) - 1));
      for (const st of cacTT) {
        await kiemCo();
        CO.tienDo = labelGoc + ' › hồ sơ «' + st + '»';
        try { await openFirstRow(mid, labelGoc + ' › «' + st + '»', path, st); } catch (e) { if (e === DUNG || e === SAP_MAN) throw e; }
      }
    }
  }

  /* ---------- thử ô nhập / ô chọn ---------- */
  async function tryInputs(label) {
    const m = mainEl();
    const boxes = [...m.querySelectorAll('input[type=search],input[type=text],input:not([type])')].filter(e => vis(e) && !inDialog(e) && !e.readOnly && !e.disabled && /tìm|lọc|search|tra cứu|họ tên|mã|số/i.test(labelOf(e)));
    if (C.thuOTim) for (const box of boxes.slice(0, 2)) {
      const lab = labelOf(box).slice(0, 40), orig = box.value; const base = output(); const got = {};
      const vals = [...C.giaTriTim];
      if (C.thuBaoMat) vals.push({ giaTri: '"><img src=x onerror="window.__itaXss=1">', ten: 'XSS', xss: true }, { giaTri: "' OR '1'='1", ten: 'SQL' }, { giaTri: 'a'.repeat(600), ten: 'chuỗi rất dài' });
      for (const v of vals) {
        await kiemCo();
        resetLog(); window.__itaXss = 0;
        setVal(box, v.giaTri); const ms = await settle(900); const o = output();
        const loi = [];
        if (apiErrs().length) loi.push('API lỗi: ' + apiErrs()[0]);
        if (ERR.length) loi.push('JS lỗi: ' + ERR[0].slice(0, 80));
        { const truoc = new Set(strange(base.text).split(', ')); const s = strange(o.text).split(', ').filter(x => x && !truoc.has(x)).join(', '); if (s) loi.push('chữ lạ: ' + s); }   // 3.6: chỉ chữ lạ MỚI
        if (v.phaiRong && o.rows > 0) loi.push('chuỗi không tồn tại vẫn ra ' + o.rows + ' dòng' + (o.rows === base.rows ? ' (danh sách không lọc)' : ''));
        if (v.phaiRong && o.rows === 0 && !o.empty) loi.push('0 dòng nhưng không có thông báo trống');
        if (v.phaiRaNhuCoDau) { const ref = got[v.phaiRaNhuCoDau]; if (ref && ref.rows > 0 && o.rows === 0) loi.push('ra 0 dòng trong khi "' + v.phaiRaNhuCoDau + '" ra ' + ref.rows); }
        if (!v.phaiRong && !v.xss && o.rows > 0 && v.giaTri.trim().length > 2 && !v.phaiRaNhuCoDau && !o.rowText.some(r => norm(r).includes(norm(v.giaTri)))) loi.push('không dòng nào chứa từ khoá (có thể tìm theo cột ẩn)');
        // 3.6: kiểm chặt hơn — từng dòng, và nội dung màn trước/sau
        if (v.phaiRaNhuCoDau) { const ref = got[v.phaiRaNhuCoDau]; if (ref && ref.rows > 0 && o.rows > 0 && (o.rows !== ref.rows || (o.total != null && ref.total != null && o.total !== ref.total))) loi.push('ra ' + o.rows + ' dòng, khác "' + v.phaiRaNhuCoDau + '" (' + ref.rows + ' dòng)'); }
        if (!v.phaiRong && !v.xss && v.ten !== 'SQL' && v.ten !== 'chuỗi rất dài' && o.rows > 0 && v.giaTri.trim().length > 2) {
          const kw = norm(v.giaTri), khongChua = o.rowText.filter(t => !norm(t).includes(kw)).length;
          if (khongChua && khongChua < o.rowText.length) loi.push('[cần xác nhận] ' + khongChua + '/' + o.rowText.length + ' dòng không chứa từ khoá (có thể tìm theo cột khác)');
          if (o.sig === base.sig) loi.push('[cần xác nhận] nội dung màn giống hệt lúc chưa tìm — ô tìm có thể không lọc');
        }
        if (v.xss && (window.__itaXss || m.querySelector('img[src="x"]'))) loi.push('⚠ XSS: chuỗi gõ vào được chạy như HTML');
        if (v.ten === 'SQL' && apiErrs().some(a => /^5/.test(a))) loi.push('⚠ máy chủ lỗi 5xx với dấu nháy — kiểm tra xử lý đầu vào');
        got[v.giaTri] = o;
        inputs.push({ man: label, o: lab, loai: 'tìm · ' + v.ten, gia_tri: v.giaTri.slice(0, 40), so_dong_truoc: base.rows, so_dong_sau: o.rows, tong_ghi: o.total, ms, loi: loi.join(' | ') });
      }
      setVal(box, orig); await settle(500);
    }
    if (C.thuOChon > 0) for (const sel of [...m.querySelectorAll('select')].filter(e => vis(e) && !inDialog(e) && !e.disabled).slice(0, 4)) {
      const lab = labelOf(sel).slice(0, 40) || 'ô chọn', orig = sel.value, base = output();
      const opts = [...sel.options].filter(o => o.value !== orig && !o.disabled).slice(0, C.thuOChon);
      let khongDoi = 0;   // 3.6
      for (const op of opts) {
        await kiemCo();
        resetLog(); setVal(sel, op.value); const ms = await settle(400); const o = output();
        const loi = [];
        if (apiErrs().length) loi.push('API lỗi: ' + apiErrs()[0]);
        if (ERR.length) loi.push('JS lỗi: ' + ERR[0].slice(0, 80));
        { const truoc = new Set(strange(base.text).split(', ')); const s = strange(o.text).split(', ').filter(x => x && !truoc.has(x)).join(', '); if (s) loi.push('chữ lạ: ' + s); }   // 3.6: chỉ chữ lạ MỚI
        if (o.sig === base.sig) khongDoi++;
        if (o.rows === 0 && !o.empty && base.rows > 0) loi.push('0 dòng nhưng không có thông báo trống');
        if (o.total != null && o.rows > o.total) loi.push('số dòng (' + o.rows + ') lớn hơn tổng ghi (' + o.total + ')');
        inputs.push({ man: label, o: lab, loai: 'chọn', gia_tri: txt(op).slice(0, 40), so_dong_truoc: base.rows, so_dong_sau: o.rows, tong_ghi: o.total, ms, loi: loi.join(' | ') });
      }
      // 3.6: mọi lựa chọn đều không làm màn đổi → bộ lọc có thể không có tác dụng (gộp 1 dòng cho cả ô)
      if (opts.length >= 2 && khongDoi === opts.length) inputs.push({ man: label, o: lab, loai: 'chọn · tổng hợp', gia_tri: opts.map(txt).slice(0, 4).join(', '), so_dong_truoc: base.rows, so_dong_sau: base.rows, tong_ghi: base.total, ms: 0,
        loi: '[cần xác nhận] thử ' + opts.length + ' lựa chọn, nội dung màn không đổi lần nào — bộ lọc có thể không có tác dụng' });
      setVal(sel, orig); await settle(300);
    }
  }

  /* ---------- kịch bản (mức 2) ---------- */
  const findField = (name, tag) => { const n = norm(name); return [...mainEl().querySelectorAll(tag)].filter(vis).find(e => norm(labelOf(e)).includes(n)); };
  const match = (re, s) => re instanceof RegExp ? re.test(s) : String(s).toLowerCase().includes(String(re).toLowerCase());
  async function runScenario(k) {
    const r = { man: k.man, buoc: [] };
    const mi = menuItems.find(x => x.ten === k.man || x.ten.endsWith('› ' + k.man));
    if (!mi || !(await openMenu(mi.mid))) { r.buoc.push({ buoc: 'mở ' + k.man, ok: false, ghi_chu: 'không thấy mục menu' }); scen.push(r); return; }
    resetLog(); await settle();
    for (const b of k.buoc) {
      const st = { buoc: JSON.stringify(b).slice(0, 120), ok: true, ghi_chu: '' };
      try {
        if (b.nhap) { const e = findField(b.nhap, 'input,textarea'); if (!e) throw new Error('không thấy ô "' + b.nhap + '"'); setVal(e, b.giaTri); await settle(700); }
        else if (b.chon) { const e = findField(b.chon, 'select'); if (!e) throw new Error('không thấy ô chọn "' + b.chon + '"'); const op = [...e.options].find(o => norm(txt(o)).includes(norm(b.giaTri))); if (!op) throw new Error('không có lựa chọn "' + b.giaTri + '"'); setVal(e, op.value); await settle(400); }
        else if (b.bam) { if (SKIP.test(b.bam) && !b.choPhep) throw new Error('nút hành động bị cấm bấm (thêm choPhep:true nếu chắc)'); const e = [...mainEl().querySelectorAll('a,button,[role=tab],[role=button]')].find(x => vis(x) && norm(txt(x)).startsWith(norm(b.bam))); if (!e) throw new Error('không thấy "' + b.bam + '"'); e.click(); await settle(); }
        else if (b.cho) await sleep(b.cho);
        if (b.kiemTra) {
          const q = b.kiemTra, o = output(), bad = [];
          if (q.coChu && !match(q.coChu, o.text)) bad.push('thiếu chữ ' + q.coChu);
          if (q.khongCoChu && match(q.khongCoChu, o.text)) bad.push('có chữ ' + q.khongCoChu);
          if (q.soDongToiThieu != null && o.rows < q.soDongToiThieu) bad.push('chỉ ' + o.rows + ' dòng < ' + q.soDongToiThieu);
          if (q.soDongToiDa != null && o.rows > q.soDongToiDa) bad.push(o.rows + ' dòng > ' + q.soDongToiDa);
          if (q.moiDongChua) { const lech = o.rowText.filter(t => !norm(t).includes(norm(q.moiDongChua))); if (lech.length) bad.push(lech.length + ' dòng không chứa "' + q.moiDongChua + '"'); }
          if (q.trangThai) { const st2 = doccTrangThai(); if (norm(st2.tt) !== norm(q.trangThai)) bad.push('trạng thái là "' + st2.tt + '", mong đợi "' + q.trangThai + '"'); }
          if (q.apiKhongLoi && apiErrs().length) bad.push('API lỗi: ' + apiErrs()[0]);
          if (q.url && !match(q.url, location.href)) bad.push('URL không khớp: ' + location.pathname + location.search);
          st.ghi_chu = bad.join(' | ') || ('OK — ' + o.rows + ' dòng'); st.ok = !bad.length;
        }
      } catch (e) { st.ok = false; st.ghi_chu = e.message; }
      r.buoc.push(st); if (!st.ok && !b.kiemTra) break;
    }
    scen.push(r);
  }

  /* ---------- chạy ---------- */
  const tStart = Date.now();
  let danhSach = menuItems.slice();
  if (trangThaiTiep && trangThaiTiep.chiLoi) {   // chayLaiLoi: chỉ các màn có lỗi lần trước
    const tenLoi = new Set(trangThaiTiep.chiLoi);
    danhSach = menuItems.filter(mi => [...tenLoi].some(t => t === mi.ten || t.startsWith(mi.ten + ' ›')));
    res.length = 0; // chạy lại thì thay kết quả cũ
  }
  console.log('%c[ita] Bắt đầu: ' + danhSach.length + ' mục menu', 'color:#b00;font-weight:bold');
  if (choGhiMoiTruong) console.log('%c[ita] MỞ GHI: ' + host + ' nằm trong moiTruongKiemThu, mức ' + C.mucQuyTrinh, 'color:#b60;font-weight:bold');

  let idx = 0, dungGiuaChung = false;
  try {
    for (const mi of (C.chiChayKichBan ? [] : danhSach)) {
      if (DA_XONG.has(mi.ten)) { idx++; continue; }
      const tuyenMi = mi.href ? chuanTuyen(mi.href) : '';
      if (SAP_TEN.has(mi.ten) || (tuyenMi && SAP_TUYEN.has(tuyenMi))) { idx++; const sx = SAP.find(x => x.man === mi.ten || x.duong_dan === tuyenMi) || {}; missing.push(mi.ten + ' (bỏ qua: màn sập ' + (sx.duong_dan || '') + (sx.loi_da_biet ? ' — LỖI ĐÃ BIẾT ' + sx.loi_da_biet.ma + (sx.loi_da_biet.yc ? '/' + sx.loi_da_biet.yc : '') : '') + ')'); DA_XONG.add(mi.ten); continue; }
      GOC = mi.ten; DANG = mi.ten; HIENTAI = mi.ten; luuCkpt();
      CO.tienDo = (++idx) + '/' + danhSach.length + ' ' + mi.ten;
      console.log('[ita] ' + CO.tienDo);
      // Mất kết nối máy chủ (phần lớn lệnh gọi lỗi mạng) → bỏ kết quả của mục này, chờ rồi thử lại; quá 3 lần thì ghi "chưa kiểm được"
      let matMang = false;
      try {   // [S1] màn sập giữa chừng → thoát mục này, chạy tiếp mục sau
      for (let lanThu = 0; lanThu < 4; lanThu++) {
        const r0 = res.length, i0 = inputs.length, t0 = TRUONG.length, s0 = skipped.length;
        const v0 = new Set(VISITED), f0 = new Set(DA_MO_FORM), l0 = new Set(DA_MO_LOC), tt0 = new Set(DA_TT);
        DEM_API = 0; DEM_NETERR = 0;
        resetLog();
        if (!(await openMenu(mi.mid))) { missing.push(mi.ten); break; }
        if (VUA_PHUC_HOI) {   // [S1] sau màn sập: chờ màn báo lỗi biến mất; còn hiện ở màn khác → app kẹt, phải tải lại trang
          const t0k = Date.now(); while (coManLoi() && Date.now() - t0k < 5000) await sleep(250);
          if (coManLoi()) { APP_SAP = mi.ten; nk('app kẹt màn báo lỗi', VUA_PHUC_HOI + ' → ' + chuanTuyen(location.pathname)); CO.dung = true; throw DUNG; }
          VUA_PHUC_HOI = '';
        }
        const ms = await settle(); await audit(mi.ten, ms);
        try { await tryInputs(mi.ten); } catch (e) { if (e === DUNG || e === SAP_MAN) throw e; inputs.push({ man: mi.ten, loi: 'lỗi khi thử ô: ' + e.message }); }
        await moCacForm(mi.mid, [], mi.ten);   // mở form Thêm mới… của màn để kiểm kê trường
        if (C.moHoSoDau) { try { await openFirstRow(mi.mid, mi.ten); } catch (e) { if (e === DUNG || e === SAP_MAN) throw e; } }
        try { await moHoSoTheoTrangThai(mi.mid, [], mi.ten); } catch (e) { if (e === DUNG || e === SAP_MAN) throw e; skipped.push({ man: mi.ten, chu: 'trạng thái', ly_do: 'lỗi khi mở hồ sơ theo trạng thái: ' + e.message }); }
        try { await explore(mi.mid, [], mi.ten, 1, new Set()); } catch (e) { if (e === DUNG || e === SAP_MAN) throw e; skipped.push({ man: mi.ten, chu: '*', ly_do: 'lỗi khi duyệt tab: ' + e.message }); }
        await closeDialog();
        matMang = DEM_API >= 2 && DEM_NETERR / DEM_API >= 0.6;
        if (!matMang) break;
        // hoàn lại mọi thứ ghi trong lần thử hỏng
        res.length = r0; inputs.length = i0; skipped.length = s0;
        TRUONG.splice(t0).forEach(f => DA_GHI_TRUONG.delete(f.khoa));
        [[VISITED, v0], [DA_MO_FORM, f0], [DA_MO_LOC, l0], [DA_TT, tt0]].forEach(([a, b]) => { a.clear(); b.forEach(x => a.add(x)); });
        const cho = (window.__itaChoThu || 20) * (lanThu + 1);
        nk('mất kết nối', mi.ten + ' — ' + DEM_NETERR + '/' + DEM_API + ' lệnh lỗi mạng, chờ ' + cho + ' giây rồi thử lại');
        console.warn('[ita] Mất kết nối máy chủ ở "' + mi.ten + '" (' + DEM_NETERR + '/' + DEM_API + ' lệnh lỗi mạng). Chờ ' + cho + ' giây rồi thử lại (lần ' + (lanThu + 1) + '/3).');
        if (lanThu < 3) { CO.tienDo = '⏳ Mất kết nối máy chủ — chờ ' + cho + ' giây rồi thử lại "' + mi.ten + '"'; capNhatBang(); for (let k = 0; k < cho * 4; k++) { await sleep(250); await kiemCo(); } }
      }
      } catch (e) {
        if (e !== SAP_MAN) throw e;
        const sx = SAP_MOI || {}; SAP_MOI = null; VUA_PHUC_HOI = sx.duong_dan || chuanTuyen(location.pathname);
        missing.push(mi.ten + ' (màn sập ở ' + (sx.man || '') + ' — ' + (sx.duong_dan || '') + (sx.loi_da_biet ? ' — LỖI ĐÃ BIẾT ' + sx.loi_da_biet.ma + (sx.loi_da_biet.yc ? '/' + sx.loi_da_biet.yc : '') : '') + '; đã bỏ qua, chạy tiếp)');
        try { await closeDialog(); } catch (x) {}
      }
      if (matMang) missing.push(mi.ten + ' (chưa kiểm được: mất kết nối máy chủ sau 4 lần thử)');
      DA_XONG.add(mi.ten);
      luuCkpt();   // lưu điểm dừng sau mỗi mục
    }
    for (const k of C.kichBan || []) { console.log('[ita] Kịch bản: ' + k.man); await runScenario(k); }
  } catch (e) {
    if (e === SAP_MAN) { dungGiuaChung = true; SAP_MOI = null; nk('dừng', 'màn sập ngoài vòng menu (kịch bản)'); }
    else if (e === DUNG) { dungGiuaChung = true; if (APP_SAP) { nk('dừng do ứng dụng sập', APP_SAP); console.warn('[ita] DỪNG: ứng dụng báo màn hình hỏng ở "' + APP_SAP + '" — tải lại trang rồi chạy tiếp, bỏ qua màn này.'); } else if (MAT_PHIEN) { nk('dừng do mất phiên', MAT_PHIEN); console.warn('[ita] DỪNG: mất phiên đăng nhập — ' + MAT_PHIEN + '. Đăng nhập lại cùng tài khoản rồi bấm Chạy để chạy tiếp.'); } else console.log('%c[ita] Đã dừng theo yêu cầu', 'color:#b60'); }
    else throw e;
  } finally {
    goHook();
    // gỡ dấu định danh menu
    document.querySelectorAll('[data-ita-menu]').forEach(e => { try { delete e.dataset.itaMenu; } catch (x) {} });
  }

  function luuCkpt() {
    const goc = { origin: location.origin, tk: TK, ts: Date.now(), dang: DANG, sap: SAP, boQuaDoTaiLai: BO_DO_TAI_LAI, ngungBam: DUNG_BAM || NGUNG_BAM_TRUOC, xong: [...DA_XONG], visited: [...VISITED], ds: DS, nt: NT };
    try { localStorage.setItem(ckptKey(), hoaChuoi(Object.assign({ res, inputs, truong: TRUONG }, goc))); CKPT_GON = false; return; } catch (e) {}
    // [S2] đầy chỗ: vẫn giữ tiến độ + màn sập (bản gọn) để tải lại không chạy lại từ đầu; kết quả chi tiết chỉ còn trong trang
    try { localStorage.setItem(ckptKey(), hoaChuoi(Object.assign({ gon: true }, goc))); if (!CKPT_GON) { CKPT_GON = true; nk('điểm dừng gọn', 'trình duyệt hết chỗ lưu'); console.warn('[ita] Trình duyệt gần hết chỗ lưu: điểm dừng chỉ giữ tiến độ, không giữ kết quả chi tiết. Xuất báo cáo trước khi tải lại trang, hoặc chạy ita.donBoNho().'); } } catch (e) {}
  }

  // So với danh mục trường mong đợi (nếu anh khai truongMongDoi)
  const thieuTruong = [];
  for (const [man, ds] of Object.entries(C.truongMongDoi || {})) {
    const co = TRUONG.filter(f => norm(f.man).includes(norm(man)));
    for (const t of ds || []) if (!co.some(f => norm(f.nhan) === norm(t) || norm(f.nhan).includes(norm(t)))) thieuTruong.push({ man, truong: t, so_truong_da_thay_o_man: co.length });
  }

  // Phân loại mức độ
  const CAO = ['api_loi', 'js_loi', 'du_lieu_nhay_cam'], TB = ['rong_nhung_api_loi', 'so_dong_vuot_tong', 'quy_trinh_loi'], THAP = ['chu_la', 'phan_tram_vo_ly', 'van_dang_tai', 'tran_ngang', 'tieu_de_bi_cat', 'o_khong_nhan', 'truong_loi'];
  // 3.6: chỉ THÊM khoá mới vào danh sách sẵn có — mức của khoá cũ giữ nguyên
  THAP.push('ma_enum_lo', 'cat_chu_khong_tooltip', 'chuoi_dai_khong_ngat', 'dinh_dang_ngay_tron', 'dinh_dang_so_tron', 'tieu_de_lech_menu', 'nut_chinh_nhieu');
  const CAN_XN = {
    nghi_ngo_so_lech: () => 'số trên màn có thể do giao diện tự tính',
    chan_ghi: () => 'màn tự gửi lệnh ghi khi chỉ mở xem — có thể là đánh dấu đã đọc/thống kê',
    api_loi: v => (String(v).split(' | ').every(x => /^404 /.test(x)) ? '404 có thể chỉ là "chưa có dữ liệu" — mở màn xem vùng đó hiển thị gì' : ''),
    dinh_dang_so_tron: () => 'dấu chấm/phẩy có thể là số thập phân',
    tieu_de_lech_menu: () => 'tên khác nhưng có thể cùng nghĩa',
    nut_chinh_nhieu: () => 'kiểm bằng mắt nút nào là hành động chính',
  };
  const canXN = r => Object.keys(CAN_XN).filter(k => r[k]).map(k => { const x = CAN_XN[k](r[k]); return x ? k + ': ' + x : ''; }).filter(Boolean).join(' | ');
  const coXss = r => /XSS|5xx/.test((r.quy_trinh_loi || '') + (r.api_loi || ''));
  const mucDo = r => (CAO.some(k => r[k]) || coXss(r) || /⚠/.test(r.quy_trinh_loi || '')) ? 'cao' : TB.some(k => r[k]) ? 'trung bình' : THAP.some(k => r[k]) ? 'thấp' : '';
  const CHECK = [...CAO, ...TB, ...THAP, 'chan_ghi', 'nghi_ngo_so_lech'];
  // Gộp các màn trùng (cùng tên màn + URL): xảy ra khi chạy tiếp sau tải lại, mục menu đang dở được chạy lại;
  // lần chạy lại không thu thêm trường đã có nên hiện "0 trường" — giữ bản có nhiều trường nhất, bổ sung ô còn trống.
  const resG = (() => {
    const m = new Map();
    for (const r of res) {
      const k = r.tab + '\u0001' + r.url, cu = m.get(k);
      if (!cu) { m.set(k, Object.assign({}, r)); continue; }
      const [goc, phu] = (+r.so_truong || 0) > (+cu.so_truong || 0) ? [Object.assign({}, r), cu] : [cu, r];
      for (const [kk, v] of Object.entries(phu)) if ((goc[kk] === '' || goc[kk] == null) && v !== '' && v != null) goc[kk] = v;
      const nut = [...new Set([goc.nut_tren_man, phu.nut_tren_man].filter(Boolean).join(' · ').split(' · ').filter(Boolean))].join(' · ');
      if (nut) goc.nut_tren_man = nut;
      m.set(k, goc);
    }
    return [...m.values()];
  })();
  const issues = resG.filter(r => CHECK.some(k => r[k])).map(r => { const o = Object.fromEntries(Object.entries(r).filter(([, v]) => v !== '' && v != null)); o.muc_do = mucDo(r) || 'nghi ngờ'; const xn = canXN(r); if (xn) o.can_xac_nhan = xn; return o; });
  const inputIssues = inputs.filter(i => i.loi);

  // 3.6: gom theo mẫu lỗi / thành phần — một lỗi component trên nhiều màn = 1 dòng
  const mucCua = (k, v) => CAO.includes(k) || (k === 'quy_trinh_loi' && /⚠/.test(v)) ? 'cao' : TB.includes(k) ? 'trung bình' : THAP.includes(k) ? 'thấp' : 'nghi ngờ';
  const MAU = {};
  const themMau = (khoa, loai, muc, chiTiet, man, xn) => {
    const o = MAU[khoa] || (MAU[khoa] = { loai, muc_do: muc, chi_tiet: chiTiet, nguyen_tac: NGUYEN_TAC[loai] || '', so_man: 0, vi_du_man: [], can_xac_nhan: xn || '', _m: new Set() });
    if (!o._m.has(man)) { o._m.add(man); o.so_man++; if (o.vi_du_man.length < 4) o.vi_du_man.push(man); }
  };
  const duongMau = x => String(x).replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id').replace(/\/\d+(?=\/|$)/g, '/:id');
  const THEO_TP = ['tieu_de_bi_cat', 'cat_chu_khong_tooltip', 'chuoi_dai_khong_ngat', 'ma_enum_lo'];
  for (const r of res) for (const k of CHECK) {
    if (!r[k]) continue;
    const muc = mucCua(k, r[k]), xn = CAN_XN[k] ? CAN_XN[k](r[k]) : '';
    if (THEO_TP.includes(k) && r.__tp && (r.__tp[k] || []).length) { for (const tp of new Set(r.__tp[k])) themMau(k + '·' + tp, k, muc, 'thành phần ' + tp, r.tab, xn); }
    else if (k === 'api_loi' || k === 'api_cham' || k === 'chan_ghi') { for (const p of String(r[k]).split(' | ')) { const c = duongMau(p.replace(/^\d+ms /, '')); themMau(k + '·' + c, k, muc, c, r.tab, k === 'api_loi' ? (CAN_XN.api_loi(p) || '') : xn); } }
    else if (k === 'chu_la') { for (const p of String(r[k]).split(', ')) themMau(k + '·' + p, k, muc, p, r.tab, xn); }
    else if (k === 'du_lieu_nhay_cam') { for (const p of String(r[k]).split(' | ')) themMau(k + '·' + p.split(' «')[0], k, muc, p.split(' «')[0], r.tab, xn); }
    else if (['js_loi', 'quy_trinh_loi', 'dinh_dang_ngay_tron', 'dinh_dang_so_tron', 'rong_nhung_api_loi', 'tieu_de_lech_menu', 'phan_tram_vo_ly', 'truong_loi'].includes(k)) { const ct = String(r[k]).replace(/\s+/g, ' ').slice(0, 120); themMau(k + '·' + ct.replace(/\d+/g, 'N'), k, muc, ct, r.tab, xn); }
    else themMau(k, k, muc, '', r.tab, xn);
  }
  for (const i of inputIssues) for (const p of String(i.loi).split(' | ')) {
    const xn = /^\[cần xác nhận\]/.test(p) ? 'kiểm bằng mắt' : '';
    const ct = p.replace(/^\[cần xác nhận\] /, '').replace(/\d+/g, 'N').replace(/"[^"]*"/g, '"…"');
    const muc = /⚠|^API lỗi|^JS lỗi/.test(p) ? 'cao' : /ra N dòng trong khi|vẫn ra|không có tác dụng|giống hệt|lớn hơn tổng/.test(ct) ? 'trung bình' : 'thấp';
    themMau('o_nhap·' + i.loai + '·' + ct, 'o_nhap', muc, i.loai + ' — ' + ct, i.man + ' · ' + i.o, xn);
  }
  const RANK = { 'cao': 3, 'trung bình': 2, 'thấp': 1, 'nghi ngờ': 0 };
  const mau_loi = Object.values(MAU).map(o => { delete o._m; return o; }).sort((a, b) => (RANK[b.muc_do] - RANK[a.muc_do]) || (b.so_man - a.so_man));
  // 3.6: hệ thống thiết kế & ngôn từ toàn app
  const xep = (bangGT, n = 12) => Object.entries(bangGT).map(([gt, o]) => ({ gia_tri: gt, lan: o.n, so_man: o.so_man })).sort((a, b) => b.lan - a.lan).slice(0, n);
  const dsKq = !C.kiemThietKe ? {} : {
    co_chu: { so_luong: Object.keys(DS.coChu).length, chuan_toi_da: chuanDS.coChuToiDa, pho_bien: xep(DS.coChu) },
    mau_chu: { so_luong: Object.keys(DS.mauChu).length, chuan_toi_da: chuanDS.mauChuToiDa, pho_bien: xep(DS.mauChu) },
    mau_nen: { so_luong: Object.keys(DS.mauNen).length, chuan_toi_da: chuanDS.mauNenToiDa, pho_bien: xep(DS.mauNen) },
    bo_goc: { so_luong: Object.keys(DS.boGoc).length, chuan_toi_da: chuanDS.boGocToiDa, pho_bien: xep(DS.boGoc) },
    do_bong: { so_luong: Object.keys(DS.doBong).length, chuan_toi_da: chuanDS.doBongToiDa, pho_bien: xep(DS.doBong, 6) },
    lech_luoi: { luoi: chuanDS.luoi, so_gia_tri: Object.keys(DS.lechLuoi).length, pho_bien: xep(DS.lechLuoi) },
    nut_cung_nhan_khac_kieu: Object.values(DS.nut).filter(o => Object.keys(o.kieu).length > 1).map(o => ({ nhan: o.nhan, so_kieu: Object.keys(o.kieu).length, kieu: xep(o.kieu, 4) })).sort((a, b) => b.so_kieu - a.so_kieu).slice(0, 20),
  };
  if (C.kiemThietKe) {
    const vuot = [];
    for (const [k, ten] of [['co_chu', 'cỡ chữ'], ['mau_chu', 'màu chữ'], ['mau_nen', 'màu nền'], ['bo_goc', 'bo góc'], ['do_bong', 'đổ bóng']]) if (dsKq[k].chuan_toi_da && dsKq[k].so_luong > dsKq[k].chuan_toi_da) vuot.push(dsKq[k].so_luong + ' ' + ten + ' (chuẩn ≤ ' + dsKq[k].chuan_toi_da + ')');
    if (dsKq.lech_luoi.so_gia_tri) vuot.push(dsKq.lech_luoi.so_gia_tri + ' giá trị khoảng cách lệch lưới ' + chuanDS.luoi + 'px và ngoài bộ khoảng cách của dự án');
    if (dsKq.nut_cung_nhan_khac_kieu.length) vuot.push(dsKq.nut_cung_nhan_khac_kieu.length + ' nhãn nút có nhiều kiểu');
    dsKq.vuot_chuan = vuot;
  }
  const nhieu = (bangGT, loc) => Object.values(bangGT).map(o => Object.entries(o)).filter(e => e.length > 1 && (!loc || loc(e)))
    .map(e => ({ cach_viet: e.map(([w, o]) => w + ' (' + o.so_man + ' màn)'), vi_du_man: [...new Set(e.flatMap(([, o]) => o.man))].slice(0, 3) })).slice(0, 30);
  const giuDau = x => { let t = String(x).normalize('NFC'); for (const [a, b] of DAU_CU_MOI) t = t.split(a).join(b); return t; };
  const ntKq = !C.kiemNgonTu ? {} : {
    mot_tu_nhieu_cach_viet: nhieu(NT.tu, e => new Set(e.map(([w]) => w)).size > 1),
    khac_hoa_thuong: nhieu(NT.nhan, e => new Set(e.map(([w]) => giuDau(w))).size > 1 && new Set(e.map(([w]) => giuDau(w).toLowerCase())).size === 1),
    lan_tieng_nuoc_ngoai: xep(NT.ngoai, 20), unicode_to_hop: xep(NT.nfd, 20), dinh_dang_ngay_dung: xep(NT.ngay),
  };

  const ketQua = {
    url: location.origin, luc: new Date().toLocaleString('vi-VN'), thoi_gian_s: Math.round((Date.now() - tStart) / 1000),
    dung_giua_chung: dungGiuaChung, ly_do_dung: !dungGiuaChung ? '' : (APP_SAP ? 'app kẹt ở màn báo lỗi sau khi một màn sập ("' + APP_SAP + '"): đã tải lại trang. Bản dán Console: dán lại đúng tệp bundle để chạy tiếp các mục chưa chạy.' : MAT_PHIEN ? 'mất phiên đăng nhập (' + MAT_PHIEN + '): đăng nhập lại cùng tài khoản để chạy tiếp.' : 'dừng theo lệnh người chạy hoặc lỗi công cụ.'), menu_chua_chay: danhSach.map(x => x.ten).filter(t => !DA_XONG.has(t)), tai_khoan: TK || '(không nhận ra — khai dacTa.vaiChon)',
    mat_phien: MAT_PHIEN, loi_403: MA403.slice(0, 100), man_loi_nang: SAP, man_sap: SAP, diem_dung_gon: CKPT_GON, quy_tac: (window.__itaQuyTac || {}).meta || null, thao_tac_cuoi: docNK().slice(-15),
    muc_quy_trinh: C.mucQuyTrinh, co_dac_ta: !!C.dacTa, mo_ghi: choGhiMoiTruong,
    phien_ban: PHIEN_BAN, cach_nap: window.__itaNguon === 'userscript' ? 'Tampermonkey (cổng chặn từ đầu trang)' : 'dán Console',
    ten_mien: location.hostname, cua_so: innerWidth + '×' + innerHeight + ' (tỉ lệ ' + (window.devicePixelRatio || 1) + ')',
    danh_sach_menu: danhSach.map(x => x.ten), di_vong_bo_chan: DI_VONG.slice(), ngung_bam_do_di_vong: DUNG_BAM || NGUNG_BAM_TRUOC, co_cong_fetch: coCong,
    mau_loi, he_thong_thiet_ke: dsKq, ngon_tu: ntKq, la_chan_tu_dau_trang: !!(LC && LC.som), nut_nghiep_vu_da_bat: nvOk(),
    lenh_di_vong_bo_chan: [...new Set(BYPASS)].slice(0, 20),
    so_muc_menu: danhSach.length, so_man_da_kiem: resG.length, man_co_van_de: issues.length,
    man_cao: issues.filter(r => r.muc_do === 'cao').length,
    man_trung_binh: issues.filter(r => r.muc_do === 'trung bình').length,
    o_nhap_da_thu: inputs.length, o_nhap_co_loi: inputIssues.length,
    menu_khong_mo_duoc: missing,
    bieu_do_chua_bam_duoc: resG.filter(r => { const m = /^(\d+)\/(\d+)/.exec(r.bieu_do || ''); return m && +m[1] < +m[2]; }).map(r => r.tab + ' (' + r.bieu_do + ')'),
    van_de: issues, loi_o_nhap: inputIssues, kich_ban: scen, bo_qua_khong_bam: skipped,
    da_kiem: resG.map(r => r.tab + ' — ' + r.url), thu_o_nhap: inputs,
    // kiểm kê trường
    so_truong: TRUONG.length, truong_co_loi: TRUONG.filter(f => f.loi).length,
    so_form_da_mo: [...new Set(TRUONG.filter(f => /^form( nghiệp vụ)? «/.test(f.vung)).map(f => f.man + ' | ' + f.vung.split(' › ')[0].split(' · ')[0]))].length,
    form_da_mo: [...new Set(TRUONG.filter(f => /^form( nghiệp vụ)? «/.test(f.vung)).map(f => f.man + ' | ' + f.vung.split(' › ')[0].split(' · ')[0]))],
    tc_nhap_kq: TC_KQ,
    o_chon_cot_bo_qua: SO_CHON_COT,
    man_da_kiem: resG.map(r => ({ tab: r.tab, url: r.url, so_truong: r.so_truong, nut_tren_man: r.nut_tren_man })),
    thieu_truong_so_voi_mong_doi: thieuTruong,
    danh_muc_truong: TRUONG.map(f => { const o = Object.assign({}, f); delete o.khoa; return o; }),
  };
  // 3.31: cho phuDanhMucTC; không liệt kê → không lưu
  Object.defineProperty(ketQua, 'man_quet', { value: resG });
  // đối chiếu với bảng đặc tả quy trình đã nạp (nếu có)
  const dsDT = docDacTa();
  if (dsDT.length) { try { ketQua.doi_chieu_dac_ta = doiChieuDacTa(ketQua, dsDT); } catch (e) { console.warn('[ita] Lỗi khi đối chiếu đặc tả: ' + e.message); } }
  { try { ketQua.phu_danh_muc_tc = phuDanhMucTC(ketQua, ketQua.doi_chieu_dac_ta); } catch (e) { console.warn('[ita] Lỗi khi đối chiếu danh mục TC: ' + e.message); } }
  window.__ITA_AUDIT = { res, inputs, scen, skipped, ketQua };
  // lưu kết quả; nếu vượt dung lượng trình duyệt thì lưu bản rút gọn (bỏ danh sách lựa chọn)
  // lưu "kết quả gần nhất" chung và một bản riêng của tài khoản này (để đổi tài khoản không mất kết quả cũ)
  const luuKQ = key => { try { localStorage.setItem(key, hoaChuoi(ketQua)); return true; } catch (e) { try { localStorage.setItem(key, hoaChuoi(Object.assign({}, ketQua, { danh_muc_truong: ketQua.danh_muc_truong.map(f => Object.assign({}, f, { lua_chon: '' })), thu_o_nhap: [] }))); return true; } catch (x) { return false; } } };
  if (!luuKQ(KEY_LAST)) console.warn('[ita] Kết quả quá lớn để lưu vào trình duyệt; vẫn xuất được ngay bây giờ bằng ita.xuat()');
  luuKQ(lastKeyTK());
  if (!dungGiuaChung) { try { localStorage.removeItem(ckptKey()); } catch (e) {} }   // xong thì xoá điểm dừng của tài khoản này
  // tự tải báo cáo HTML khi chạy xong, để kết quả không bị mất khi đổi tài khoản / tải lại trang
  // [3.25] dừng vì app kẹt màn lỗi / mất phiên: vẫn tải báo cáo phần đã chạy TRƯỚC khi trang tải lại, để lỗi không bị mất
  if (C.tuTaiBaoCao && (!dungGiuaChung || APP_SAP || MAT_PHIEN)) { try { taiTep('ita-' + slugTK() + '-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + (dungGiuaChung ? '-DANG-DO' : '') + '.html', sangHTML(ketQua), 'text/html'); } catch (e) {} }

  console.log('%c[ita] Xong: ' + res.length + ' màn · ' + issues.length + ' có vấn đề (cao: ' + ketQua.man_cao + ', TB: ' + ketQua.man_trung_binh + ') · ' + inputs.length + ' lần thử ô (' + inputIssues.length + ' lỗi)', 'color:#070;font-weight:bold');
  console.table(issues.map(r => ({ màn: r.tab, mức: r.muc_do, api_lỗi: r.api_loi || '', js: r.js_loi || '', quy_trình: r.quy_trinh_loi || '' })));
  console.log('%c[ita] Kiểm kê: ' + TRUONG.length + ' trường · ' + ketQua.truong_co_loi + ' trường có lỗi · ' + ketQua.so_form_da_mo + ' form đã đọc được' + ((DUNG_BAM || NGUNG_BAM_TRUOC) ? ' (CÓ PHẦN CHẠY Ở CHẾ ĐỘ NGỪNG BẤM NÚT NGHIỆP VỤ vì có yêu cầu mạng đi vòng — chạy lại bằng Tampermonkey để đọc đủ form)' : '') + (thieuTruong.length ? ' · THIẾU ' + thieuTruong.length + ' trường so với danh mục mong đợi' : '') + '. Xuất: ita.xuat("truong")', 'color:#0b3d66;font-weight:bold');
  if (ketQua.doi_chieu_dac_ta) {
    const d = ketQua.doi_chieu_dac_ta;
    console.log('%c[ita] Đối chiếu đặc tả ' + gonMaDT(d.quy_trinh.map(q => q.ma)) + ':\n  ' + demBang(d).join('\n  '), 'color:#6a1b9a;font-weight:bold');
    const cl = d.ket_qua.filter(k => (k.kq === 'LỆCH' || k.kq === 'CẢNH BÁO') && k.loai_bang !== 'khung');
    if (cl.length) console.table(cl.map(k => ({ 'kết quả': k.kq, 'mã ca': k.ma, 'diễn giải': k.dg })));
    const clK = d.ket_qua.filter(k => k.kq === 'CẢNH BÁO' && k.loai_bang === 'khung').length;
    if (clK) console.log('[ita] Bảng khung: ' + clK + ' chỗ khác mốc, xem trong báo cáo HTML hoặc ita.xuat("dacta").');
  }
  capNhatBang();
  return ketQua;
}

