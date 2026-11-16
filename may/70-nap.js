/* ============================================================= *
 * 7. NẠP DỮ LIỆU (bản 3.26.1, bước 6)                            *
 * Người dùng chọn tệp hoặc cả thư mục (nút «Nạp tệp», «Nạp thư   *
 * mục» trên bảng, hoặc ita.nap() / ita.napThuMuc()). Mỗi tệp đi *
 * qua các bộ đọc trong bo-doc/: bộ nào nhận ra NỘI DUNG thì đọc;  *
 * không bộ nào nhận ra thì báo «không nhận ra», không đoán.       *
 * Tệp đã nhận giữ trong IndexedDB của trình duyệt (localStorage  *
 * quá nhỏ), tải lại trang vẫn còn. Không gửi gì lên máy chủ.      *
 * ============================================================= */
// Mỗi bộ đọc (bo-doc/*.js) tự thêm vào đây: { ten, mo_ta, nhan(ten, chu) → true/false, doc(ten, chu) → { dac_ta: [bảng…] } }
const BO_DOC = [];
let NAP_DA_DUNG = [], KHONG_NHAN = [];   // tệp đang dùng (ghi vào báo cáo) · tệp không nhận ra ở lần nạp gần nhất
// [bước 7c] Hàm ghép (bo-doc/9x-*.js tự thêm vào): nhận mọi dữ liệu không phải bảng đặc tả mà các bộ đọc trả về (tài liệu quy trình, TC v7…),
// gộp theo tên khoá, trả { dac_ta, tc, do_phu }. Bảng ghép vào phần đối chiếu; danh mục TC dùng cho mục «Phủ danh mục TC».
const GHEP = [];
let DM_V7 = null, DO_PHU = null;
let TT_QT_CO = false;   // [1.3] có dữ liệu trạng thái quy trình (tệp đã nạp hoặc đóng gói sẵn)
const KEY_NAP_KHONG = 'ita.napkhong.v1';   // [1.3] tệp không nạp được ở lần nạp gần nhất (theo tên miền) — báo cáo ghi lại
// [1.3] cột của TC v7 mà bộ đọc dùng — GIỐNG cong-cu/dong_goi.py (COT_TC): nạp thư mục rút gọn như bản đóng gói
const COT_TC = ['Mã TC', 'Mã UC', 'Quy trình', 'Bước', 'Loại ca tool', 'Bộ chạy đích', 'Vai', 'Màn', 'Thao tác', 'Dữ liệu nhập', 'Kết quả mong đợi', 'Căn cứ đặc tả Bên B', 'Trạng thái TC', 'Ưu tiên'];
// tách CSV (RFC 4180: ô trong ngoặc kép, "" là dấu ngoặc kép, xuống dòng trong ô)
function tachCSV(s) {
  const rows = []; let row = [], i = 0; const n = s.length;
  if (!n) return rows;
  for (;;) {
    if (s[i] === '"') { let j = i + 1, out = ''; for (;;) { const k = s.indexOf('"', j); if (k < 0) { out += s.slice(j); i = n; break; } out += s.slice(j, k); if (s[k + 1] === '"') { out += '"'; j = k + 2; } else { i = k + 1; break; } } row.push(out); }
    else { let k = i; while (k < n && s[k] !== ',' && s[k] !== '\n' && s[k] !== '\r') k++; row.push(s.slice(i, k)); i = k; }
    if (i >= n) { rows.push(row); break; }
    if (s[i] === ',') { i++; if (i >= n) { row.push(''); rows.push(row); break; } continue; }
    if (s[i] === '\r') i++;
    if (s[i] === '\n') i++;
    rows.push(row); row = [];
    if (i >= n) break;
  }
  return rows;
}
function rutGonCSV(chu) {
  chu = chu.replace(/^\ufeff/, '');
  const nl = chu.indexOf('\n'), dau = tachCSV(nl < 0 ? chu : chu.slice(0, nl))[0] || [], idx = COT_TC.map(c => dau.indexOf(c));
  if (idx.some(i => i < 0)) return chu;   // không phải khuôn v7: giữ nguyên, bộ đọc tự quyết
  const q = v => /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  const rows = tachCSV(chu).slice(1).filter(r => !(r.length === 1 && r[0] === ''));
  return COT_TC.map(q).join(',') + '\n' + rows.map(r => idx.map(i => q(r[i] == null ? '' : r[i])).join(',')).join('\n') + (rows.length ? '\n' : '');
}
// [1.3] đọc tệp zip trong trình duyệt (không thư viện ngoài): mục lục cuối tệp, tệp con kiểu lưu thẳng (0) hoặc nén deflate (8)
async function docZip(f) {
  const b = new Uint8Array(await f.arrayBuffer()), dv = new DataView(b.buffer, b.byteOffset, b.byteLength), td = new TextDecoder();
  let e = -1; for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new Error('không thấy mục lục zip');
  const so = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true); const ra = [];
  if (p === 0xffffffff || so === 0xffff) throw new Error('zip64 chưa hỗ trợ');
  for (let k = 0; k < so; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('mục lục zip hỏng');
    const cach = dv.getUint16(p + 10, true), nen = dv.getUint32(p + 20, true), lt = dv.getUint16(p + 28, true), lx = dv.getUint16(p + 30, true), lc = dv.getUint16(p + 32, true), dau = dv.getUint32(p + 42, true);
    const ten = td.decode(b.subarray(p + 46, p + 46 + lt)); p += 46 + lt + lx + lc;
    if (ten.endsWith('/')) continue;
    ra.push({ ten, lay: async () => {
      if (dv.getUint32(dau, true) !== 0x04034b50) throw new Error('tệp con hỏng: ' + ten);
      const bd = dau + 30 + dv.getUint16(dau + 26, true) + dv.getUint16(dau + 28, true), raw = b.subarray(bd, bd + nen);
      if (cach === 0) return td.decode(raw);
      if (cach !== 8) throw new Error('kiểu nén ' + cach + ' chưa hỗ trợ');
      return await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
    } });
  }
  return ra;
}
// [1.3] tóm tắt dữ liệu dự án đang dùng: có / không, dùng cho việc gì — ita.duLieu() và mục «Dữ liệu dự án» của báo cáo
function tomTatDuLieu() {
  const hs = window.__itaHoSo, qt = window.__itaQuyTac, gh = window.__itaGioiHanO;
  const nguon = (...bd) => { const x = NAP_DA_DUNG.filter(n => bd.includes(n.bo_doc)); return !x.length ? '' : x.some(n => !n.goi_san) ? 'đã nạp' : 'đóng gói sẵn'; };
  let bang = 0; try { bang = docDacTa().length; } catch (e) {}
  const md = NAP_DA_DUNG.filter(n => n.bo_doc === 'quy-trinh-md').length;
  return [
    { muc: 'Hồ sơ dự án', co: !!hs, chi_tiet: hs ? hs.ten + (hs.giao_dien_thuan ? ' (hồ sơ tạm, giao diện thuần)' : '') : '', nguon: nguon('ho-so') || (hs ? 'đóng gói sẵn / tạm' : ''), dung_cho: 'khoá tên miền, lệnh POST được đi, tài khoản' },
    { muc: 'Sổ lỗi đã biết', co: !!(qt && (qt.loi_sap || []).length), chi_tiet: qt ? (qt.loi_sap || []).length + ' màn' : '', nguon: nguon('loi-da-biet') || (qt ? 'đóng gói sẵn' : ''), dung_cho: 'bỏ qua màn đã biết là sập; thiếu thì công cụ mở màn đó, app sập có thể làm dừng lần chạy' },
    { muc: 'Quy cách giao diện', co: !!QUY_CACH, chi_tiet: QUY_CACH ? (QUY_CACH.nguon || 'quy-cach.json') : '', nguon: nguon('quy-cach'), dung_cho: 'lệch quy cách theo dự án (thiếu: chỉ ghi nhận theo ngưỡng công cụ)' },
    { muc: 'Hồ sơ mẫu', co: !!(HO_SO_MAU && HO_SO_MAU.length), chi_tiet: HO_SO_MAU ? HO_SO_MAU.length + ' hồ sơ' : '', nguon: nguon('ho-so-mau') || (HO_SO_MAU ? 'đóng gói sẵn' : ''), dung_cho: 'mở thẳng hồ sơ theo chặng' },
    { muc: 'Tài liệu quy trình', co: md > 0, chi_tiet: md ? md + ' tệp' : '', nguon: nguon('quy-trinh-md'), dung_cho: 'căn cứ bước, vai, nút của quy trình' },
    { muc: 'TC', co: !!DM_V7, chi_tiet: DM_V7 ? DM_V7.tc.length + ' TC' : '', nguon: nguon('v7-tc-csv'), dung_cho: 'kết quả theo mã TC (thiếu: không có đối chiếu đặc tả)' },
    { muc: 'Bảng đặc tả (sau ghép)', co: bang > 0, chi_tiet: bang ? bang + ' bảng' : '', nguon: bang ? 'ghép tài liệu × TC' : '', dung_cho: 'đối chiếu đặc tả quy trình' },
    { muc: 'Giới hạn ô', co: !!(gh && gh.o), chi_tiet: gh && gh.o ? Object.keys(gh.o).length + ' tên ô' : '', nguon: nguon('gioi-han-o') || (gh ? 'đóng gói sẵn' : ''), dung_cho: 'kiểm ô theo khai báo của app' },
    { muc: 'Trạng thái quy trình', co: TT_QT_CO, chi_tiet: '', nguon: nguon('trang-thai-quy-trinh') || (TT_QT_CO ? 'đóng gói sẵn' : ''), dung_cho: 'độ phủ: tài liệu × workflow của app' },
  ];
}
const khongNhanGanNhat = () => { if (KHONG_NHAN.length) return KHONG_NHAN; try { return JSON.parse(localStorage.getItem(KEY_NAP_KHONG + '|' + location.origin) || '[]'); } catch (e) { return []; } };
// [bước 7d] Tệp đóng gói sẵn trong dist (cong-cu/dong_goi.py: gzip + base64 ở window.__itaGoiSan). Giải nén một lần.
let GOI_SAN = null;
async function docGoiSan() {
  if (GOI_SAN) return GOI_SAN;
  GOI_SAN = [];
  for (const t of window.__itaGoiSan || []) {
    try {
      const b = Uint8Array.from(atob(t.gz), c => c.charCodeAt(0));
      const chu = await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
      GOI_SAN.push({ ten: t.ten, chu, bam: t.bam, luc: t.luc, goi_san: true });
    } catch (e) { console.warn('[ita] Không giải nén được tệp đóng gói sẵn ' + t.ten + ': ' + e.message); }
  }
  return GOI_SAN;
}
// danh mục TC v7 sau ghép → khuôn của phuDanhMucTC: tc = [[mã, chỉ số loại, [chỉ số vai]]]; TC không chạy kèm lý do
function lapDanhMucV7(ds, tep) {
  const loai = [], vai = [], li = x => { let i = loai.indexOf(x); if (i < 0) { i = loai.length; loai.push(x); } return i; }, vi = x => { let i = vai.indexOf(x); if (i < 0) { i = vai.length; vai.push(x); } return i; };
  const tc = [], khong_chay = {};
  for (const o of ds) { tc.push([o.ma, li(o.loai), o.vai.map(vi)]); if (o.khong_chay) khong_chay[o.ma] = { ly_do: o.khong_chay, nhom: o.nhom || (o.cho_pm ? 'TC' : /chờ PM/.test(o.khong_chay) ? 'TC' : 'CÔNG CỤ'), chay_duoi: o.chay_duoi || '' }; }
  return { tc, loai, vai, khong_chay, meta: { tep } };
}

