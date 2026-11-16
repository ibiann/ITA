/* Bộ đọc: tài liệu quy trình của Bên B (qt-*.md, dm.*.md, ngoai63.*.md), bản máy sinh từ sổ nghiệp vụ và khai báo của app.
 * Nhận ra theo NỘI DUNG: có dấu mốc «máy sinh: vai-tro» và «máy sinh: buoc». Tệp tổng thể, khối, bản HTML không có → không nhận.
 * Chỉ đọc bảng ĐẦU của 4 mục máy sinh: vai-tro (mục 4), chang (mục 6), buoc (mục 7), du-lieu (mục 9); thêm bảng «Theo khai báo của app» (mục 7). Không đọc phần viết tay.
 * Không suy gì thêm: ô nào tài liệu để trống thì để trống. Mỗi dòng giữ số dòng trong tệp để báo cáo ghi căn cứ.
 * Ra: { quy_trinh_tl: [{ ma, ten, tep, tom_tat, vai, chang, buoc, du_lieu }] } — ma = «Mã trong sổ» bỏ tiền tố «qt-» (khớp cột «Quy trình» của v7). */
{
  const ma1 = s => (/`([^`]+)`/.exec(s || '') || [])[1] || '';
  const maNhieu = s => [...String(s || '').matchAll(/`([^`]+)`/g)].map(m => m[1]);
  const boMa = s => String(s || '').replace(/\s*\(`[^`]*`\)/g, '').replace(/`/g, '').trim();
  // bảng nằm giữa <!-- máy sinh: ten --> và <!-- hết: ten -->: bảng ĐẦU, hoặc bảng có tiêu đề bắt đầu bằng dauCot; mỗi dòng → { tên cột: ô, __dong: số dòng trong tệp }
  const bang = (chu, ten, dauCot) => {
    const a = chu.indexOf('<!-- máy sinh: ' + ten + ' -->'); if (a < 0) return [];
    const b = chu.indexOf('<!-- hết: ' + ten + ' -->', a);
    const dong0 = chu.slice(0, a).split('\n').length, ds = chu.slice(a, b < 0 ? undefined : b).split('\n');
    const ra = []; let cot = null;
    for (let i = 1; i < ds.length; i++) {
      const l = ds[i];
      if (!l.startsWith('|')) { if (cot) break; continue; }
      if (/^\|[\s:|-]+\|?\s*$/.test(l)) continue;   // dòng kẻ |---|---|
      const o = l.trim().replace(/^\|/, '').replace(/\|$/, '').split(' | ').map(x => x.trim());
      if (!cot) { if (dauCot && !l.startsWith(dauCot)) { while (i + 1 < ds.length && ds[i + 1].startsWith('|')) i++; continue; } cot = o; continue; }
      const r = { __dong: dong0 + i }; cot.forEach((c, j) => { r[c] = o[j] || ''; }); ra.push(r);
    }
    return ra;
  };
  const nhan = (ten, chu) => chu.includes('<!-- máy sinh: vai-tro -->') && chu.includes('<!-- máy sinh: buoc -->');
  BO_DOC.push({
    ten: 'quy-trinh-md',
    mo_ta: 'tài liệu quy trình Bên B (máy sinh), mục 4, 6, 7, 9',
    nhan,
    doc: (ten, chu) => {
      const tep = String(ten).split('/').pop();
      const ma = (/\*\*Mã trong sổ\*\* \| `([^`]+)`/.exec(chu) || [])[1] || tep.replace(/\.md$/, '');
      const tt = /(\d+) bước · (\d+) chặng · (\d+) vai/.exec(chu) || [];
      const hoSo = (/\*\*Hồ sơ:\*\* ([^\n]+)/.exec(chu) || [])[1] || '';
      return { quy_trinh_tl: [{
        ma: ma.replace(/^qt-/, ''), ten: (/^# (.+)$/m.exec(chu) || [])[1] || ma, tep, ho_so: hoSo.trim(),
        tom_tat: { buoc: +tt[1] || 0, chang: +tt[2] || 0, vai: +tt[3] || 0 },
        vai: bang(chu, 'vai-tro').map(r => ({ ma: ma1(r['Vai trong sổ']), ten: boMa(r['Tên trong app']), dieu_kien: r['Điều kiện'], dong: r.__dong })),
        chang: bang(chu, 'chang').map(r => ({ ma: ma1(r['Chặng']), nhan: r['Tên hiển thị'], ket_thuc: /kết thúc/.test(r['Kết thúc?']), dong: r.__dong })),
        buoc: bang(chu, 'buoc').map(r => ({ so: r['#'], ten: boMa(r['Bước']), ma: ma1(r['Mã bước']), ai: boMa(r['Ai thực hiện']),
          tu: maNhieu(r['Từ chặng']), sang: maNhieu(r['Sang chặng'])[0] || '', giu_nguyen: /giữ nguyên/.test(r['Sang chặng']), dong: r.__dong })),
        // mục 7 «Theo khai báo của app»: bước app khai; cột # là «—» khi sổ nghiệp vụ không có bước ấy
        buoc_app: bang(chu, 'buoc', '| # | Bước | Người làm phải thuộc').map(r => ({ so: r['#'], ten: boMa(r['Bước']), nguoi_thuoc: r['Người làm phải thuộc'], dong: r.__dong })),
        du_lieu: bang(chu, 'du-lieu').map(r => ({ nhan: r['Ô dữ liệu'], ma: ma1(r['Mã']), kieu: r['Kiểu (app)'], cho_phep: r['Giá trị cho phép'], dong: r.__dong })),
      }] };
    },
  });
}
