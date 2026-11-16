/* Bộ đọc: hồ sơ mẫu của dự án du-an/<tên>/ho-so-mau.json (bản 1.1). Nhận ra theo NỘI DUNG: một đối tượng JSON có
 * loai = "ho-so-mau" và danh sách ho_so. Mỗi mục: { ma (vd HSM-2-SIGNING), duong_dan (đường dẫn hồ sơ thật trên môi trường kiểm),
 * quy_trinh?, chang?, nhan_chang? (nhãn chặng hiện trên giao diện), vai?, tai_khoan? (chỉ mở khi đúng tài khoản này) }.
 * Trả { ho_so_mau: [...] }; 70-nap.js đặt HO_SO_MAU; lõi kiểm mở thẳng từng hồ sơ sau vòng menu. Mục thiếu ma / duong_dan bị bỏ (ghi cảnh báo). */
{
  const docJSON = chu => { const s = chu.trim(); return s[0] === '{' ? JSON.parse(s) : undefined; };
  BO_DOC.push({
    ten: 'ho-so-mau',
    mo_ta: 'hồ sơ mẫu của dự án: mã hồ sơ mẫu trong TC → đường dẫn hồ sơ thật trên môi trường kiểm',
    nhan: (ten, chu) => { const d = docJSON(chu); return !!d && d.loai === 'ho-so-mau' && Array.isArray(d.ho_so); },
    doc: (ten, chu) => {
      const d = docJSON(chu), ra = [];
      for (const h of d.ho_so) {
        if (!h || !h.ma || !h.duong_dan || String(h.duong_dan).indexOf('/') !== 0) { console.warn('[ita] ho-so-mau: bỏ mục thiếu ma hoặc duong_dan (phải bắt đầu bằng /): ' + JSON.stringify(h).slice(0, 120)); continue; }
        ra.push({ ma: String(h.ma), duong_dan: String(h.duong_dan), quy_trinh: h.quy_trinh || '', chang: h.chang || '', nhan_chang: h.nhan_chang || '', vai: h.vai || '', tai_khoan: h.tai_khoan || '' });
      }
      return { ho_so_mau: ra };
    },
  });
}
