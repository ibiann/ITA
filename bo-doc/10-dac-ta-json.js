/* Bộ đọc: bảng đặc tả quy trình, khuôn JSON mẫu 2.1 (khuôn mà 50-doi-chieu-dac-ta.js đối chiếu).
 * Nhận ra theo NỘI DUNG, không theo tên tệp: JSON là một bảng hoặc một mảng bảng; MỌI bảng phải có dinh_danh kèm mã
 * (ma / ma_ben_b / ma_qt) và ít nhất một trong buoc / ban_giao / vai. Một bảng sai khuôn thì cả tệp «không nhận ra».
 * Bảng giữ nguyên như trong tệp: không sửa, không thêm mục nào. */
{
  const laBang = d => !!d && typeof d === 'object' && !!d.dinh_danh && typeof d.dinh_danh === 'object'
    && !!(d.dinh_danh.ma || d.dinh_danh.ma_ben_b || d.dinh_danh.ma_qt)
    && (Array.isArray(d.buoc) || Array.isArray(d.ban_giao) || Array.isArray(d.vai));
  const docJSON = chu => { const s = chu.trim(); return /^[[{]/.test(s) ? JSON.parse(s) : undefined; };
  BO_DOC.push({
    ten: 'dac-ta-json-2.1',
    mo_ta: 'bảng đặc tả quy trình, JSON mẫu 2.1',
    nhan: (ten, chu) => { const x = docJSON(chu); const ds = [].concat(x === undefined ? [] : x); return ds.length > 0 && ds.every(laBang); },
    doc: (ten, chu) => ({ dac_ta: [].concat(docJSON(chu)) }),
  });
}
