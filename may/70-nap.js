/* ============================================================= *
 * 7. NẠP DỮ LIỆU (bản 3.26.1, bước 6)                            *
 * Người dùng chọn tệp hoặc cả thư mục (nút «Nạp tệp», «Nạp thư   *
 * mục» trên bảng, hoặc dqtv.nap() / dqtv.napThuMuc()). Mỗi tệp đi *
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
// [bước 7d] Tệp đóng gói sẵn trong dist (cong-cu/dong_goi.py: gzip + base64 ở window.__dqtvGoiSan). Giải nén một lần.
let GOI_SAN = null;
async function docGoiSan() {
  if (GOI_SAN) return GOI_SAN;
  GOI_SAN = [];
  for (const t of window.__dqtvGoiSan || []) {
    try {
      const b = Uint8Array.from(atob(t.gz), c => c.charCodeAt(0));
      const chu = await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
      GOI_SAN.push({ ten: t.ten, chu, bam: t.bam, luc: t.luc, goi_san: true });
    } catch (e) { console.warn('[dqtv] Không giải nén được tệp đóng gói sẵn ' + t.ten + ': ' + e.message); }
  }
  return GOI_SAN;
}
// danh mục TC v7 sau ghép → khuôn của phuDanhMucTC: tc = [[mã, chỉ số loại, [chỉ số vai]]]; TC không chạy kèm lý do
function lapDanhMucV7(ds, tep) {
  const loai = [], vai = [], li = x => { let i = loai.indexOf(x); if (i < 0) { i = loai.length; loai.push(x); } return i; }, vi = x => { let i = vai.indexOf(x); if (i < 0) { i = vai.length; vai.push(x); } return i; };
  const tc = [], khong_chay = {};
  for (const o of ds) { tc.push([o.ma, li(o.loai), o.vai.map(vi)]); if (o.khong_chay) khong_chay[o.ma] = { ly_do: o.khong_chay, nhom: o.nhom || (o.cho_pm ? 'TC' : /chờ PM/.test(o.khong_chay) ? 'TC' : 'CÔNG CỤ') }; }
  return { tc, loai, vai, khong_chay, meta: { tep } };
}

function moKho() {
  return new Promise((ok, loi) => {
    const r = indexedDB.open('dqtv-kiem-tra', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('tep', { keyPath: 'ten' });
    r.onsuccess = () => ok(r.result); r.onerror = () => loi(r.error);
  });
}
async function kho(che, viec) {
  const db = await moKho();
  return new Promise((ok, loi) => {
    const tx = db.transaction('tep', che), r = viec(tx.objectStore('tep'));
    tx.oncomplete = () => { db.close(); ok(r && r.result); };
    tx.onerror = () => { db.close(); loi(tx.error); };
  });
}
const boDocCua = (ten, chu) => BO_DOC.find(b => { try { return b.nhan(ten, chu); } catch (e) { return false; } });

// Đọc lại mọi tệp đã nạp rồi đưa bảng đặc tả vào phần đối chiếu. Mỗi bảng mang tên tệp (__tep) để báo cáo ghi căn cứ.
async function apDungNap() {
  let ds;
  try { ds = (await kho('readonly', st => st.getAll())) || []; } catch (e) { console.warn('[dqtv] Không đọc được dữ liệu đã nạp: ' + e.message); ds = []; }
  // tệp đóng gói sẵn: chỉ dùng loại (bộ đọc) mà người dùng chưa tự nạp — nạp thư mục quy trình mới thì thay bộ quy trình đóng gói
  const goi = await docGoiSan(), loaiNap = new Set(ds.map(t => t.bo_doc));
  for (const t of goi) { const bd = boDocCua(t.ten, t.chu); if (bd && !loaiNap.has(bd.ten)) ds.push(Object.assign({ bo_doc: bd.ten }, t)); }
  NAP_DA_DUNG = []; DM_V7 = null; DO_PHU = null;
  if (!ds.length) return;   // chưa nạp gì: giữ nguyên (đặc tả dán Console, nếu có)
  const bang = [], gop = {};
  if (window.__dqtvTrangThaiQT) gop.trang_thai_qt = window.__dqtvTrangThaiQT;
  for (const t of ds) {
    const bd = BO_DOC.find(b => b.ten === t.bo_doc) || boDocCua(t.ten, t.chu);
    if (!bd) continue;
    try {
      const ra = bd.doc(t.ten, t.chu), dt = ra.dac_ta || [];
      for (const d of dt) bang.push(Object.assign(d, { __tep: t.ten, __bo_doc: bd.ten }));
      let so = 0; for (const [k, v] of Object.entries(ra)) if (k !== 'dac_ta' && Array.isArray(v)) { (gop[k] = gop[k] || []).push(...v); so += v.length; }
      NAP_DA_DUNG.push({ tep: t.ten, bo_doc: bd.ten, so_bang: dt.length, so_muc: so, bam: t.bam, luc: t.luc, goi_san: !!t.goi_san });
    } catch (e) { console.warn('[dqtv] Bộ đọc «' + bd.ten + '» lỗi với tệp ' + (t.goi_san ? 'đóng gói sẵn ' : 'đã nạp ') + t.ten + ': ' + e.message); }
  }
  // [bước 7c] ghép: tài liệu quy trình × TC v7 → bảng cho phần đối chiếu + danh mục TC
  for (const g of GHEP) {
    try {
      const r = g(gop); if (!r) continue;
      for (const d of r.dac_ta || []) bang.push(Object.assign(d, { __bo_doc: d.__bo_doc || 'ghép' }));
      if (r.tc && r.tc.length) DM_V7 = lapDanhMucV7(r.tc, NAP_DA_DUNG.filter(x => x.bo_doc === 'v7-tc-csv').map(x => x.tep).join(', ') || 'TC v7');
      if (r.do_phu) DO_PHU = r.do_phu;
    } catch (e) { console.warn('[dqtv] Ghép dữ liệu lỗi: ' + e.message); }
  }
  napDacTaVao.chiBoNho = true;
  try { if (bang.length) napDacTaVao(bang, true); else window.__dqtvDacTaBoNho = []; } catch (e) { console.warn('[dqtv] Không đưa được bảng đã nạp vào đối chiếu: ' + e.message); }
}

async function napTep(files) {
  const dung = [], khong = [];
  for (const f of files) {
    const ten = f.webkitRelativePath || f.name;
    const dau = new Uint8Array(await f.slice(0, 2).arrayBuffer());
    if (dau[0] === 0x50 && dau[1] === 0x4b) { khong.push({ tep: ten, ly_do: 'tệp nén (zip, xlsx…): chưa có bộ đọc cho kiểu này' }); continue; }
    const chu = await f.text(), bd = boDocCua(ten, chu);
    if (!bd) { khong.push({ tep: ten, ly_do: 'không bộ đọc nào nhận ra nội dung' }); continue; }
    let ra; try { ra = bd.doc(ten, chu); } catch (e) { khong.push({ tep: ten, ly_do: 'bộ đọc «' + bd.ten + '» lỗi: ' + e.message }); continue; }
    await kho('readwrite', st => st.put({ ten, chu, bo_doc: bd.ten, bam: bam(chu), luc: new Date().toLocaleString('vi-VN') }));
    dung.push({ tep: ten, bo_doc: bd.ten, so_bang: (ra.dac_ta || []).length });
  }
  KHONG_NHAN = khong;
  await apDungNap();
  if (dung.length) console.table(dung);
  if (khong.length) { console.warn('[dqtv] ' + khong.length + ' tệp không nhận ra, không dùng:'); console.table(khong); }
  CO.tienDo = 'Đã nạp ' + dung.length + ' tệp (' + dung.reduce((n, x) => n + x.so_bang, 0) + ' bảng)' + (khong.length ? '; ' + khong.length + ' tệp không nhận ra: ' + khong.map(x => x.tep).join(', ') : '') + '.';
  capNhatBang(); console.info('[dqtv] ' + CO.tienDo);
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

Object.assign(window.dqtv, {
  nap() { chonTep(false); return this; },
  napThuMuc() { chonTep(true); return this; },
  napTep(files) { return napTep([...files]); },
  async xemNap() {
    const ds = ((await kho('readonly', st => st.getAll())) || []).map(t => ({ 'tệp': t.ten, 'bộ đọc': t.bo_doc, 'mã băm': t.bam, 'lúc nạp': t.luc }));
    console.table(ds); if (KHONG_NHAN.length) console.table(KHONG_NHAN); return ds;
  },
  async xoaNap() {
    await kho('readwrite', st => st.clear());
    NAP_DA_DUNG = []; KHONG_NHAN = []; window.__dqtvDacTaBoNho = [];
    console.info('[dqtv] Đã xoá mọi dữ liệu đã nạp.'); return this;
  },
});
