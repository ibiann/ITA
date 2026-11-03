/* ============================================================= *
 * ĐẶC TẢ QUY TRÌNH (UC) — nạp vào công cụ, đối chiếu ngay khi chạy
 *   Bảng đặc tả theo mẫu MauDacTa_QuyTrinh_DQTV (YAML → JSON).
 *   dqtv.napDacTa(...) lưu vào trình duyệt; mỗi lần chạy xong công cụ
 *   tự đối chiếu và thêm mục "Đối chiếu đặc tả quy trình" vào báo cáo.
 * ============================================================= */
/* <<DACTA-BAT-DAU>> */
const KEY_DACTA = 'dqtv.dacta.v325';
// Bộ đặc tả lớn (hơn 100 bảng) có thể vượt hạn mức lưu của trình duyệt: khi đó giữ trong bộ nhớ của trang cho lần dán này.
function docDacTa() {
  if (Array.isArray(window.__dqtvDacTaBoNho)) return window.__dqtvDacTaBoNho;
  try { const x = JSON.parse(localStorage.getItem(KEY_DACTA) || '[]'); return Array.isArray(x) ? x : []; } catch (e) { return []; }
}
function luuDacTa(ds) {
  if (napDacTaVao.chiBoNho) { window.__dqtvDacTaBoNho = ds; return 'bo_nho'; }   // [S2] bộ đóng gói: chỉ giữ trong trang
  try { localStorage.setItem(KEY_DACTA, JSON.stringify(ds)); window.__dqtvDacTaBoNho = null; return 'luu'; }
  catch (e) { try { localStorage.removeItem(KEY_DACTA); } catch (e2) {} window.__dqtvDacTaBoNho = ds; return 'bo_nho'; }
}
// Tài khoản khớp nhãn đăng nhập của vai. Bỏ chữ viết tắt ở đầu (BD, PK, TQ…) ở cả hai bên:
// ứng dụng chỉ hiện chữ viết tắt này ở cửa sổ rộng, cửa sổ hẹp thì mất.
function khopTK(tk, nhan) {
  if (!nhan) return false;
  const bo = x => String(x || '').replace(/\*/g, '').replace(/\s+/g, ' ').trim().replace(/^[A-ZĐ]{2,3} (?=\S)/, '').toLowerCase();
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
const nguonDaDuyet = n => ((window.__dqtvQuyTac || {}).nguon_da_duyet || ['UC']).includes(n);
const chuanDT = s => String(s == null ? '' : s).replace(/\*/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
const duongDanDT = u => String(u || '').replace(/^https?:\/\/[^/]+/, '').split(/[?#]/)[0];
const mauDuongDanDT = p => p ? new RegExp('^' + String(p).split('{id}').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^/]+') + '$') : null;

// giá trị điền sẵn là một bản ghi (có mã định danh) thì không chép ra: thường là tên người, số hồ sơ
const giaTriGon = v => /\[mã: [0-9a-f]{8}-[0-9a-f]{4}-/i.test(String(v)) ? 'một bản ghi (không chép giá trị)' : '"' + String(v).replace(/\d{9,}/g, x => x.slice(0, 2) + '…') + '"';
function doiChieuDacTa(kq, dsDT) {
  const KQ = [];
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
  const vctCo = nut => forms.some(f => /^Việc của tôi/.test(f) && f.includes('«' + nut + '»'));

  for (const dt of dsDT) {
    const ma = maQT(dt);
    const loaiBang = Array.isArray(dt.ban_giao) ? 'chuỗi' : ((dt.mau || {}).loai_bang === 'khung' ? 'khung' : 'đặc tả');
    // chuỗi khép kín: kiểm các điểm bàn giao thấy được trên giao diện; phần chạy trọn chuỗi là lớp 4
    if (Array.isArray(dt.ban_giao)) {
      const ghiC = (muc, maCa, ketQua, dg, nguon) => KQ.push({ quy_trinh: ma, muc, ma: maCa, vai: '—', kq: ketQua, dg, nguon: nguon || '', loai_bang: loaiBang });
      for (const bg of dt.ban_giao) {
        const k = bg.kiem_lop3; const ten = bg.ma + ' ' + ((bg.tu || {}).qt || '') + ' → ' + ((bg.den || {}).qt || '');
        if (!k || !k.vai || !khopTK(kq.tai_khoan, k.vai)) continue;
        const { r } = nutThay(k.man);
        const co = k.nut && (r.has(k.nut) || vctCo(k.nut));
        const lech = nguonDaDuyet(bg.nguon) ? 'LỆCH' : 'CẢNH BÁO';
        if (k.nut) KQ.push({ quy_trinh: ma, muc: 'Bàn giao ' + ten, ma: ma + '.' + bg.ma + '.NUT', vai: k.vai, kq: co ? 'ĐẠT' : lech, dg: co ? 'thấy nút "' + k.nut + '" ở bên nhận' : 'bên nhận không thấy nút "' + k.nut + '" ở ' + k.man, nguon: bg.nguon, loai_bang: loaiBang });
        if (k.nut && (bg.truong_noi || k.can_truong)) {
          const ft = truongForm(k.nut, k.man).map(t => chuanDT(t.nhan));
          const can = k.can_truong ? [k.can_truong] : [];
          if (!ft.length) KQ.push({ quy_trinh: ma, muc: 'Bàn giao ' + ten, ma: ma + '.' + bg.ma + '.TRUONG_NOI', vai: k.vai, kq: 'CHƯA KIỂM', dg: 'chưa đọc được form "' + k.nut + '"', nguon: bg.nguon, loai_bang: loaiBang });
          else if (can.length) { const ok = can.every(x => ft.includes(chuanDT(x))); KQ.push({ quy_trinh: ma, muc: 'Bàn giao ' + ten, ma: ma + '.' + bg.ma + '.TRUONG_NOI', vai: k.vai, kq: ok ? 'ĐẠT' : lech, dg: ok ? 'form có trường "' + can.join(', ') + '"' : 'form thiếu trường "' + can.join(', ') + '"', nguon: bg.nguon, loai_bang: loaiBang }); }
          else KQ.push({ quy_trinh: ma, muc: 'Bàn giao ' + ten, ma: ma + '.' + bg.ma + '.TRUONG_NOI', vai: k.vai, kq: 'CẢNH BÁO', dg: 'chưa xác định trường nối trên form; form hiện có: ' + [...new Set(truongForm(k.nut, k.man).map(t => t.nhan))].join(', '), nguon: bg.nguon, loai_bang: loaiBang });
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
    const ghi = (muc, maCa, ketQua, dg, nguon) => KQ.push({ quy_trinh: ma, muc, ma: maCa, vai: vaiHien, kq: ketQua, dg, nguon: nguon || '', loai_bang: loaiBang });
    const lech = n => nguonDaDuyet(n) ? 'LỆCH' : 'CẢNH BÁO';

    // 1. quyền xem
    // màn Việc của tôi ai cũng thấy: không dùng làm màn của quy trình khi xét quyền xem
    const b0 = (dt.buoc || []).find(b => b.duong_dan_man && !/\{id\}/.test(b.duong_dan_man) && !/^\/dqtv\/viec-cua-toi/.test(b.duong_dan_man));
    if (b0) {
      const goc = b0.duong_dan_man, thay = man.some(m => m.url.startsWith(goc));
      const q = (dt.quyen_du_lieu || []).find(x => x.vai === v && (x.hanh_dong || []).includes('xem')) || (dt.quyen_xem || []).find(x => x.vai === v);
      const sxX = manSapCua(goc);
      if (sxX) ghi('Quyền xem', ma + '.XEM', 'CHƯA KIỂM', 'màn ' + goc + (sxX.bo_truoc ? ' không mở (đã biết là sập)' : ' sập khi mở') + nhanLoiBiet(sxX), q ? q.nguon : '');
      else if (q && q.chi_xem) ghi('Quyền xem', ma + '.XEM', thay ? 'ĐẠT' : 'CHƯA KIỂM', 'đặc tả: chỉ xem ' + q.chi_xem + '; giao diện ' + (thay ? 'có' : 'không') + ' thấy màn ' + goc, q.nguon);
      else if (q) ghi('Quyền xem', ma + '.XEM', thay ? 'ĐẠT' : lech(q.nguon), thay ? 'thấy màn ' + goc : 'đặc tả cho xem, giao diện không thấy màn ' + goc, q.nguon);
      else ghi('Quyền xem', ma + '.XEM', thay ? 'CẢNH BÁO' : 'ĐẠT', thay ? 'đặc tả không cho xem, giao diện thấy màn ' + goc : 'không thấy màn ' + goc + ', đúng đặc tả', '');
    }
    // 2. từng bước
    const khongVao = [];
    // [3.25] đã mở được ít nhất một màn của quy trình chưa (để "không thấy" mới là bằng chứng)
    const manKhai = [].concat((dt.man_danh_sach || []).map(x => x.duong_dan), (dt.buoc || []).map(x => x.duong_dan_man)).filter(dd => dd && !/viec-cua-toi/.test(dd)), coManKhai = manKhai.length > 0;
    const coManQT = [].concat((dt.man_danh_sach || []).map(x => x.duong_dan), (dt.buoc || []).map(x => x.duong_dan_man)).filter(Boolean).some(dd => { const g = duongDanDT(String(dd).split('/{id}')[0]).replace(/\/+$/, ''); return g && !/viec-cua-toi/.test(g) && man.some(m => m.url === g || m.url.startsWith(g + '/')); });
    for (const b of (dt.buoc || [])) {
      const mb = ma + '.' + b.ma, nut = b.nut, ng = b.nguon, ten = b.ma + ' ' + (b.ten || '');
      if (!v && b.loai_buoc !== 'he_tu_lam' && !nut) continue;   // vai ngoài đặc tả: chỉ kiểm không thấy nút
      if (b.loai_buoc === 'he_tu_lam') {   // [S13] bước hệ thống tự làm (phiên auto): không vai nào được thấy nút
        const nutHT = b.ten; const { r: rrHT } = nutThay(b.duong_dan_man);
        if (nutHT && (rrHT.has(nutHT) || vctCo(nutHT))) ghi(ten, mb + '.HE_THONG', lech(ng), '[AUTO-BƯỚC] người dùng thấy nút «' + nutHT + '» của bước hệ thống tự làm (' + [...(rrHT.get(nutHT) || [])].join('; ') + ') — YC-CHUNG-09', ng);
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
        const thay = [], daXem = [];
        for (const x of khac) {
          const o = nutThay(b.duong_dan_man, m => m.ten.includes('«' + x.nhan + '»'));
          if (!o.khop.length) continue;
          daXem.push(x.nhan); if (o.r.has(nut) && ![...o.r.get(nut)].some(c => /khoá/.test(c))) thay.push(x.nhan);
        }
        if (thay.length) ghi(ten, mb + '.SAI_TRANG_THAI', lech(ng), 'nút "' + nut + '" hiện ở hồ sơ chặng ' + thay.map(x => '«' + x + '»').join(', ') + ' (chỉ được làm ở ' + [...duocTT].map(m => '«' + ((tt[m] || {}).nhan || m) + '»').join(', ') + ')', ng);
        else if (daXem.length) ghi(ten, mb + '.SAI_TRANG_THAI', 'ĐẠT', 'không thấy nút ở hồ sơ chặng ' + daXem.map(x => '«' + x + '»').join(', '), ng);
      }
      // trạng thái hồ sơ chỉ xét khi nút nằm trên hồ sơ của chính quy trình (đường dẫn có {id})
      const nhanTT = b.tu && tt[b.tu] && (!b.duong_dan_man || /\{id\}/.test(b.duong_dan_man)) ? tt[b.tu].nhan : null;
      const { r: tatCa, khop: manRoute } = nutThay(b.duong_dan_man);
      const coO = (rr) => rr.has(nut) || vctCo(nut);
      const cach = rr => [...(rr.get(nut) || [])].join('; ') + (vctCo(nut) ? '; có ở Việc của tôi' : '');
      if (!duoc) {
        if (coO(tatCa)) ghi(ten, mb + '.SAI_VAI', lech(ng), 'vai không được làm bước này nhưng thấy nút "' + nut + '" (' + cach(tatCa) + ')', ng);
        else if (b.duong_dan_man && !manRoute.length) khongVao.push(b.ma);   // màn không mở được: gộp một dòng, không đếm ĐẠT từng bước
        else if (b.duong_dan_man || coManQT) ghi(ten, mb + '.SAI_VAI', 'ĐẠT', (b.duong_dan_man ? 'đã mở màn ' + b.duong_dan_man + ', không thấy nút "' : 'đã mở màn của quy trình, không thấy nút: "') + nut + '"', ng);
        else if (coManKhai) khongVao.push(b.ma);   // màn của quy trình có khai nhưng vai này không vào được: gộp một dòng như cũ
        else ghi(ten, mb + '.SAI_VAI', 'CHƯA KIỂM', 'không đủ căn cứ: đặc tả không ghi màn của quy trình (CK-5) nên "không thấy nút" chưa chứng minh được', ng);   // [3.25] không đánh ĐẠT khi vắng bằng chứng
        continue;
      }
      if (b.duong_dan_man && !manRoute.length && !vctCo(nut)) { ghi(ten, mb + '.DUNG', 'CHƯA KIỂM', 'vai này không mở được màn ' + b.duong_dan_man, ng); continue; }
      // đúng vai: tìm nút ở hồ sơ đúng trạng thái "tu"
      let rr = tatCa, coSo = '';
      if (nhanTT) { const o = nutThay(b.duong_dan_man, m => m.ten.includes('«' + nhanTT + '»')); rr = o.r; coSo = o.khop.length ? '' : 'chưa mở được hồ sơ ở trạng thái «' + nhanTT + '»'; }
      if (coO(rr)) {
        ghi(ten, mb + '.DUNG', 'ĐẠT', 'thấy nút "' + nut + '" (' + cach(rr) + ')' + (/khoá/.test(cach(rr)) ? '. Nút đang khoá' : ''), ng);
        const ck = cach(rr);
        if (/khoá/.test(ck)) {
          if (/không ghi lý do/.test(ck)) ghi(ten, mb + '.LY_DO_KHOA', 'CẢNH BÁO', 'nút "' + nut + '" đang khoá nhưng không ghi lý do', ng);
          else if ((b.khoa_khi || []).length) { const lyDo = b.khoa_khi.map(k => k.ly_do_hien).filter(Boolean); const khop = lyDo.some(x => ck.includes(x)); ghi(ten, mb + '.LY_DO_KHOA', khop ? 'ĐẠT' : lech(ng), khop ? 'lý do khoá đúng đặc tả' : 'lý do khoá khác đặc tả (' + lyDo.join(' / ') + '): ' + ck, ng); }
        }
      }
      else if (coSo) { ghi(ten, mb + '.DUNG', 'CHƯA KIỂM', coSo, ng); continue; }
      else if (b.tu && !nhanTT) { ghi(ten, mb + '.DUNG', 'CHƯA KIỂM', 'không thấy nút "' + nut + '". Đặc tả chưa có nhãn trạng thái ' + b.tu + ' nên không biết hồ sơ mẫu có ở đúng trạng thái không', ng); continue; }
      else {
        // bước chỉ hiện khi dữ liệu của hồ sơ thỏa điều kiện (loại chức vụ, cấp chủ hồ sơ, ô đã có…): hồ sơ đã mở chưa chắc thỏa → chưa kết luận
        const dkDL = (b.dieu_kien || []).map(x => typeof x === 'string' ? x : (x.ma + ': ' + (x.dung_khi || ''))).filter(x => !/người (đang )?làm (là người|thuộc)|^actorIn/i.test(x));
        if (dkDL.length) ghi(ten, mb + '.DUNG', 'CHƯA KIỂM', 'không thấy nút "' + nut + '"' + (nhanTT ? ' ở hồ sơ «' + nhanTT + '» đã mở' : '') + '; nút chỉ hiện khi hồ sơ thỏa: ' + dkDL.slice(0, 2).join(' ; ').slice(0, 220) + (dkDL.length > 2 ? ' …' : '') + '. Cần hồ sơ mẫu thỏa điều kiện', ng);
        else ghi(ten, mb + '.DUNG', lech(ng), 'không thấy nút "' + nut + '" trên ' + (rr.size ? 'các màn đã quét' : 'màn') + (nhanTT ? ' (hồ sơ «' + nhanTT + '»)' : ''), ng);
        continue;
      }
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
        if (!td.nhan) { ghi(ten, mb + '.TRUONG.' + mt, (nguonDaDuyet(td.nguon) || td.nguon === 'DE_XUAT') ? lech(td.nguon) : 'CHƯA KIỂM', 'đặc tả đòi trường "' + mt + '" nhưng chưa có nhãn; form hiện có: ' + coNhan.join(', '), td.nguon); continue; }
        const t = theoNhan.get(chuanDT(td.nhan));
        if (!t) { ghi(ten, mb + '.TRUONG.' + mt, lech(td.nguon), 'form không có trường "' + td.nhan + '"', td.nguon); continue; }
        const loi = [];
        if (td.bat_buoc && t.bat_buoc !== 'Có') loi.push('không bắt buộc');
        if (/không có dấu \*/.test(t.ghi_chu || '')) loi.push('bắt buộc nhưng nhãn không có dấu *');
        if (td.mac_dinh == null && !laFormSua(b) && t.gia_tri && !/^—/.test(t.gia_tri) && ['chọn', 'chữ', 'số', 'ngày/giờ'].includes(t.loai)) {   // [S14] phân loại tự điền
          const gt = giaTriGon(t.gia_tri), gtTho = String(t.gia_tri).replace(/\s*\[mã:[^\]]*\]/g, '').trim();
          if (/kết luận|thẩm quyền|độ mật|mật|ngày ký|người ký|cấp quyết định|quyết định|hình thức|xếp loại|kết quả|lý do|loại đóng|căn cứ đóng/i.test(td.nhan || '')) loi.push('[AUTO-ĐIỀN:QĐ] app tự chọn sẵn quyết định nghiệp vụ ' + gt + ' (YC-GD-13)');
          else if (gtTho && chuanDT(kq.tai_khoan || '').includes(chuanDT(gtTho))) loi.push('[AUTO-ĐIỀN:TK] điền sẵn theo tài khoản đang đăng nhập ' + gt + ' — chờ PM xác nhận');
          else if (td.bat_buoc) loi.push('[AUTO-ĐIỀN:BB] ô bắt buộc có giá trị sẵn ' + gt + ' — chờ Bên B giải trình nguồn (YC-GD-08)');
          else loi.push('[AUTO-ĐIỀN] ô không bắt buộc có giá trị sẵn ' + gt);
        }
        if (Array.isArray(td.lua_chon)) { const co = String(t.lua_chon || '').split(';').map(s => s.trim()).filter(s => s && !/^—/.test(s)); const thieu = td.lua_chon.filter(x => !co.includes(x)); if (thieu.length) loi.push('thiếu lựa chọn: ' + thieu.join(', ')); }
        ghi(ten, mb + '.TRUONG.' + mt, loi.length ? lech(td.nguon) : 'ĐẠT', loi.length ? loi.join('; ') : 'có trường "' + td.nhan + '"', td.nguon);
      }
      const daNeu = new Set(b.truong_phai_nhap.map(x => chuanDT((truong[x] || {}).nhan)));
      const thua = coNhan.filter(n => !daNeu.has(chuanDT(n)));
      if (thua.length) ghi(ten, mb + '.TRUONG_THUA', 'CẢNH BÁO', 'form có trường không nêu trong đặc tả: ' + thua.join(', '), ng);
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
  const DONG = (window.__dqtvQuyTac || {}).tc_dong || {};
  for (const k of KQ) { const d = DONG[k.ma]; if (d && k.kq !== 'ĐẠT' && k.kq !== 'LỚP 4') { k.dg = 'đã đóng theo ' + d.ma + ': ' + d.ly_do + ' (quan sát: ' + k.dg + ')'; if (k.loai_bang !== 'khung') k.kq = 'ĐẠT'; k.da_dong = d.ma; } }
  // [3.25] lần chạy dừng giữa chừng: "không thấy" chưa phải bằng chứng → không đánh ĐẠT
  if (kq.dung_giua_chung) for (const k of KQ) if (k.kq === 'ĐẠT' && !k.da_dong && (/^(không thấy|vai không mở được|đã mở màn[^,]*, không thấy)/.test(k.dg || '') || /\.(KHONG_VAO_MAN|SAI_CHE_DO)$/.test(k.ma))) { k.kq = 'CHƯA KIỂM'; k.dg += ' — lần chạy dừng giữa chừng, vắng mặt chưa đủ làm bằng chứng'; }
  const DM = window.__dqtvDanhMucTC, CO_TC = DM && DM.phien_ban === 2 && Array.isArray(DM.tc) ? new Set(DM.tc.map(t => t[0])) : null;   // 3.31: v7
  for (const k of KQ) { const p = phanLoaiKQ(k); if (p) { k.nhom = p[0]; k.nguyen_nhan = p[1]; k.viec_tiep = p[2]; } if (CO_TC && k.loai_bang === 'đặc tả') k.co_tc_pm = CO_TC.has(k.ma) ? 'có' : 'không'; }
  const dem = {}, dem_theo_bang = {}; for (const k of KQ) { dem[k.kq] = (dem[k.kq] || 0) + 1; const g = dem_theo_bang[k.loai_bang] = dem_theo_bang[k.loai_bang] || {}; g[k.kq] = (g[k.kq] || 0) + 1; }
  const vaiTK = dsDT.map(d => { const x = (d.vai || []).find(y => khopTK(kq.tai_khoan, y.nhan_dang_nhap)); return { ma: maQT(d), vai: x ? x.ma : null }; });
  return { quy_trinh: dsDT.map(d => ({ ma: maQT(d), ten: (d.dinh_danh || {}).ten || '', phien_ban: (d.dinh_danh || {}).phien_ban || '' })), vai_tai_khoan: vaiTK, dem, dem_theo_bang, ket_qua: KQ };
}

const THU_TU_KQ = ['LỆCH', 'CẢNH BÁO', 'CHƯA KIỂM', 'ĐẠT', 'LỚP 4'];
/* [3.25] Nguyên nhân của mỗi kết quả chưa ĐẠT — để biết lỗi do đâu trước khi gửi yêu cầu sửa.
 * nhóm: AUTO (tự điền / bước hệ thống tự làm) · ỨNG DỤNG (gửi Bên B/dev) · QUY TRÌNH (đặc tả thiếu/chưa chốt → PM) · TC (danh mục TC lệch đặc tả → PM)
 *       THIẾU (dữ liệu, tài khoản → Bên B nạp) · CÔNG CỤ (công cụ chưa đọc được → kiểm tay / khai đồng nghĩa) · THỦ CÔNG */
const LUAT_NN = [
  [k => k.kq === 'LỚP 4', 'THỦ CÔNG', 'ca phải bấm Lưu hoặc chạy trọn quy trình', 'chạy trên môi trường kiểm thử riêng, ghi vào danh mục TC'],
  [k => /LỖI ĐÃ BIẾT/.test(k.dg), 'ỨNG DỤNG', 'lỗi đã biết trong sổ yêu cầu', 'chờ Bên B sửa; chạy lại sau khi có bản sửa'],
  [k => /\[AUTO-ĐIỀN:QĐ\]/.test(k.dg), 'AUTO', 'app tự chọn sẵn quyết định nghiệp vụ (YC-GD-13)', 'gửi Bên B sửa — mức Cao'],
  [k => /\[AUTO-ĐIỀN:BB\]/.test(k.dg), 'AUTO', 'ô bắt buộc có giá trị sẵn (YC-GD-08)', 'Bên B giải trình nguồn giá trị; PM chốt giữ hay bỏ'],
  [k => /\[AUTO-ĐIỀN:TK\]/.test(k.dg), 'AUTO', 'điền sẵn theo tài khoản đang đăng nhập', 'PM xác nhận có hợp lệ không'],
  [k => /\[AUTO-ĐIỀN\]/.test(k.dg), 'AUTO', 'ô không bắt buộc có giá trị sẵn', 'PM xác nhận có hợp lệ không'],
  [k => /\[AUTO-BƯỚC\]/.test(k.dg) && k.kq !== 'CHƯA KIỂM', 'AUTO', 'người dùng thấy nút của bước hệ thống tự làm (YC-CHUNG-09)', 'gửi Bên B: bước này phải chỉ do phiên auto chạy'],
  [k => /\[AUTO-BƯỚC\]/.test(k.dg), 'THIẾU', 'chưa mở được màn của quy trình', 'chạy bằng tài khoản có vai trong quy trình'],
  [k => /lỗi mới, cần báo/.test(k.dg), 'ỨNG DỤNG', 'màn sập mới (chưa có trong sổ)', 'báo Bên B/dev kèm tài khoản, vai, đường dẫn, thời điểm'],
  [k => /lần chạy dừng giữa chừng/.test(k.dg), 'CÔNG CỤ', 'lần chạy chưa xong', 'chạy lại tới hết'],
  [k => k.nguon === 'CAN_BO_SUNG' || /đặc tả chưa có|chưa có nhãn|đặc tả không ghi|Đặc tả chưa có nhãn trạng thái/.test(k.dg), 'QUY TRÌNH', 'đặc tả thiếu (nút, vai, nhãn, màn)', 'PM/Bên B bổ sung đặc tả'],
  [k => /chưa mở được hồ sơ|Cần hồ sơ|nút chỉ hiện khi hồ sơ thỏa|chưa có hồ sơ|hồ sơ mẫu|không có hồ sơ/.test(k.dg), 'THIẾU', 'thiếu hồ sơ mẫu đúng chặng/điều kiện', 'Bên B nạp dữ liệu mẫu (CK-1, CK-2)'],
  [k => /không mở được màn|chưa có tài khoản|không có quyền vào/.test(k.dg), 'THIẾU', 'tài khoản/vai không vào được màn', 'kiểm phân quyền hoặc dùng tài khoản đúng vai (CK-4)'],
  [k => /công cụ chưa|chưa đọc được form|không thấy ô|không phải ô gõ chữ|đang khoá|chưa bấm|chưa mở được form|không đủ căn cứ|chưa xác định trường nối/.test(k.dg), 'CÔNG CỤ', 'công cụ chưa đọc/bấm được', 'kiểm tay, hoặc khai bảng đồng nghĩa chữ nút/màn (CK-6)'],
  [k => (k.kq === 'LỆCH' || k.kq === 'CẢNH BÁO') && ['DE_XUAT', 'GD'].includes(k.nguon), 'QUY TRÌNH', 'đặc tả chưa chốt (nguồn ' + '' + 'đề xuất/giao diện)', 'PM chốt điểm đặc tả trước khi coi là lỗi'],
  [k => k.kq === 'LỆCH', 'ỨNG DỤNG', 'giao diện khác điểm đặc tả đã duyệt', 'gửi yêu cầu sửa Bên B'],
  [k => k.kq === 'CẢNH BÁO', 'ỨNG DỤNG', 'giao diện khác tài liệu Bên B (chưa duyệt)', 'Bên B chốt: sửa app hoặc sửa tài liệu'],
  [k => k.kq === 'CHƯA KIỂM', 'CÔNG CỤ', 'chưa rõ', 'xem diễn giải'],
];
const phanLoaiKQ = k => { if (k.kq === 'ĐẠT') return null; const r = LUAT_NN.find(x => { try { return x[0](k); } catch (e) { return false; } }); return r ? [r[1], r[2], r[3]] : null; };
/* [3.31] Chấm theo ma trận v7 (CT-06/07/08/15), giữ tên của [3.25]. Lỗi → kq.ma_tran = {loi}, không ném. ma_tran.dong không lưu;
 * dựng lại từ bản lưu thì dùng kc (KHUNG-CHUNG) và loc đã lưu. */
function phuDanhMucTC(kq, d) {
  const DM = window.__dqtvDanhMucTC, DA = window.__dqtvDuAn, loiGoi = kiemGoi(DA, DM);
  if (loiGoi) { kq.ma_tran = { loi: loiGoi, ban_tool: PHIEN_BAN }; return null; }
  try {
    const cu = kq.ma_tran || {};
    const kc = cu.kc || chamKhungChung(kq.man_quet, kq.thu_o_nhap, DA, { sap: kq.man_sap, thietKe: kq.he_thong_thiet_ke }), tool = kc.concat(kq.tc_nhap_kq || []);
    const coV7 = new Set(DM.tc.map(t => t[0])), vaiTheoQT = Object.fromEntries(((d && d.vai_tai_khoan) || []).map(x => [x.ma, x.vai]));
    for (const k of (d && d.ket_qua) || []) {
      if (k.loai_bang === 'khung') continue;   // mốc, không phải ca kiểm
      // ca không mã v7: lọc như [3.25]
      if (!coV7.has(k.ma) && !k.buoc_gop && (k.kq === 'LỚP 4' || !vaiTheoQT[k.quy_trinh] || /\.(NHAP|DONG|KHONG_VAO_MAN|TRUONG_THUA|LY_DO_KHOA|SAI_CHE_DO)\b|\.NHAP\./.test(k.ma))) continue;
      // dòng KHONG_VAO_MAN gộp các ca SAI_VAI (mã v7) → tách lại từng mã
      if (k.buoc_gop) { for (const b of k.buoc_gop) tool.push({ ma: k.quy_trinh + '.' + b + '.SAI_VAI', kq: k.kq, dg: k.dg, nhom: k.nhom, nguyen_nhan: k.nguyen_nhan }); continue; }
      tool.push(k);
    }
    const loc = cu.loc || docKeHoach(), r = chamTheoMaTran(tool, DM, DA, kq.tai_khoan, loc, vaiTheoQT);
    kq.ma_tran = { ngoai_danh_muc: r.ngoai_danh_muc, dem: r.dem, so_cho_pm: r.dong.length - Object.values(r.dem).reduce((a, b) => a + b, 0), bam: DA.bam, ban_tool: PHIEN_BAN,
      so_tc_theo_vai: r.so_tc_theo_vai, loc, danh_muc: DM.meta || {}, kc, canh_bao: d ? '' : (docDacTa().length ? 'đối chiếu đặc tả lỗi (xem Console)' : 'chưa nạp đặc tả') + ': chỉ chấm KHUNG-CHUNG và ca nhập ô' };
    Object.defineProperty(kq.ma_tran, 'dong', { value: r.dong });
    return { danh_muc: DM.meta || {}, so_tc: r.dong.length, dem: r.dem, ngoai_danh_muc: r.ngoai_danh_muc.length };
  } catch (e) { kq.ma_tran = { loi: 'lỗi khi chấm ma trận: ' + ((e && e.message) || e), ban_tool: PHIEN_BAN }; return null; }
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
  const dong = rr => rr.map(k => `<tr class="${k.loai_bang === 'khung' ? '' : (lop[k.kq] || '')}"><td>${esc(k.loai_bang || '')}</td><td>${esc(k.kq)}</td><td>${esc(k.ma)}</td><td>${esc(k.muc)}</td><td>${esc(k.vai)}</td><td>${esc(k.dg)}</td><td><b>${esc(k.nhom || '')}</b>${k.nguyen_nhan ? ': ' + esc(k.nguyen_nhan) : ''}${k.viec_tiep ? '<br><span style="color:#666">→ ' + esc(k.viec_tiep) + '</span>' : ''}</td><td>${esc(k.co_tc_pm || '')}</td><td>${esc(k.nguon)}</td></tr>`).join('');
  const dau = '<table><thead><tr><th>Loại bảng</th><th>Kết quả</th><th>Mã ca</th><th>Bước</th><th>Vai</th><th>Diễn giải</th><th>Nguyên nhân → việc tiếp</th><th>Có TC PM</th><th>Nguồn đặc tả</th></tr></thead><tbody>';
  const demNhom = {}; for (const k of d.ket_qua) if (k.nhom && k.loai_bang !== 'khung') { const x = demNhom[k.nhom] = demNhom[k.nhom] || {}; x[k.nguyen_nhan] = (x[k.nguyen_nhan] || 0) + 1; }
  const bangNhom = Object.keys(demNhom).length ? '<table><thead><tr><th>Nhóm nguyên nhân</th><th>Nguyên nhân</th><th>Số ca</th></tr></thead><tbody>' + Object.entries(demNhom).flatMap(([n, o]) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([nn, c]) => '<tr><td><b>' + esc(n) + '</b></td><td>' + esc(nn) + '</td><td>' + c + '</td></tr>')).join('') + '</tbody></table>' : '';
  // ĐẠT và LỚP 4 rất nhiều khi nạp cả bộ: để trong mục thu gọn, CSV vẫn có đủ
  const chinh = ds.filter(k => k.kq !== 'ĐẠT' && k.kq !== 'LỚP 4'), dat = ds.filter(k => k.kq === 'ĐẠT'), l4 = ds.filter(k => k.kq === 'LỚP 4');
  return `<h2 style="font-size:16px;margin-top:28px">Đối chiếu đặc tả quy trình (${d.ket_qua.length})</h2>
<p class=m>Bảng đặc tả: ${esc(gonMaDT(d.quy_trinh.map(q => q.ma)))}.<br>
${coVai.length ? 'Tài khoản này giữ vai trong ' + coVai.length + ' bảng: ' + coVai.map(x => esc(x.ma + ' (' + x.vai + ')')).join(', ') + '.' : 'Tài khoản này không giữ vai nào trong các bảng.'}${khongVai ? ' Ở ' + khongVai + ' bảng còn lại, chỉ kiểm vai này không thấy màn và nút của quy trình.' : ''}<br>
${d.dem_theo_bang ? demBang(d).map(esc).join('<br>') : THU_TU_KQ.map(k => esc(k) + ': <b>' + (d.dem[k] || 0) + '</b>').join(' · ')}<br>
Kết quả theo bảng khung chỉ cho biết giao diện có khác lần quan sát trước hay không; không dùng làm kết luận đúng hay sai nghiệp vụ.<br>
LỆCH: khác mục đặc tả đã duyệt (nhãn UC). CẢNH BÁO: khác mục chưa duyệt (DE_XUAT, GD, B). CHƯA KIỂM: thiếu dữ kiện (chưa mở được hồ sơ ở trạng thái cần, đặc tả chưa có nhãn, nút khoá). LỚP 4: chỉ kiểm được khi chạy quy trình thật trên môi trường kiểm thử riêng.</p>
${bangNhom}
${dau}${dong(chinh)}</tbody></table>
<details><summary>ĐẠT (${dat.length})</summary>${dau}${dong(dat)}</tbody></table></details>
<details><summary>LỚP 4 (${l4.length})</summary>${dau}${dong(l4)}</tbody></table></details>`;
}
function sangCSVDacTa(kq) {
  const d = kq.doi_chieu_dac_ta; if (!d) return '';
  const q = v => '"' + cheChuoi(v == null ? '' : v).replace(/"/g, '""') + '"';
  return '\ufeff' + ['Loại bảng', 'Quy trình', 'Mã ca', 'Bước', 'Vai', 'Kết quả', 'Diễn giải', 'Nhóm nguyên nhân', 'Nguyên nhân', 'Việc tiếp', 'Có TC PM', 'Nguồn đặc tả', 'Tài khoản', 'Lúc chạy'].map(q).join(',') + '\n'
    + d.ket_qua.map(k => [k.loai_bang, k.quy_trinh, k.ma, k.muc, k.vai, k.kq, k.dg, k.nhom, k.nguyen_nhan, k.viec_tiep, k.co_tc_pm, k.nguon, kq.tai_khoan, kq.luc].map(q).join(',')).join('\n');
}

/* <<DACTA-HET>> */
