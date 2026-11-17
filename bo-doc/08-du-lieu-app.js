/* Bộ đọc (bản 1.3): ba tệp dữ liệu dự án trước đây CHỈ có khi đóng gói (dist/rieng/ita-<dự án>.js gán thẳng vào biến) —
 * nay «Nạp thư mục» đọc được như nhau, cùng một đường. Nhận ra theo NỘI DUNG, không theo tên tệp.
 *  loi-da-biet.json        { loi_sap: [{ ma, duong_dan, … }], meta }  → window.__itaQuyTac   (bỏ qua màn đã biết là sập)
 *  gioi-han-o.json         { _nguon: { tep, ban }, o: { <name ô>: [khai báo] }, … } → window.__itaGioiHanO (kiểm ô theo khai báo của app)
 *  trang-thai-quy-trinh.json { tai_lieu_app_khong_co: [], app_chua_co_tai_lieu: [], … } → độ phủ tài liệu × app (70-nap.js, bộ ghép)
 * 70-nap.js đặt biến từ tệp đã nạp (thay bản đóng gói sẵn nếu có). */
{
  const docJSON = chu => { const s = chu.trim(); if (s[0] !== '{') return undefined; try { return JSON.parse(s); } catch (e) { return undefined; } };
  BO_DOC.push({
    ten: 'loi-da-biet',
    mo_ta: 'sổ màn đã biết là sập (bỏ qua trước khi mở, đối chiếu sổ yêu cầu)',
    nhan: (ten, chu) => { const d = docJSON(chu); return !!d && Array.isArray(d.loi_sap); },
    doc: (ten, chu) => ({ loi_da_biet: [docJSON(chu)] }),
  });
  BO_DOC.push({
    ten: 'gioi-han-o',
    mo_ta: 'giới hạn ô nhập sinh từ mã nguồn app (kiểm ô theo khai báo)',
    nhan: (ten, chu) => { const d = docJSON(chu); return !!d && !!d.o && typeof d.o === 'object' && !Array.isArray(d.o) && !!(d._nguon && d._nguon.tep); },
    doc: (ten, chu) => ({ gioi_han_o: [docJSON(chu)] }),
  });
  BO_DOC.push({
    ten: 'trang-thai-quy-trinh',
    mo_ta: 'đối chiếu tài liệu quy trình với workflow khai trong app (độ phủ quy trình)',
    nhan: (ten, chu) => { const d = docJSON(chu); return !!d && Array.isArray(d.tai_lieu_app_khong_co) && Array.isArray(d.app_chua_co_tai_lieu); },
    doc: (ten, chu) => ({ trang_thai_qt_tep: [docJSON(chu)] }),
  });
}
