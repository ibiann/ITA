/* Bộ đọc: quy cách giao diện của dự án du-an/<tên>/quy-cach.json (bước 13e). Nhận ra theo NỘI DUNG: một đối tượng JSON có
 * loai = "quy-cach-giao-dien". Trả { quy_cach: [quy cách] }; 70-nap.js đặt QUY_CACH, lõi kiểm dùng thay ngưỡng chuanDS của công cụ
 * và ghi căn cứ «quy cách dự án — <nguon>». Không có tệp này thì phần thiết kế vẫn chạy với ngưỡng công cụ (chỉ ghi nhận). */
{
  const docJSON = chu => { const s = chu.trim(); return s[0] === '{' ? JSON.parse(s) : undefined; };
  BO_DOC.push({
    ten: 'quy-cach',
    mo_ta: 'quy cách giao diện của dự án (lưới khoảng cách, cỡ chữ, bo góc được phép)',
    nhan: (ten, chu) => { const d = docJSON(chu); return !!d && d.loai === 'quy-cach-giao-dien'; },
    doc: (ten, chu) => ({ quy_cach: [docJSON(chu)] }),
  });
}