function moKho(ten = 'ita') {
  return new Promise((ok, loi) => {
    const r = indexedDB.open(ten, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('tep', { keyPath: 'ten' });
    r.onsuccess = () => ok(r.result); r.onerror = () => loi(r.error);
  });
}
async function kho(che, viec, ten) {
  const db = await moKho(ten);
  return new Promise((ok, loi) => {
    const tx = db.transaction('tep', che), r = viec(tx.objectStore('tep'));
    tx.oncomplete = () => { db.close(); ok(r && r.result); };
    tx.onerror = () => { db.close(); loi(tx.error); };
  });
}
// [10a] điểm dừng đầy đủ khi localStorage hết chỗ: kho riêng, không lẫn với tệp đã nạp. Chạy tiếp chỉ dùng bản của đúng lượt chạy.
const KHO_CKPT = 'ita-ckpt';
const luuCkptLon = (khoa, chu) => kho('readwrite', st => st.put({ ten: khoa, chu }), KHO_CKPT);
const xoaCkptLon = khoa => kho('readwrite', st => st.delete(khoa), KHO_CKPT).catch(() => {});
async function docCkptLon(ck) {
  let day = null; try { const x = await kho('readonly', st => st.get(ckptKey()), KHO_CKPT); day = x && doChuoi(x.chu); } catch (e) {}
  if (!day || day.luot !== ck.luot || day.tk !== ck.tk || day.origin !== ck.origin) return ck;   // không có bản đúng lượt: giữ bản gọn, báo cáo ghi mục mất kết quả
  // bản đầy đủ có thể cũ hơn bản gọn vài mục (trang tải lại khi chưa ghi xong): các mục ấy chạy lại, không mất gì
  day.sap = ck.sap; day.boQuaDoTaiLai = ck.boQuaDoTaiLai; day.matKq = ck.matKq;
  for (const m of ck.boQuaDoTaiLai || []) if (!day.xong.includes(m)) day.xong.push(m);
  return day;
}
const boDocCua = (ten, chu) => BO_DOC.find(b => { try { return b.nhan(ten, chu); } catch (e) { return false; } });

// Đọc lại mọi tệp đã nạp rồi đưa bảng đặc tả vào phần đối chiếu. Mỗi bảng mang tên tệp (__tep) để báo cáo ghi căn cứ.
async function apDungNap() {
  let ds;
  try { ds = (await kho('readonly', st => st.getAll())) || []; } catch (e) { console.warn('[ita] Không đọc được dữ liệu đã nạp: ' + e.message); ds = []; }
  // tệp đóng gói sẵn: chỉ dùng loại (bộ đọc) mà người dùng chưa tự nạp — nạp thư mục quy trình mới thì thay bộ quy trình đóng gói
  const goi = await docGoiSan(), loaiNap = new Set(ds.map(t => t.bo_doc));
  for (const t of goi) { const bd = boDocCua(t.ten, t.chu); if (bd && !loaiNap.has(bd.ten)) ds.push(Object.assign({ bo_doc: bd.ten }, t)); }
  NAP_DA_DUNG = []; DM_V7 = null; DO_PHU = null; QUY_CACH = null; HO_SO_MAU = null;
  // [1.1] hồ sơ mẫu đóng gói sẵn (dist/ita-<dự án>.js); tệp ho-so-mau.json người dùng tự nạp sẽ thay bên dưới
  { const g = window.__itaHoSoMau; if (g && g.loai === 'ho-so-mau' && Array.isArray(g.ho_so)) HO_SO_MAU = g.ho_so.filter(h => h && h.ma && /^\//.test(String(h.duong_dan || ''))).map(h => Object.assign({ quy_trinh: '', chang: '', nhan_chang: '', vai: '', tai_khoan: '' }, h)); }
  TT_QT_CO = !!window.__itaTrangThaiQT;
  if (!ds.length) return;   // chưa nạp gì: giữ nguyên (đặc tả dán Console, nếu có)
  const bang = [], gop = {};
  for (const t of ds) {
    const bd = BO_DOC.find(b => b.ten === t.bo_doc) || boDocCua(t.ten, t.chu);
    if (!bd) continue;
    try {
      const ra = bd.doc(t.ten, t.chu), dt = ra.dac_ta || [];
      for (const d of dt) bang.push(Object.assign(d, { __tep: t.ten, __bo_doc: bd.ten }));
      let so = 0; for (const [k, v] of Object.entries(ra)) if (k !== 'dac_ta' && Array.isArray(v)) { (gop[k] = gop[k] || []).push(...v); so += v.length; }
      NAP_DA_DUNG.push({ tep: t.ten, bo_doc: bd.ten, so_bang: dt.length, so_muc: so, bam: t.bam, luc: t.luc, goi_san: !!t.goi_san });
    } catch (e) { console.warn('[ita] Bộ đọc «' + bd.ten + '» lỗi với tệp ' + (t.goi_san ? 'đóng gói sẵn ' : 'đã nạp ') + t.ten + ': ' + e.message); }
  }
  if (gop.ho_so && gop.ho_so.length > 1) console.warn('[ita] Có ' + gop.ho_so.length + ' hồ sơ dự án cùng nạp (' + gop.ho_so.map(h => h.ten).join(', ') + '): dùng hồ sơ nạp sau cùng. Xoá bớt bằng «Xoá dữ liệu đã nạp» nếu không đúng.');   // [1.1]
  if (gop.ho_so && gop.ho_so.length) apHoSo(gop.ho_so[gop.ho_so.length - 1]);   // [13b] hồ sơ đã nạp thay hồ sơ đóng gói sẵn
  if (gop.quy_cach && gop.quy_cach.length) QUY_CACH = gop.quy_cach[gop.quy_cach.length - 1];
  if (gop.ho_so_mau && gop.ho_so_mau.length) HO_SO_MAU = gop.ho_so_mau;   // [1.1] dataset hồ sơ mẫu
  // [1.3] sổ lỗi đã biết, giới hạn ô, trạng thái quy trình: tệp đã nạp thay bản đóng gói sẵn
  { const sau = k => gop[k] && gop[k].length ? gop[k][gop[k].length - 1] : null;
    if (sau('loi_da_biet')) window.__itaQuyTac = sau('loi_da_biet');
    if (sau('gioi_han_o')) window.__itaGioiHanO = sau('gioi_han_o');
    const tt = sau('trang_thai_qt_tep') || window.__itaTrangThaiQT; if (tt) gop.trang_thai_qt = tt; TT_QT_CO = !!tt; }   // [13e]
  // [bước 7c] ghép: tài liệu quy trình × TC v7 → bảng cho phần đối chiếu + danh mục TC
  for (const g of GHEP) {
    try {
      const r = g(gop); if (!r) continue;
      for (const d of r.dac_ta || []) bang.push(Object.assign(d, { __bo_doc: d.__bo_doc || 'ghép' }));
      if (r.tc && r.tc.length) DM_V7 = lapDanhMucV7(r.tc, NAP_DA_DUNG.filter(x => x.bo_doc === 'v7-tc-csv').map(x => x.tep).join(', ') || 'TC v7');
      if (r.do_phu) DO_PHU = r.do_phu;
    } catch (e) { console.warn('[ita] Ghép dữ liệu lỗi: ' + e.message); }
  }
  napDacTaVao.chiBoNho = true;
  try { if (bang.length) napDacTaVao(bang, true); else window.__itaDacTaBoNho = []; } catch (e) { console.warn('[ita] Không đưa được bảng đã nạp vào đối chiếu: ' + e.message); }
}

async function napTep(files) {
  const dung = [], khong = [];
  const nhan1 = async (ten, chu) => {
    const bd = boDocCua(ten, chu);
    if (!bd) { khong.push({ tep: ten, ly_do: 'không bộ đọc nào nhận ra nội dung' }); return; }
    let ra; try { ra = bd.doc(ten, chu); } catch (e) { khong.push({ tep: ten, ly_do: 'bộ đọc «' + bd.ten + '» lỗi: ' + e.message }); return; }
    await kho('readwrite', st => st.put({ ten, chu, bo_doc: bd.ten, bam: bam(chu), luc: new Date().toLocaleString('vi-VN') }));
    dung.push({ tep: ten, bo_doc: bd.ten, so_bang: (ra.dac_ta || []).length });
  };
  for (const f of files) {
    const ten = f.webkitRelativePath || f.name;
    const dau = new Uint8Array(await f.slice(0, 2).arrayBuffer());
    if (dau[0] === 0x50 && dau[1] === 0x4b) {
      // [1.3] zip: lấy các tệp .csv bên trong (như cong-cu/dong_goi.py); tệp nén kiểu Office thì chưa đọc
      if (!/\.zip$/i.test(ten)) { khong.push({ tep: ten, ly_do: 'tệp nén kiểu Office (xlsx, docx…): chưa có bộ đọc' }); continue; }
      let con; try { con = await docZip(f); } catch (e) { khong.push({ tep: ten, ly_do: 'không giải nén được: ' + e.message }); continue; }
      for (const c of con) {
        if (!/\.csv$/i.test(c.ten)) { khong.push({ tep: ten + '/' + c.ten, ly_do: 'trong zip chỉ đọc tệp .csv (như bản đóng gói)' }); continue; }
        let chu; try { chu = rutGonCSV(await c.lay()); } catch (e) { khong.push({ tep: ten + '/' + c.ten, ly_do: 'không giải nén được: ' + e.message }); continue; }
        await nhan1(ten + '/' + c.ten, chu);
      }
      continue;
    }
    let chu = await f.text(); if (/\.csv$/i.test(ten)) chu = rutGonCSV(chu);   // [1.3] rút gọn TC như bản đóng gói
    await nhan1(ten, chu);
  }
  KHONG_NHAN = khong; try { localStorage.setItem(KEY_NAP_KHONG + '|' + location.origin, JSON.stringify(khong.slice(0, 200))); } catch (e) {}
  await apDungNap();
  if (dung.length) console.table(dung);
  if (khong.length) { console.warn('[ita] ' + khong.length + ' tệp không nhận ra, không dùng:'); console.table(khong); }
  CO.tienDo = 'Đã nạp ' + dung.length + ' tệp (' + dung.reduce((n, x) => n + x.so_bang, 0) + ' bảng)' + (khong.length ? '; ' + khong.length + ' tệp không nhận ra: ' + khong.map(x => x.tep).join(', ') : '') + '.';
  capNhatBang(); console.info('[ita] ' + CO.tienDo);
  return { dung, khong_nhan: khong };
}

// Mở hộp chọn tệp của trình duyệt (phải gọi từ một cú bấm)
function chonTep(thuMuc) {
  const i = document.createElement('input');
  i.type = 'file'; i.multiple = true;
  if (thuMuc) i.webkitdirectory = true;
  i.onchange = () => { if (i.files.length) napTep([...i.files]); };
  i.click();
}

Object.assign(window.ita, {
  nap() { chonTep(false); return this; },
  napThuMuc() { chonTep(true); return this; },
  napTep(files) { return napTep([...files]); },
  // [1.3] dữ liệu dự án đang dùng: có / không, nguồn, dùng cho việc gì
  duLieu() { const ds = tomTatDuLieu(); console.table(ds.map(x => ({ 'mục': x.muc, 'có': x.co ? '✔' : '✘', 'chi tiết': x.chi_tiet, 'nguồn': x.nguon, 'dùng cho': x.dung_cho }))); const k = khongNhanGanNhat(); if (k.length) { console.warn('[ita] Tệp không nạp được ở lần nạp gần nhất:'); console.table(k); } return ds; },
  async xemNap() {
    const ds = ((await kho('readonly', st => st.getAll())) || []).map(t => ({ 'tệp': t.ten, 'bộ đọc': t.bo_doc, 'mã băm': t.bam, 'lúc nạp': t.luc }));
    console.table(ds); if (KHONG_NHAN.length) console.table(KHONG_NHAN); return ds;
  },
  async xoaNap() {
    await kho('readwrite', st => st.clear());
    NAP_DA_DUNG = []; KHONG_NHAN = []; window.__itaDacTaBoNho = [];
    console.info('[ita] Đã xoá mọi dữ liệu đã nạp.'); return this;
  },
});
