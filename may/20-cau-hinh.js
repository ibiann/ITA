/* ============================================================= *
 * 1. CẤU HÌNH MẶC ĐỊNH — sửa bằng ita.dat(...) hoặc trên bảng   *
 * ============================================================= */
// Hồ sơ dự án: du-an/<dự án>/ho-so.json. Đóng gói sẵn thành window.__itaHoSo (dist/rieng/ita-<dự án>.js) hoặc nạp bằng «Nạp thư mục»
// (bộ đọc ho-so → apHoSo, bước 13b). Mọi chữ riêng của dự án lấy từ đây. Chưa có hồ sơ: ita.chay không chạy, mọi lệnh ghi bị chặn.
const DU_AN = Object.assign({}, window.__itaHoSo || {});
let QUY_CACH = null;   // [13e] quy cách giao diện của dự án (du-an/<tên>/quy-cach.json, bộ đọc quy-cach): ngưỡng + giá trị được phép
let HO_SO_MAU = null;   // [1.1] hồ sơ mẫu của dự án (du-an/<tên>/ho-so-mau.json, bộ đọc ho-so-mau): mã → đường dẫn hồ sơ thật
const reTenMien = t => t ? new RegExp('^' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') : null;
const boGoc = s => DU_AN.goc_duong_dan && String(s).startsWith(DU_AN.goc_duong_dan) ? String(s).slice(DU_AN.goc_duong_dan.length) : s;
const MAC_DINH = {
  /* --- phạm vi duyệt menu / tab --- */
  tenMienDuocChay: reTenMien(DU_AN.ten_mien),   // chỉ chạy trên tên miền khớp (môi trường kiểm thử); null = không khoá
  cheNhayCam: true,             // che dữ liệu nhạy cảm (câu lệnh, IP nội bộ, đường dẫn máy chủ, SQL, khoá) khi in báo cáo
  chiMenu: null,                // RegExp: chỉ kiểm mục menu khớp, vd /Chiến sĩ|Đơn vị/
  boQuaMenu: null,              // RegExp: bỏ qua mục menu khớp
  doSauTab: 2,                  // tab con lồng mấy tầng
  maxTabMoiMan: 25,
  moHoSoDau: true,              // mở thử dòng đầu tiên của mỗi bảng danh sách rồi quay lại

  /* --- thử ô nhập (đầu vào) và kiểm đầu ra --- */
  thuOTim: true,
  thuLoiDoc: true,   // [bước 2] giả lỗi đọc dữ liệu (như mất mạng) rồi mở lại màn: màn có báo lỗi không, hay hiện «trống» / treo / trắng
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
  boQuaNut: /(?<![\p{L}\d])(đăng xuất|thoát|xuất(?=\s*$)|xuất (excel|pdf|word|tệp|file|dữ liệu|danh sách|báo cáo)|tải|in|download|export|import|nhập danh sách|nhập từ|xoá|xóa|huỷ|hủy|đóng hồ sơ|khoá|mở khoá|mở bản|mở tờ|đã ký|xem|ẩn|hiện|trạng thái|diện|về danh sách|mở danh sách|kỳ trước|kỳ sau|tuần trước|tuần này|tuần sau|tháng trước|tháng sau|thu gọn|mở rộng|cột|bỏ lọc|lọc|nâng cao|báo cáo tổng hợp|bảng kê|tra cứu|làm mới|tải lại|đặt lại|khôi phục|reset)(?![\p{L}\d])/iu,   // đặt lại / khôi phục / reset: thường tác động ngay, không qua hộp thoại — không bao giờ bấm
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
  kiemTroNang: true,            // [1.2] kiểm trợ năng bằng axe-core (trước chỉ có trong KIEU, không có mặc định)
  cauTrongThem: [],             // câu báo trống riêng của app, vd ['Chưa phát sinh'] hoặc /chưa phát sinh/i
  chuanDS: { coChuToiDa: 6, mauChuToiDa: 8, mauNenToiDa: 10, boGocToiDa: 4, doBongToiDa: 3, luoi: 4, nutChinhToiDa: 1, mauMoiMan: 900 },

  /* --- LỚP KIỂM QUY TRÌNH --- */
  // [1.2] bỏ mucQuyTrinh, moiTruongKiemThu, tienToKiemThu, chanGhi: công cụ luôn chỉ đọc, đặt các khoá này bị từ chối (KHOA_KHOA)

  // Đặc tả để đối chiếu. Để null thì bỏ qua kiểm quy trình, chỉ kiểm mã.
  // Khai theo hệ thống thật rồi dán vào (ita.dat({ dacTa: {...} })).
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
  // lệnh POST được để đi: lấy từ hồ sơ dự án (post_cho_qua), không cấu hình được ở đây (xem 10-la-chan: postDuocDi)
  // chữ của màn báo lỗi khi một màn sập: lõi chỉ giữ mẫu chung (chữ mặc định của React Router); chữ riêng của app khai ở hồ sơ dự án: mau_man_loi
  mauManLoi: /Unexpected Application Error/i,
  thuLaiLoiDaBiet: false,      // [S16] true: vẫn mở màn đã biết là sập (khi Bên B báo đã sửa)
  dungKhiMatPhien: true,        // gặp mã 401 (mất phiên) thì dừng gọn, lưu điểm dừng, ghi lý do
};
// [13b] hồ sơ nạp bằng «Nạp thư mục» (70-nap.js) thay hồ sơ đóng gói sẵn: khoá tên miền, lệnh ghi được cho qua, chữ riêng dự án theo hồ sơ mới
function apHoSo(h) {
  window.__itaHoSo = h;
  for (const k of Object.keys(DU_AN)) delete DU_AN[k];
  Object.assign(DU_AN, h);
  MAC_DINH.tenMienDuocChay = reTenMien(DU_AN.ten_mien);
  apHoSoDoiChieu();
}

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
  if (window.__itaKhongChe) return String(s);
  let t = String(s);
  // che một lần: bỏ qua đoạn đã che (có "…" trong đoạn khớp hoặc ngay sau nó), để không che chồng
  for (const [, re] of MAU_NHAY_CAM) {
    re.lastIndex = 0;
    t = t.replace(re, function (m) { const a = arguments, off = a[a.length - 2], str = a[a.length - 1];
      if (m.includes('…') || /^[.\s]?…/.test(str.slice(off + m.length, off + m.length + 2))) return m; return cheMot(m); });
  }
  return t;
}

