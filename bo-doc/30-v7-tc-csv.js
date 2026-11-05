/* Bộ đọc: danh mục TC của ma trận v7 dạng CSV (tc_all.csv, hoặc bản rút gọn do cong-cu/dong_goi.py đóng gói).
 * Nhận ra theo NỘI DUNG: dòng tiêu đề có cột «Mã TC», «Loại ca tool», «Thao tác», «Kết quả mong đợi».
 * Giữ nguyên mọi ô như trong tệp. Ra: { tc_v7: [{ tên cột: ô }] }. */
{
  // CSV theo RFC 4180: dấu phẩy, ô trong ngoặc kép, "" là một dấu ", xuống dòng được phép trong ô
  const docCSV = chu => {
    const ra = []; let dong = [], o = '', q = false, dau = 0;
    for (let i = 0; i < chu.length; i++) {
      const c = chu.charCodeAt(i);
      if (q) { if (c === 34) { if (chu.charCodeAt(i + 1) === 34) { o += chu.slice(dau, i + 1); i++; dau = i + 1; } else { o += chu.slice(dau, i); q = false; dau = i + 1; } } continue; }
      if (c === 34) { o += chu.slice(dau, i); q = true; dau = i + 1; }
      else if (c === 44) { dong.push(o + chu.slice(dau, i)); o = ''; dau = i + 1; }
      else if (c === 10) { dong.push((o + chu.slice(dau, i)).replace(/\r$/, '')); ra.push(dong); dong = []; o = ''; dau = i + 1; }
    }
    const cuoi = o + chu.slice(dau);
    if (cuoi || dong.length) { dong.push(cuoi.replace(/\r$/, '')); ra.push(dong); }
    return ra;
  };
  const CAN = ['Mã TC', 'Loại ca tool', 'Thao tác', 'Kết quả mong đợi'];
  const dauDong = chu => chu.replace(/^﻿/, '').slice(0, 4000).split('\n')[0];
  BO_DOC.push({
    ten: 'v7-tc-csv',
    mo_ta: 'danh mục TC ma trận v7 (CSV)',
    nhan: (ten, chu) => { const d = dauDong(chu); return CAN.every(c => d.includes(c)); },
    doc: (ten, chu) => {
      const r = docCSV(chu.replace(/^﻿/, '')), cot = r[0];
      return { tc_v7: r.slice(1).filter(x => x.length > 1).map(x => Object.fromEntries(cot.map((c, j) => [c, x[j] || '']))) };
    },
  });
}
