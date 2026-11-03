/* ============================================================= *
 * 1. CẤU HÌNH MẶC ĐỊNH — sửa bằng dqtv.dat(...) hoặc trên bảng   *
 * ============================================================= */
const MAC_DINH = {
  /* --- phạm vi duyệt menu / tab --- */
  tenMienDuocChay: /^dqtv\.linksafe\.vn$/i,   // chỉ chạy trên tên miền khớp (môi trường kiểm thử); null = không khoá
  cheNhayCam: true,             // che dữ liệu nhạy cảm (câu lệnh, IP nội bộ, đường dẫn máy chủ, SQL, khoá) khi in báo cáo
  chiMenu: null,                // RegExp: chỉ kiểm mục menu khớp, vd /Chiến sĩ|Đơn vị/
  boQuaMenu: null,              // RegExp: bỏ qua mục menu khớp
  doSauTab: 2,                  // tab con lồng mấy tầng
  maxTabMoiMan: 25,
  moHoSoDau: true,              // mở thử dòng đầu tiên của mỗi bảng danh sách rồi quay lại

  /* --- thử ô nhập (đầu vào) và kiểm đầu ra --- */
  thuOTim: true,
  giaTriTim: [
    { giaTri: 'Nguyễn', ten: 'có dấu' },
    { giaTri: 'nguyen', ten: 'không dấu', phaiRaNhuCoDau: 'Nguyễn' },
    { giaTri: 'zzqx_khong_ton_tai_9871', ten: 'không tồn tại', phaiRong: true },
    { giaTri: '  Nguyễn  ', ten: 'thừa khoảng trắng', phaiRaNhuCoDau: 'Nguyễn' },
  ],
  thuOChon: 6,                  // mỗi ô chọn lọc thử tối đa N lựa chọn, 0 = tắt
  thuBaoMat: false,             // gõ chuỗi thử XSS/SQL vào ô tìm (chỉ GET)

  /* --- KIỂM KÊ TRƯỜNG: quét đủ mọi trường trên giao diện --- */
  kiemKeTruong: true,           // ghi danh mục mọi ô nhập, ô chọn, cột bảng, trường hiển thị
  moFormDeKiemKe: true,         // bấm nút mở form (Thêm mới, Sửa…) CHỈ để đọc trường rồi đóng; chỉ chạy khi đang chặn ghi
  nutMoForm: /(?<![\p{L}\d])(thêm mới|thêm|tạo mới|tạo|khai báo|lập mới|lập|soạn|soạn thảo|khởi tạo|đăng ký mới|sửa|chỉnh sửa|cập nhật|xem chi tiết|chi tiết)(?![\p{L}\d])/iu,
  maxFormMoiMan: 20,            // mỗi màn mở tối đa N form (nút có trong đặc tả không tính vào giới hạn này)
  tuTaiBaoCao: true,            // chạy xong tự tải báo cáo HTML (tên tệp có tên tài khoản)
  moHoSoMoiTrangThai: true,     // mở một hồ sơ cho mỗi trạng thái có dữ liệu (theo nút lọc trạng thái) và mỗi tab
  maxTrangThai: 10,
  // Mở cả nút nghiệp vụ (Ghi nhận…, Ra lệnh…, Phê duyệt, Trả lại, Phân công…) để đọc form của bước đó.
  // Chỉ chạy khi đang chặn ghi; không bao giờ bấm nút bên trong form (chỉ Hủy/Đóng).
  moNutNghiepVu: true,
  // Nút không bao giờ bấm khi mở form (tải tệp, mở tệp, điều hướng, xoá/huỷ hồ sơ…)
  // "xuất" chỉ bỏ khi là xuất tệp (không bỏ "Nhận công văn báo xuất ngũ")
  boQuaNut: /(?<![\p{L}\d])(đăng xuất|thoát|xuất(?=\s*$)|xuất (excel|pdf|word|tệp|file|dữ liệu|danh sách|báo cáo)|tải|in|download|export|import|nhập danh sách|nhập từ|xoá|xóa|huỷ|hủy|đóng hồ sơ|khoá|mở khoá|mở bản|mở tờ|đã ký|xem|ẩn|hiện|trạng thái|diện|về danh sách|mở danh sách|kỳ trước|kỳ sau|tuần trước|tuần này|tuần sau|tháng trước|tháng sau|thu gọn|mở rộng|cột|bỏ lọc|lọc|nâng cao|báo cáo tổng hợp|bảng kê|tra cứu|làm mới|tải lại)(?![\p{L}\d])/iu,
  moDropdownTuyBien: true,      // mở ô chọn kiểu Ant/Element/MUI… để đọc danh sách lựa chọn
  maxMoChon: 25,                // mỗi vùng mở tối đa N ô chọn tuỳ biến
  maxLuaChon: 60,               // lưu tối đa N lựa chọn mỗi ô
  moRongMuc: true,              // bấm "Xem thêm", "Tìm kiếm nâng cao", mục thu gọn để lộ trường ẩn
  // Danh mục trường mong đợi theo màn (lấy từ đặc tả / Phụ lục) để báo THIẾU trường
  // vd { 'Chiến sĩ': ['Họ và tên','Ngày sinh','Số CCCD','Đơn vị'], 'Đơn vị': ['Mã đơn vị','Tên đơn vị'] }
  truongMongDoi: null,

  /* --- BỔ SUNG 3.6: kiểm giao diện toàn app (chỉ đọc) --- */
  kiemThietKe: true,            // thống kê cỡ chữ, màu, bo góc, đổ bóng, khoảng cách lệch lưới, kiểu nút
  kiemNgonTu: true,             // một từ hai cách viết, hoa/thường, lẫn tiếng Anh, chữ tổ hợp
  cauTrongThem: [],             // câu báo trống riêng của app, vd ['Chưa phát sinh'] hoặc /chưa phát sinh/i
  chuanDS: { coChuToiDa: 8, mauChuToiDa: 8, mauNenToiDa: 10, boGocToiDa: 4, doBongToiDa: 3, luoi: 4, khoangCach: [2, 6, 10, 18, 30, 42], nutChinhToiDa: 1, mauMoiMan: 900 },

  /* --- LỚP KIỂM QUY TRÌNH --- */
  mucQuyTrinh: 1,               // 1 = chỉ đọc (an toàn mọi nơi); 2/3 cần moiTruongKiemThu
  moiTruongKiemThu: [],         // vd ['staging.dqtv.local','test.dqtv'] — mở ghi khi origin khớp
  tienToKiemThu: '[KIEMTHU] ',  // chỉ thao tác trên hồ sơ mang tiền tố này (mức 2)

  // Đặc tả để đối chiếu. Để null thì bỏ qua kiểm quy trình, chỉ kiểm mã.
  // Khai theo hệ thống thật rồi dán vào (dqtv.dat({ dacTa: {...} })).
  dacTa: null,
  // dacTa = {
  //   trangThai: ['Dự thảo','Trình ký','Đã ký','Hoàn thành','Trả lại'], // danh mục trạng thái hợp lệ
  //   vaiChon: '.user-role',        // selector ô hiện tên vai; hoặc:
  //   vaiText: /Vai trò:\s*(.+)/,   // regex bắt tên vai từ chữ trên trang
  //   quyTac: [                     // nút hành động được/không được theo trạng thái (+vai)
  //     { trangThai:'Dự thảo', vai:/Cán bộ/, phaiCo:['Trình ký','Sửa'], khongDuocCo:['Phê duyệt'] },
  //     { trangThai:'Trình ký', phaiCo:['Phê duyệt','Trả lại'] },
  //   ],
  //   quaHan: { nhan:/Quá hạn|Trễ hạn/ },   // nếu hồ sơ trễ mà không thấy nhãn này -> nghi lỗi
  // }

  /* --- kịch bản tự khai (mức 2, chạy chuỗi bước rồi kiểm) --- */
  kichBan: [],
  chiChayKichBan: false,

  /* --- kỹ thuật --- */
  waitMax: 10000, idle: 600, slowMs: 3000,
  chanGhi: true,
  // 3.31: lệnh POST được đi nằm trong gói (du-an.json → duong_dan_xac_thuc), so trọn đường dẫn; xem laPostDuocPhep (may/05-thuan.js). Không cấu hình ở đây.
  // [S1] chữ của màn báo lỗi do ứng dụng hiện khi một màn sập (app DQTV: "Màn hình này gặp lỗi và đã dừng lại…")
  mauManLoi: /gặp lỗi và đã dừng lại|đã dừng lại để không hiện số liệu sai|Unexpected Application Error/i,
  thuLaiLoiDaBiet: false,      // [S16] true: vẫn mở màn đã biết là sập (khi Bên B báo đã sửa)
  dungKhiMatPhien: true,        // gặp mã 401 (mất phiên) thì dừng gọn, lưu điểm dừng, ghi lý do
};