// [1.7.1] ba luật nhỏ dùng chung, để ở mức tệp cho test gọi thẳng được
// cảnh báo của chính trình duyệt, không phải lỗi app (so CẢ câu: lỗi thật có chữ ResizeObserver ở giữa vẫn là lỗi)
const LOI_TRINH_DUYET_VO_HAI = /^(JS: )?ResizeObserver loop (completed with undelivered notifications|limit exceeded)\.?$/i;
// giá trị (cỡ chữ, bo góc) ngoài danh sách px được phép của quy cách: xét từng phần («0px 0px 10px 10px» = bốn góc); phần 0 (góc không bo)
// không trái quy cách nào nên bỏ qua — trước 1.7.1 góc 0 làm cả giá trị bị tính «ngoài quy cách». Giá trị % giữ nguyên (quy cách chỉ khai px).
const ngoaiQuyCach = (bang, cho) => Object.keys(bang).filter(v => v.split(/\s+/).filter(p => p && p !== '/' && parseFloat(p) !== 0)
  .some(p => !cho.includes(p.endsWith('%') ? p : parseFloat(p))));
// nút chuyển trang trơn («← Trước», «Tiếp theo →», «Next»): khoá ở trang đầu / cuối là bình thường. Nhãn có thêm chữ khác («Tiếp theo: Trình ký») thì không phải
const laNutChuyenTrang = ten => /^\s*[←‹«<]?\s*(trang\s+)?(trước|sau|tiếp|tiếp theo|previous|prev|next)\s*[→›»>]?\s*$/i.test(String(ten || ''));

const PHIEN_BAN = '1.7';
const KEY_CFG = 'ita.cfg.v1', KEY_CKPT = 'ita.ckpt.v1', KEY_LAST = 'ita.last.v1', KEY_TAY = 'ita.truongtay.v1', KEY_SAP = 'ita.sap.v1';

