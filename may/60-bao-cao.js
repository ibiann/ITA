// 3.6: mẫu lỗi → CSV; thiết kế & ngôn từ → HTML
function sangCSVMau(kq) {
  const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const cols = ['muc_do', 'loai', 'chi_tiet', 'so_man', 'vi_du_man', 'nguyen_tac', 'can_cu', 'can_xac_nhan'];
  return '\ufeff' + cols.join(',') + '\n' + (kq.mau_loi || []).map(r => cols.map(c => q(Array.isArray(r[c]) ? r[c].join(' · ') : r[c])).join(',')).join('\n');
}
function htmlThietKe(kq) {
  const d = kq.he_thong_thiet_ke || {}, n = kq.ngon_tu || {};
  if (!d.co_chu && !n.mot_tu_nhieu_cach_viet) return '';
  const bangGT = (tieuDe, o) => !o || !o.pho_bien ? '' : '<h4>' + esc(tieuDe) + ' — ' + esc(o.so_luong != null ? o.so_luong : o.so_gia_tri) + ' giá trị' + (o.chuan_toi_da ? ' (ngưỡng công cụ ≤ ' + esc(o.chuan_toi_da) + ')' : '') + '</h4><table><tbody>' +
    o.pho_bien.map(p => '<tr><td>' + esc(p.gia_tri) + '</td><td>' + esc(p.lan) + ' lần</td><td>' + esc(p.so_man) + ' màn</td></tr>').join('') + '</tbody></table>';
  const ds = (tieuDe, arr, f) => !arr || !arr.length ? '' : '<h4>' + esc(tieuDe) + ' (' + arr.length + ')</h4><table><tbody>' + arr.map(a => '<tr><td>' + f(a) + '</td></tr>').join('') + '</tbody></table>';
  return '<p class=m>Căn cứ: ' + esc(d.can_cu || 'ngưỡng công cụ tự đặt') + '. Phần ngôn từ cũng là luật công cụ tự đặt: chỉ ghi nhận.</p>' +
    ((d.vuot_chuan || []).length ? '<p style="color:#8a4b00">Ghi nhận, vượt ngưỡng công cụ:<br>' + d.vuot_chuan.map(esc).join('<br>') + '</p>' : '') +
    bangGT('Cỡ chữ', d.co_chu) + bangGT('Màu chữ', d.mau_chu) + bangGT('Màu nền', d.mau_nen) + bangGT('Bo góc', d.bo_goc) + bangGT('Đổ bóng', d.do_bong) + bangGT('Khoảng cách lệch lưới', d.lech_luoi) +
    ds('Cùng nhãn nút, khác kiểu', d.nut_cung_nhan_khac_kieu, a => '<b>' + esc(a.nhan) + '</b> — ' + esc(a.so_kieu) + ' kiểu<br><span style="color:#666">' + a.kieu.map(k => esc(k.gia_tri) + ' (' + esc(k.so_man) + ' màn)').join('<br>') + '</span>') +
    ds('Một từ, nhiều cách viết', n.mot_tu_nhieu_cach_viet, a => esc(a.cach_viet.join(' · '))) +
    ds('Cùng nhãn, khác hoa/thường', n.khac_hoa_thuong, a => esc(a.cach_viet.join(' · '))) +
    ds('Lẫn tiếng nước ngoài', n.lan_tieng_nuoc_ngoai, a => esc(a.gia_tri) + ' (' + esc(a.so_man) + ' màn)') +
    ds('Chữ Unicode tổ hợp (NFD)', n.unicode_to_hop, a => esc(a.gia_tri)) +
    ds('Định dạng ngày đang dùng', n.dinh_dang_ngay_dung, a => esc(a.gia_tri) + ' (' + esc(a.so_man) + ' màn)');
}
// [11a] tên tiếng Việt của các mục WCAG 2.2 mà bộ luật axe-core đo (chỉ để đọc; mã mục là căn cứ)
const TEN_SC = { '1.1.1': 'chữ thay thế cho ảnh, biểu tượng', '1.2.2': 'phụ đề', '1.3.1': 'thông tin và quan hệ (nhãn, tiêu đề, bảng)', '1.3.5': 'mục đích ô nhập',
  '1.4.1': 'không chỉ dùng màu', '1.4.2': 'điều khiển âm thanh', '1.4.3': 'tương phản chữ (tối thiểu)', '1.4.4': 'phóng to chữ', '1.4.11': 'tương phản thành phần, biểu tượng', '1.4.12': 'giãn cách chữ',
  '2.1.1': 'dùng được bằng bàn phím', '2.2.1': 'thời gian điều chỉnh được', '2.2.2': 'dừng, ẩn nội dung chuyển động', '2.4.1': 'bỏ qua khối lặp', '2.4.2': 'tiêu đề trang', '2.4.4': 'mục đích liên kết',
  '2.5.3': 'nhãn trùng tên hiện', '2.5.8': 'cỡ vùng bấm (tối thiểu)', '3.1.1': 'ngôn ngữ của trang', '3.1.2': 'ngôn ngữ của đoạn', '3.3.2': 'nhãn hoặc hướng dẫn', '4.1.2': 'tên, vai trò, giá trị' };
