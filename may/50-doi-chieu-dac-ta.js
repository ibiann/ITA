/* ============================================================= *
 * ĐẶC TẢ QUY TRÌNH (UC) — nạp vào công cụ, đối chiếu ngay khi chạy
 *   Bảng đặc tả theo mẫu MauDacTa_QuyTrinh_DQTV (YAML → JSON).
 *   ita.napDacTa(...) lưu vào trình duyệt; mỗi lần chạy xong công cụ
 *   tự đối chiếu và thêm mục "Đối chiếu đặc tả quy trình" vào báo cáo.
 * ============================================================= */
/* <<DACTA-BAT-DAU>> */
const KEY_DACTA = 'ita.dacta.v1';
// Màn mọi vai đều thấy (DQTV: «Việc của tôi»), tiền tố tên tài khoản, mã yêu cầu sửa: lấy từ hồ sơ dự án
let VC = {}, TIEN_TO_TK = null;
function apHoSoDoiChieu() { VC = DU_AN.man_viec_chung || {}; TIEN_TO_TK = DU_AN.tien_to_tai_khoan ? new RegExp(DU_AN.tien_to_tai_khoan) : null; }
apHoSoDoiChieu();
const laManVC = dd => !!VC.duong_dan && String(dd || '').includes(VC.duong_dan.replace(/^.*\//, ''));
const maYC = k => (DU_AN.ma_yeu_cau || {})[k] ? ' (' + DU_AN.ma_yeu_cau[k] + ')' : '';
// Bộ đặc tả lớn (hơn 100 bảng) có thể vượt hạn mức lưu của trình duyệt: khi đó giữ trong bộ nhớ của trang cho lần dán này.
function docDacTa() {
  if (Array.isArray(window.__itaDacTaBoNho)) return window.__itaDacTaBoNho;
  try { const x = JSON.parse(localStorage.getItem(KEY_DACTA) || '[]'); return Array.isArray(x) ? x : []; } catch (e) { return []; }
}
function luuDacTa(ds) {
  if (napDacTaVao.chiBoNho) { window.__itaDacTaBoNho = ds; return 'bo_nho'; }   // [S2] bộ đóng gói: chỉ giữ trong trang
  try { localStorage.setItem(KEY_DACTA, JSON.stringify(ds)); window.__itaDacTaBoNho = null; return 'luu'; }
  catch (e) { try { localStorage.removeItem(KEY_DACTA); } catch (e2) {} window.__itaDacTaBoNho = ds; return 'bo_nho'; }
}
// Tài khoản khớp nhãn đăng nhập của vai. Bỏ chữ viết tắt ở đầu (BD, PK, TQ…) ở cả hai bên:
// ứng dụng chỉ hiện chữ viết tắt này ở cửa sổ rộng, cửa sổ hẹp thì mất.
function khopTK(tk, nhan) {
  if (!nhan) return false;
  const bo = x => String(x || '').replace(/\*/g, '').replace(/\s+/g, ' ').trim().replace(TIEN_TO_TK || /(?!)/, '').toLowerCase();
  const a = bo(tk), b = bo(nhan);
  return !!b && a.startsWith(b);
}
function maQT(d) { const dd = (d && d.dinh_danh) || {}; return dd.ma_qt || dd.ma_ben_b || dd.ma || dd.ten || '?'; }
function napDacTaVao(x, thay) {
  let ds = x; if (typeof ds === 'string') ds = JSON.parse(ds);
  if (!Array.isArray(ds)) ds = [ds];
  ds = ds.filter(d => d && d.dinh_danh).map(d => Object.assign({ buoc: [] }, d));   // bảng chưa có bước (chỉ có màn, trường) vẫn nạp
  if (!ds.length) throw new Error('không thấy bảng đặc tả hợp lệ (cần dinh_danh và buoc)');
  // thay = true (bộ đóng gói sẵn): thay cả bộ cũ, để bảng của bản đóng gói trước (mã cũ) không còn sót lại
  const cu = thay ? [] : docDacTa().filter(d => !ds.some(n => maQT(n) === maQT(d)));
  const moi = cu.concat(ds);
  napDacTaVao.noiLuu = luuDacTa(moi);
  return moi;
}
// chữ thường, bỏ dấu *, gộp khoảng trắng (giữ dấu tiếng Việt)
// [S5] nguồn đã được duyệt (khác điểm đã duyệt = LỆCH); còn lại là tài liệu Bên B chưa duyệt / đề xuất = CẢNH BÁO
// [3.26.1] không mặc định nguồn nào là đã duyệt: dữ liệu nạp vào phải tự khai nguon_da_duyet. Chưa khai thì mọi chỗ khác đặc tả là CẢNH BÁO.
const nguonDaDuyet = n => ((window.__itaQuyTac || {}).nguon_da_duyet || []).includes(n);
// căn cứ của một dòng: tệp, bảng, mục trong bảng (phần mã ca sau mã bảng), nguồn của mục
const canCuDT = (dt, maCa, nguon) => { const m = maQT(dt); return (dt.__tep ? 'tệp ' + dt.__tep + ' › ' : '') + 'bảng ' + m + ' › ' + (String(maCa).startsWith(m + '.') ? String(maCa).slice(m.length + 1) : maCa) + ' · nguồn mục: ' + (nguon || 'không ghi'); };
const KET_LUAN = new Set(['ĐẠT', 'LỆCH', 'CẢNH BÁO']);
const chuanDT = s => String(s == null ? '' : s).replace(/\*/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const duongDanDT = u => String(u || '').replace(/^https?:\/\/[^/]+/, '').split(/[?#]/)[0];
const mauDuongDanDT = p => p ? new RegExp('^' + String(p).split('{id}').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^/]+') + '$') : null;

// giá trị điền sẵn là một bản ghi (có mã định danh) thì không chép ra: thường là tên người, số hồ sơ
const giaTriGon = v => /\[mã: [0-9a-f]{8}-[0-9a-f]{4}-/i.test(String(v)) ? 'một bản ghi (không chép giá trị)' : '"' + String(v).replace(/\d{9,}/g, x => x.slice(0, 2) + '…') + '"';
function doiChieuDacTa(kq, dsDT) {
  const KQ = [];
  // [3.26.1] mọi dòng đi qua đây. Kết luận (ĐẠT / LỆCH / CẢNH BÁO) phải có căn cứ là một mục trong bảng đã nạp và có quan sát.
  // Bảng khung (sinh từ chính giao diện) không phải căn cứ. Thiếu căn cứ → GHI NHẬN; thiếu quan sát → CHƯA KIỂM.
  const them = (dt, r) => {
    r.can_cu = r.kq === 'GHI NHẬN' || r.loai_bang === 'khung' ? '' : canCuDT(dt, r.ma, r.nguon);
    if (KET_LUAN.has(r.kq) && !r.can_cu) { r.dg = (r.dg || '') + ' — không có căn cứ: ' + (r.loai_bang === 'khung' ? 'bảng khung sinh từ chính giao diện' : 'đặc tả không nói'); r.kq = 'GHI NHẬN'; }
    else if (KET_LUAN.has(r.kq) && !r.dg) r.kq = 'CHƯA KIỂM';
    KQ.push(r);
  };
  const SAPS = kq.man_sap || kq.man_loi_nang || [];
  const manSapCua = dd => { if (!dd) return null; const goc = duongDanDT(String(dd).split('/{id}')[0]).replace(/\/+$/, ''); return SAPS.find(x => x.duong_dan && (x.duong_dan === goc || x.duong_dan.startsWith(goc + '/'))) || null; };
  const nhanLoiBiet = sx => sx.loi_da_biet ? ' — LỖI ĐÃ BIẾT ' + sx.loi_da_biet.ma + (sx.loi_da_biet.yc ? '/' + sx.loi_da_biet.yc : '') : ' — lỗi mới, cần báo';
  const laFormSua = b => /^(sửa|cập nhật|chỉnh sửa|điều chỉnh)\b/i.test(String((b && (b.nut || b.ten)) || '').trim());
  const man = (kq.man_da_kiem || []).map(m => ({ ten: m.tab || '', url: duongDanDT(m.url), nut: String(m.nut_tren_man || '').split(' · ').map(s => s.trim()).filter(Boolean) }));
  const boQua = kq.bo_qua_khong_bam || [], forms = kq.form_da_mo || [], TR = kq.danh_muc_truong || [];
  const tk = chuanDT(kq.tai_khoan);
  const manDuoi = dd => { if (!dd) return null; const goc = String(dd).split('/{id}')[0]; return new Set(man.filter(m => m.url.startsWith(goc)).map(m => m.ten)); };
  // các nút thấy được (chữ → cách thấy) trên những màn khớp đường dẫn
  function nutThay(dd, locTen) {
    const mau = mauDuongDanDT(dd), duoi = manDuoi(dd);
    let khop = man.filter(m => !mau || mau.test(m.url));
    if (locTen) khop = khop.filter(locTen);
    const ten = new Set(khop.map(m => m.ten)); const r = new Map();
    const them = (k, c) => { if (!k) return; if (!r.has(k)) r.set(k, new Set()); r.get(k).add(c); };
    for (const m of khop) for (const n of m.nut) them(n, 'nút trên màn');
    for (const f of forms) { const [mm, phan] = String(f).split(' | '); const g = /«(.+?)»/.exec(phan || ''); if (g && (!dd || ten.has((mm || '').trim()))) them(g[1], 'đã mở form'); }
    if (!locTen) for (const t of TR) if (/^form trên màn/.test(t.vung || '') && (!duoi || duoi.has(t.man))) them(String(t.man || '').split(' › ').pop(), 'đã mở form');
    for (const b of boQua) if (!dd || ten.has(b.man)) them(b.chu, 'bỏ qua: ' + (b.ly_do || ''));
    for (const t of TR) { const g = /^nút «(.+?)»/.exec(t.vung || ''); if (g && (!dd || ten.has(t.man))) them(g[1], (t.loai || '') + ' ' + (t.ghi_chu || '') + ' ' + (t.loi || '')); }
    return { r, khop };
  }
  const truongForm = (nut, dd) => { const duoi = manDuoi(dd); return TR.filter(t => ((t.vung || '').includes('«' + nut + '»') || (String(t.man || '').endsWith('› ' + nut) && /^form trên màn/.test(t.vung || '')))
    && !/cột bảng|trường hiển thị|^nút «/.test(t.vung || '') && !['cột bảng', 'hiển thị'].includes(t.loai) && !/^nút/.test(t.loai || '') && (!duoi || duoi.has(t.man))); };
  const vctCo = nut => forms.some(f => !!VC.nhan && f.startsWith(VC.nhan) && f.includes('«' + nut + '»'));
  // [10b][10c] danh sách bước máy chủ trả kèm hồ sơ (mã bước, chữ, được làm không): đối chiếu nút theo mã bước, không theo chữ
  const BM = kq.buoc_may_chu || [], mayTheoMa = new Map(), tuyenCoBM = new Set(BM.map(x => x.tuyen)), AX = (kq.kiem_tro_nang || {}).ds || [];
  for (const x of BM) { if (!mayTheoMa.has(x.action)) mayTheoMa.set(x.action, []); mayTheoMa.get(x.action).push(x); }
  const boCuoi = u => String(u || '').replace(/\/+$/, '');
  const mayTren = (b, khopMan) => (b.ma_app ? mayTheoMa.get(b.ma_app) || [] : []).filter(x => khopMan.some(m => boCuoi(m.url) === x.tuyen));
  // nút gần chữ (ganChu) trên các màn đã quét, bỏ chữ trùng hẳn tên một bước khác của quy trình
  const nutGan = (rr, nut, tenBuoc) => [...rr.keys()].filter(k => !tenBuoc.has(k) && ganChu(k, nut));
  const tenMay = x => 'bước ' + x.action + (x.label ? ' «' + x.label + '»' : '') + ' ở ' + x.tuyen;

  for (const dt of dsDT) {
    const ma = maQT(dt);
    const loaiBang = Array.isArray(dt.ban_giao) ? 'chuỗi' : ((dt.mau || {}).loai_bang === 'khung' ? 'khung' : 'đặc tả');
    // chuỗi khép kín: kiểm các điểm bàn giao thấy được trên giao diện; phần chạy trọn chuỗi là lớp 4
    if (Array.isArray(dt.ban_giao)) {
      const ghiC = (muc, maCa, ketQua, dg, nguon) => them(dt, { quy_trinh: ma, muc, ma: maCa, vai: '—', kq: ketQua, dg, nguon: nguon || '', loai_bang: loaiBang });
      for (const bg of dt.ban_giao) {
        const k = bg.kiem_lop3; const ten = bg.ma + ' ' + ((bg.tu || {}).qt || '') + ' → ' + ((bg.den || {}).qt || '');
        if (!k || !k.vai || !khopTK(kq.tai_khoan, k.vai)) continue;
        const { r } = nutThay(k.man);
        const co = k.nut && (r.has(k.nut) || vctCo(k.nut));
        const lech = nguonDaDuyet(bg.nguon) ? 'LỆCH' : 'CẢNH BÁO';
        if (k.nut) them(dt, { quy_trinh: ma, muc: 'Bàn giao ' + ten, ma: ma + '.' + bg.ma + '.NUT', vai: k.vai, kq: co ? 'ĐẠT' : lech, dg: co ? 'thấy nút "' + k.nut + '" ở bên nhận' : 'bên nhận không thấy nút "' + k.nut + '" ở ' + k.man, nguon: bg.nguon, loai_bang: loaiBang });
        if (k.nut && (bg.truong_noi || k.can_truong)) {
          const ft = truongForm(k.nut, k.man).map(t => chuanDT(t.nhan));
          const can = k.can_truong ? [k.can_truong] : [];
          if (!ft.length) them(dt, { quy_trinh: ma, muc: 'Bàn giao ' + ten, ma: ma + '.' + bg.ma + '.TRUONG_NOI', vai: k.vai, kq: 'CHƯA KIỂM', dg: 'chưa đọc được form "' + k.nut + '"', nguon: bg.nguon, loai_bang: loaiBang });
          else if (can.length) { const ok = can.every(x => ft.includes(chuanDT(x))); them(dt, { quy_trinh: ma, muc: 'Bàn giao ' + ten, ma: ma + '.' + bg.ma + '.TRUONG_NOI', vai: k.vai, kq: ok ? 'ĐẠT' : lech, dg: ok ? 'form có trường "' + can.join(', ') + '"' : 'form thiếu trường "' + can.join(', ') + '"', nguon: bg.nguon, loai_bang: loaiBang }); }
          else them(dt, { quy_trinh: ma, muc: 'Bàn giao ' + ten, ma: ma + '.' + bg.ma + '.TRUONG_NOI', vai: k.vai, kq: 'CHƯA KIỂM', dg: 'chưa xác định trường nối trên form (đặc tả không ghi nhãn trường nối); form hiện có: ' + [...new Set(truongForm(k.nut, k.man).map(t => t.nhan))].join(', '), nguon: bg.nguon, loai_bang: loaiBang });
        }
      }
      if (KQ.some(x => x.quy_trinh === ma)) {
        for (const x of (dt.bat_bien_chuoi || [])) ghiC('Quy tắc chuỗi', ma + '.' + x.ma, 'LỚP 4', x.mo_ta + ': ' + x.bieu_thuc, x.nguon);
        for (const x of (dt.kich_ban_chuoi || [])) ghiC('Kịch bản chuỗi', ma + '.' + x.ma, 'LỚP 4', x.ten + ': ' + (x.chuoi || []).join(' → '), x.nguon);
      }
      continue;
    }
    const vaiDT = (dt.vai || []).find(v => khopTK(kq.tai_khoan, v.nhan_dang_nhap));
    const v = vaiDT ? vaiDT.ma : null, vaiHien = v || 'ngoài đặc tả';
    const tt = Object.fromEntries((dt.trang_thai || []).map(s => [s.ma, s]));
    const truong = Object.fromEntries((dt.truong || []).map(t => [t.ma, t]));
    const ghi = (muc, maCa, ketQua, dg, nguon, pl) => them(dt, Object.assign({ quy_trinh: ma, muc, ma: maCa, vai: vaiHien, kq: ketQua, dg, nguon: nguon || '', loai_bang: loaiBang }, pl || {}));
    const tenBuoc = new Set((dt.buoc || []).map(b => b.nut).filter(Boolean));
    const lech = n => nguonDaDuyet(n) ? 'LỆCH' : 'CẢNH BÁO';

    // 1. quyền xem
    // màn Việc của tôi ai cũng thấy: không dùng làm màn của quy trình khi xét quyền xem
    const b0 = (dt.buoc || []).find(b => b.duong_dan_man && !/\{id\}/.test(b.duong_dan_man) && !laManVC(b.duong_dan_man));
    if (b0) {
      const goc = b0.duong_dan_man, thay = man.some(m => m.url.startsWith(goc));
      const q = (dt.quyen_du_lieu || []).find(x => x.vai === v && (x.hanh_dong || []).includes('xem')) || (dt.quyen_xem || []).find(x => x.vai === v);
      const sxX = manSapCua(goc);
      if (sxX) ghi('Quyền xem', ma + '.XEM', 'CHƯA KIỂM', 'màn ' + goc + (sxX.bo_truoc ? ' không mở (đã biết là sập)' : ' sập khi mở') + nhanLoiBiet(sxX), q ? q.nguon : '');
      else if (q && q.chi_xem) ghi('Quyền xem', ma + '.XEM', thay ? 'ĐẠT' : 'CHƯA KIỂM', 'đặc tả: chỉ xem ' + q.chi_xem + '; giao diện ' + (thay ? 'có' : 'không') + ' thấy màn ' + goc, q.nguon);
      else if (q) ghi('Quyền xem', ma + '.XEM', thay ? 'ĐẠT' : lech(q.nguon), thay ? 'thấy màn ' + goc : 'đặc tả cho xem, giao diện không thấy màn ' + goc, q.nguon);
      else ghi('Quyền xem', ma + '.XEM', 'GHI NHẬN', 'đặc tả không ghi quyền xem của vai này; giao diện ' + (thay ? 'có' : 'không') + ' thấy màn ' + goc, '');
    }
    // 2. từng bước
    const khongVao = [];
    // [3.25] đã mở được ít nhất một màn của quy trình chưa (để "không thấy" mới là bằng chứng)
    const manKhai = [].concat((dt.man_danh_sach || []).map(x => x.duong_dan), (dt.buoc || []).map(x => x.duong_dan_man)).filter(dd => dd && !laManVC(dd)), coManKhai = manKhai.length > 0;
    const coManQT = [].concat((dt.man_danh_sach || []).map(x => x.duong_dan), (dt.buoc || []).map(x => x.duong_dan_man)).filter(Boolean).some(dd => { const g = duongDanDT(String(dd).split('/{id}')[0]).replace(/\/+$/, ''); return g && !laManVC(g) && man.some(m => m.url === g || m.url.startsWith(g + '/')); });
    for (const b of (dt.buoc || [])) {
      const mb = ma + '.' + b.ma, ng = b.nguon, ten = b.ma + ' ' + (b.ten || ''); let nut = b.nut;
      if (!v && b.loai_buoc !== 'he_tu_lam' && !nut) continue;   // vai ngoài đặc tả: chỉ kiểm không thấy nút
      if (b.loai_buoc === 'he_tu_lam') {   // [S13] bước hệ thống tự làm (phiên auto): không vai nào được thấy nút
        const nutHT = b.ten; const { r: rrHT } = nutThay(b.duong_dan_man);
        if (nutHT && (rrHT.has(nutHT) || vctCo(nutHT))) ghi(ten, mb + '.HE_THONG', lech(ng), '[AUTO-BƯỚC] người dùng thấy nút «' + nutHT + '» của bước hệ thống tự làm (' + [...(rrHT.get(nutHT) || [])].join('; ') + ')' + (maYC('buoc_he_thong') ? ' —' + maYC('buoc_he_thong').slice(1, -1) : ''), ng);
        else if (coManQT) ghi(ten, mb + '.HE_THONG', 'ĐẠT', 'đã mở màn của quy trình, không thấy nút «' + nutHT + '» của bước hệ thống tự làm', ng);
        else ghi(ten, mb + '.HE_THONG', 'CHƯA KIỂM', '[AUTO-BƯỚC] chưa mở được màn nào của quy trình để kiểm nút của bước hệ thống tự làm', ng);
        continue;
      }
      if (ng === 'CAN_BO_SUNG' || !nut) { ghi(ten, mb, 'CHƯA KIỂM', 'đặc tả chưa có nút hoặc vai cho bước này', ng); continue; }
      { const sx = manSapCua(b.duong_dan_man) || (dt.man_danh_sach || []).map(x => manSapCua(x.duong_dan)).find(Boolean); if (sx) { ghi(ten, mb + '.DUNG', 'CHƯA KIỂM', 'bị chặn: màn ' + sx.duong_dan + (sx.bo_truoc ? ' không mở (đã biết là sập)' : ' sập khi chạy') + (sx.loi_da_biet ? ' — LỖI ĐÃ BIẾT ' + sx.loi_da_biet.ma + (sx.loi_da_biet.yc ? '/' + sx.loi_da_biet.yc : '') : ' — lỗi mới, cần báo') , ng); continue; } }   // [S1]
      // bước chỉ có ở chế độ khác chế độ của môi trường kiểm (vd chỉ khi tình trạng khẩn cấp): không được hiện nút
      const ckKiem = (dt.che_do && dt.che_do.khi_kiem) || {};
      const ngoaiCheDo = b.chi_khi_che_do && Object.entries(b.chi_khi_che_do).some(([k, ds]) => ckKiem[k] != null && ![].concat(ds).includes(ckKiem[k]));
      if (ngoaiCheDo) {
        const { r: rr0 } = nutThay(b.duong_dan_man);
        if (rr0.has(nut) || vctCo(nut)) ghi(ten, mb + '.SAI_CHE_DO', lech(ng), 'bước chỉ có khi ' + JSON.stringify(b.chi_khi_che_do) + ' nhưng nút "' + nut + '" hiện ở chế độ ' + JSON.stringify(ckKiem), ng);
        else ghi(ten, mb + '.SAI_CHE_DO', 'ĐẠT', 'không hiện nút "' + nut + '" ở chế độ ' + JSON.stringify(ckKiem), ng);
        continue;
      }
      const duoc = (b.vai || []).includes(v);
      // sai chặng: hồ sơ ở chặng khác chặng được làm thì không có nút (chỉ xét màn hồ sơ đã mở có nhãn chặng)
      if (duoc && b.duong_dan_man && /\{id\}/.test(b.duong_dan_man) && b.tu) {
        const duocTT = new Set([].concat(b.tu_hop_le || b.tu));
        const khac = Object.values(tt).filter(x => x.nhan && !duocTT.has(x.ma));
        const thay = [], daXem = [], ganTT = [];
        for (const x of khac) {
          const o = nutThay(b.duong_dan_man, m => m.ten.includes('«' + x.nhan + '»'));
          if (!o.khop.length) continue;
          daXem.push(x.nhan); if (o.r.has(nut) && ![...o.r.get(nut)].some(c => /khoá/.test(c))) thay.push(x.nhan); else if (!o.r.has(nut)) for (const g of nutGan(o.r, nut, tenBuoc)) ganTT.push('«' + x.nhan + '»:  + g + ');
        }
        if (!thay.length && ganTT.length) ghi(ten, mb + '.SAI_TRANG_THAI', 'CHƯA KIỂM', 'không thấy nút đúng chữ "' + nut + '" ở hồ sơ sai chặng; có nút gần chữ ' + ganTT.slice(0, 3).join(', ') + ' — chưa biết là nút của bước này', ng, PL_MX.gan);
        else if (thay.length) ghi(ten, mb + '.SAI_TRANG_THAI', lech(ng), 'nút "' + nut + '" hiện ở hồ sơ chặng ' + thay.map(x => '«' + x + '»').join(', ') + ' (chỉ được làm ở ' + [...duocTT].map(m => '«' + ((tt[m] || {}).nhan || m) + '»').join(', ') + ')', ng);
        else if (daXem.length) ghi(ten, mb + '.SAI_TRANG_THAI', 'ĐẠT', 'không thấy nút ở hồ sơ chặng ' + daXem.map(x => '«' + x + '»').join(', '), ng);
      }
      // trạng thái hồ sơ chỉ xét khi nút nằm trên hồ sơ của chính quy trình (đường dẫn có {id})
      const nhanTT = b.tu && tt[b.tu] && (!b.duong_dan_man || /\{id\}/.test(b.duong_dan_man)) ? tt[b.tu].nhan : null;
      const { r: tatCa, khop: manRoute } = nutThay(b.duong_dan_man);
      const coO = (rr) => rr.has(nut) || vctCo(nut);
      const cach = rr => [...(rr.get(nut) || [])].join('; ') + (vctCo(nut) ? '; có ở ' + VC.nhan : '');
      if (!duoc) {
        const mayV = mayTren(b, manRoute), choV = mayV.filter(x => x.allowed), ganV = coO(tatCa) ? [] : nutGan(tatCa, nut, tenBuoc);
        if (choV.length) ghi(ten, mb + '.SAI_VAI', lech(ng), 'máy chủ cho tài khoản này làm ' + tenMay(choV[0]) + (coO(tatCa) ? '; màn có nút "' + nut + '"' : ganV.length ? '; màn có nút gần chữ "' + ganV[0] + '"' : '') + '; tài liệu/TC ghi vai khác', ng, PL_MX.appChoVai);
        else if (coO(tatCa)) { const c = cach(tatCa), camMa = mayV.length && !/khoá/.test(c); ghi(ten, mb + '.SAI_VAI', lech(ng), 'vai không được làm bước này nhưng thấy nút "' + nut + '" (' + c + ')' + (camMa ? '; máy chủ không cho làm (' + tenMay(mayV[0]) + ') mà nút vẫn bấm được' : ''), ng, camMa ? PL_MX.hienKhiMayCam : null); }
        else if (ganV.length) ghi(ten, mb + '.SAI_VAI', 'CHƯA KIỂM', 'không thấy nút đúng chữ "' + nut + '"; có nút gần chữ "' + ganV.join('", "') + '" (' + [...(tatCa.get(ganV[0]) || [])].join('; ') + ') — chưa biết là nút của bước này', ng, PL_MX.gan);
        else if (b.duong_dan_man && !manRoute.length) khongVao.push(b.ma);   // màn không mở được: gộp một dòng, không đếm ĐẠT từng bước
        else if (b.duong_dan_man || coManQT) ghi(ten, mb + '.SAI_VAI', 'ĐẠT', (b.duong_dan_man ? 'đã mở màn ' + b.duong_dan_man + ', không thấy nút "' : 'đã mở màn của quy trình, không thấy nút: "') + nut + '"', ng);
        else if (coManKhai) khongVao.push(b.ma);   // màn của quy trình có khai nhưng vai này không vào được: gộp một dòng như cũ
        else ghi(ten, mb + '.SAI_VAI', 'CHƯA KIỂM', 'không đủ căn cứ: đặc tả không ghi màn của quy trình (CK-5) nên "không thấy nút" chưa chứng minh được', ng);   // [3.25] không đánh ĐẠT khi vắng bằng chứng
        continue;
      }
      if (b.duong_dan_man && !manRoute.length && !vctCo(nut)) { ghi(ten, mb + '.DUNG', 'CHƯA KIỂM', 'vai này không mở được màn ' + b.duong_dan_man, ng); continue; }
      // đúng vai: tìm nút ở hồ sơ đúng trạng thái "tu"
      let rr = tatCa, manRR = manRoute, coSo = '';
      if (nhanTT) { const o = nutThay(b.duong_dan_man, m => m.ten.includes('«' + nhanTT + '»')); rr = o.r; manRR = o.khop; coSo = o.khop.length ? '' : 'chưa mở được hồ sơ ở trạng thái «' + nhanTT + '»'; }
      // [10b][10c] không thấy đúng chữ: nút gần chữ + máy chủ xác nhận mã bước trên chính màn đó → là nút của bước
      const mayD = mayTren(b, manRR), choD = mayD.filter(x => x.allowed), ganD = coO(rr) ? [] : nutGan(rr, nut, tenBuoc);
      const nutGoc = nut; let nutX = nut;
      if (ganD.length === 1 && choD.length) nutX = ganD[0];
      if (rr.has(nutX) || vctCo(nutX)) {
        const ck = [...(rr.get(nutX) || [])].join('; ') + (vctCo(nutX) ? '; có ở ' + VC.nhan : '');
        ghi(ten, mb + '.DUNG', 'ĐẠT', 'thấy nút "' + nutX + '" (' + ck + ')' + (nutX !== nutGoc ? '; chữ nút khác TC/tài liệu "' + nutGoc + '" — máy chủ trả ' + tenMay(choD[0]) + ' (ghi chú cho Bên B: chữ nút khác tên bước khai báo)' : '') + (/khoá/.test(ck) ? '. Nút đang khoá' : ''), ng);
        if (/khoá/.test(ck)) {
          if (/không ghi lý do/.test(ck) && !(b.khoa_khi || []).length) ghi(ten, mb + '.LY_DO_KHOA', 'GHI NHẬN', 'nút "' + nut + '" đang khoá, không ghi lý do; đặc tả không ghi lý do khoá', ng);
          else if ((b.khoa_khi || []).length) { const lyDo = b.khoa_khi.map(k => k.ly_do_hien).filter(Boolean); const khop = lyDo.some(x => ck.includes(x)); ghi(ten, mb + '.LY_DO_KHOA', khop ? 'ĐẠT' : lech(ng), khop ? 'lý do khoá đúng đặc tả' : 'lý do khoá khác đặc tả (' + lyDo.join(' / ') + '): ' + ck, ng); }
        }
      }
      else if (coSo) { ghi(ten, mb + '.DUNG', 'CHƯA KIỂM', coSo, ng); continue; }
      else if (ganD.length) { ghi(ten, mb + '.DUNG', 'CHƯA KIỂM', 'không thấy nút đúng chữ "' + nut + '"; có nút gần chữ "' + ganD.join('", "') + '" (' + [...(rr.get(ganD[0]) || [])].join('; ') + ')' + (choD.length ? '; nhiều nút gần chữ' : mayD.length ? '; máy chủ không cho làm bước ' + b.ma_app + ' ở màn này' : '; màn không có danh sách bước của máy chủ') + ' — chưa đối chiếu được mã bước ' + (b.ma_app || '(tài liệu không ghi)'), ng, PL_MX.gan); continue; }
      else if (choD.length) {
        const con = choD.filter(x => !['done', 'n/a'].includes(x.kind));
        if (con.length) ghi(ten, mb + '.DUNG', lech(ng), 'máy chủ cho làm ' + tenMay(con[0]) + (con[0].ready ? '' : ' (chưa sẵn, máy chủ ghi lý do: ' + (con[0].ly_do || con[0].kind) + ')') + ' mà màn không có nút "' + nut + '" hay nút gần chữ', ng, PL_MX.mayChoKhongNut);
        else ghi(ten, mb + '.DUNG', 'CHƯA KIỂM', 'máy chủ: ' + tenMay(choD[0]) + ' là ' + choD[0].kind + (choD[0].ly_do ? ' (' + choD[0].ly_do + ')' : '') + ' nên không hiện nút', ng, PL_MX.hoSoXong);
        continue;
      }
      else if (mayD.length) { ghi(ten, mb + '.DUNG', 'CHƯA KIỂM', 'máy chủ không cho tài khoản này làm ' + tenMay(mayD[0]) + (mayD[0].ly_do ? ' (' + mayD[0].ly_do + ')' : ''), ng, PL_MX.mayKhongCho); continue; }
      else if (b.tu && !nhanTT) { ghi(ten, mb + '.DUNG', 'CHƯA KIỂM', 'không thấy nút "' + nut + '". Đặc tả chưa có nhãn trạng thái ' + b.tu + ' nên không biết hồ sơ mẫu có ở đúng trạng thái không', ng); continue; }
      else {
        // bước chỉ hiện khi dữ liệu của hồ sơ thỏa điều kiện (loại chức vụ, cấp chủ hồ sơ, ô đã có…): hồ sơ đã mở chưa chắc thỏa → chưa kết luận
        const dkDL = (b.dieu_kien || []).map(x => typeof x === 'string' ? x : (x.ma + ': ' + (x.dung_khi || ''))).filter(x => !/người (đang )?làm (là người|thuộc)|^actorIn/i.test(x));
        if (dkDL.length) ghi(ten, mb + '.DUNG', 'CHƯA KIỂM', 'không thấy nút "' + nut + '"' + (nhanTT ? ' ở hồ sơ «' + nhanTT + '» đã mở' : '') + '; nút chỉ hiện khi hồ sơ thỏa: ' + dkDL.slice(0, 2).join(' ; ').slice(0, 220) + (dkDL.length > 2 ? ' …' : '') + '. Cần hồ sơ mẫu thỏa điều kiện', ng);
        // [10c] hồ sơ đúng chặng tài liệu ghi, máy chủ trả danh sách bước mà không có bước này → app khác tài liệu (không phải lỗi giao diện)
        else if (nhanTT && b.ma_app && manRR.some(m => tuyenCoBM.has(boCuoi(m.url)))) ghi(ten, mb + '.DUNG', lech(ng), 'hồ sơ «' + nhanTT + '» (chặng tài liệu ghi cho bước này): máy chủ trả danh sách bước của hồ sơ nhưng không có bước ' + b.ma_app + '; màn không có nút "' + nut + '"', ng, PL_MX.appKhacTL);
        // [10d] «không thấy» khi chưa có xác nhận máy chủ: công cụ không thấy, chưa phải app thiếu
        else ghi(ten, mb + '.DUNG', 'CHƯA KIỂM', 'không thấy nút "' + nut + '" trên ' + (rr.size ? 'các màn đã quét' : 'màn') + (nhanTT ? ' (hồ sơ «' + nhanTT + '»)' : '') + '; màn không có danh sách bước của máy chủ nên chưa biết app có cho làm không', ng, PL_MX.khongThay);
        continue;
      }
      nut = nutX;   // phần xác nhận, trường: theo chữ nút thật
      // xác nhận trước khi ghi
      const dh = [...(rr.get(nut) || tatCa.get(nut) || [])].join(' ');
      const guiNgay = /gửi ngay|ghi ngay/.test(dh), yc = b.xac_nhan;
      if (yc === 'form' || yc === 'hop_thoai') {
        if (guiNgay) ghi(ten, mb + '.XAC_NHAN', lech(ng), 'đặc tả đòi ' + (yc === 'form' ? 'form' : 'hộp xác nhận') + '; bấm nút là gửi lệnh ghi ngay', ng);
        else if (/đã mở form/.test(dh) || vctCo(nut)) ghi(ten, mb + '.XAC_NHAN', 'ĐẠT', 'bấm nút mở form', ng);
        else if (/khoá/.test(dh)) ghi(ten, mb + '.XAC_NHAN', 'CHƯA KIỂM', 'nút đang khoá', ng);
        else ghi(ten, mb + '.XAC_NHAN', 'CHƯA KIỂM', 'công cụ chưa bấm nút này', ng);
      }
      // trường của form
      if (yc !== 'form' || !(b.truong_phai_nhap || []).length) continue;
      if (guiNgay) { for (const mt of b.truong_phai_nhap) { const td = truong[mt] || {}; ghi(ten, mb + '.TRUONG.' + mt, lech(td.nguon), 'không có form để nhập "' + (td.nhan || mt) + '" (nút ghi ngay)', td.nguon); } continue; }
      const ft = truongForm(nut, b.duong_dan_man);
      if (!ft.length) { ghi(ten, mb + '.TRUONG', 'CHƯA KIỂM', 'công cụ chưa đọc được form của nút này', ng); continue; }
      const theoNhan = new Map(ft.map(t => [chuanDT(t.nhan), t]));
      const coNhan = [...new Set(ft.map(t => t.nhan))];
      for (const mt of b.truong_phai_nhap) {
        const td = truong[mt] || {};
        if (!td.nhan) { ghi(ten, mb + '.TRUONG.' + mt, 'CHƯA KIỂM', 'đặc tả đòi trường "' + mt + '" nhưng chưa có nhãn; form hiện có: ' + coNhan.join(', '), td.nguon); continue; }
        const t = theoNhan.get(chuanDT(td.nhan));
        if (!t) { ghi(ten, mb + '.TRUONG.' + mt, lech(td.nguon), 'form không có trường "' + td.nhan + '"', td.nguon); continue; }
        const loi = []; let ghiNhanSan = '';
        if (td.bat_buoc && t.bat_buoc !== 'Có') loi.push('không bắt buộc');
        if (/không có dấu \*/.test(t.ghi_chu || '')) loi.push('bắt buộc nhưng nhãn không có dấu *');
        // [3.26.1] ô có giá trị sẵn mà đặc tả không ghi giá trị mặc định: chỉ ghi nhận. Không đoán ô nào là «quyết định nghiệp vụ» theo chữ trong nhãn.
        if (td.mac_dinh == null && !laFormSua(b) && t.gia_tri && !/^—/.test(t.gia_tri) && ['chọn', 'chữ', 'số', 'ngày/giờ'].includes(t.loai)) {
          const gtTho = String(t.gia_tri).replace(/\s*\[mã:[^\]]*\]/g, '').trim();
          ghiNhanSan = 'ô «' + td.nhan + '» có giá trị sẵn ' + giaTriGon(t.gia_tri) + (gtTho && chuanDT(kq.tai_khoan || '').includes(chuanDT(gtTho)) ? ' (trùng tên tài khoản đang đăng nhập)' : '') + (td.bat_buoc ? '; ô bắt buộc' : '') + '; đặc tả không ghi giá trị mặc định';
        }
        if (Array.isArray(td.lua_chon)) { const co = String(t.lua_chon || '').split(';').map(s => s.trim()).filter(s => s && !/^—/.test(s)); const thieu = td.lua_chon.filter(x => !co.includes(x)); if (thieu.length) loi.push('thiếu lựa chọn: ' + thieu.join(', ')); }
        ghi(ten, mb + '.TRUONG.' + mt, loi.length ? lech(td.nguon) : 'ĐẠT', loi.length ? loi.join('; ') : 'có trường "' + td.nhan + '"', td.nguon);
        if (ghiNhanSan) ghi(ten, mb + '.TRUONG.' + mt + '.SAN', 'GHI NHẬN', ghiNhanSan, td.nguon);
      }
      const daNeu = new Set(b.truong_phai_nhap.map(x => chuanDT((truong[x] || {}).nhan)));
      const thua = coNhan.filter(n => !daNeu.has(chuanDT(n)));
      if (thua.length) ghi(ten, mb + '.TRUONG_THUA', 'GHI NHẬN', 'form có trường không nêu trong đặc tả: ' + thua.join(', '), ng);
    }
    // ca nhập ô (bộ TC): kết quả công cụ đã chạy trong form; ca chưa chạy được gộp một dòng
    if (Array.isArray(dt.tc_nhap) && dt.tc_nhap.length && v) {
      const chay = (kq.tc_nhap_kq || []).filter(x => x.quy_trinh === ((dt.dinh_danh || {}).ma_ben_b || ma));
      const daChay = new Set(chay.map(x => x.ma));
      for (const x of chay) ghi(x.muc, x.ma, x.kq, 'ô «' + x.truong + '»: ' + x.dg, x.nguon);
      const buocV = new Set((dt.buoc || []).filter(b => (b.vai || []).includes(v)).map(b => b.ma));
      const chua = dt.tc_nhap.filter(c => buocV.has(c.buoc) && !daChay.has(c.ma));
      if (chua.length) ghi('Ca nhập ô', ma + '.NHAP.CHUA_CHAY', 'CHƯA KIỂM', chua.length + ' ca nhập ô của vai này chưa chạy: công cụ chưa mở được form của nút (' + [...new Set(chua.map(c => c.nut))].slice(0, 6).join('; ') + (new Set(chua.map(c => c.nut)).size > 6 ? '…' : '') + ')', '');
    }
    // [11a][11b] TC giao diện chung của quy trình (TRO_NANG, KHUNG_CHUNG, O_TIM) và KHUNG-CHUNG.* (mọi vai): chấm trên màn / form của quy trình.
    // Màn của quy trình = đường dẫn TC, tài liệu ghi; hồ sơ có danh sách bước máy chủ chứa bước của quy trình; form mở bằng nút của bước. Bảng KHUNG: mọi màn.
    if ((dt.ca_gd || []).some(tn => ma === 'KHUNG' || (v && (tn.vai || []).includes(v)))) {
      const tatCa = ma === 'KHUNG', mau = [].concat((dt.ca_gd.find(x => x.man) || {}).man || [], (dt.buoc || []).map(b => b.duong_dan_man)).filter(Boolean).map(mauDuongDanDT);
      const maApp = new Set((dt.buoc || []).map(b => b.ma_app).filter(Boolean)), tuyenQT = new Set(BM.filter(x => maApp.has(x.action)).map(x => x.tuyen));
      const nutQT = (dt.buoc || []).map(b => b.nut).filter(Boolean);
      const formCua = m => { const g = /«([^»]+)»[^«]*$/.exec(m || ''); return !!g && /›\s*form/.test(m) && nutQT.includes(g[1]); };   // chỉ đúng chữ nút: chữ gần đúng dễ gán nhầm form của quy trình khác
      const gocDS = new Set([].concat((dt.ca_gd.find(x => x.man) || {}).man || [], (dt.buoc || []).map(b => b.duong_dan_man)).filter(p => p && /\/\{id\}/.test(p)).map(p => boCuoi(p.split('/{id}')[0])));   // màn danh sách của cùng loại hồ sơ
      const cuaQT = (url, tenMan) => { const u = boCuoi(duongDanDT(url)); return tatCa || (!laManVC(u) && (mau.some(re => re.test(u)) || gocDS.has(u) || tuyenQT.has(u) || formCua(tenMan))); };
      const urlMan = new Map((kq.man_da_kiem || []).map(m => [m.tab, m.url]));
      const ctx = { VD: (kq.van_de || []).filter(r => cuaQT(r.url, r.tab)), MAN: (kq.man_da_kiem || []).filter(m => cuaQT(m.url, m.tab)),
        TRG: TR.filter(t => cuaQT(urlMan.get(t.man) || '', t.man + ' › ' + (t.vung || ''))), TIM: (kq.thu_o_nhap || []).filter(i => /^tìm · /.test(i.loai || '') && cuaQT(urlMan.get(i.man) || '', i.man)),
        SAP: SAPS.filter(x => cuaQT(x.duong_dan || '', x.man)), AX: AX.filter(x => x.vi_pham && cuaQT(x.url, x.man)), toanBo: tatCa };
      for (const tn of dt.ca_gd) {
        if (!tatCa && (!v || !(tn.vai || []).includes(v))) continue;
        if (tn.loai === 'TRO_NANG') {
          const cua = ctx.AX;
          if (!cua.length) { ghi('Trợ năng', tn.ma, 'CHƯA KIỂM', 'chưa nối được màn / form nào đã kiểm trợ năng với quy trình này (TC, tài liệu không ghi đường dẫn màn; chưa mở hồ sơ có bước của quy trình)', 'v7', PL_MX.tnChuaNoi); continue; }
          const nang = cua.map(x => ({ man: x.man, v: x.vi_pham.filter(y => y.muc === 'critical' || y.muc === 'serious') })).filter(x => x.v.length);
          if (nang.length) {
            const luat = {}; for (const x of nang) for (const y of x.v) { const l = luat[y.id] = luat[y.id] || { sc: y.sc, so: 0, man: 0 }; l.so += y.so; l.man++; }
            ghi('Trợ năng', tn.ma, lech('v7'), 'axe-core (WCAG 2.2 A/AA) thấy lỗi mức nghiêm trọng ở ' + nang.length + '/' + cua.length + ' màn / form của quy trình: ' + Object.entries(luat).map(([id, l]) => id + (l.sc.length ? ' (WCAG ' + l.sc.join('/') + ')' : '') + ' ×' + l.so + ' ở ' + l.man + ' màn').join('; ') + '; ví dụ: ' + nang.slice(0, 2).map(x => x.man).join(' | '), 'v7', PL_MX.tnLoi);
          } else ghi('Trợ năng', tn.ma, 'CHƯA KIỂM', 'axe-core (WCAG 2.2 A/AA) không thấy lỗi mức nghiêm trọng ở ' + cua.length + ' màn / form của quy trình; phần «mọi nút, ô dùng được bằng bàn phím» công cụ không thử được (trình duyệt không cho phím giả chuyển tiêu điểm)', 'v7', PL_MX.tnBanPhim);
        } else if (tn.loai === 'KHUNG_CHUNG') {
          const ra = /^KHUNG-CHUNG\./.test(tn.ma) ? [[tn.ma.slice(12), chamKhung(tn.ma.slice(12), ctx, kq)]] : Object.keys(KHUNG_CHAM).concat(Object.keys(KHUNG_KHONG)).map(k => [k, chamKhung(k, ctx, kq)]);   // «mọi ca KHUNG-CHUNG.*»: ca chưa có phép kiểm cũng tính là chưa kết luận
          if (ra.length === 1) { const [, [t, dg]] = ra[0]; ghi('Khung chung', tn.ma, t === 'LOI' ? lech('v7') : t === 'DAT' ? 'ĐẠT' : 'CHƯA KIỂM', dg, 'v7', t === 'LOI' ? PL_MX.khungLoi : t === 'DAT' ? null : PL_MX.khungChua); continue; }
          const loi = ra.filter(x => x[1][0] === 'LOI'), chua = ra.filter(x => x[1][0] !== 'LOI' && x[1][0] !== 'DAT');
          ghi('Khung chung', tn.ma, loi.length ? lech('v7') : chua.length ? 'CHƯA KIỂM' : 'ĐẠT', loi.length ? 'lệch ' + loi.map(x => 'KHUNG-CHUNG.' + x[0] + ' (' + x[1][1].slice(0, 90) + ')').join('; ') : chua.length ? 'chưa kết luận được ' + chua.length + ' ca: ' + chua.map(x => 'KHUNG-CHUNG.' + x[0]).join(', ') : 'mọi ca KHUNG-CHUNG.* đạt trên ' + ctx.MAN.length + ' màn của quy trình', 'v7', loi.length ? PL_MX.khungLoi : chua.length ? PL_MX.khungChua : null);
        } else if (tn.loai === 'O_TIM') {
          const loi = ctx.TIM.filter(i => /API lỗi|⚠/.test(i.loi || ''));
          if (loi.length) ghi('Ô tìm', tn.ma, lech('v7'), 'máy chủ / trang báo lỗi khi tìm ở ' + loi.length + ' lần thử (' + loi.slice(0, 2).map(i => i.man + ' · ' + i.loai + ': ' + i.loi.slice(0, 60)).join(' | ') + ')', 'v7', PL_MX.khungLoi);
          else if (ctx.TIM.length) ghi('Ô tìm', tn.ma, 'CHƯA KIỂM', 'đã thử ' + ctx.TIM.length + ' lần ở ô tìm của quy trình: không lỗi máy chủ, không lộ câu truy vấn; phần «không trả dòng ngoài phạm vi» công cụ không kiểm được (không biết phạm vi dữ liệu của tài khoản)', 'v7', PL_MX.khungChua);
          else ghi('Ô tìm', tn.ma, 'CHƯA KIỂM', 'chưa có lần thử ô tìm nào trên màn nối được với quy trình (màn không có ô tìm, hoặc chưa nối được màn với quy trình)', 'v7', PL_MX.khungChua);
        }
      }
    }
    if (khongVao.length) ghi('Màn của vai khác', ma + '.KHONG_VAO_MAN', 'ĐẠT', 'vai không mở được màn của ' + khongVao.length + ' bước không phải việc của mình (' + khongVao.join(', ') + '): không có đường bấm nút; gộp một dòng', '');
    if (khongVao.length) KQ[KQ.length - 1].buoc_gop = khongVao.slice();   // [3.25] để đối chiếu phủ TC SAI_VAI
    // 3. trường phải ẩn với vai này
    for (const q of (dt.quyen_du_lieu || []).filter(x => x.vai === v && (x.truong_an || []).length)) {
      const goc = b0 ? b0.duong_dan_man : null; const duoi = goc ? manDuoi(goc) : null;
      for (const mt of q.truong_an) {
        const nh = (truong[mt] || {}).nhan; if (!nh) { ghi('Trường ẩn', ma + '.AN.' + mt, 'CHƯA KIỂM', 'đặc tả chưa có nhãn của trường "' + mt + '"', q.nguon); continue; }
        const thay = TR.some(t => chuanDT(t.nhan) === chuanDT(nh) && (!duoi || duoi.has(t.man)));
        if (!thay && !(duoi && duoi.size)) { ghi('Trường ẩn', ma + '.AN.' + mt, 'CHƯA KIỂM', 'không đủ căn cứ: chưa mở được màn của quy trình để biết trường "' + nh + '" có ẩn không', q.nguon); continue; }   // [3.25]
        ghi('Trường ẩn', ma + '.AN.' + mt, thay ? lech(q.nguon) : 'ĐẠT', thay ? 'trường "' + nh + '" phải ẩn với vai này nhưng đang hiện' : 'không thấy trường "' + nh + '"', q.nguon);
      }
    }
    // 4. màn danh sách: đủ cột như bảng
    if (v) for (const d of (dt.man_danh_sach || []).filter(x => x.duong_dan && (x.cot || []).length)) {
      const mau = mauDuongDanDT(d.duong_dan), tenMan = new Set(man.filter(m => mau.test(m.url)).map(m => m.ten));
      if (!tenMan.size) continue;   // vai không thấy màn: đã kiểm ở ca XEM
      const cotCo = new Set(TR.filter(t => tenMan.has(t.man) && /cột bảng/.test((t.vung || '') + ' ' + (t.loai || ''))).map(t => chuanDT(t.nhan)));
      const thieu = d.cot.filter(c => !cotCo.has(chuanDT(c)));
      ghi('Màn danh sách', ma + '.' + d.ma + '.COT', thieu.length ? lech(d.nguon) : 'ĐẠT', thieu.length ? 'thiếu cột: ' + thieu.join(', ') : 'đủ ' + d.cot.length + ' cột', d.nguon);
    }
    // 5. phần chỉ kiểm được khi chạy quy trình thật (lớp 4) — không lặp lại ở vai ngoài đặc tả
    if (v) for (const b of (dt.buoc || [])) {
      const l4 = [];
      if (b.den !== b.tu) l4.push('chuyển ' + (b.tu || '(mở hồ sơ)') + ' → ' + b.den);
      if ((b.dieu_kien || []).length) l4.push('điều kiện: ' + b.dieu_kien.map(x => typeof x === 'string' ? x : (x.ma + (x.dung_khi ? ': ' + x.dung_khi : ''))).join(' ; '));
      if (b.viec_tiep) l4.push('việc tiếp cho ' + [].concat(b.viec_tiep.vai || []).join(', '));
      if (b.nhat_ky) l4.push('ghi nhật ký');
      if (l4.length) ghi(b.ma + ' ' + (b.ten || ''), ma + '.' + b.ma + '.DONG', 'LỚP 4', l4.join('; '), b.nguon);
    }
    if (v) for (const x of (dt.bat_bien || [])) ghi('Bất biến', ma + '.' + x.ma, 'LỚP 4', x.mo_ta + ': ' + x.bieu_thuc, x.nguon);
    if (v) for (const x of (dt.quy_tac || [])) ghi('Quy tắc', ma + '.' + x.ma, 'LỚP 4', (x.loai || '') + ': ' + x.bieu_thuc + (x.khi_vi_pham ? ' (' + x.khi_vi_pham + ')' : ''), x.nguon);
    if (v) for (const x of (dt.kich_ban || [])) ghi('Kịch bản', ma + '.' + x.ma, 'LỚP 4', x.ten + ': ' + (x.chuoi || []).join(' → ') + (x.ket_qua_mong_doi ? ' · mong đợi: ' + x.ket_qua_mong_doi : ''), x.nguon);
  }
  // [S6] ca đã đóng trong sổ yêu cầu (Trạng thái «Đóng»): ghi ĐẠT kèm lý do, giữ nguyên quan sát
  const DONG = (window.__itaQuyTac || {}).tc_dong || {};
  for (const k of KQ) { const d = DONG[k.ma]; if (d && k.kq !== 'ĐẠT' && k.kq !== 'LỚP 4') { k.dg = 'đã đóng theo ' + d.ma + ': ' + d.ly_do + ' (quan sát: ' + k.dg + ')'; if (k.loai_bang !== 'khung') k.kq = 'ĐẠT'; k.da_dong = d.ma; k.can_cu = (k.can_cu ? k.can_cu + ' · ' : '') + 'sổ yêu cầu ' + d.ma; } }
  // [3.25] lần chạy dừng giữa chừng: "không thấy" chưa phải bằng chứng → không đánh ĐẠT
  if (kq.dung_giua_chung) for (const k of KQ) if (k.kq === 'ĐẠT' && !k.da_dong && (/^(không thấy|vai không mở được|đã mở màn[^,]*, không thấy)/.test(k.dg || '') || /\.(KHONG_VAO_MAN|SAI_CHE_DO)$/.test(k.ma) || ['Khung chung', 'Trợ năng', 'Ô tìm'].includes(k.muc))) { k.kq = 'CHƯA KIỂM'; k.dg += ' — lần chạy dừng giữa chừng, vắng mặt chưa đủ làm bằng chứng'; }
  const DM = window.__itaDanhMucTC || DM_V7, CO_TC = DM ? new Set(DM.tc.map(t => t[0]).concat(DM.tc_khac || [])) : null;
  for (const k of KQ) {
    if (k.kq === 'ĐẠT' || k.kq === 'GHI NHẬN') { delete k.nhom; delete k.nguyen_nhan; delete k.viec_tiep; delete k.mat_xich; }   // phân loại sẵn của dòng đã đổi thành ĐẠT / GHI NHẬN thì bỏ
    else if (!k.nhom) { const p = phanLoaiKQ(k); if (p) { k.nhom = p[0]; k.nguyen_nhan = p[1]; k.viec_tiep = p[2]; k.mat_xich = p[3]; } }   // [10d] dòng đã có mắt xích từ phép kiểm thì giữ
    if (CO_TC && k.loai_bang === 'đặc tả') k.co_tc_pm = CO_TC.has(k.ma) ? 'có' : 'không';
  }
  const dem = {}, dem_theo_bang = {}; for (const k of KQ) { dem[k.kq] = (dem[k.kq] || 0) + 1; const g = dem_theo_bang[k.loai_bang] = dem_theo_bang[k.loai_bang] || {}; g[k.kq] = (g[k.kq] || 0) + 1; }
  const vaiTK = dsDT.map(d => { const x = (d.vai || []).find(y => khopTK(kq.tai_khoan, y.nhan_dang_nhap)); return { ma: maQT(d), vai: x ? x.ma : null }; });
  return { quy_trinh: dsDT.map(d => ({ ma: maQT(d), ten: (d.dinh_danh || {}).ten || '', phien_ban: (d.dinh_danh || {}).phien_ban || '' })), vai_tai_khoan: vaiTK, dem, dem_theo_bang, ket_qua: KQ };
}

const THU_TU_KQ = ['LỆCH', 'CẢNH BÁO', 'CHƯA KIỂM', 'ĐẠT', 'GHI NHẬN', 'LỚP 4'];
/* [3.25] Nguyên nhân của mỗi kết quả chưa ĐẠT — để biết lỗi do đâu trước khi gửi yêu cầu sửa.
 * nhóm: AUTO (tự điền / bước hệ thống tự làm) · ỨNG DỤNG (gửi Bên B/dev) · QUY TRÌNH (đặc tả thiếu/chưa chốt → PM) · TC (danh mục TC lệch đặc tả → PM)
 *       THIẾU (dữ liệu, tài khoản → Bên B nạp) · CÔNG CỤ (công cụ chưa đọc được → kiểm tay / khai đồng nghĩa) · THỦ CÔNG */
/* [10d] mắt xích: lần ngược từ màn hình về TC, dòng chưa đạt ghi mắt xích đầu tiên bị lệch.
 * 0 điều kiện chạy (tài khoản, hồ sơ mẫu) · 1 công cụ · 2 màn hình ↔ máy chủ · 2/3 màn hình khác tài liệu (chưa biết app hay tài liệu sai) · 3 app ↔ tài liệu · 4 tài liệu ↔ TC v7 · 5 chờ PM */
const TEN_MX = { 0: 'điều kiện chạy', 1: 'công cụ', 2: 'màn hình ↔ máy chủ', '2/3': 'màn hình khác tài liệu', 3: 'app ↔ tài liệu', 4: 'tài liệu ↔ TC v7', 5: 'chờ PM', 'chuẩn': 'màn hình sai chuẩn (WCAG)', 'khung': 'màn hình sai TC khung chung' };
const PL_MX = {
  gan: { nhom: 'CÔNG CỤ', mat_xich: 1, nguyen_nhan: 'có nút gần chữ, chưa đối chiếu được mã bước', viec_tiep: 'kiểm tay nút gần chữ trên màn; hoặc mở hồ sơ có danh sách bước của máy chủ' },
  khongThay: { nhom: 'CÔNG CỤ', mat_xich: 1, nguyen_nhan: 'không thấy nút, chưa có xác nhận của máy chủ', viec_tiep: 'kiểm tay trên màn bằng tài khoản đúng vai' },
  mayChoKhongNut: { nhom: 'ỨNG DỤNG', mat_xich: 2, nguyen_nhan: 'máy chủ cho làm bước mà màn không có nút', viec_tiep: 'gửi Bên B: màn thiếu nút của bước máy chủ cho làm' },
  hienKhiMayCam: { nhom: 'ỨNG DỤNG', mat_xich: 2, nguyen_nhan: 'màn hiện nút bấm được trong khi máy chủ không cho vai này làm', viec_tiep: 'gửi Bên B: ẩn hoặc khoá nút theo danh sách bước của máy chủ' },
  appKhacTL: { nhom: 'QUY TRÌNH', mat_xich: 3, nguyen_nhan: 'hồ sơ ở chặng tài liệu ghi nhưng máy chủ không chào bước', viec_tiep: 'Bên B chốt: sửa khai báo app hoặc sửa tài liệu' },
  appChoVai: { nhom: 'QUY TRÌNH', mat_xich: 3, nguyen_nhan: 'máy chủ cho vai này làm bước mà tài liệu/TC ghi vai khác', viec_tiep: 'Bên B chốt vai của bước (khai báo app hay tài liệu); PM xem lại TC' },
  mayKhongCho: { nhom: 'THIẾU', mat_xich: 0, nguyen_nhan: 'máy chủ không cho tài khoản này làm bước trên hồ sơ đã mở', viec_tiep: 'dùng hồ sơ thuộc đơn vị của tài khoản; vẫn không cho thì Bên B soát vai của bước trong app' },
  khungLoi: { nhom: 'ỨNG DỤNG', mat_xich: 'khung', nguyen_nhan: 'màn hình lệch TC khung chung / ô tìm của v7', viec_tiep: 'gửi Bên B sửa theo TC (mã TC ghi ở cột Mã ca)' },
  khungChua: { nhom: 'CÔNG CỤ', mat_xich: 1, nguyen_nhan: 'công cụ chỉ kiểm được một phần TC, hoặc chưa có phép kiểm', viec_tiep: 'kiểm tay phần còn lại theo thao tác của TC' },
  tnLoi: { nhom: 'ỨNG DỤNG', mat_xich: 'chuẩn', nguyen_nhan: 'màn hình vi phạm WCAG 2.2 mức nghiêm trọng (axe-core)', viec_tiep: 'gửi Bên B sửa theo mục WCAG ghi ở từng luật' },
  tnBanPhim: { nhom: 'CÔNG CỤ', mat_xich: 1, nguyen_nhan: 'phần bàn phím của TC trợ năng công cụ không thử được', viec_tiep: 'kiểm tay: dùng phím Tab đi qua mọi nút, ô trên màn danh sách, hồ sơ, form của quy trình' },
  tnChuaNoi: { nhom: 'CÔNG CỤ', mat_xich: 1, nguyen_nhan: 'chưa nối được màn đã kiểm trợ năng với quy trình', viec_tiep: 'mở màn / hồ sơ của quy trình bằng tài khoản đúng vai; hoặc PM ghi đường dẫn màn vào TC' },
  hoSoXong: { nhom: 'THIẾU', mat_xich: 0, nguyen_nhan: 'hồ sơ đã mở đã xong hoặc không áp dụng bước này (máy chủ)', viec_tiep: 'cần hồ sơ ở chặng còn việc này' },
};
// [11b] chấm từng TC KHUNG-CHUNG.* của v7 trên phép kiểm giao diện chung đã có. Trả [LOI | DAT | CHUA, diễn giải].
// ĐẠT chỉ khi phép kiểm làm đủ thao tác và kết quả mong đợi của TC; TC phép kiểm chỉ làm được một phần thì không lỗi → CHƯA KIỂM, ghi phần chưa kiểm.
const vdMan = (ds, f) => ds.slice(0, 3).map(f).join(' | ') + (ds.length > 3 ? ' …' : '');
const chamDS = (loi, f, coKiem, ten) => loi.length ? ['LOI', loi.length + ' chỗ: ' + vdMan(loi, f)] : coKiem ? ['DAT', 'đã kiểm ' + coKiem + ' ' + (ten || 'màn') + ', không thấy chỗ lệch'] : ['CHUA', 'chưa có ' + (ten || 'màn') + ' nào để kiểm'];
const motPhan = (loi, f, coKiem, conLai) => loi.length ? ['LOI', loi.length + ' chỗ: ' + vdMan(loi, f)] : ['CHUA', (coKiem ? 'không thấy chỗ lệch ở phần đã kiểm (' + coKiem + ')' : 'chưa có chỗ nào để kiểm') + '; phần chưa kiểm: ' + conLai];
const theoO = (ctx, k) => ctx.VD.filter(r => r[k]);
// ô tìm: chỉ tính lần thử có kết quả rõ cho đúng ca; lần «có dấu» làm mốc phải ra > 0 dòng; lỗi không thuộc kết quả mong đợi của ca không tính
const timO = (ctx, ten, laLoi, coMoc) => {
  const moc = i => ctx.TIM.find(x => x.loai === 'tìm · có dấu' && x.man === i.man && x.o === i.o);
  const ds = ctx.TIM.filter(i => i.loai === 'tìm · ' + ten && !/danh sách không lọc/.test(i.loi || '') && (!coMoc || (moc(i) && +moc(i).so_dong_sau > 0)));
  return chamDS(ds.filter(i => laLoi.test(i.loi || '')), i => i.man + ': ' + i.loi.slice(0, 80), ds.length, 'lần thử ô tìm' + (coMoc ? ' có mốc «có dấu» ra dữ liệu' : ''));
};
const KHUNG_CHAM = {
  LOI_API: ctx => chamDS(ctx.VD.filter(r => r.api_loi || r.rong_nhung_api_loi), r => r.tab + ': ' + (r.api_loi || r.rong_nhung_api_loi).slice(0, 60), ctx.MAN.length),
  // màn sập đã biết (bỏ trước theo sổ) chỉ tính khi menu của tài khoản có màn đó
  MAN_KHONG_SAP: (ctx, kq) => chamDS(ctx.SAP.filter(x => !x.bo_truoc || (kq.menu_khong_mo_duoc || []).some(m => x.duong_dan && m.includes(x.duong_dan))), x => (x.duong_dan || x.man) + (x.loi_da_biet ? ' (LỖI ĐÃ BIẾT ' + x.loi_da_biet.ma + ')' : ''), ctx.MAN.length),
  // TC: «ô nhập, ô chọn trên màn và biểu mẫu» → gộp ô của form; chưa mở form nào thì chưa đủ
  O_CO_NHAN: ctx => { const loi = theoO(ctx, 'o_khong_nhan').map(r => r.tab + ': ' + r.o_khong_nhan.slice(0, 50)).concat(ctx.TRG.filter(t => /không có nhãn|thiếu nhãn/.test(t.loi || '')).map(t => t.man + ' › ' + (t.vung || '') + ' › ' + (t.nhan || t.ten_ma || 'ô')), ctx.AX.filter(x => x.vi_pham.some(y => ['label', 'select-name', 'aria-input-field-name'].includes(y.id))).map(x => x.man + ' (axe: ô không có tên)')), form = ctx.TRG.filter(t => /^form/.test(t.vung || ''));
    return loi.length ? ['LOI', loi.length + ' chỗ: ' + loi.slice(0, 3).join(' | ')] : form.length ? ['DAT', 'đã đọc ' + ctx.TRG.length + ' ô (' + form.length + ' ô trong form), mọi ô có nhãn'] : ['CHUA', 'các ô trên màn có nhãn; phần biểu mẫu chưa kiểm (chưa mở form nào)']; },
  // TC: «mở màn ở cửa sổ 1366 và 1920 px» → một lần chạy chỉ một khổ: lệch thì ghi, không lệch thì chưa đủ hai khổ và phần «bảng cuộn trong khung»
  TRAN_NGANG: (ctx, kq) => { const w = parseInt(kq.cua_so, 10) || 0, loi = theoO(ctx, 'tran_ngang');
    if (![1366, 1920].includes(w)) return ['CHUA', 'lần chạy ở khổ ' + w + 'px; TC đòi 1366 và 1920px' + (loi.length ? ' (ở khổ này có ' + loi.length + ' màn cuộn ngang: ' + vdMan(loi, r => r.tab) + ')' : '')];
    return loi.length ? ['LOI', 'khổ ' + w + 'px: ' + loi.length + ' màn: ' + vdMan(loi, r => r.tab + ' (' + r.tran_ngang + ')')] : ['CHUA', 'khổ ' + w + 'px: ' + ctx.MAN.length + ' màn không rộng hơn cửa sổ; chưa kiểm khổ ' + (w === 1366 ? 1920 : 1366) + 'px và phần «bảng cuộn trong khung»']; },
  CHU_CAT: ctx => chamDS(theoO(ctx, 'cat_chu_khong_tooltip'), r => r.tab, ctx.MAN.length),
  MA_CHUA_DICH: ctx => chamDS(ctx.VD.filter(r => r.ma_enum_lo || (r.chu_la && !CHU_LOI_MAY.test(r.chu_la) && /[a-z][A-Z]|\b[A-Z]+_[A-Z]/.test(r.chu_la))), r => r.tab + ': ' + String(r.ma_enum_lo || r.chu_la).slice(0, 50), ctx.MAN.length),
  // TC nêu đích danh màn TÁC CHIẾN › Xử lý tàu bay không người lái, bộ lọc «Đã khép»; vế «có dữ liệu hoặc thông báo trống» công cụ chưa xét
  KHONG_TREO_TAI: ctx => { const loi = theoO(ctx, 'van_dang_tai'); if (loi.length) return ['LOI', loi.length + ' màn còn đang tải sau 10 giây: ' + vdMan(loi, r => r.tab)];
    const coMan = ctx.MAN.some(m => /tàu bay không người lái/i.test(m.tab) && /«Đã khép»/.test(m.tab));
    return ['CHUA', ctx.MAN.length + ' màn không còn đang tải sau 10 giây' + (ctx.toanBo && !coMan ? '; chưa mở màn TC nêu (Xử lý tàu bay không người lái, bộ lọc «Đã khép»)' : '') + '; vế «có dữ liệu hoặc thông báo trống» chưa kiểm']; },
  // màn mục menu không đọc được tiêu đề thì chưa so được
  TIEU_DE_MENU: (ctx, kq) => { const loi = theoO(ctx, 'tieu_de_lech_menu'), mm = ctx.MAN.filter(m => (kq.danh_sach_menu || []).includes(m.tab)), khong = mm.filter(m => !m.tieu_de_man || m.tieu_de_man === '—');
    return loi.length ? ['LOI', loi.length + ' màn: ' + vdMan(loi, r => r.tieu_de_lech_menu.slice(0, 80))] : khong.length ? ['CHUA', khong.length + '/' + mm.length + ' màn mục menu không đọc được tiêu đề (không có h1, h2): ' + vdMan(khong, m => m.tab)] : mm.length ? ['DAT', 'đã so ' + mm.length + ' màn mục menu, tiêu đề trùng tên mục menu'] : ['CHUA', 'chưa có màn mục menu nào để so']; },
  THOI_DIEM: (ctx, kq) => { const khac = ctx.toanBo ? ((kq.ngon_tu || {}).dinh_dang_ngay_dung || []).filter(x => x.gia_tri !== 'dd/mm/yyyy') : [];
    const loi = ctx.VD.filter(r => r.dinh_dang_ngay_tron || r.gio_khong_chuan);
    return loi.length || khac.length ? ['LOI', [loi.length && loi.length + ' màn: ' + vdMan(loi, r => r.tab + ': ' + (r.gio_khong_chuan || r.dinh_dang_ngay_tron))].concat(khac.map(x => 'dạng ' + x.gia_tri + ' ở ' + x.so_man + ' màn')).filter(Boolean).join('; ')]
      : ctx.MAN.length ? ['DAT', 'đã kiểm ' + ctx.MAN.length + ' màn: ngày dạng dd/mm/yyyy; không có chuỗi giờ ISO thô, không có giờ kiểu AM/PM'] : ['CHUA', 'chưa có màn nào để kiểm']; },
  LO_LOT: ctx => chamDS(theoO(ctx, 'du_lieu_nhay_cam'), r => r.tab + ': ' + r.du_lieu_nhay_cam.split(' «')[0], ctx.MAN.length),
  MOT_NUT_CHINH: (ctx, kq) => { const hs = m => /\[hồ sơ/.test(m.tab) || /\/[0-9a-f]{8}-[0-9a-f]{4}-/.test(m.url); if (!Object.keys(kq.he_thong_thiet_ke || {}).length) return ['CHUA', 'lần chạy tắt phép kiểm thiết kế (kiemThietKe)'];
    return chamDS(ctx.VD.filter(r => r.nut_chinh_nhieu && hs(r)), r => r.tab + ': ' + r.nut_chinh_nhieu, ctx.MAN.filter(hs).length, 'màn hồ sơ'); },
  NUT_KHOA_LY_DO: ctx => { const ds = ctx.TRG.filter(t => t.loai === 'nút đang khoá'); return chamDS(ds.filter(t => /không ghi lý do/.test(t.ghi_chu || '')), t => t.man + ' › ' + t.nhan, ds.length, 'nút đang khoá'); },
  LUA_CHON_TRUNG: ctx => chamDS(ctx.TRG.filter(t => /lựa chọn trùng/.test(t.loi || '')), t => t.man + ' › ' + t.nhan, ctx.TRG.filter(t => +t.so_lua_chon > 1).length, 'ô chọn đã đọc lựa chọn'),
  // công cụ bỏ qua cột đầu / cuối không tiêu đề (cột chọn dòng, cột thao tác) khi đọc bảng → không kết luận được vế «cột chỉ có nút có nhãn»
  COT_TIEU_DE: ctx => { const cot = ctx.TRG.filter(t => t.loai === 'cột bảng'); return motPhan(cot.filter(t => /cột không có tiêu đề/.test(t.loi || '')), t => t.man, cot.length, 'cột đầu / cuối không tiêu đề (cột chọn dòng, cột thao tác) công cụ bỏ qua khi đọc, nên vế «cột chỉ có nút có nhãn cho trình đọc màn hình» chưa kiểm'); },
  // chỉ ô là số giấy tờ (bỏ «ngày cấp», «nơi cấp»); công cụ chưa đọc ô trong bảng nên không kết luận «mọi giá trị»
  CCCD_12: ctx => { const ds = ctx.TRG.filter(t => /căn cước|cccd|số định danh/i.test(t.nhan || '') && !/ngày|nơi|cấp/i.test(t.nhan || '') && t.gia_tri && !/^—|\[mã:/.test(t.gia_tri) && !/[*•]{2,}|x{3,}/i.test(t.gia_tri));
    return motPhan(ds.filter(t => !/^\d{12}$/.test(String(t.gia_tri).replace(/\s/g, ''))), t => t.man + ' › ô «' + t.nhan + '» (không chép giá trị)', ds.length, 'giá trị trong ô bảng, giá trị app che bớt số'); },
  'TIM.KHONG_CO': ctx => timO(ctx, 'không tồn tại', /vẫn ra \d+ dòng|0 dòng nhưng không có thông báo trống/, false),
  'TIM.KHONG_DAU': ctx => timO(ctx, 'không dấu', /ra 0 dòng trong khi|dòng, khác "/, true),
  'TIM.KHOANG_TRANG': ctx => timO(ctx, 'thừa khoảng trắng', /ra 0 dòng trong khi|dòng, khác "/, true),
  DEM_KHOP: ctx => motPhan(theoO(ctx, 'so_dong_vuot_tong'), r => r.tab + ': ' + r.so_dong_vuot_tong, ctx.MAN.length, 'công cụ không đổi từng bộ lọc và không đi qua mọi trang để so tổng = số dòng'),
  DAU_SAO_BAT_BUOC: ctx => motPhan(ctx.TRG.filter(t => /không có dấu \*/.test(t.ghi_chu || '')), t => t.man + ' › ' + t.nhan, ctx.TRG.filter(t => t.bat_buoc === 'Có').length, 'thử lưu khi trống (là ghi), một quy ước «không bắt buộc», tên lực lượng / đơn vị bắt buộc'),
};
// TC KHUNG-CHUNG công cụ không có phép kiểm, hoặc là nội dung nghiệp vụ phải đọc chữ / phải ghi mới kiểm được
const KHUNG_KHONG = { KHONG_CHON_SAN: 'công cụ chưa có phép kiểm theo đúng các ô TC nêu', QUY_CHUAN_GIAO_DIEN: 'cần bộ quy chuẩn giao diện của dự án (chưa nạp)', DANH_MUC_VAI: 'nội dung nghiệp vụ (danh mục vai), công cụ không tự kết luận',
  GHI_CHU_THEO_CHANG: 'nội dung nghiệp vụ (ghi chú theo chặng), công cụ không tự kết luận', KHONG_CAP_HUYEN: 'nội dung nghiệp vụ (chủ thể cấp huyện), công cụ không tự kết luận', VAN_BAN_KY_NGOAI_HE: 'nội dung nghiệp vụ (văn bản ký ngoài hệ), công cụ không tự kết luận',
  PHAM_VI_NUT_THEO_VAI: 'phần giao diện đã chấm theo từng bước (DUNG, SAI_VAI); phần «gọi API cũng bị từ chối» phải ghi (M3)' };
const chamKhung = (khoa, ctx, kq) => KHUNG_CHAM[khoa] ? KHUNG_CHAM[khoa](ctx, kq) : ['CHUA', KHUNG_KHONG[khoa] || 'công cụ chưa có phép kiểm cho TC này'];
const LUAT_NN = [
  [k => k.kq === 'LỚP 4', 'THỦ CÔNG', 'ca phải bấm Lưu hoặc chạy trọn quy trình', 'chạy trên môi trường kiểm thử riêng, ghi vào danh mục TC', null],
  [k => /LỖI ĐÃ BIẾT/.test(k.dg), 'ỨNG DỤNG', 'lỗi đã biết trong sổ yêu cầu', 'chờ Bên B sửa; chạy lại sau khi có bản sửa', 2],
  [k => /\[AUTO-BƯỚC\]/.test(k.dg) && k.kq !== 'CHƯA KIỂM', 'AUTO', 'người dùng thấy nút của bước hệ thống tự làm' + maYC('buoc_he_thong'), 'gửi Bên B: bước này phải chỉ do phiên auto chạy', 2],
  [k => /\[AUTO-BƯỚC\]/.test(k.dg), 'THIẾU', 'chưa mở được màn của quy trình', 'chạy bằng tài khoản có vai trong quy trình', 0],
  [k => /lỗi mới, cần báo/.test(k.dg), 'ỨNG DỤNG', 'màn sập mới (chưa có trong sổ)', 'báo Bên B/dev kèm tài khoản, vai, đường dẫn, thời điểm', 2],
  [k => /lần chạy dừng giữa chừng/.test(k.dg), 'CÔNG CỤ', 'lần chạy chưa xong', 'chạy lại tới hết', 1],
  [k => k.nguon === 'CAN_BO_SUNG' || /đặc tả chưa có|chưa có nhãn|đặc tả không ghi|Đặc tả chưa có nhãn trạng thái/.test(k.dg), 'QUY TRÌNH', 'đặc tả thiếu (nút, vai, nhãn, màn)', 'PM/Bên B bổ sung đặc tả', 4],
  [k => /chưa mở được hồ sơ|Cần hồ sơ|nút chỉ hiện khi hồ sơ thỏa|chưa có hồ sơ|hồ sơ mẫu|không có hồ sơ/.test(k.dg), 'THIẾU', 'thiếu hồ sơ mẫu đúng chặng/điều kiện', 'Bên B nạp dữ liệu mẫu (CK-1, CK-2)', 0],
  [k => /không mở được màn|chưa có tài khoản|không có quyền vào/.test(k.dg), 'THIẾU', 'tài khoản/vai không vào được màn', 'kiểm phân quyền hoặc dùng tài khoản đúng vai (CK-4)', 0],
  [k => /công cụ chưa|chưa đọc được form|không thấy ô|không phải ô gõ chữ|đang khoá|chưa bấm|chưa mở được form|không đủ căn cứ|chưa xác định trường nối/.test(k.dg), 'CÔNG CỤ', 'công cụ chưa đọc/bấm được', 'kiểm tay, hoặc khai bảng đồng nghĩa chữ nút/màn (CK-6)', 1],
  [k => (k.kq === 'LỆCH' || k.kq === 'CẢNH BÁO') && ['DE_XUAT', 'GD'].includes(k.nguon), 'QUY TRÌNH', 'đặc tả chưa chốt (nguồn ' + '' + 'đề xuất/giao diện)', 'PM chốt điểm đặc tả trước khi coi là lỗi', 5],
  [k => k.kq === 'LỆCH', 'ỨNG DỤNG', 'giao diện khác điểm đặc tả đã duyệt', 'gửi yêu cầu sửa Bên B', '2/3'],
  [k => k.kq === 'CẢNH BÁO', 'ỨNG DỤNG', 'giao diện khác tài liệu Bên B (chưa duyệt)', 'Bên B chốt: sửa app hoặc sửa tài liệu', '2/3'],
  [k => k.kq === 'CHƯA KIỂM', 'CÔNG CỤ', 'chưa rõ', 'xem diễn giải', 1],
];
// [10d] mắt xích của lý do «không chạy» trong danh mục TC (phần ghép) theo nhóm
const mxNhom = (nhom, ly) => nhom === 'CÔNG CỤ' ? 1 : nhom === 'THIẾU' ? 0 : nhom === 'ỨNG DỤNG' ? '2/3' : nhom === 'TC' ? (/chờ PM/.test(ly || '') ? 5 : 4)
  : nhom === 'QUY TRÌNH' ? (/khai báo|không còn khai báo|khác .*\(|app/.test(ly || '') ? 3 : 4) : null;
const phanLoaiKQ = k => { if (k.kq === 'ĐẠT' || k.kq === 'GHI NHẬN') return null; const r = LUAT_NN.find(x => { try { return x[0](k); } catch (e) { return false; } }); return r ? [r[1], r[2], r[3], r[4]] : null; };
/* [3.25] Phủ danh mục TC của PM: TC áp cho vai này mà công cụ không có kết quả → không coi là ĐẠT, ghi rõ vì sao */
function phuDanhMucTC(kq, d) {
  const DM = window.__itaDanhMucTC || DM_V7; if (!DM || !d) return null;   // DM_V7: danh mục TC v7 sau ghép với tài liệu (bước 7c)
  const tk = chuanDT(kq.tai_khoan);
  const vaiKhop = DM.vai.map(v => !!v && v.length > 3 && tk.includes(chuanDT(v)));
  const vaiTheoQT = Object.fromEntries((d.vai_tai_khoan || []).map(x => [x.ma, x.vai]));
  const kqTheoMa = new Map(d.ket_qua.map(k => [k.ma, k]));
  for (const k of d.ket_qua) if (k.buoc_gop) for (const b of k.buoc_gop) kqTheoMa.set(k.quy_trinh + '.' + b + '.SAI_VAI', k);   // ca SAI_VAI đã gộp vào dòng KHONG_VAO_MAN
  const dsDT = docDacTa(), buocQT = Object.fromEntries(dsDT.map(x => [maQT(x), new Set((x.buoc || []).map(b => b.ma))]));
  const thieu = [], demNN = {}, theoMaKhac = []; let apDung = 0, coKQ = 0;
  for (const [id, li, vs] of DM.tc) {
    const loai = DM.loai[li], qt = id.slice(0, id.search(/\.(B\d+[a-z]?\.|XEM$|PHAM_VI$)/) >>> 0) || id.split('.B')[0];
    const ap = loai === 'Phạm vi dữ liệu' ? !!vaiTheoQT[qt] : vs.some(i => vaiKhop[i] || DM.vai[i] === '*');   // [11b] KHUNG-CHUNG.*: mọi vai
    if (!ap) continue; apDung++;
    if (kqTheoMa.has(id)) { coKQ++; continue; }
    const bm = /\.(B\d+[a-z]?)\./.exec(id);
    let nn; const kc = (DM.khong_chay || {})[id];
    // [10e] bước đã dời tài liệu: kết quả là của TC đề xuất tương ứng (không chạy hai lần)
    if (kc && kc.chay_duoi && kqTheoMa.has(kc.chay_duoi)) { const k2 = kqTheoMa.get(kc.chay_duoi); coKQ++; theoMaKhac.push({ ma: id, theo: kc.chay_duoi, kq: k2.kq, dg: k2.dg }); continue; }
    // TC phần ghép đã quyết không chạy: giữ lý do của phần ghép; gom nhóm theo lý do đã bỏ tên riêng
    if (kc) nn = [kc.nhom, kc.ly_do, kc.ly_do.replace(/«[^»]*»/g, '«…»').replace(/\s*\(rà soát:[^)]*\)/g, '').replace(/ dòng \d+/g, '').replace(/\([^)]*\)/g, '(…)').slice(0, 140)];
    else if (!buocQT[qt]) nn = ['QUY TRÌNH', 'quy trình có TC nhưng không có bảng đặc tả'];
    else if (bm && !buocQT[qt].has(bm[1])) nn = ['TC', 'TC trỏ tới bước ' + bm[1] + ' không có trong đặc tả (TC cũ hoặc sai mã)'];
    else if (loai === 'Phạm vi dữ liệu') nn = ['CÔNG CỤ', 'công cụ chưa có phép kiểm phạm vi dữ liệu (mở thẳng hồ sơ đơn vị khác)'];
    else {   // [S15] lấy nguyên nhân theo bước gốc
      const goc = bm && (kqTheoMa.get(qt + '.' + bm[1] + '.DUNG') || kqTheoMa.get(qt + '.' + bm[1] + '.HE_THONG'));
      const dt0 = dsDT.find(x => maQT(x) === qt) || {};
      const coMan = [].concat((dt0.man_danh_sach || []).map(x => x.duong_dan), (dt0.buoc || []).map(x => x.duong_dan_man)).some(x => x && !laManVC(x));
      if (loai === 'Quyền xem' && !coMan) nn = ['QUY TRÌNH', 'đặc tả/tài liệu không ghi màn của quy trình (CK-5)'];
      else if (goc && goc.kq !== 'ĐẠT' && goc.nhom) nn = [goc.nhom, 'theo bước ' + bm[1] + ': ' + goc.nguyen_nhan, undefined, goc.mat_xich];
      else if (goc && goc.kq === 'ĐẠT' && /TRUONG|NHAP|XAC_NHAN/.test(id)) nn = ['CÔNG CỤ', 'đã thấy nút của bước nhưng chưa mở/đọc được form'];
      else if (bm && !goc) nn = ['THIẾU', 'vai/tài khoản này chưa tới được bước ' + bm[1] + ' (không có hồ sơ ở chặng hoặc không vào được màn)'];
      else nn = ['CÔNG CỤ', 'công cụ không sinh được kết quả (chưa tới màn/nút của bước, hoặc chữ nút khác đặc tả)'];
    }
    const mx = nn[3] !== undefined ? nn[3] : mxNhom(nn[0], nn[1]);   // [10d]
    const kk = (mx != null ? 'mắt xích ' + mx + ' (' + TEN_MX[mx] + ') · ' : '') + nn[0] + ' · ' + (nn[2] || nn[1]); demNN[kk] = (demNN[kk] || 0) + 1;
    if (thieu.length < 400) thieu.push({ ma: id, loai, nhom: nn[0], nguyen_nhan: nn[1], mat_xich: mx });
  }
  const tcSet = new Set(DM.tc.map(t => t[0]).concat(DM.tc_khac || []));
  const ngoai = d.ket_qua.filter(k => k.loai_bang === 'đặc tả' && vaiTheoQT[k.quy_trinh] && !tcSet.has(k.ma) && !/\.(NHAP|DONG|KHONG_VAO_MAN|TRUONG_THUA|LY_DO_KHOA|SAI_CHE_DO)\b|\.NHAP\./.test(k.ma) && k.kq !== 'LỚP 4');
  return { danh_muc: DM.meta || {}, ap_dung: apDung, co_ket_qua: coKQ, chua_co_ket_qua: apDung - coKQ, theo_nguyen_nhan: demNN, ds_chua_co: thieu, theo_ma_khac: theoMaKhac,
    ca_ngoai_danh_muc: ngoai.length, ds_ngoai_danh_muc: ngoai.slice(0, 200).map(k => ({ ma: k.ma, kq: k.kq, muc: k.muc })) };
}
// bảng khung sinh từ chính giao diện đã quan sát: chỉ là mốc để phát hiện thay đổi, không phải bằng chứng đúng nghiệp vụ
const LOAI_BANG = ['đặc tả', 'chuỗi', 'khung'];
const GHI_CHU_BANG = { 'đặc tả': 'bảng đặc tả đã soạn', 'chuỗi': 'chuỗi khép kín', 'khung': 'bảng khung (mốc, sinh từ chính giao diện)' };
const demBang = d => LOAI_BANG.filter(l => (d.dem_theo_bang || {})[l]).map(l => GHI_CHU_BANG[l] + ': ' + THU_TU_KQ.map(k => k + ' ' + (d.dem_theo_bang[l][k] || 0)).join(' · '));
const gonMaDT = ds => ds.length <= 6 ? ds.join(', ') : ds.length + ' bảng (' + ds.slice(0, 4).join(', ') + ', … ' + ds[ds.length - 1] + ')';
function htmlDacTa(kq) {
  const d = kq.doi_chieu_dac_ta; if (!d) return '';
  const lop = { 'LỆCH': 'cao', 'CẢNH BÁO': 'tb' };
  const ds = d.ket_qua.slice().sort((a, b) => (LOAI_BANG.indexOf(a.loai_bang) - LOAI_BANG.indexOf(b.loai_bang)) || (THU_TU_KQ.indexOf(a.kq) - THU_TU_KQ.indexOf(b.kq)));
  const coVai = (d.vai_tai_khoan || []).filter(x => x.vai), khongVai = (d.vai_tai_khoan || []).length - coVai.length;
  const dong = rr => rr.map(k => `<tr class="${k.loai_bang === 'khung' ? '' : (lop[k.kq] || '')}"><td>${esc(k.loai_bang || '')}</td><td>${esc(k.kq)}</td><td>${esc(k.ma)}</td><td>${esc(k.muc)}</td><td>${esc(k.vai)}</td><td>${esc(k.can_cu || '')}</td><td>${esc(k.dg)}</td><td>${k.mat_xich != null ? '<span style="color:#6a1b9a">mắt xích ' + esc(k.mat_xich) + ' · ' + esc(TEN_MX[k.mat_xich] || '') + '</span><br>' : ''}<b>${esc(k.nhom || '')}</b>${k.nguyen_nhan ? ': ' + esc(k.nguyen_nhan) : ''}${k.viec_tiep ? '<br><span style="color:#666">→ ' + esc(k.viec_tiep) + '</span>' : ''}</td><td>${esc(k.co_tc_pm || '')}</td><td>${esc(k.nguon)}</td></tr>`).join('');
  const dau = '<table><thead><tr><th>Loại bảng</th><th>Kết quả</th><th>Mã ca</th><th>Bước</th><th>Vai</th><th>Căn cứ</th><th>Quan sát / diễn giải</th><th>Nguyên nhân → việc tiếp</th><th>Có TC PM</th><th>Nguồn đặc tả</th></tr></thead><tbody>';
  const demNhom = {}; for (const k of d.ket_qua) if (k.nhom && k.loai_bang !== 'khung') { const g = (k.mat_xich != null ? 'mắt xích ' + k.mat_xich + ' (' + TEN_MX[k.mat_xich] + ') · ' : '') + k.nhom; const x = demNhom[g] = demNhom[g] || {}; x[k.nguyen_nhan] = (x[k.nguyen_nhan] || 0) + 1; }
  const bangNhom = Object.keys(demNhom).length ? '<table><thead><tr><th>Nhóm nguyên nhân</th><th>Nguyên nhân</th><th>Số ca</th></tr></thead><tbody>' + Object.entries(demNhom).flatMap(([n, o]) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([nn, c]) => '<tr><td><b>' + esc(n) + '</b></td><td>' + esc(nn) + '</td><td>' + c + '</td></tr>')).join('') + '</tbody></table>' : '';
  const P = kq.phu_danh_muc_tc;
  const phu = !P ? '' : '<h3 style="font-size:14px">Phủ danh mục TC của PM (' + esc((P.danh_muc || {}).tep || '') + ')</h3><p class=m>TC áp cho vai này: <b>' + P.ap_dung + '</b> · có kết quả: <b>' + P.co_ket_qua + '</b> · chưa có kết quả: <b>' + P.chua_co_ket_qua + '</b> (không tính ĐẠT) · ca công cụ kiểm nhưng không có trong danh mục PM (thiếu TC): <b>' + P.ca_ngoai_danh_muc + '</b>. Ca nhập ô và ca thủ công tính riêng.</p>'
    + (Object.keys(P.theo_nguyen_nhan).length ? '<table><thead><tr><th>Vì sao chưa có kết quả</th><th>Số TC</th></tr></thead><tbody>' + Object.entries(P.theo_nguyen_nhan).sort((a, b) => b[1] - a[1]).map(([k, c]) => '<tr><td>' + esc(k) + '</td><td>' + c + '</td></tr>').join('') + '</tbody></table>' : '')
    + ((P.theo_ma_khac || []).length ? '<details><summary>TC v7 của bước đã dời tài liệu, kết quả theo TC đề xuất (' + P.theo_ma_khac.length + ')</summary><table><thead><tr><th>Mã TC v7</th><th>Theo mã</th><th>Kết quả</th><th>Quan sát</th></tr></thead><tbody>' + P.theo_ma_khac.map(t => '<tr><td>' + esc(t.ma) + '</td><td>' + esc(t.theo) + '</td><td>' + esc(t.kq) + '</td><td>' + esc(t.dg) + '</td></tr>').join('') + '</tbody></table></details>' : '')
    + (P.ds_chua_co.length ? '<details><summary>TC chưa có kết quả (' + P.ds_chua_co.length + (P.chua_co_ket_qua > P.ds_chua_co.length ? '/' + P.chua_co_ket_qua : '') + ')</summary><table><thead><tr><th>Mã TC</th><th>Loại</th><th>Nhóm</th><th>Nguyên nhân</th></tr></thead><tbody>' + P.ds_chua_co.map(t => '<tr><td>' + esc(t.ma) + '</td><td>' + esc(t.loai) + '</td><td>' + (t.mat_xich != null ? 'mắt xích ' + esc(t.mat_xich) + ' · ' : '') + esc(t.nhom) + '</td><td>' + esc(t.nguyen_nhan) + '</td></tr>').join('') + '</tbody></table></details>' : '')
    + (P.ds_ngoai_danh_muc.length ? '<details><summary>Ca ngoài danh mục TC (' + P.ca_ngoai_danh_muc + ') — PM bổ sung TC hoặc xác nhận bỏ</summary><table><thead><tr><th>Mã ca</th><th>Kết quả</th><th>Bước</th></tr></thead><tbody>' + P.ds_ngoai_danh_muc.map(t => '<tr><td>' + esc(t.ma) + '</td><td>' + esc(t.kq) + '</td><td>' + esc(t.muc) + '</td></tr>').join('') + '</tbody></table></details>' : '');
  // ĐẠT và LỚP 4 rất nhiều khi nạp cả bộ: để trong mục thu gọn, CSV vẫn có đủ
  const chinh = ds.filter(k => !['ĐẠT', 'LỚP 4', 'GHI NHẬN'].includes(k.kq)), dat = ds.filter(k => k.kq === 'ĐẠT'), l4 = ds.filter(k => k.kq === 'LỚP 4'), gn = ds.filter(k => k.kq === 'GHI NHẬN');
  return `<h2 style="font-size:16px;margin-top:28px">Đối chiếu đặc tả quy trình (${d.ket_qua.length})</h2>
<p class=m>Bảng đặc tả: ${esc(gonMaDT(d.quy_trinh.map(q => q.ma)))}.<br>
${coVai.length ? 'Tài khoản này giữ vai trong ' + coVai.length + ' bảng: ' + coVai.map(x => esc(x.ma + ' (' + x.vai + ')')).join(', ') + '.' : 'Tài khoản này không giữ vai nào trong các bảng.'}${khongVai ? ' Ở ' + khongVai + ' bảng còn lại, chỉ kiểm vai này không thấy màn và nút của quy trình.' : ''}<br>
${d.dem_theo_bang ? demBang(d).map(esc).join('<br>') : THU_TU_KQ.map(k => esc(k) + ': <b>' + (d.dem[k] || 0) + '</b>').join(' · ')}<br>
Kết quả theo bảng khung chỉ cho biết giao diện có khác lần quan sát trước hay không; không dùng làm kết luận đúng hay sai nghiệp vụ.<br>
Mỗi kết luận có căn cứ là một mục trong bảng đã nạp (cột Căn cứ). LỆCH: khác mục có nguồn được dữ liệu nạp khai là đã duyệt (nguon_da_duyet; chưa khai thì không có LỆCH). CẢNH BÁO: khác mục đặc tả chưa duyệt hoặc không ghi nguồn. GHI NHẬN: công cụ thấy nhưng đặc tả không nói gì, không phải lỗi. CHƯA KIỂM: thiếu dữ kiện (chưa mở được hồ sơ ở trạng thái cần, đặc tả chưa có nhãn, nút khoá). LỚP 4: chỉ kiểm được khi chạy quy trình thật trên môi trường kiểm thử riêng.</p>
${bangNhom}
${phu}
${dau}${dong(chinh)}</tbody></table>
<details><summary>ĐẠT (${dat.length})</summary>${dau}${dong(dat)}</tbody></table></details>
<details><summary>GHI NHẬN — không có căn cứ để kết luận (${gn.length})</summary>${dau}${dong(gn)}</tbody></table></details>
<details><summary>LỚP 4 (${l4.length})</summary>${dau}${dong(l4)}</tbody></table></details>`;
}
function sangCSVDacTa(kq) {
  const d = kq.doi_chieu_dac_ta; if (!d) return '';
  const q = v => '"' + cheChuoi(v == null ? '' : v).replace(/"/g, '""') + '"';
  return '\ufeff' + ['Loại bảng', 'Quy trình', 'Mã ca', 'Bước', 'Vai', 'Kết quả', 'Căn cứ', 'Quan sát / diễn giải', 'Nhóm nguyên nhân', 'Nguyên nhân', 'Việc tiếp', 'Có TC PM', 'Nguồn đặc tả', 'Tài khoản', 'Lúc chạy', 'Mắt xích'].map(q).join(',') + '\n'
    + d.ket_qua.map(k => [k.loai_bang, k.quy_trinh, k.ma, k.muc, k.vai, k.kq, k.can_cu, k.dg, k.nhom, k.nguyen_nhan, k.viec_tiep, k.co_tc_pm, k.nguon, kq.tai_khoan, kq.luc, k.mat_xich != null ? k.mat_xich + ' ' + (TEN_MX[k.mat_xich] || '') : ''].map(q).join(',')).join('\n');
}

/* <<DACTA-HET>> */