/* --- Nhận ra tài khoản đang đăng nhập, để điểm dừng và kết quả TÁCH RIÊNG theo tài khoản ---
 * Lý do: đổi tài khoản mà dùng chung một điểm dừng thì lần chạy mới bỏ qua các mục "đã xong"
 * của tài khoản cũ và trộn kết quả hai tài khoản với nhau. */
let TK = '';
function taiKhoan() {
  try {
    const d = (cfgHienTai().dacTa) || {};
    const chon = d.vaiChon || DU_AN.chon_tai_khoan;   // [13d] hồ sơ dự án khai chỗ hiện tên tài khoản
    if (chon) { const e = document.querySelector(chon); if (e && (e.innerText || '').trim()) return e.innerText.trim().replace(/\s+/g, ' ').slice(0, 140); }
    // khối chữ ở góc phải trên cùng (thường là chức vụ + đơn vị người dùng), bỏ ô tìm kiếm và bảng điều khiển
    const W = innerWidth;
    const ds = [...document.querySelectorAll('header *, nav *, body > div *')].filter(e => {
      if (e.closest('#ita-panel-host') || e.querySelector('input,svg + svg') || e.children.length > 4) return false;
      const r = e.getBoundingClientRect(); return r.top >= 0 && r.top < 90 && r.left > W * 0.6 && r.width > 0 && r.width < W * 0.35;
    }).map(e => (e.innerText || '').trim().replace(/\s+/g, ' ')).filter(t => /\p{L}{3,}/u.test(t) && t.length < 160);
    return ds.sort((a, b) => b.length - a.length)[0] || '';
  } catch (e) { return ''; }
}
// Cờ "đang chạy" — còn lại sau khi trang tự tải lại giữa chừng thì lần nạp sau tự chạy tiếp
const KEY_RUN = 'ita.run.v1';
// [1.1] nơi mất phiên lần trước (theo tên miền + hồ sơ dự án + tài khoản): lần sau mất phiên ĐÚNG màn đó thì báo «lặp lại»
const KEY_MAT_PHIEN = 'ita.matphien.v1';
let MAT_PHIEN_LY_DO = '', MAT_PHIEN_LAP = '';

/* --- Nhật ký lưu bền: giữ lại 300 thao tác gần nhất trong trình duyệt (không mất khi trang tải lại / bị đăng xuất).
 * Dùng để biết lần chạy trước dừng ở đâu, sau thao tác nào, có lỗi 401/403 hay lệnh ghi bị chặn nào. */
const KEY_NK = 'ita.nk.v1';
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
// [1.1] khoá danh sách màn sập: theo tên miền + HỒ SƠ DỰ ÁN + tài khoản (trước chỉ tên miền + tài khoản → lẫn dữ liệu giữa dự án)
const khoaSap = tk => KEY_SAP + '|' + location.origin + '|' + bam(((window.__itaHoSo || {}).ten) || '') + '|' + bam(tk || '?');
// [1.1] hồ sơ tạm «kiểm giao diện thuần»: người dùng xác nhận đúng tên miền đang mở, mọi POST bị chặn
const KEY_HOSO_TAM = 'ita.hosotam.v1';
const docHoSoTam = () => { try { const h = JSON.parse(localStorage.getItem(KEY_HOSO_TAM + '|' + location.origin) || 'null'); return h && h.ten_mien === location.hostname ? h : null; } catch (e) { return null; } };
const taoHoSoTam = () => { const h = { ten: location.hostname + ' (giao diện thuần)', ten_mien: location.hostname, post_cho_qua: [], giao_dien_thuan: true };
  try { localStorage.setItem(KEY_HOSO_TAM + '|' + location.origin, JSON.stringify(h)); } catch (e) {} return h; };
const bam = s => { let h = 5381; for (const c of String(s)) h = ((h << 5) + h + c.codePointAt(0)) >>> 0; return h.toString(36); };
const ckptKey = () => KEY_CKPT + '|' + bam(TK || '?');
const lastKeyTK = () => KEY_LAST + '|' + bam(TK || '?');
const slugTK = () => (TK || 'khong-ro-tai-khoan').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 40).toLowerCase();
function docTay() { try { return doChuoi(localStorage.getItem(KEY_TAY) || '[]') || []; } catch (e) { return []; } }

