/* Bộ đọc: hồ sơ dự án du-an/<tên>/ho-so.json (bước 13b). Nhận ra theo NỘI DUNG, không theo tên tệp: một đối tượng JSON
 * có ten, ten_mien (chuỗi) và post_cho_qua (mảng). Trả { ho_so: [hồ sơ] }; 70-nap.js áp hồ sơ (apHoSo) sau khi đọc mọi tệp. */
{
  const docJSON = chu => { const s = chu.trim(); return s[0] === '{' ? JSON.parse(s) : undefined; };
  const laHoSo = d => !!d && typeof d.ten === 'string' && typeof d.ten_mien === 'string' && Array.isArray(d.post_cho_qua);
  BO_DOC.push({
    ten: 'ho-so',
    mo_ta: 'hồ sơ dự án (tên miền, lệnh được cho qua, kiểu app, tài khoản → vai)',
    nhan: (ten, chu) => laHoSo(docJSON(chu)),
    doc: (ten, chu) => ({ ho_so: [docJSON(chu)] }),
  });
}