/* ============================================================= *
 * 2. LƯU / ĐỌC CẤU HÌNH (localStorage) — giữ được cả RegExp      *
 * ============================================================= */
/* --- Dữ liệu nhạy cảm hiện trên giao diện: thông tin hạ tầng, câu lệnh, khoá bí mật ---
 * Mỗi mẫu có tên loại tiếng Việt. IP chỉ nhận dải nội bộ, mỗi phần 0–255 (không nhận "10.000.000"). */
const MAU_NHAY_CAM = [
  ['dấu nhắc lệnh terminal', /\b[\w.-]+@[\w.-]+:[~\/][^\s$#]*[$#]/g],
  ['câu lệnh quản trị máy chủ', /(?<![\p{L}\d])(sudo|apt-get|systemctl|chmod|chown|docker|kubectl|go build|go version|git (?:commit|push|pull|diff|log|checkout)|grep -[a-zA-Z]+|rm -rf)\s+\S+/gu],
  ['IP / cổng nội bộ', /(?<![\d.])(?:127|10|192\.168|172\.(?:1[6-9]|2\d|3[01])|169\.254)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){1,3}(?::\d{2,5})?(?![\d.]*\d)/g],
  ['đường dẫn máy chủ', /(?<![\w.\/])\/(?:tmp|opt|etc|var|home|root|usr|srv|proc)\/[\w.\-\/]+/g],
  ['câu lệnh SQL', /\b(?:SELECT\s+[\w*.,\s()]{1,120}?\s+FROM\s+\w+|INSERT\s+INTO\s+\w+|UPDATE\s+\w+\s+SET\b|DELETE\s+FROM\s+\w+|DROP\s+(?:TABLE|DATABASE)\s+\w+)/gi],
  ['khoá / mật khẩu / token', /\b(?:eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{5,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|(?:password|passwd|pwd|secret|token|api[_-]?key)\s*[=:]\s*\S{4,})/gi],
  ['kết quả lệnh git / build', /\b\d+ (?:insertions?\(\+\)|deletions?\(-\))|\bvcs\.(?:revision|time|modified)=\S+|\b\d+ files? changed\b/g],
];
function timNhayCam(text) {
  const out = []; const t = String(text || '');
  for (const [loai, re] of MAU_NHAY_CAM) { re.lastIndex = 0; const m = t.match(re); if (m && m.length) out.push({ loai, mau: m[0], so: m.length }); }
  return out;
}
const cheMot = x => x.length <= 8 ? x.slice(0, 2) + '…' : x.slice(0, 8) + '…(' + x.length + ' ký tự)';
function cheChuoi(s) {
  if (window.__dqtvKhongChe) return String(s);
  let t = String(s);
  // che một lần: bỏ qua đoạn đã che (có "…" trong đoạn khớp hoặc ngay sau nó), để không che chồng
  for (const [, re] of MAU_NHAY_CAM) {
    re.lastIndex = 0;
    t = t.replace(re, function (m) { const a = arguments, off = a[a.length - 2], str = a[a.length - 1];
      if (m.includes('…') || /^[.\s]?…/.test(str.slice(off + m.length, off + m.length + 2))) return m; return cheMot(m); });
  }
  return t;
}

const PHIEN_BAN = '3.31';
const KEY_CFG = 'dqtv.cfg.v325', KEY_CKPT = 'dqtv.ckpt.v325', KEY_LAST = 'dqtv.last.v325', KEY_TAY = 'dqtv.truongtay.v325', KEY_SAP = 'dqtv.sap.v325';
// khóa của các bản trước (v3, v3.6, 3.17–3.23): dqtv.donBoNho() xoá để trả chỗ cho trình duyệt
const KHOA_CU = /^dqtv\.(cfg|ckpt|last|truongtay|run|nk|sap)\.v3(24)?(\||$)|^dqtv\.dacta\.v(1|324)$/;

/* --- Nhận ra tài khoản đang đăng nhập, để điểm dừng và kết quả TÁCH RIÊNG theo tài khoản ---
 * Lý do: đổi tài khoản mà dùng chung một điểm dừng thì lần chạy mới bỏ qua các mục "đã xong"
 * của tài khoản cũ và trộn kết quả hai tài khoản với nhau. */
let TK = '';
function taiKhoan() {
  try {
    const d = (cfgHienTai().dacTa) || {};
    if (d.vaiChon) { const e = document.querySelector(d.vaiChon); if (e && (e.innerText || '').trim()) return e.innerText.trim().replace(/\s+/g, ' ').slice(0, 140); }
    // khối chữ ở góc phải trên cùng (thường là chức vụ + đơn vị người dùng), bỏ ô tìm kiếm và bảng điều khiển
    const W = innerWidth;
    const ds = [...document.querySelectorAll('header *, nav *, body > div *')].filter(e => {
      if (e.closest('#dqtv-panel-host') || e.querySelector('input,svg + svg') || e.children.length > 4) return false;
      const r = e.getBoundingClientRect(); return r.top >= 0 && r.top < 90 && r.left > W * 0.6 && r.width > 0 && r.width < W * 0.35;
    }).map(e => (e.innerText || '').trim().replace(/\s+/g, ' ')).filter(t => /\p{L}{3,}/u.test(t) && t.length < 160);
    return ds.sort((a, b) => b.length - a.length)[0] || '';
  } catch (e) { return ''; }
}
// Cờ "đang chạy" — còn lại sau khi trang tự tải lại giữa chừng thì lần nạp sau tự chạy tiếp
const KEY_RUN = 'dqtv.run.v325';

/* --- Nhật ký lưu bền: giữ lại 300 thao tác gần nhất trong trình duyệt (không mất khi trang tải lại / bị đăng xuất).
 * Dùng để biết lần chạy trước dừng ở đâu, sau thao tác nào, có lỗi 401/403 hay lệnh ghi bị chặn nào. */
const KEY_NK = 'dqtv.nk.v325';
let NK_BO = null;
function nk(loai, noiDung) {
  try {
    if (!NK_BO) NK_BO = JSON.parse(localStorage.getItem(KEY_NK) || '[]');
    NK_BO.push({ t: new Date().toLocaleTimeString('vi-VN'), tk: (TK || '').slice(0, 40), loai, nd: String(noiDung).slice(0, 200), url: location.pathname + location.search });
    if (NK_BO.length > 300) NK_BO.splice(0, NK_BO.length - 300);
    localStorage.setItem(KEY_NK, JSON.stringify(NK_BO));
  } catch (e) {}
}
const docNK = () => { try { return JSON.parse(localStorage.getItem(KEY_NK) || '[]'); } catch (e) { return []; } };
let MAT_PHIEN = '';   // có giá trị khi API trả 401 trong lúc chạy
let APP_SAP = '';     // có giá trị khi ứng dụng hiện màn hình hỏng: dừng ngay, tải lại trang, chạy tiếp và bỏ qua màn đó
// Mã có đang chạy trong chính trang không (thử chèn một thẻ script nhỏ rồi xem trang có thấy biến không)
function laTrangThat() {
  try {
    const k = '__dqtvKiem' + Math.random().toString(36).slice(2);
    const s = document.createElement('script'); s.textContent = 'window["' + k + '"]=1';
    (document.head || document.documentElement).appendChild(s); s.remove();
    const ok = window[k] === 1; try { delete window[k]; } catch (e) {} return ok;
  } catch (e) { return false; }
}
const bam = s => { let h = 5381; for (const c of String(s)) h = ((h << 5) + h + c.codePointAt(0)) >>> 0; return h.toString(36); };
const ckptKey = () => KEY_CKPT + '|' + bam(TK || '?');
const lastKeyTK = () => KEY_LAST + '|' + bam(TK || '?');
const slugTK = () => (TK || 'khong-ro-tai-khoan').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 40).toLowerCase();
function docTay() { try { return doChuoi(localStorage.getItem(KEY_TAY) || '[]') || []; } catch (e) { return []; } }

// Chuyển RegExp <-> dạng lưu được {$re, f}
function hoaChuoi(o) {
  return JSON.stringify(o, (k, v) => v instanceof RegExp ? { $re: v.source, f: v.flags } : v);
}
function doChuoi(s) {
  return JSON.parse(s, (k, v) => (v && v.$re !== undefined) ? new RegExp(v.$re, v.f || '') : v);
}
function docCfgLuu() { try { const s = localStorage.getItem(KEY_CFG); return s ? locLuu(doChuoi(s)) : {}; } catch (e) { return {}; } }
function luuCfg(o) { try { localStorage.setItem(KEY_CFG, hoaChuoi(o)); } catch (e) {} }

// Các khóa hợp lệ + kiểu, để cảnh báo khi đặt sai
const KIEU = {
  tenMienDuocChay: 'RegExp?', cheNhayCam: 'boolean',
  chiMenu: 'RegExp?', boQuaMenu: 'RegExp?', doSauTab: 'number', maxTabMoiMan: 'number',
  moHoSoDau: 'boolean', thuOTim: 'boolean', giaTriTim: 'object', thuOChon: 'number',
  thuBaoMat: 'boolean', mucQuyTrinh: 'number', moiTruongKiemThu: 'object',
  tienToKiemThu: 'string', dacTa: 'object?', kichBan: 'object', chiChayKichBan: 'boolean',
  waitMax: 'number', idle: 'number', slowMs: 'number', chanGhi: 'boolean',
  kiemKeTruong: 'boolean', moFormDeKiemKe: 'boolean', nutMoForm: 'RegExp', maxFormMoiMan: 'number',
  moNutNghiepVu: 'boolean', boQuaNut: 'RegExp', moHoSoMoiTrangThai: 'boolean', maxTrangThai: 'number', tuTaiBaoCao: 'boolean', dungKhiMatPhien: 'boolean', mauManLoi: 'RegExp?', thuLaiLoiDaBiet: 'boolean',
  moDropdownTuyBien: 'boolean', maxMoChon: 'number', maxLuaChon: 'number', moRongMuc: 'boolean',
  truongMongDoi: 'object?',
  kiemThietKe: 'boolean', kiemNgonTu: 'boolean', cauTrongThem: 'object', chuanDS: 'object',
};
function kiemKieu(k, v) {
  const t = KIEU[k]; if (!t) return 'không có khóa cấu hình tên "' + k + '"';
  if (v == null) return t.endsWith('?') ? '' : '"' + k + '" không được để trống';
  const base = t.replace('?', '');
  if (base === 'RegExp') {
    if (!(v instanceof RegExp)) return '"' + k + '" phải là RegExp, vd /abc/i';
    return '';
  }
  if (base === 'object') return typeof v === 'object' ? '' : '"' + k + '" phải là mảng/đối tượng';
  return typeof v === base ? '' : '"' + k + '" phải là ' + base;
}

const HO_SO = {
  'nhanh':  { moHoSoDau: false, thuOTim: false, thuOChon: 0, doSauTab: 1, kiemKeTruong: true, moFormDeKiemKe: false, moDropdownTuyBien: false, moRongMuc: false },
  'day-du': { moHoSoDau: true, thuOTim: true, thuOChon: 6, doSauTab: 2, kiemKeTruong: true, moFormDeKiemKe: true, moDropdownTuyBien: true, moRongMuc: true },
  'bao-mat':{ moHoSoDau: true, thuOTim: true, thuBaoMat: true },
  // chỉ kiểm kê trường: bỏ thử ô tìm/ô lọc cho nhanh, mở đủ form, ô chọn, mục ẩn
  'kiem-ke-truong': { moHoSoDau: true, thuOTim: false, thuOChon: 0, doSauTab: 2, kiemKeTruong: true, moFormDeKiemKe: true, moDropdownTuyBien: true, moRongMuc: true, maxFormMoiMan: 20 },
};

// Cấu hình đang dùng = mặc định ← đã lưu ← DQTV_CONFIG (nếu có)
let daCanhBaoChiDoc = false;
function cfgHienTai(over) {
  const goc = Object.assign({}, MAC_DINH, cauHinhGoiAnToan((window.__dqtvDuAn || {}).cau_hinh), docCfgLuu(), window.DQTV_MAC_DINH || {}, window.DQTV_CONFIG || {}, over || {});
  // 3.31 (CT-03): chỉ đọc, luôn luôn (mucQuyTrinh về 1, chanGhi về true); chế độ ghi chưa làm. Cảnh báo một lần mỗi lần nạp trang.
  const c = epChiDoc(goc);
  if (!daCanhBaoChiDoc && (c.mucQuyTrinh !== goc.mucQuyTrinh || c.chanGhi !== goc.chanGhi)) {
    daCanhBaoChiDoc = true;
    console.warn('[dqtv] 3.31 chỉ chạy chỉ đọc; mucQuyTrinh 2/3 và chanGhi:false bị bỏ qua (chế độ ghi chưa làm, CT-11)');
  }
  return c;
}

/* ============================================================= *
 * 3. CỜ ĐIỀU KHIỂN (dừng / tạm dừng) dùng chung cho lõi kiểm     *
 * ============================================================= */
const CO = { dung: false, tamDung: false, dangChay: false, tienDo: '', ghiKichBan: null };

