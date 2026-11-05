/* Ghép: TC ma trận v7 (bộ đọc v7-tc-csv) × tài liệu quy trình Bên B (bộ đọc quy-trinh-md) → bảng cho phần đối chiếu (50-doi-chieu-dac-ta.js).
 * v7 là thứ cần kiểm (TC, kết quả mong đợi). Tài liệu là căn cứ để biết TC còn đúng quy trình hiện tại. KHÔNG sinh TC từ tài liệu.
 * Chỉ lấy TC bộ chạy M1 (chỉ đọc) thuộc 6 loại ca công cụ có phép kiểm: DUNG, SAI_VAI, XAC_NHAN, SAI_TRANG_THAI, TRUONG, NHAP.
 * TC «chờ PM quyết» không chạy. TC lệch tài liệu (không còn bước, ghi mã bước thay chữ nút, vai trái tài liệu) không chạy, ghi lý do «chờ PM».
 * Mọi chữ của v7 được đọc theo mẫu câu cố định của v7; câu không khớp mẫu → TC không chạy, ghi lý do (không đoán).
 * [bước 9] gop.trang_thai_qt (nếu có): TC của tài liệu app không còn, bước không có trong khai báo app, sai chặng ở bước có chặng khác app → không chạy, ghi lý do + số báo cáo rà soát.
 * Ra: { dac_ta: [bảng theo quy trình], tc: [{ ma, ma_uc, quy_trinh, loai, vai, trang_thai, can_cu, can_cu_ben_b, khong_chay, cho_pm, nhom, ly_do }], do_phu } */
{
  const LOAI = ['DUNG', 'SAI_VAI', 'XAC_NHAN', 'SAI_TRANG_THAI', 'TRUONG', 'NHAP'];
  const boMa = s => String(s || '').replace(/\s*\(`[^`]*`\)/g, '').replace(/`/g, '').trim();
  const tenVai = s => boMa(s).replace(/^AC-[A-Za-z]+\s*\((.+)\)$/, '$1').trim();   // «AC-CHT (Chỉ huy trưởng…)» → tên
  // tài liệu ghi vai kèm điều kiện đơn vị: «Bộ CHQS cấp tỉnh (thuộc cấp trên của chủ hồ sơ)» → tên + điều kiện
  const tachAi = s => { const m = /^(.*?)\s*\(([^()`]*)\)\s*$/.exec(s || ''); return m ? { ten: m[1].trim(), dk: m[2].trim() } : { ten: String(s || '').trim(), dk: '' }; };
  const cacO = s => [...String(s || '').matchAll(/«([^»]+)»/g)].map(m => m[1]);
  GHEP.push(gop => {
    const tl = new Map((gop.quy_trinh_tl || []).map(d => [d.ma, d]));
    // TC ghi mã vai (vd `personnel`) ở một số dòng; dòng khác của chính v7 ghi cặp «Tên (`mã`)» → học cặp, chỉ dùng khi một mã ứng đúng một tên
    const hoc = new Map();
    for (const r of gop.tc_v7 || []) for (const p of String(r['Vai'] || '').split(';')) { const m = /^\s*(.+?)\s*\(`([^`]+)`\)\s*$/.exec(p); if (m) { if (!hoc.has(m[2])) hoc.set(m[2], new Set()); hoc.get(m[2]).add(m[1].trim()); } }
    const tenMa = new Map([...hoc].filter(([, v]) => v.size === 1).map(([k, v]) => [k, [...v][0]]));
    const vaiTC = s => String(s || '').split(';').map(x => { const t = tenVai(x); return tenMa.get(t) || t; }).filter(Boolean);
    // tên bước → tài liệu đang chứa bước ấy (để báo bước đã chuyển sang tài liệu khác)
    const buocO = new Map(); for (const d of gop.quy_trinh_tl || []) for (const b of d.buoc) if (!buocO.has(b.ten)) buocO.set(b.ten, d.tep);
    const buocO2 = new Map(); for (const d of gop.quy_trinh_tl || []) for (const b of d.buoc) if (!buocO2.has(b.ten)) buocO2.set(b.ten, { ma: d.ma, buoc: b.ma });
    // [bước 9] trạng thái tài liệu so với khai báo app (du-an/<dự án>/trang-thai-quy-trinh.json, sinh bằng cong-cu/sinh_trang_thai_qt.py), kèm số báo cáo rà soát
    const TT = gop.trang_thai_qt || {}, appBan = (TT._nguon || {}).app || 'app';
    const goApp = new Map((TT.tai_lieu_app_khong_co || []).map(x => [x.ma, x])), buocKhong = TT.buoc_app_khong_co || {}, changKhac = TT.chang_khac_app || {};
    const rs = x => x && x.ra_soat && x.ra_soat.length ? ' (rà soát: ' + x.ra_soat.join(', ') + ')' : '';
    const changCua = (q, mb) => (changKhac[q] || []).find(x => x.ma_buoc === mb);
    // vai cùng tên hiển thị nhưng khác mã trong sổ (vd approver, commander cùng «Chỉ huy trưởng Ban CHQS xã»): công cụ nhận vai theo tên hiển thị nên không phân biệt được
    const tenTrung = d => { const m = new Map(); for (const v of d.vai) if (v.ten && v.ma && v.ma !== '—') { if (!m.has(v.ten)) m.set(v.ten, new Set()); m.get(v.ten).add(v.ma); } return new Map([...m].filter(([, x]) => x.size > 1)); };
    const trungCua = new Map();
    const bang = new Map(), tc = [];
    for (const r of gop.tc_v7 || []) {
      if (!/^M1/.test(r['Bộ chạy đích'] || '') || !LOAI.includes(r['Loại ca tool'])) continue;
      const qt = r['Quy trình'], ma = r['Mã TC'], loai = r['Loại ca tool'];
      const o = { ma, ma_uc: r['Mã UC'], quy_trinh: qt, loai, vai: vaiTC(r['Vai']), trang_thai: r['Trạng thái TC'], can_cu_ben_b: r['Căn cứ đặc tả Bên B'], uu_tien: r['Ưu tiên'] };
      tc.push(o);
      if (/chờ PM quyết/.test(o.trang_thai)) { o.khong_chay = 'TC chờ PM quyết'; continue; }
      const go = goApp.get(qt);
      if (go) { o.khong_chay = 'tài liệu ' + go.tep + ' tả quy trình mà ' + appBan + ' không còn khai báo (' + go.tep_app + ')' + rs(go); o.nhom = 'QUY TRÌNH'; continue; }
      const nut = cacO(r['Thao tác'])[0] || '', kqmd = r['Kết quả mong đợi'] || '';
      const sau = ma.startsWith(qt + '.') ? ma.slice(qt.length + 1) : '', bm = /^(B\d+[a-z]?)\./.exec(sau);
      if (!bm || !nut) { o.khong_chay = 'không tách được mã bước hoặc chữ nút từ TC'; continue; }
      const d = tl.get(qt);
      let khop = null;
      if (d) {
        khop = d.buoc.filter(b => b.ten === nut);
        if (!khop.length) {
          const app = (d.buoc_app || []).find(b => b.ten === nut && b.so === '—'), khac = buocO.get(nut);
          o.khong_chay = d.buoc.some(b => b.ma === nut) ? 'TC ghi mã bước «' + nut + '» thay cho chữ trên nút'
            : app ? 'TC lệch tài liệu: bước «' + nut + '» chỉ có trong khai báo của app (' + d.tep + ' dòng ' + app.dong + '), sổ nghiệp vụ không ghi, tài liệu không ghi vai làm' + (khac && khac !== d.tep ? '; sổ nay để bước này ở ' + khac + (() => { const o2 = buocO2.get(nut), ck = o2 && changCua(o2.ma, o2.buoc); return ck ? rs(ck) : ''; })() : '')
            : khac ? 'TC lệch tài liệu: bước «' + nut + '» nay ở ' + khac + ', không còn ở ' + d.tep
              + (() => { const o2 = buocO2.get(nut), ck = o2 && changCua(o2.ma, o2.buoc); return ck ? '; nhưng ' + appBan + ' vẫn để bước ' + ck.ma_buoc + ' ở ' + ck.tep_app + ', từ chặng ' + ck.tu_app.join(', ') + rs(ck) : ''; })()
            : 'TC lệch tài liệu: ' + d.tep + ' không còn bước «' + nut + '»';
          o.cho_pm = true; continue;
        }
        const bk = (buocKhong[qt] || []).find(x => khop.some(b => b.ma === x.ma_buoc));
        if (bk) { o.khong_chay = 'bước «' + nut + '» (' + bk.ma_buoc + ') không có trong khai báo quy trình của ' + appBan + rs(bk); o.nhom = 'QUY TRÌNH'; continue; }
        const ck = khop.map(b => changCua(qt, b.ma)).find(Boolean);
        if (ck && loai === 'SAI_TRANG_THAI') { o.khong_chay = '«Từ chặng» trong tài liệu (' + ck.tu_tai_lieu.join(', ') + ') khác ' + appBan + ' (' + ck.tu_app.join(', ') + ')' + rs(ck) + '; chưa biết chặng nào là sai chặng'; o.nhom = 'QUY TRÌNH'; continue; }
        if (!trungCua.has(qt)) trungCua.set(qt, tenTrung(d));
        const tt = trungCua.get(qt), vaiTrung = (loai === 'DUNG' || loai === 'SAI_VAI') ? o.vai.filter(v => tt.has(v)) : [];
        if (vaiTrung.length) { o.khong_chay = 'tài liệu có nhiều vai cùng tên hiển thị «' + vaiTrung.join('; ') + '» (' + vaiTrung.map(v => [...tt.get(v)].join(', ')).join('; ') + '); công cụ nhận vai theo tên trên tài khoản nên không phân biệt được'; continue; }
        const ai = khop.map(b => tachAi(b.ai)), ten = [...new Set(ai.map(x => x.ten))], trung = o.vai.filter(v => ten.includes(v));
        const dk = [...new Set(ai.filter(x => trung.includes(x.ten) && x.dk).map(x => x.dk))];
        if ((loai === 'DUNG' && !trung.length) || (loai === 'SAI_VAI' && trung.length && !dk.length)) {
          o.khong_chay = 'vai trong TC (' + o.vai.join('; ') + ') trái tài liệu: ' + d.tep + ' dòng ' + khop[0].dong + ' ghi «' + khop.map(b => b.ai).join('; ') + '» làm bước này'; o.cho_pm = true; continue;
        }
        if (loai === 'SAI_VAI' && trung.length) { o.khong_chay = 'tài liệu ghi «' + trung.join('; ') + '» làm bước này khi ' + dk.join('; ') + '; công cụ chưa biết tài khoản có thoả điều kiện đơn vị đó không'; continue; }
        o.can_cu = d.tep + ' dòng ' + khop[0].dong + ' (mục 7, bước «' + nut + '»' + (dk.length ? '; tài liệu ghi điều kiện: ' + dk.join('; ') : '') + ')';
      } else o.can_cu = 'không có tài liệu quy trình «' + qt + '» để đối chiếu; chỉ theo TC';
      // bảng của quy trình: vai và chặng lấy từ tài liệu; bước, ô, ca nhập ô lấy từ TC
      let dt = bang.get(qt);
      if (!dt) {
        dt = { mau: { ten: 'ghép v7 × tài liệu quy trình' }, dinh_danh: { ma_ben_b: qt, ten: d ? d.ten : qt }, __tep: d ? d.tep : 'TC v7', __v7: true,
          vai: d ? [...new Set(d.vai.map(v => v.ten).filter(v => v && v !== '—'))].map(v => ({ ma: v, ten: v, nhan_dang_nhap: v })) : [],   // một vai có thể nhiều dòng (kèm điều kiện); «—» = không ghi vai
          trang_thai: d ? d.chang.filter(c => c.ma).map(c => ({ ma: c.ma, nhan: c.nhan, ket_thuc: c.ket_thuc })) : [], truong: [], buoc: [], tc_nhap: [] };
        bang.set(qt, dt);
      }
      if (!d) for (const v of o.vai) if (!dt.vai.some(x => x.ma === v)) dt.vai.push({ ma: v, ten: v, nhan_dang_nhap: v });
      let b = dt.buoc.find(x => x.ma === bm[1]);
      if (!b) {
        b = { ma: bm[1], ten: nut, nut, vai: khop ? [...new Set(khop.map(x => tachAi(x.ai).ten))] : [], nguon: 'v7' };
        const k = khop && khop[0];
        // chặng của bước trong tài liệu khác app: không giao chặng cho phần đối chiếu (không kiểm sai chặng, không đòi nhãn chặng)
        if (k && k.tu.length && !changCua(qt, k.ma)) { b.tu = k.tu[0]; b.tu_hop_le = k.tu; b.den = k.giu_nguyen ? k.tu[0] : (k.sang || k.tu[0]); }
        if (/\{id\}/.test(r['Màn'] || '') && !/suy theo/.test(r['Màn'])) b.duong_dan_man = r['Màn'].trim();   // chỉ đường dẫn hồ sơ ghi rõ
        dt.buoc.push(b);
      }
      if (!khop && loai === 'DUNG') for (const v of o.vai) if (!b.vai.includes(v)) b.vai.push(v);   // không có tài liệu: vai làm bước theo TC DUNG
      if (loai === 'XAC_NHAN') {
        if (/^mở form$/.test(kqmd)) b.xac_nhan = 'form'; else if (/^mở hộp xác nhận$/.test(kqmd)) b.xac_nhan = 'hop_thoai';
        else { o.khong_chay = 'kết quả mong đợi không theo mẫu «mở form» / «mở hộp xác nhận»'; continue; }
      } else if (loai === 'SAI_TRANG_THAI' && !b.duong_dan_man) o.ly_do = 'TC và tài liệu không ghi đường dẫn màn hồ sơ; công cụ chỉ kiểm sai chặng khi biết màn hồ sơ';
      else if (loai === 'TRUONG') {
        const nhanO = cacO(kqmd)[0], key = sau.slice(bm[0].length).replace(/^TRUONG\./, '');
        if (!/^có ô «/.test(kqmd) || !nhanO || !key) { o.khong_chay = 'kết quả mong đợi không theo mẫu «có ô «…»»'; continue; }
        let t = dt.truong.find(x => x.ma === key);
        if (!t) { t = { ma: key, nhan: nhanO, nguon: 'v7' }; dt.truong.push(t); }
        if (/nhãn có dấu \*|bắt buộc/.test(kqmd)) t.bat_buoc = true;
        if (/không (điền|chọn) sẵn/.test(kqmd)) t.khong_dien_san = true;
        const lc = /đủ lựa chọn: (.+)$/.exec(kqmd); if (lc) t.lua_chon = lc[1].split('; ').map(x => x.trim()).filter(Boolean);
        b.truong_phai_nhap = b.truong_phai_nhap || []; if (!b.truong_phai_nhap.includes(key)) b.truong_phai_nhap.push(key);
        if (!b.xac_nhan) b.xac_nhan = 'form';   // TC TRUONG ghi «bấm «nút», đọc form»
      } else if (loai === 'NHAP') {
        const nhanO = cacO(r['Thao tác'])[1] || '';
        const md = /không báo lỗi|thì nhận( đủ)?$/.test(kqmd) ? 'hop_le' : /báo lỗi|không nhận/.test(kqmd) ? 'khong_hop_le' : '';
        if (!nhanO || !md) { o.khong_chay = 'không đọc được ô hoặc kết quả mong đợi của ca nhập ô'; continue; }
        dt.tc_nhap.push({ ma, buoc: bm[1], nut, nhan: nhanO, gia_tri: r['Dữ liệu nhập'] || '', mong_doi: md, nguon: 'v7' });
      } else if ((loai === 'DUNG' && kqmd !== 'thấy nút') || (loai === 'SAI_VAI' && kqmd !== 'không thấy nút')) {
        o.khong_chay = 'kết quả mong đợi không theo mẫu «thấy nút» / «không thấy nút»'; continue;
      }
    }
    // độ phủ: tài liệu chưa có TC v7 nào; từ trạng thái: tài liệu app không có, app chưa có tài liệu
    const coTC = new Set((gop.tc_v7 || []).map(r => r['Quy trình']));
    const do_phu = { chua_co_tc_v7: (gop.quy_trinh_tl || []).filter(d => !coTC.has(d.ma)).map(d => ({ ma: d.ma, tep: d.tep, so_buoc: d.buoc.length })),
      tai_lieu_app_khong_co: TT.tai_lieu_app_khong_co || [], app_chua_co_tai_lieu: TT.app_chua_co_tai_lieu || [],
      so_buoc_app_khong_co: Object.values(buocKhong).reduce((n, v) => n + v.length, 0), so_buoc_chang_khac: Object.values(changKhac).reduce((n, v) => n + v.length, 0),
      nguon_trang_thai: TT._nguon || null };
    return { dac_ta: [...bang.values()], tc, do_phu };
  });
}
