/*
 * ITA — kiểm giao diện, đối chiếu đặc tả, chấm theo ma trận TC v7. Bản 5.0 (tách từ DQTV kiểm tra 3.31).
 * Dùng: đăng nhập → F12 → Console → dán tệp dist (hoặc Tampermonkey) → "▶ Chạy". Bảng: Alt+Shift+D.
 *   ita.chay() · dung() · chayLaiLoi() · cauHinh() · dat(...) · hoSo(ten) · gopKetQua(csv1, csv2…) · tuKiemChan()
 *   ita.xuat('html'|'json'|'csv'|'mau'|'truong'|'dacta'|'ket-qua-ma-tran') · keHoach({loai_kiem, uu_tien, bo_chay, quy_trinh})
 * An toàn: chỉ đọc, luôn luôn. Chỉ POST tới đúng các đường trong du-an.json → duong_dan_xac_thuc; lệnh ghi khác bị chặn.
 *   Lá chắn tự kiểm khi nạp và mỗi lần Chạy; không đạt thì khoá nút Chạy.
 * Lịch sử bản 3.4–3.26: xem dqtv-kiem-tra-dacta-3.26.js (đầu tệp).
 */

(function () {
'use strict';
// Nguồn nạp của LẦN NÀY: bản userscript đặt cờ ngay trước khi chạy; dán vào Console thì không có cờ → "console".
// (Dán vào Console luôn chạy trong chính trang, nên không cần kiểm tra thêm.)
window.__itaNguon = window.__itaNguonMoi || 'console';
try { delete window.__itaNguonMoi; } catch (e) { window.__itaNguonMoi = undefined; }