// Chuyển RegExp <-> dạng lưu được {$re, f}
// [10b] chữ nút gần tên bước: các từ của chữ ngắn hơn nằm đúng thứ tự trong chữ dài hơn (mỗi bên ≥ 2 từ, không trùng hẳn).
// Vd «Ghi nhận nhiệm vụ» ~ «Ghi nhận nhiệm vụ được giao», «Lập buổi tuyên truyền» ~ «Lập kế hoạch buổi tuyên truyền». Chỉ là ứng viên: kết luận cần máy chủ xác nhận mã bước.
const tuNut = s => String(s || '').toLowerCase().normalize('NFC').replace(/[«»"“”'().,:;!?…\/]/g, ' ').split(/\s+/).filter(Boolean);
function ganChu(x, y) {
  const a = tuNut(x), b = tuNut(y);
  if (a.length < 2 || b.length < 2 || a.join(' ') === b.join(' ')) return false;
  const [n, d] = a.length <= b.length ? [a, b] : [b, a]; let i = 0;
  for (const w of d) if (w === n[i]) i++;
  return i === n.length;
}
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
  moHoSoDau: 'boolean', thuOTim: 'boolean', thuLoiDoc: 'boolean', giaTriTim: 'object', thuOChon: 'number',
  thuBaoMat: 'boolean',
  dacTa: 'object?', kichBan: 'object', chiChayKichBan: 'boolean',
  waitMax: 'number', idle: 'number', slowMs: 'number',
  kiemKeTruong: 'boolean', moFormDeKiemKe: 'boolean', nutMoForm: 'RegExp', maxFormMoiMan: 'number',
  moNutNghiepVu: 'boolean', boQuaNut: 'RegExp', moHoSoMoiTrangThai: 'boolean', maxTrangThai: 'number', tuTaiBaoCao: 'boolean', dungKhiMatPhien: 'boolean', mauManLoi: 'RegExp?', thuLaiLoiDaBiet: 'boolean',
  moDropdownTuyBien: 'boolean', maxMoChon: 'number', maxLuaChon: 'number', moRongMuc: 'boolean',
  truongMongDoi: 'object?',
  kiemThietKe: 'boolean', kiemNgonTu: 'boolean', kiemTroNang: 'boolean', cauTrongThem: 'object', chuanDS: 'object',
};
// [1.2] khoá KHÔNG đặt được bằng cấu hình (an toàn, hoặc đã bỏ): đặt là bị từ chối, kèm lý do
const KHOA_KHOA = {
  tenMienDuocChay: 'khoá tên miền chỉ lấy từ ho-so.json của dự án (ten_mien), hoặc từ xác nhận «kiểm giao diện thuần»',
  cheNhayCam: 'báo cáo luôn che dữ liệu nhạy cảm',
  chanGhi: 'công cụ luôn chỉ đọc', mucQuyTrinh: 'công cụ luôn chỉ đọc', moiTruongKiemThu: 'công cụ luôn chỉ đọc', tienToKiemThu: 'công cụ luôn chỉ đọc',
};
// [1.2] khoá chỉ CỘNG THÊM: giá trị người đặt được gộp «hoặc» với mặc định (và với hồ sơ dự án), không thay
const KHOA_CONG = { boQuaNut: 1, mauManLoi: 1 };
// [1.2] khoảng hợp lệ của khoá số
const KHOANG = { doSauTab: [1, 5], maxTabMoiMan: [0, 200], thuOChon: [0, 50], maxFormMoiMan: [0, 200], maxTrangThai: [0, 50], maxMoChon: [0, 200], maxLuaChon: [1, 1000], waitMax: [1000, 60000], idle: [0, 5000], slowMs: [100, 60000] };
function kiemKieu(k, v) {
  if (KHOA_KHOA[k]) return '"' + k + '" không đặt được: ' + KHOA_KHOA[k];
  const t = KIEU[k]; if (!t) return 'không có khóa cấu hình tên "' + k + '"';
  if (v == null) return t.endsWith('?') ? '' : '"' + k + '" không được để trống';
  const base = t.replace('?', '');
  if (base === 'RegExp') {
    if (!(v instanceof RegExp)) return '"' + k + '" phải là RegExp, vd /abc/i';
    return '';
  }
  if (base === 'object') return typeof v === 'object' ? '' : '"' + k + '" phải là mảng/đối tượng';
  if (typeof v !== base) return '"' + k + '" phải là ' + base;
  if (base === 'number' && KHOANG[k] && !(isFinite(v) && v >= KHOANG[k][0] && v <= KHOANG[k][1])) return '"' + k + '" phải trong khoảng ' + KHOANG[k][0] + '–' + KHOANG[k][1] + ' (đang đặt ' + v + ')';
  return '';
}

// [1.2] BỘ CẤU HÌNH: mỗi bộ đặt ĐỦ cùng một danh sách khoá (không cộng dồn bộ trước), chỉ áp cho lần chạy (không lưu), báo cáo ghi tên bộ.
// Thứ tự: mặc định ← đã lưu (ita.dat) ← bộ đang chọn ← ITA_MAC_DINH ← ITA_CONFIG ← tham số ita.chay({...}).
const BO_KHOA = ['moHoSoDau', 'thuOTim', 'thuLoiDoc', 'thuOChon', 'doSauTab', 'maxTabMoiMan', 'kiemKeTruong', 'moFormDeKiemKe', 'maxFormMoiMan', 'moNutNghiepVu', 'moDropdownTuyBien', 'moRongMuc', 'moHoSoMoiTrangThai', 'maxTrangThai', 'kiemTroNang', 'kiemThietKe', 'kiemNgonTu', 'thuBaoMat'];
const BO_CHUAN = Object.fromEntries(BO_KHOA.map(k => [k, MAC_DINH[k]]));   // «chuẩn» = đúng mặc định
const BO_CAU_HINH = {
  // bề mặt mọi màn: không mở form, hồ sơ, ô chọn, mục ẩn; tab một tầng — quét định kỳ cho nhanh
  'nhanh': Object.assign({}, BO_CHUAN, { moHoSoDau: false, thuOTim: false, thuLoiDoc: false, thuOChon: 0, doSauTab: 1, maxTabMoiMan: 10, moFormDeKiemKe: false, maxFormMoiMan: 0, moNutNghiepVu: false, moDropdownTuyBien: false, moRongMuc: false, moHoSoMoiTrangThai: false, maxTrangThai: 0 }),
  'chuan': Object.assign({}, BO_CHUAN),
  // thêm tầng tab, nhiều form, nhiều trạng thái, nhiều lựa chọn lọc — trước khi bàn giao
  'sau': Object.assign({}, BO_CHUAN, { doSauTab: 3, maxTabMoiMan: 50, maxFormMoiMan: 50, thuOChon: 12, maxTrangThai: 20 }),
  // chỉ kiểm kê trường: bỏ thử ô tìm / ô lọc, thiết kế, ngôn từ, trợ năng
  'kiem-ke-truong': Object.assign({}, BO_CHUAN, { thuOTim: false, thuLoiDoc: false, thuOChon: 0, kiemTroNang: false, kiemThietKe: false, kiemNgonTu: false }),
  'bao-mat': Object.assign({}, BO_CHUAN, { thuBaoMat: true }),
};
const BO_TEN = { 'nhanh': 'nhanh', 'chuan': 'chuan', 'day-du': 'chuan', 'sau': 'sau', 'kiem-ke-truong': 'kiem-ke-truong', 'bao-mat': 'bao-mat' };   // day-du: tên cũ
const HO_SO = BO_CAU_HINH;   // tên cũ (không phải hồ sơ dự án)

// [1.2] gộp các RegExp bằng «hoặc» (khoá chỉ cộng thêm). Gộp không được (cờ khác nhau làm mẫu không hợp lệ) thì giữ mặc định, cảnh báo.
function gopRe(...ds) {
  const re = ds.filter(r => r instanceof RegExp); if (re.length <= 1) return re[0] || null;
  const co = [...new Set(re.flatMap(r => r.flags.split('')).filter(f => 'iusm'.includes(f)))].join('');
  try { return new RegExp(re.map(r => '(?:' + r.source + ')').join('|'), co); } catch (e) { console.warn('[ita] Không gộp được mẫu ' + re.map(r => r.source.slice(0, 40)).join(' | ') + ': ' + e.message + ' — dùng mẫu mặc định.'); return re[0]; }
}
const reHoSo = s => { if (!s) return null; try { return new RegExp(String(s), 'i'); } catch (e) { console.warn('[ita] mau_man_loi trong hồ sơ không phải biểu thức hợp lệ: ' + e.message); return null; } };
// [1.2] lọc cấu hình theo kiểu + khoảng; khoá sai bị bỏ, cảnh báo một lần mỗi lỗi. Khoá nội bộ (__…) giữ nguyên.
const CFG_DA_BAO = new Set();
function locHopLe(o, nguon) {
  const r = {}; for (const k in (o || {})) { if (k.startsWith('__')) { r[k] = o[k]; continue; }
    const e = kiemKieu(k, o[k]); if (!e) { r[k] = o[k]; continue; }
    const m = '[ita] Bỏ cấu hình (' + nguon + '): ' + e; if (!CFG_DA_BAO.has(m)) { CFG_DA_BAO.add(m); console.warn(m); } }
  return r;
}
// Cấu hình đang dùng. Trả kèm (không liệt kê) __bo: tên bộ, __nguon: nguồn của từng khoá khác mặc định — báo cáo ghi lại.
function cfgHienTai(over) {
  const luu = locHopLe(docCfgLuu(), 'đã lưu bằng ita.dat'), mdDuAn = locHopLe(window.ITA_MAC_DINH, 'ITA_MAC_DINH'), tay = locHopLe(window.ITA_CONFIG, 'ITA_CONFIG'), lan = locHopLe(over, 'tham số ita.chay');
  const tenBo = BO_TEN[lan.__bo || CO.bo || ''] || '', bo = tenBo ? BO_CAU_HINH[tenBo] : {};
  const C = Object.assign({}, MAC_DINH, luu, bo, mdDuAn, tay, lan);
  C.boQuaNut = gopRe(MAC_DINH.boQuaNut, luu.boQuaNut, mdDuAn.boQuaNut, tay.boQuaNut, lan.boQuaNut);   // chỉ cộng thêm nút cấm bấm
  C.mauManLoi = gopRe(MAC_DINH.mauManLoi, reHoSo(DU_AN.mau_man_loi), luu.mauManLoi, mdDuAn.mauManLoi, tay.mauManLoi, lan.mauManLoi);
  C.tenMienDuocChay = MAC_DINH.tenMienDuocChay; C.cheNhayCam = true;   // khoá an toàn: theo hồ sơ / luôn che
  for (const k of Object.keys(KHOA_KHOA)) if (!(k in MAC_DINH)) delete C[k];
  const nguon = {};
  for (const k of Object.keys(KIEU)) {
    if (KHOA_KHOA[k] || hoaChuoi(C[k]) === hoaChuoi(MAC_DINH[k])) continue;
    nguon[k] = k in lan ? 'tham số lần chạy' : k in tay ? 'ITA_CONFIG' : k in mdDuAn ? 'ITA_MAC_DINH' : (tenBo && k in bo && hoaChuoi(bo[k]) === hoaChuoi(C[k])) ? 'bộ «' + tenBo + '»'
      : k in luu ? 'đã lưu (ita.dat)' : (k === 'mauManLoi' && DU_AN.mau_man_loi) ? 'hồ sơ dự án (mau_man_loi)' : 'gộp';
  }
  Object.defineProperty(C, '__bo', { value: tenBo || 'chuan', enumerable: false });
  Object.defineProperty(C, '__nguon', { value: nguon, enumerable: false });
  return C;
}

/* ============================================================= *
 * 3. CỜ ĐIỀU KHIỂN (dừng / tạm dừng) dùng chung cho lõi kiểm     *
 * ============================================================= */
const CO = { dung: false, tamDung: false, dangChay: false, tienDo: '', ghiKichBan: null, bo: '' };   // [1.2] bo: bộ cấu hình chọn cho lần chạy trong trang