const MUC_AXE_VN = { critical: 'nghiêm trọng nhất', serious: 'nghiêm trọng', moderate: 'vừa', minor: 'nhẹ' };
function htmlTroNang(kq) {
  const o = kq.kiem_tro_nang; if (!o) return '';
  const ds = o.ds || [], chay = ds.filter(x => x.vi_pham), loi = ds.filter(x => x.loi), g = {};
  for (const m of chay) for (const v of m.vi_pham) { const x = g[v.id] = g[v.id] || { id: v.id, muc: v.muc, sc: v.sc, help: v.help, man: [], so: 0 }; x.man.push(m.man); x.so += v.so; }
  const thu = ['critical', 'serious', 'moderate', 'minor'], hang = Object.values(g).sort((a, b) => thu.indexOf(a.muc) - thu.indexOf(b.muc) || b.man.length - a.man.length);
  const nang = chay.filter(m => m.vi_pham.some(v => v.muc === 'critical' || v.muc === 'serious')).length, canXem = new Set(chay.flatMap(m => (m.can_xem || []).map(v => v.id)));
  return '<h2 style="font-size:16px;margin-top:28px">Kiểm trợ năng tự động — ' + esc(o.cong_cu) + ', WCAG 2.2 mức A/AA (' + hang.length + ' luật vi phạm)</h2>'
    + '<p class=m>Căn cứ: WCAG 2.2 (W3C, bản chính thức mới nhất), đo bằng bộ luật của axe-core (' + esc((o.bo_luat || []).join(', ')) + '). Đã kiểm ' + chay.length + ' màn / form; ' + nang + ' màn / form có lỗi mức nghiêm trọng (critical, serious)'
    + (loi.length ? '; ' + loi.length + ' chỗ axe không chạy được' : '') + '. Máy đo chỉ bắt được một phần WCAG: không thấy lỗi không có nghĩa là đạt WCAG 2.2 AA. '
    + canXem.size + ' luật axe chưa tự kết luận được (cần người xem): ' + esc([...canXem].slice(0, 12).join(', ')) + '. Phần «dùng được bằng bàn phím» (2.1.1) công cụ không thử được: trình duyệt không cho phím giả chuyển tiêu điểm.</p>'
    + (hang.length ? '<table><thead><tr><th>Luật axe</th><th>Mức</th><th>Mục WCAG</th><th>Mô tả (axe)</th><th>Số màn</th><th>Số chỗ</th><th>Ví dụ màn</th></tr></thead><tbody>'
      + hang.map(x => '<tr class="' + (x.muc === 'critical' || x.muc === 'serious' ? 'tb' : '') + '"><td>' + esc(x.id) + '</td><td>' + esc(MUC_AXE_VN[x.muc] || x.muc) + '</td><td>' + esc(x.sc.map(s => s + (TEN_SC[s] ? ' ' + TEN_SC[s] : '')).join('; ')) + '</td><td>' + esc(x.help) + '</td><td>' + x.man.length + '</td><td>' + x.so + '</td><td>' + esc(x.man.slice(0, 2).join(' | ')) + '</td></tr>').join('') + '</tbody></table>' : '');
}
function sangHTML(kq) {
  const rows = kq.van_de || [];
  const ds = kq.danh_muc_truong || [];
  const trT = ds.map(f => `<tr class="${f.loi ? 'tb' : ''}">${COT_TRUONG.map(c => `<td>${esc(f[c[0]])}</td>`).join('')}</tr>`).join('');
  const trThieu = (kq.thieu_truong_so_voi_mong_doi || []).map(x => `<tr class="cao"><td>${esc(x.man)}</td><td>${esc(x.truong)}</td></tr>`).join('');
  const tr = rows.map(r => `<tr class="${r.muc_do === 'cao' ? 'cao' : r.muc_do === 'trung bình' ? 'tb' : ''}"><td>${esc(r.tab)}</td><td>${esc(r.muc_do)}</td><td>${esc(r.url)}</td><td>${esc(r.can_cu || '')}</td><td>${esc([
    r.du_lieu_nhay_cam && 'Dữ liệu nhạy cảm hiện trên màn: ' + r.du_lieu_nhay_cam,
    r.api_loi && 'API lỗi: ' + r.api_loi, r.js_loi && 'JS lỗi: ' + r.js_loi, r.quy_trinh_loi && 'Quy trình: ' + r.quy_trinh_loi,
    r.rong_nhung_api_loi, r.cat_chu_khong_goi_y && 'Chữ bị cắt «…» không có gợi ý: ' + r.cat_chu_khong_goi_y, r.so_dong_vuot_tong && 'Số dòng vượt tổng: ' + r.so_dong_vuot_tong,
    r.chu_la && 'Chữ lạ: ' + r.chu_la, r.phan_tram_vo_ly && 'Phần trăm vô lý: ' + r.phan_tram_vo_ly, r.van_dang_tai && 'Vẫn đang tải',
    r.tran_ngang && 'Tràn ngang ' + r.tran_ngang, r.tieu_de_bi_cat && 'Tiêu đề bị cắt: ' + r.tieu_de_bi_cat, r.o_khong_nhan && 'Ô không nhãn: ' + r.o_khong_nhan,
    r.truong_loi && 'Trường: ' + r.truong_loi, r.chan_ghi && 'Đã chặn lệnh ghi: ' + r.chan_ghi, r.api_cham && 'API chậm: ' + r.api_cham,
    r.nghi_ngo_so_lech && 'Nghi số lệch với API: ' + r.nghi_ngo_so_lech,
    r.du_lieu_nhay_cam && 'Dữ liệu nhạy cảm: ' + r.du_lieu_nhay_cam, r.ma_enum_lo && 'Mã lộ ra: ' + r.ma_enum_lo, r.cat_chu_khong_tooltip && 'Chữ cắt không tooltip: ' + r.cat_chu_khong_tooltip,
    r.chuoi_dai_khong_ngat && 'Chuỗi dài không ngắt: ' + r.chuoi_dai_khong_ngat, r.dinh_dang_ngay_tron && 'Ngày trộn: ' + r.dinh_dang_ngay_tron, r.dinh_dang_so_tron && 'Số trộn: ' + r.dinh_dang_so_tron,
    r.tieu_de_lech_menu && 'Tiêu đề lệch menu: ' + r.tieu_de_lech_menu, r.nut_chinh_nhieu && 'Nhiều nút chính: ' + r.nut_chinh_nhieu, r.can_xac_nhan && 'Cần xác nhận: ' + r.can_xac_nhan,
  ].filter(Boolean).join(' | '))}</td></tr>`).join('');
  return `<!doctype html><meta charset=utf-8><title>DQTV kết quả kiểm</title>
<style>body{font:14px system-ui;margin:24px;color:#1a1a1a}h1{font-size:18px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}tr.cao td{background:#fdecea}tr.tb td{background:#fff6e5}.m{color:#666}</style>
<h1>DQTV — kết quả kiểm giao diện</h1>
<p><b>Tài khoản:</b> ${esc(kq.tai_khoan || '')}${kq.dung_giua_chung ? ' · <b style="color:#c62828">LẦN CHẠY BỊ DỪNG GIỮA CHỪNG — kết quả chưa đủ</b>' : ''}</p>${(kq.muc_mat_ket_qua || []).length ? '<p style="color:#c62828"><b>MẤT KẾT QUẢ KHI TRANG TẢI LẠI — ' + kq.muc_mat_ket_qua.length + ' mục menu đã chạy nhưng không đọc lại được kết quả, màn và TC của các mục này không có trong báo cáo:</b> ' + kq.muc_mat_ket_qua.map(esc).join(' · ') + '</p>' : ''}${kq.dung_giua_chung ? `<p style="color:#c62828"><b>Lý do dừng:</b> ${esc(kq.ly_do_dung || '')}${(kq.menu_chua_chay || []).length ? '<br><b>Mục menu chưa chạy (' + kq.menu_chua_chay.length + '):</b> ' + kq.menu_chua_chay.map(esc).join(' · ') : ''}</p>` : ''}
<p class=m>Công cụ bản ${esc(kq.phien_ban || '≤3.10')} · nạp bằng ${esc(kq.cach_nap || '?')} · cửa sổ ${esc(kq.cua_so || '?')}${kq.ngung_bam_do_di_vong ? ' · <b style="color:#c62828">có phần chạy ở chế độ ngừng bấm nút nghiệp vụ (bản dán Console gặp yêu cầu mạng đi vòng bộ chặn) — form chưa kiểm đủ; chạy lại từ đầu bằng Tampermonkey: dqtv.chayLaiTuDau()</b>' : ''}</p>
<p class=m>${esc(kq.url)} · ${esc(kq.luc)} · ${kq.so_man_da_kiem} màn đã kiểm · cao ${kq.man_cao}, trung bình ${kq.man_trung_binh}, ghi nhận ${kq.man_ghi_nhan || 0} · ${kq.o_nhap_co_loi} lỗi ô nhập · ${kq.doi_chieu_dac_ta ? 'đối chiếu đặc tả: ' + esc(gonMaDT(kq.doi_chieu_dac_ta.quy_trinh.map(q => q.ma))) : 'mức quy trình ' + kq.muc_quy_trinh + (kq.co_dac_ta ? ' (có đặc tả)' : ' (chưa nạp đặc tả)')}</p>
<p class=m><b>Dữ liệu đã nạp:</b> ${(kq.du_lieu_nap || []).length ? Object.values(kq.du_lieu_nap.reduce((g, x) => { const k = x.bo_doc + (x.goi_san ? '|g' : ''); (g[k] = g[k] || []).push(x); return g; }, {})).map(n => n.length > 3 ? esc(n.length + ' tệp ' + n[0].bo_doc + (n[0].goi_san ? ' (đóng gói sẵn trong tệp dán)' : ' (đã nạp)') + ': ' + n.slice(0, 3).map(x => x.tep).join(', ') + '…') : n.map(x => esc(x.tep) + ' (bộ đọc ' + esc(x.bo_doc) + ', ' + (x.so_bang ? x.so_bang + ' bảng, ' : '') + (x.so_muc ? x.so_muc + ' mục, ' : '') + 'mã băm ' + esc(x.bam) + ', ' + (x.goi_san ? 'đóng gói sẵn ' : 'nạp ') + esc(x.luc) + ')').join('; ')).join('; ') : 'không có. Chỉ kiểm giao diện chung, không đối chiếu quy trình / UC / TC.'}</p>
${htmlDacTa(kq)}
<p class=m>Mức (cao / trung bình / thấp) chỉ tính cho phép kiểm có căn cứ: sự việc (máy chủ, trang báo lỗi…), chuẩn công khai (ghi điều khoản), hoặc đặc tả đã nạp. Phép kiểm theo ngưỡng công cụ tự đặt ghi «ghi nhận», không tính là lỗi.</p>
<table><thead><tr><th>Màn</th><th>Mức</th><th>URL</th><th>Căn cứ</th><th>Vấn đề</th></tr></thead><tbody>${tr}</tbody></table>
${(kq.mau_loi || []).length ? `<h2 style="font-size:16px;margin-top:28px">Mẫu lỗi — gom theo thành phần / loại (${kq.mau_loi.length})</h2><table><thead><tr><th>Mức</th><th>Mẫu lỗi · nguyên tắc</th><th>Số màn</th><th>Ví dụ</th></tr></thead><tbody>${kq.mau_loi.map(m => `<tr class="${m.muc_do === 'cao' ? 'cao' : m.muc_do === 'trung bình' ? 'tb' : ''}"><td>${esc(m.muc_do)}</td><td><b>${esc(m.loai)}</b>${m.chi_tiet ? ' — ' + esc(m.chi_tiet) : ''}<div class=m>${esc(m.nguyen_tac)}${m.can_cu ? ' · căn cứ: ' + esc(m.can_cu) : ''}${m.can_xac_nhan ? ' · cần xác nhận: ' + esc(m.can_xac_nhan) : ''}</div></td><td>${esc(m.so_man)}</td><td>${esc((m.vi_du_man || []).join(' · '))}</td></tr>`).join('')}</tbody></table>` : ''}
${htmlThietKe(kq) ? '<h2 style="font-size:16px;margin-top:28px">Hệ thống thiết kế &amp; ngôn từ</h2>' + htmlThietKe(kq) : ''}
${kq.mat_phien ? `<p style="color:#c62828"><b>Dừng vì mất phiên đăng nhập:</b> ${esc(kq.mat_phien)}</p>` : ''}
${(kq.man_loi_nang || []).length ? `<h2 style="font-size:16px;margin-top:28px;color:#c62828">Màn sập — gửi dev (${kq.man_loi_nang.length})</h2><p class=m>Công cụ đã bỏ qua các màn này và chạy tiếp. TC của các màn này ghi CHƯA KIỂM (bị chặn), không tính ĐẠT.</p><table><thead><tr><th>Màn</th><th>Đường dẫn</th><th>Đối chiếu sổ yêu cầu</th><th>Vai trên giao diện</th><th>Lúc</th><th>Cách nhận</th><th>Lỗi</th></tr></thead><tbody>${kq.man_loi_nang.map(x => `<tr class=cao><td>${esc(x.man)}</td><td>${esc(x.duong_dan || x.url)}</td><td>${x.loi_da_biet ? 'LỖI ĐÃ BIẾT ' + esc(x.loi_da_biet.ma) + (x.loi_da_biet.yc ? ' / ' + esc(x.loi_da_biet.yc) : '') : '<b>LỖI MỚI — chưa có trong sổ</b>'}</td><td>${esc(x.vai_tren_giao_dien || '')}</td><td>${esc(x.luc || '')}</td><td>${esc(x.cach_nhan || '')}</td><td>${esc(x.loi)}</td></tr>`).join('')}</tbody></table>` : ''}
${(kq.loi_403 || []).length ? `<h2 style="font-size:16px;margin-top:28px">Máy chủ cấm (403) dù giao diện cho vào (${kq.loi_403.length})</h2><table><thead><tr><th>Đang ở</th><th>API</th></tr></thead><tbody>${kq.loi_403.map(x => `<tr class=tb><td>${esc(x.man)}</td><td>${esc(x.api)}</td></tr>`).join('')}</tbody></table>` : ''}
${(kq.thao_tac_cuoi || []).length ? `<h2 style="font-size:16px;margin-top:28px">15 thao tác cuối</h2><table><thead><tr><th>Giờ</th><th>Loại</th><th>Nội dung</th><th>URL</th></tr></thead><tbody>${kq.thao_tac_cuoi.map(x => `<tr><td>${esc(x.t)}</td><td>${esc(x.loai)}</td><td>${esc(x.nd)}</td><td>${esc(x.url)}</td></tr>`).join('')}</tbody></table>` : ''}
<h2 style="font-size:16px;margin-top:28px">Form đã mở để kiểm kê (${(kq.form_da_mo || []).length})</h2>
<p class=m>${(kq.form_da_mo || []).map(esc).join('<br>') || 'Không mở được form nào — xem cột "Nút trên màn" bên dưới để biết tên nút thật'}${kq.o_chon_cot_bo_qua ? '<br>Đã bỏ ' + kq.o_chon_cot_bo_qua + ' ô đánh dấu thuộc bảng chọn cột hiển thị (không phải trường dữ liệu)' : ''}</p>
${(() => { const r0 = (kq.man_da_kiem || []).filter(r => !r.so_truong && !r.nut_tren_man); return r0.length ? `<h2 style="font-size:16px;margin-top:28px">Màn không có trường nào và không có nút nào (${r0.length})</h2><p class=m>Màn trống với vai đang đăng nhập: có thể đúng theo phân quyền, hoặc thiếu chức năng / thiếu dữ liệu — cần đối chiếu đặc tả.</p><table><thead><tr><th>Màn</th><th>URL</th></tr></thead><tbody>${r0.map(r => `<tr><td>${esc(r.tab)}</td><td>${esc(r.url)}</td></tr>`).join('')}</tbody></table>` : ''; })()}
${(kq.di_vong_bo_chan || []).length ? `<h2 style="font-size:16px;margin-top:28px;color:#b3261e">Yêu cầu mạng không đi qua bộ chặn (${kq.di_vong_bo_chan.length})</h2><p class=m>Ứng dụng gọi mạng bằng tham chiếu cũ nên bộ chặn ghi không thấy. Không biết phương thức (đọc hay ghi). Nên chạy bằng bản Tampermonkey (cài móc từ lúc trang bắt đầu tải) và báo Bên B kiểm tra mã gọi API này.</p><table><thead><tr><th>Giờ</th><th>Loại</th><th>Đường dẫn</th><th>Đang ở màn</th></tr></thead><tbody>${kq.di_vong_bo_chan.map(x => `<tr class="tb"><td>${esc(x.luc)}</td><td>${esc(x.loai)}</td><td>${esc(x.ngan)}</td><td>${esc(x.man)}</td></tr>`).join('')}</tbody></table>` : ''}
${(() => { const p = kq.do_phu_quy_trinh; if (!p) return ''; const rs = x => x.ra_soat && x.ra_soat.length ? ' · rà soát ' + esc(x.ra_soat.join(', ')) : ''; return `<h2 style="font-size:16px;margin-top:28px">Độ phủ quy trình — tài liệu × app × TC v7</h2><p class=m>Nguồn so với app: ${esc((p.nguon_trang_thai || {}).app || 'chưa có tệp trạng thái')}${(p.nguon_trang_thai || {}).ra_soat ? ' · số báo cáo rà soát lấy từ ' + esc(p.nguon_trang_thai.ra_soat) : ''}. TC rơi vào các mục dưới ghi «chưa chạy» kèm lý do ở mục «Phủ danh mục TC», không tính là lỗi app.</p><ul><li><b>Tài liệu chưa có TC v7 nào (${p.chua_co_tc_v7.length}):</b> ${p.chua_co_tc_v7.map(x => esc(x.ma) + ' (' + x.so_buoc + ' bước)').join(' · ') || '—'}</li><li><b>Tài liệu tả quy trình app không còn (${p.tai_lieu_app_khong_co.length}):</b> ${p.tai_lieu_app_khong_co.map(x => esc(x.tep) + ' → ' + esc(x.tep_app) + rs(x)).join('<br>') || '—'}</li><li><b>App có quy trình, chưa có tài liệu nên chưa có TC (${p.app_chua_co_tai_lieu.length}):</b> ${p.app_chua_co_tai_lieu.map(x => esc(x.tep_app) + ' (' + esc(x.entity || '') + ': ' + esc((x.buoc || []).join(', ')) + ')' + rs(x)).join('<br>') || '—'}</li><li><b>Bước của tài liệu không có trong khai báo app:</b> ${p.so_buoc_app_khong_co} · <b>bước có «Từ chặng» khác app:</b> ${p.so_buoc_chang_khac}</li></ul>`; })()}
${htmlTroNang(kq)}
${(() => { const o = kq.kiem_o; if (!o) return ''; const thu = { 'KHÁC KHAI BÁO': 0, 'CHƯA KIỂM': 1, 'ĐẠT': 2 }, ds = (o.dong || []).slice().sort((a, b) => thu[a.kq] - thu[b.kq]); const dem = k => ds.filter(x => x.kq === k).length; return `<h2 style="font-size:16px;margin-top:28px">Kiểm ô theo khai báo giới hạn của app (${ds.length}) — bổ sung, chưa có mã TC v7</h2><p class=m>Căn cứ: ${esc(o.nguon.tep)} @${esc(o.nguon.ban)} — ${esc(o.nguon.ghi_chu)} Công cụ chỉ gõ rồi rời ô, không bấm Lưu: thấy ô có chặn trên màn hay không, chưa thấy máy chủ từ chối. Khác khai báo ${dem('KHÁC KHAI BÁO')} · chưa kiểm ${dem('CHƯA KIỂM')} · đạt ${dem('ĐẠT')} · ô đã xét ${o.dem.o_da_xet}, ô không mang name ${o.dem.o_khong_name}, ô không có trong khai báo ${o.dem.o_khong_khai}.</p>${ds.length ? `<table><thead><tr><th>Kết quả</th><th>Màn › form</th><th>Ô</th><th>Ca</th><th>Giá trị gõ</th><th>Mong đợi</th><th>Quan sát</th><th>Căn cứ</th></tr></thead><tbody>${ds.map(x => `<tr class="${x.kq === 'KHÁC KHAI BÁO' ? 'tb' : ''}"><td>${esc(x.kq)}</td><td>${esc(x.man)} › ${esc(x.form)}</td><td>${esc(x.o)}<div class=m>${esc(x.name)}</div></td><td>${esc(x.ca)}</td><td>${esc(x.gia_tri)}</td><td>${esc(x.mong_doi)}</td><td>${esc(x.quan_sat)}</td><td class=m>${esc(x.can_cu)}</td></tr>`).join('')}</tbody></table>` : ''}`; })()}
${(kq.loi_o_nhap || []).length ? `<h2 style="font-size:16px;margin-top:28px">Lỗi ô tìm kiếm / ô lọc (${kq.loi_o_nhap.length})</h2><table><thead><tr><th>Màn</th><th>Ô</th><th>Phép thử</th><th>Giá trị gõ</th><th>Số dòng trước</th><th>Số dòng sau</th><th>Lỗi</th></tr></thead><tbody>${kq.loi_o_nhap.map(x => `<tr class="tb"><td>${esc(x.man)}</td><td>${esc(x.o)}</td><td>${esc(x.loai)}</td><td>${esc(x.gia_tri)}</td><td>${esc(x.so_dong_truoc)}</td><td>${esc(x.so_dong_sau)}</td><td>${esc(x.loi)}</td></tr>`).join('')}</tbody></table>` : ''}
${(kq.bieu_do_chua_bam_duoc || []).length ? `<h2 style="font-size:16px;margin-top:28px">Biểu đồ chưa bấm được để xem chi tiết (${kq.bieu_do_chua_bam_duoc.length})</h2><ul>${kq.bieu_do_chua_bam_duoc.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
${(kq.danh_sach_menu || []).length ? `<h2 style="font-size:16px;margin-top:28px">Mục menu của tài khoản (${kq.danh_sach_menu.length})</h2><p class=m>${kq.danh_sach_menu.map(esc).join(' · ')}</p>` : ''}
${(kq.menu_khong_mo_duoc || []).length ? `<h2 style="font-size:16px;margin-top:28px;color:#b3261e">Mục menu chưa kiểm được (${kq.menu_khong_mo_duoc.length})</h2><ul>${kq.menu_khong_mo_duoc.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
<h2 style="font-size:16px;margin-top:28px">Các màn đã kiểm (${(kq.man_da_kiem || []).length})</h2>
<table><thead><tr><th>Màn</th><th>URL</th><th>Số trường</th><th>Nút trên màn</th></tr></thead><tbody>${(kq.man_da_kiem || []).map(r => `<tr><td>${esc(r.tab)}</td><td>${esc(r.url)}</td><td>${esc(r.so_truong)}</td><td>${esc(r.nut_tren_man)}</td></tr>`).join('')}</tbody></table>
<h2 style="font-size:16px;margin-top:28px">Không bấm / bỏ qua (${(kq.bo_qua_khong_bam || []).length})</h2>
<table><thead><tr><th>Màn</th><th>Chữ</th><th>Lý do</th></tr></thead><tbody>${(kq.bo_qua_khong_bam || []).map(r => `<tr><td>${esc(r.man)}</td><td>${esc(r.chu)}</td><td>${esc(r.ly_do)}</td></tr>`).join('')}</tbody></table>
${trThieu ? `<h2 style="font-size:16px;margin-top:28px">Thiếu trường so với danh mục mong đợi</h2><table><thead><tr><th>Màn</th><th>Trường không thấy</th></tr></thead><tbody>${trThieu}</tbody></table>` : ''}
<h2 style="font-size:16px;margin-top:28px">Danh mục trường (${ds.length} trường, ${ds.filter(f => f.loi).length} có lỗi)</h2>
<table><thead><tr>${COT_TRUONG.map(c => `<th>${c[1]}</th>`).join('')}</tr></thead><tbody>${trT}</tbody></table>`;
}

/* ---------- đối tượng lệnh dqtv ---------- */
window.dqtv = {
  cauHinh() { const c = cfgHienTai(); console.log(jsLiteral(Object.fromEntries(Object.keys(KIEU).map(k => [k, c[k]])))); return c; },
  dat(a, b) {
    const cur = docCfgLuu(); let patch = {};
    if (typeof a === 'string') patch[a] = b; else patch = a || {};
    for (const k in patch) { const e = kiemKieu(k, patch[k]); if (e) { console.warn('[dqtv] ' + e); delete patch[k]; }
      else if (KHONG_LUU[k]) { console.warn('[dqtv] "' + k + '" không lưu (an toàn) — truyền khi chạy: dqtv.chay({ ' + k + ': ... })'); delete patch[k]; } }
    Object.assign(cur, patch); luuCfg(cur); console.log('[dqtv] Đã lưu:', Object.keys(patch).join(', ') || '(không có)'); return this;
  },
  datLai() { try { localStorage.removeItem(KEY_CFG); } catch (e) {} delete window.DQTV_CONFIG; console.log('[dqtv] Về mặc định.'); return this; },
  hoSo(ten) { const h = HO_SO[ten]; if (!h) { console.warn('[dqtv] Không có bộ "' + ten + '". Có: ' + Object.keys(HO_SO).join(', ')); return this; } this.dat(h); console.log('[dqtv] Dùng bộ:', ten); return this; },
  xuatCauHinh() { return hoaChuoi(docCfgLuu()); },
  nhapCauHinh(s) { const o = typeof s === 'string' ? doChuoi(s) : s; return this.dat(o || {}); },

  async chay(over) {
    if (CO.dangChay) { console.warn('[dqtv] Đang chạy rồi, không cần bấm lại. Muốn chạy lại thì bấm "■ Dừng" (hoặc gõ dqtv.dung()) trước.'); return; }
    // Chạy từ userscript: phải chắc mã đang chạy trong chính trang (không phải vùng tách riêng của tiện ích),
    // vì chỉ khi đó lệnh ghi của trang mới bị chặn được. Không chắc thì KHÔNG chạy.
    if (window.__dqtvNguon === 'userscript' && !laTrangThat()) {
      const t = 'Không chạy: userscript đang chạy tách khỏi trang nên không chặn được lệnh ghi. Kiểm tra dòng "@grant none" trong Tampermonkey, hoặc dán tệp vào Console.';
      console.warn('[dqtv] ' + t); CO.tienDo = t; capNhatBang(); return;
    }
    TK = taiKhoan();
    MAT_PHIEN = ''; APP_SAP = '';
    nk('bắt đầu chạy', TK);
    try { localStorage.setItem(KEY_RUN, hoaChuoi({ tk: TK, over: locLuu(over || {}), ts: Date.now(), lan: (CO.lanTiep || 0), moc: CO.mocTiep || '' })); } catch (e) {}   // 3.5: không lưu khoá mở ghi
    CO.mocTiep = '';
    CO.dung = false; CO.tamDung = false; CO.dangChay = true; CO.tienDo = 'Tài khoản: ' + (TK || '(không nhận ra)'); capNhatBang();
    console.info('[dqtv] Tài khoản: ' + (TK || '(không nhận ra — điểm dừng dùng chung, nên khai dqtv.dat({dacTa:{vaiChon:"..."}}))'));
    // điểm dừng của bản cũ (dùng chung mọi tài khoản) → bỏ, để không chạy tiếp nhầm sang tài khoản khác
    try { if (localStorage.getItem(KEY_CKPT)) { localStorage.removeItem(KEY_CKPT); console.info('[dqtv] Đã bỏ điểm dừng cũ dùng chung mọi tài khoản (bản trước).'); } } catch (e) {}
    // tiếp tục từ điểm dừng của ĐÚNG tài khoản này (nếu có)
    let tiep = null; try { const c = localStorage.getItem(ckptKey()); if (c) { const ck = doChuoi(c); if (ck.origin === location.origin && ck.tk === TK) tiep = ck; } } catch (e) {}
    if (tiep && tiep.gon) tiep = await docCkptLon(tiep);   // [10a] bản gọn: đọc bản đầy đủ của đúng lượt chạy ở kho lớn
    if (tiep) console.info('[dqtv] Chạy tiếp từ điểm dừng lúc ' + new Date(tiep.ts).toLocaleString('vi-VN') + ' (' + tiep.xong.length + ' mục đã xong). Muốn chạy lại từ đầu: dqtv.chayLaiTuDau()');
    try { const kq = await dqtvAudit(over, tiep); return kq; }
    catch (e) { console.log('%c[dqtv] LỖI: ' + (e && e.message || e), 'color:#fff;background:#b00;padding:2px 6px'); }
    // tới được đây là lần chạy đã kết thúc trong trang (xong, dừng hoặc lỗi) → bỏ cờ "đang chạy";
    // nếu trang tự tải lại giữa chừng thì không tới được đây, cờ còn lại để lần nạp sau chạy tiếp
    // mất phiên: GIỮ cờ đang chạy để đăng nhập lại cùng tài khoản là chạy tiếp (bản Tampermonkey tự chạy tiếp)
    finally { if (window.__dqtvGoHook) window.__dqtvGoHook(); CO.dangChay = false; CO.lanTiep = 0; if (!window.__dqtvDangRoi && !MAT_PHIEN && !APP_SAP) { try { localStorage.removeItem(KEY_RUN); } catch (e) {} }
    if (APP_SAP && window.__dqtvNguon !== 'userscript') console.log('%c[dqtv] ỨNG DỤNG SẬP Ở "' + APP_SAP + '" — TRANG SẼ TẢI LẠI.\nAPP KẸT MÀN BÁO LỖI SANG CẢ MÀN KHÁC.\nSAU KHI TRANG TẢI XONG: DÁN LẠI ĐÚNG TỆP BUNDLE NÀY (bản ' + PHIEN_BAN + ') VÀO CONSOLE. Công cụ tự chạy tiếp từ mục đang dở và bỏ qua các màn đã sập.\n(Dùng Tampermonkey thì không phải dán lại.)', 'color:#fff;background:#c62828;font-size:14px;font-weight:bold;padding:6px 10px');
    if (APP_SAP) { CO.tienDo = '⚠ Ứng dụng sập ở "' + APP_SAP + '". Đang tải lại trang để chạy tiếp (bản dán Console: dán lại tệp sau khi trang tải xong).'; setTimeout(() => { try { location.assign(location.origin + '/' + (location.pathname.split('/')[1] || '')); } catch (e) {} }, 1500); } if (MAT_PHIEN) { CO.tienDo = '⚠ Dừng vì mất phiên: ' + MAT_PHIEN + '. Đăng nhập lại cùng tài khoản — công cụ tự chạy tiếp.'; setTimeout(() => window.__dqtvChoDangNhap && window.__dqtvChoDangNhap(true), 1000); } capNhatBang(); }
  },
  // nạp bảng đặc tả quy trình (JSON chuyển từ YAML theo mẫu) — một bảng hoặc mảng nhiều bảng
  napDacTa(x) {
    try { const ds = napDacTaVao(x); console.info('[dqtv] Đã nạp đặc tả: ' + ds.map(d => maQT(d) + ' (' + (d.buoc || []).length + ' bước)').join(', ') + '. Vai của tài khoản này: ' + this.vaiDacTa().join(', ')); return ds.length; }
    catch (e) { console.warn('[dqtv] Không nạp được đặc tả: ' + e.message); return 0; }
  },
  xemDacTa() { const ds = docDacTa(); console.table(ds.map(d => ({ 'quy trình': maQT(d), 'tên': (d.dinh_danh || {}).ten, 'bản': (d.dinh_danh || {}).phien_ban, 'số bước': (d.buoc || []).length, 'menu': (d.menu || []).join(' · ') }))); return ds; },
  xoaDacTa(ma) { const ds = ma ? docDacTa().filter(d => maQT(d) !== ma) : []; luuDacTa(ds); console.info('[dqtv] Đã xoá ' + (ma ? 'đặc tả ' + ma : 'mọi đặc tả') + '.'); return this; },
  vaiDacTa() { const tk = taiKhoan(); return docDacTa().map(d => { const v = (d.vai || []).find(x => khopTK(tk, x.nhan_dang_nhap)); return maQT(d) + ': ' + (v ? v.ma : 'ngoài đặc tả'); }); },
  // 3.6: xem công cụ nhận ra menu, vùng chính, bảng, ô tìm, tài khoản thế nào (không bấm gì)
  // 3.6: xem công cụ nhận ra menu, vùng chính, bảng, ô tìm, tài khoản thế nào (không bấm gì)
  // bỏ điểm dừng của tài khoản đang đăng nhập rồi chạy lại toàn bộ
  async chayLaiTuDau(over) { TK = taiKhoan(); try { localStorage.removeItem(ckptKey()); localStorage.removeItem(KEY_CKPT); } catch (e) {} /* màn sập vẫn giữ: muốn thử lại màn sập thì dqtv.manSap('xoa') */ console.info('[dqtv] Đã xoá điểm dừng của tài khoản này, chạy lại từ đầu.'); return this.chay(over); },
  // in 40 thao tác cuối (giữ qua tải lại trang / đăng xuất) để biết lần chạy dừng ở đâu
  nhatKy(n = 40) { const ds = docNK().slice(-n); console.table(ds.map(x => ({ giờ: x.t, 'tài khoản': x.tk, loại: x.loai, 'nội dung': x.nd, url: x.url }))); return ds; },
  xoaNhatKy() { try { localStorage.removeItem(KEY_NK); } catch (e) {} NK_BO = null; console.info('[dqtv] Đã xoá nhật ký.'); },
  taiKhoan() { const t = taiKhoan(); console.info('[dqtv] Tài khoản nhận ra: ' + (t || '(không nhận ra)')); return t; },
  tamDung() { CO.tamDung = true; console.log('[dqtv] Tạm dừng.'); return this; },
  tiep() { CO.tamDung = false; console.log('[dqtv] Tiếp.'); return this; },
  dung() { CO.dung = true; CO.tamDung = false; try { localStorage.removeItem(KEY_RUN); } catch (e) {} if (!CO.dangChay && LC) LC.quyetDinh = null; console.log('[dqtv] Dừng.'); return this; },
  async chayLaiLoi() {
    let kq; try { kq = doChuoi(localStorage.getItem(KEY_LAST) || 'null'); } catch (e) {}
    if (CO.dangChay) { console.warn('[dqtv] Đang chạy. Dùng dqtv.dung() trước.'); return; }   // 3.5: không chạy chồng
    const loi = (kq && kq.van_de || []).map(r => r.tab); if (!loi.length) { console.warn('[dqtv] Lần trước không có màn lỗi.'); return; }
    TK = taiKhoan();
    try { localStorage.removeItem(ckptKey()); } catch (e) {}
    CO.dung = false; CO.tamDung = false; CO.dangChay = true; capNhatBang();
    try { return await dqtvAudit({}, { chiLoi: loi }); } finally { if (window.__dqtvGoHook) window.__dqtvGoHook(); CO.dangChay = false; capNhatBang(); }
  },
  async moMan(url, ten) {   // mở lại đúng màn có lỗi để xem tận mắt
    console.log('[dqtv] Mở lại:', ten, url);
    if (location.pathname + location.search === url) return;
    try { history.pushState({}, '', url); dispatchEvent(new PopStateEvent('popstate', { state: {} })); }   // 3.5: điều hướng trong app, không tải lại trang
    catch (e) { location.href = url; }
  },
  // [S1] xem / xoá danh sách màn sập đã nhớ của tài khoản này (xoá khi Bên B báo đã sửa, để lần chạy sau thử lại)
  manSap(lenh) {
    TK = taiKhoan(); const k = KEY_SAP + '|' + location.origin + '|' + bam(TK || '?');
    if (lenh === 'xoa') { try { localStorage.removeItem(k); } catch (e) {} console.info('[dqtv] Đã xoá danh sách màn sập của tài khoản này.'); return []; }
    let ds = []; try { ds = doChuoi(localStorage.getItem(k) || '[]') || []; } catch (e) {}
    console.table(ds.map(x => ({ man: x.man, duong_dan: x.duong_dan, loi_da_biet: x.loi_da_biet ? x.loi_da_biet.ma + ' ' + (x.loi_da_biet.yc || '') : 'MỚI — cần báo', vai: x.vai_tren_giao_dien, luc: x.luc })));
    return ds;
  },
  // [S4] xoá dữ liệu lưu của các bản trước (v3, v3.6, 3.17–3.23) để trả chỗ cho trình duyệt; không đụng dữ liệu v3.24
  donBoNho() {
    const bo = []; for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && KHOA_CU.test(k)) { bo.push(k); try { localStorage.removeItem(k); } catch (e) {} } }
    let dung = 0; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); dung += (k.length + (localStorage.getItem(k) || '').length); }
    console.info('[dqtv] Đã xoá ' + bo.length + ' khóa cũ. localStorage còn dùng khoảng ' + Math.round(dung / 1024) + ' nghìn ký tự.'); return bo;
  },
  vai() {
    const d = cfgHienTai().dacTa; if (!d) { console.warn('[dqtv] Chưa khai dacTa. Chưa kiểm được vai.'); return ''; }
    let v = ''; if (d.vaiChon) { const e = document.querySelector(d.vaiChon); if (e) v = (e.innerText || '').trim(); }
    if (!v && d.vaiText) { const m = (document.body.innerText || '').match(d.vaiText); if (m) v = (m[1] || m[0]).trim(); }
    console.log('[dqtv] Vai nhận ra:', v || '(không xác định)'); return v;
  },
  xuat(kieu) {
    const ts = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    if (kieu === 'truong-tay') { const ds = docTay(); if (!ds.length) { console.warn('[dqtv] Chưa có lần quét tay nào.'); return; } taiTep('dqtv-truong-quet-tay-' + ts + '.csv', sangCSVTruong(ds), 'text/csv'); console.log('[dqtv] Đã xuất ' + ds.length + ' trường quét tay.'); return; }
    let kq; try { kq = doChuoi(localStorage.getItem(KEY_LAST) || 'null'); } catch (e) {}
    kq = (window.__DQTV_AUDIT && window.__DQTV_AUDIT.ketQua) || kq;
    if (!kq) { console.warn('[dqtv] Chưa có kết quả.'); return; }
    if (kieu === 'dacta') { if (!kq.doi_chieu_dac_ta) { console.warn('[dqtv] Lần chạy này chưa có đối chiếu đặc tả.'); return; } taiTep('dqtv-doi-chieu-dac-ta-' + slugTK() + '-' + ts + '.csv', sangCSVDacTa(kq), 'text/csv'); console.log('[dqtv] Đã xuất đối chiếu đặc tả.'); return; }
    if (kieu === 'truong') { taiTep('dqtv-danh-muc-truong-' + ts + '.csv', sangCSVTruong(kq.danh_muc_truong), 'text/csv'); console.log('[dqtv] Đã xuất ' + (kq.danh_muc_truong || []).length + ' trường.'); return; }
    const ten = 'dqtv-' + slugTK() + '-' + ts;
    if (kieu === 'csv') taiTep(ten + '.csv', sangCSV(kq), 'text/csv');
    else if (kieu === 'mau') taiTep(ten + '-mau-loi.csv', sangCSVMau(kq), 'text/csv');   // 3.6
    else if (kieu === 'html') taiTep(ten + '.html', sangHTML(kq), 'text/html');
    else taiTep(ten + '.json', hoaChuoi(kq), 'application/json');
    console.log('[dqtv] Đã xuất ' + (kieu || 'json') + '.');
  },
  bang() { moBang(); return this; },

  /* --- quét tay: anh tự mở form / hồ sơ / hộp thoại rồi gõ lệnh này --- */
  async quetManNay(ten) {
    if (CO.dangChay) { console.warn('[dqtv] Đang chạy tự động, dừng trước đã.'); return; }
    CO.dung = false; CO.tamDung = false;
    const ds = await dqtvAudit({ __chiManNay: true, __tenMan: ten || (document.title + ' · ' + location.pathname) });
    const cu = docTay(); const khoa = new Set(cu.map(f => f.khoa));
    const moi = ds.filter(f => !khoa.has(f.khoa));
    try { localStorage.setItem(KEY_TAY, hoaChuoi(cu.concat(moi))); } catch (e) { console.warn('[dqtv] Không lưu được vào trình duyệt (quá lớn). Xuất ngay bằng dqtv.xuat("truong-tay").'); }
    console.table(ds.map(f => ({ vùng: f.vung, nhãn: f.nhan, kiểu: f.loai, 'bắt buộc': f.bat_buoc, 'số lựa chọn': f.so_lua_chon, lỗi: f.loi })));
    console.log('%c[dqtv] Quét tay: ' + ds.length + ' trường (' + moi.length + ' mới). Tổng đã gom: ' + (cu.length + moi.length) + '. Xuất: dqtv.xuat("truong-tay")', 'color:#0b3d66;font-weight:bold');
    return ds;
  },
  xoaTruongTay() { try { localStorage.removeItem(KEY_TAY); } catch (e) {} console.log('[dqtv] Đã xoá các lần quét tay.'); },

  /* --- ghi kịch bản bằng thao tác tay --- */
  ghi() {
    if (CO.ghiKichBan) { console.warn('[dqtv] Đang ghi.'); return; }
    const buoc = []; CO.ghiKichBan = buoc;
    const labelOf = el => (el.getAttribute('aria-label') || el.placeholder || el.title || el.name || (el.id && (document.querySelector('label[for="' + CSS.escape(el.id) + '"]') || {}).innerText) || (el.closest('label') ? el.closest('label').innerText : '') || '').trim().slice(0, 40);
    const biMat = t => t.type === 'password' || t.autocomplete === 'one-time-code' || /pass|mat-?khau|mật khẩu|otp|token|secret|pin|cvv/i.test([t.name, t.id, t.autocomplete, labelOf(t)].join(' '));   // 3.5
    const onInput = e => { const t = e.target; if (!t.matches || !t.matches('input,textarea') || biMat(t)) return; const last = buoc[buoc.length - 1]; const lab = labelOf(t); if (last && last.nhap === lab) last.giaTri = t.value; else buoc.push({ nhap: lab, giaTri: t.value }); };
    const onChange = e => { const t = e.target; if (t.matches && t.matches('select')) buoc.push({ chon: labelOf(t), giaTri: (t.options[t.selectedIndex] || {}).text }); };
    const onClick = e => { const b = e.target.closest('a,button,[role=tab],[role=button]'); if (b && b.closest && !b.closest('#dqtv-panel-host')) { const tx = (b.innerText || '').trim().slice(0, 30); if (tx) buoc.push({ bam: tx }); } };
    CO._ghiHandlers = { onInput, onChange, onClick };
    document.addEventListener('input', onInput, true); document.addEventListener('change', onChange, true); document.addEventListener('click', onClick, true);
    console.log('%c[dqtv] Bắt đầu ghi. Thao tác bình thường rồi gõ dqtv.dungGhi()', 'color:#b60;font-weight:bold');
  },
  dungGhi() {
    const buoc = CO.ghiKichBan; if (!buoc) { console.warn('[dqtv] Chưa ghi.'); return; }
    const h = CO._ghiHandlers; document.removeEventListener('input', h.onInput, true); document.removeEventListener('change', h.onChange, true); document.removeEventListener('click', h.onClick, true);
    CO.ghiKichBan = null;
    const kb = { man: '(điền tên mục menu)', buoc: buoc.concat([{ kiemTra: { trangThai: '(điền trạng thái mong đợi)', apiKhongLoi: true } }]) };
    console.log('%c[dqtv] Đã ghi ' + buoc.length + ' bước. Chép đoạn dưới vào kichBan rồi sửa phần kiemTra:', 'color:#070;font-weight:bold');
    console.log(jsLiteral(kb));
    return kb;
  },
};

