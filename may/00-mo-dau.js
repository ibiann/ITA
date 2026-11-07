/*
 * ITA — máy kiểm giao diện dùng cho nhiều dự án (bước 13, 07/11/2026: tách từ «DQTV kiểm tra» 3.26.6; dữ liệu riêng mỗi dự án nằm ở du-an/<tên>/).
 * Lịch sử trước bước 13 (bản DQTV): bản 3.25 = nhánh đặc tả 3.23 (dqtv-kiem-tra-dacta) GỘP nhánh 3.6 (chốt chặn + phép kiểm giao diện)
 *   Gộp ba chiều trên bản gốc chung (dqtv-kiem-tra-v3 ~3.4). Ghi chú 3.6 và 3.17–3.23 bên dưới vẫn đúng.
 * ------------------------------------------------------------------
 * Bản 3.6 THÊM (chỉ đọc màn hình — không bấm thêm gì, không gửi lệnh mạng; trường cũ giữ nguyên, chỉ thêm trường mới):
 *   • Trên mỗi màn: du_lieu_nhay_cam (mức cao) · cat_chu_khong_tooltip · chuoi_dai_khong_ngat · ma_enum_lo ·
 *     dinh_dang_ngay_tron · dinh_dang_so_tron · tieu_de_lech_menu · nut_chinh_nhieu (mức thấp) · can_xac_nhan (lý do dễ báo nhầm)
 *   • Thử ô: kiểm từng dòng có chứa từ khoá · so nội dung màn trước/sau khi tìm · bộ lọc vô tác dụng (gộp 1 dòng/ô) ·
 *     chữ lạ chỉ báo khi MỚI xuất hiện · nhận thông báo trống rộng hơn (+ cauTrongThem)
 *   • Toàn app: he_thong_thiet_ke (cỡ chữ, màu, bo góc, đổ bóng, lệch lưới 4px, cùng nhãn nút khác kiểu) ·
 *     ngon_tu (Xoá/Xóa, hoa/thường, lẫn tiếng Anh, chữ tổ hợp NFD, định dạng ngày đang dùng)
 *   • Báo cáo: mau_loi — gom theo mẫu lỗi / thành phần kèm nguyên tắc vi phạm · bảng lọc "theo mẫu lỗi", "thiết kế & ngôn từ"
 *   • ita.thamDo() / nút Thăm dò: xem công cụ nhận ra menu, vùng chính, bảng, ô tìm, tài khoản thế nào
 *   • Tắt được: ita.dat({ kiemThietKe:false, kiemNgonTu:false }) nếu thấy chạy chậm
 * ------------------------------------------------------------------
 * (Ghi chú bản 3.5 bên dưới vẫn đúng)
 * Bản 3.5 sửa so với 3.4 (rút từ lỗi đã tái hiện khi chạy thử):
 *   [1] LÁ CHẮN cài ngay khi nạp. Bản Tampermonkey nạp ở document-start → lá chắn có mặt TRƯỚC mã ứng dụng,
 *       nên lệnh ghi qua fetch/XHR mà ứng dụng giữ sẵn cũng bị chặn. Ngoài lúc chạy kiểm lá chắn cho qua hết.
 *   [2] Chặn form.submit() gọi thẳng (3.4 để lọt POST và làm trang chuyển đi).
 *   [3] Ngoại lệ choPhepPost chỉ áp cho POST (3.4 cho qua cả PUT/DELETE tới /auth, /search…).
 *   [4] Phát hiện lệnh mạng đi vòng bộ chặn (khi dán Console) → ghi "lenh_di_vong_bo_chan".
 *   [5] So chữ nút đã chuẩn hoá Unicode (Xóa/Xoá, chữ tổ hợp NFD). Link có chữ/đường dẫn hành động không còn được miễn.
 *   [6] Lỗi giữa chừng ở bất kỳ đâu cũng gỡ móc (3.4: lỗi "không thấy menu" để treo chặn ghi trên trang).
 *   [7] Mở ghi: so tên máy chủ CHÍNH XÁC; chanGhi/mucQuyTrinh/moiTruongKiemThu KHÔNG lưu, chỉ truyền khi chạy.
 *       ITA_MAC_DINH cũ chỉ dùng trong phiên. nhapCauHinh có kiểm khoá.
 *   [8] Nút nghiệp vụ (moNutNghiepVu) và tự chạy tiếp sau tải lại CHỈ hoạt động khi lá chắn có từ đầu trang
 *       (bản Tampermonkey) và chưa thấy lệnh đi vòng. Dán Console thì tự tắt, có thông báo.
 *   [9] Bảng điều khiển escape dữ liệu; ghi kịch bản bỏ ô mật khẩu/OTP; chayLaiLoi không chạy chồng;
 *       "Mở lại màn" điều hướng trong app, không tải lại trang.
 * Mục đích: Bên A tự kiểm giao diện để bắt (1) lỗi mã và (2) lỗi quy trình,
 *           trước khi chuyển yêu cầu sửa cho Bên B.
 *
 * Dùng:  Đăng nhập xong → F12 → Console → dán cả tệp → Enter.
 *        Dán xong hiện BẢNG ĐIỀU KHIỂN (góc phải). Bấm "Chạy".
 *        Hoặc gõ  ita.chay()  trong Console.
 *        Bật/tắt bảng bằng  Alt+Shift+D.
 *
 * An toàn: mọi lệnh GHI (POST/PUT/PATCH/DELETE) bị CHẶN, trừ khi tên máy chủ
 *          nằm trong cấu hình moiTruongKiemThu VÀ anh bật mucQuyTrinh >= 2.
 *          Không bấm nút hành động (Ký, Trình, Gửi, Lưu, Xoá…). Không giữ mật khẩu.
 *
 * Lệnh Console chính:
 *   ita.chay()            chạy (hoặc bấm nút trên bảng)
 *   ita.tamDung()         tạm dừng      ita.tiep()   chạy tiếp
 *   ita.dung()            dừng hẳn
 *   ita.chayLaiLoi()      chỉ kiểm lại các màn có lỗi ở lần trước
 *   ita.cauHinh()         in cấu hình đang dùng
 *   ita.dat('maxTabMoiMan', 10)   hoặc   ita.dat({ chiMenu: /Chiến sĩ/ })
 *   ita.hoSo('nhanh' | 'day-du' | 'bao-mat' | 'kiem-ke-truong')   dùng bộ cấu hình có sẵn
 *   ita.xuatCauHinh() / ita.nhapCauHinh(chuoi)  chuyển cấu hình sang máy khác
 *   ita.datLai()          về mặc định
 *   ita.xuat('json'|'csv'|'html'|'truong')   xuất kết quả lần chạy gần nhất ('truong' = danh mục trường, CSV)
 *   ita.quetManNay()      chỉ quét trường của màn / hộp thoại đang mở (anh tự mở form rồi gõ lệnh)
 *   ita.xuat('truong-tay') / ita.xoaTruongTay()   xuất / xoá các lần quét tay
 *   ita.ghi() / ita.dungGhi()      ghi kịch bản bằng thao tác tay
 *   ita.vai()             thử xem công cụ nhận ra vai đang đăng nhập là gì
 *   ita.bang()            bật/tắt bảng điều khiển
 *
 * Đặc tả quy trình (UC), từ bản 3.17:
 *   Dán tệp dqtv-kiem-tra-dacta.js (công cụ + đặc tả đóng gói sẵn), hoặc gõ ita.napDacTa(<JSON>).
 *   Bấm "▶ Chạy" như thường: cùng một lần chạy vừa kiểm giao diện vừa đối chiếu đặc tả.
 *   Nút có trong đặc tả luôn được mở để đọc form (không tính vào maxFormMoiMan).
 *   ita.xemDacTa() / ita.xoaDacTa(ma) / ita.vaiDacTa()   xem, xoá, xem vai của tài khoản theo đặc tả
 *   ita.xuat('dacta')     xuất bảng đối chiếu ra CSV
 *
 * Bản 3.18: nạp được bảng chuỗi khép kín (ban_giao) và bảng khung; ca SAI_VAI chỉ tính ĐẠT khi đã mở
 *   đúng màn; các bước của vai khác ở màn không mở được gộp thành một dòng KHONG_VAO_MAN.
 * Bản 3.19: nạp được bảng chuyển từ tài liệu Bên B (103 bảng); tệp đóng gói thay cả bộ đặc tả cũ thay vì cộng dồn;
 *   bộ quá lớn so với chỗ lưu của trình duyệt thì giữ trong trang; báo cáo HTML thu gọn phần ĐẠT và LỚP 4.
 * Bản 3.20: chạy bộ TC chuẩn ngay trong lần chạy: ca nhập ô (gõ giá trị vào ô của form vừa mở, rời ô, đọc ô nhận hay báo lỗi,
 *   trả lại giá trị cũ; KHÔNG bấm Lưu, không phát phím Enter); ca sai chặng (nút không được hiện ở hồ sơ chặng khác).
 * Bản 3.21: nhận vai đúng cả khi ứng dụng không hiện chữ viết tắt đầu tên tài khoản (PK, BD…) ở cửa sổ hẹp.
 * Bản 3.22: danh sách có cột Trạng thái mà không có nút lọc trạng thái: mở thêm một hồ sơ cho mỗi trạng thái đang có
 *   (tối đa maxTrangThai), ghi trạng thái vào tên màn, để kiểm được nút, form, ca nhập ô của bước ở từng chặng.
 * Bản 3.26 (30/10/2026):
 *   [S12] Đặc tả sinh từ tài liệu quy trình Bên B 30/10 (109 quy trình); mã bước/ô/KB trùng mã danh mục TC tự sinh.
 *   [S13] Bước hệ thống tự làm: kiểm KHÔNG vai nào thấy nút (ca .HE_THONG, YC-CHUNG-09), thay cho LỚP 4.
 *   [S14] Tự điền chia loại: tự chọn quyết định nghiệp vụ (YC-GD-13) · ô bắt buộc có giá trị sẵn (YC-GD-08)
 *         · điền theo tài khoản đang đăng nhập · ô không bắt buộc có giá trị sẵn — nhóm nguyên nhân AUTO.
 *   [S15] TC chưa có kết quả lấy nguyên nhân theo bước gốc (thiếu màn, thiếu hồ sơ, vai không vào được…).
 *   [S16] Không mở trước màn đã biết là sập (sổ yêu cầu, vd UI-01) → không sập, không tải lại;
 *         ita.chay({ thuLaiLoiDaBiet: true }) để mở lại khi Bên B báo đã sửa.
 *   [S17] Báo cáo ghi lý do dừng và các mục menu chưa chạy.
 * Bản 3.25 (30/10/2026) — trên nền gộp 3.23 + 3.6:
 *   [S8] Mỗi kết quả chưa ĐẠT có NHÓM NGUYÊN NHÂN (ỨNG DỤNG / QUY TRÌNH / TC / THIẾU / CÔNG CỤ / THỦ CÔNG) + việc tiếp.
 *   [S9] Không đánh ĐẠT khi vắng bằng chứng (chưa mở được màn của quy trình, lần chạy dừng giữa chừng).
 *   [S10] Phủ danh mục TC của PM (window.__itaDanhMucTC): TC áp cho vai mà không có kết quả → ghi vì sao; ca ngoài danh mục → thiếu TC.
 *   [S11] Dừng vì app kẹt/mất phiên vẫn tải báo cáo phần đã chạy (-DANG-DO.html) trước khi tải lại trang.
 *   Từ 3.24:
 *   [S1] Màn sập (vd UI-01 Phiếu nhập kho trang phục): nhận cả chữ trên màn báo lỗi; ghi màn sập theo ĐƯỜNG DẪN;
 *        đối chiếu sổ quy tắc (window.__itaQuyTac) để ghi LỖI ĐÃ BIẾT; bỏ qua màn đó và CHẠY TIẾP mục sau,
 *        không dừng cả lần chạy. Chỉ tải lại trang khi app kẹt màn báo lỗi sang cả màn khác.
 *   [S2] Không lưu bộ đặc tả đóng gói vào localStorage (trước đây chiếm gần hết chỗ → điểm dừng không lưu được,
 *        màn sập không được nhớ → chạy lại từ đầu và sập lại). Danh sách màn sập lưu ở khóa nhỏ riêng.
 *   [S3] Chốt an toàn lấy từ v3.6: chặn form.submit() gọi thẳng; choPhepPost chỉ miễn cho POST; so tên máy chủ
 *        chính xác; chanGhi/mucQuyTrinh/moiTruongKiemThu không lưu, chỉ truyền khi chạy.
 *   [S4] Khóa lưu riêng 'dqtv.*.v324' (không đụng v3/v3.6). ita.donBoNho() xoá dữ liệu cũ của bản trước.
 *   [S5] Mức tin cậy nguồn lấy từ sổ quy tắc (nguon_da_duyet, mặc định ['UC']): giữ đúng quy ước PM —
 *        khác tài liệu Bên B chưa duyệt = CẢNH BÁO; khác điểm đã duyệt = LỆCH.
 *   [S6] Ca đã đóng trong sổ yêu cầu (vd TR-046…049) ghi ĐẠT kèm lý do đóng; form «Sửa…» không báo "đang điền sẵn".
 *   [S7] Ca nhập ô nhận thêm giá trị @chu_so:N.
 * Bản 3.23: bước chỉ hiện khi dữ liệu hồ sơ thỏa điều kiện (loại chức vụ, cấp chủ hồ sơ…) mà không thấy nút thì ghi CHƯA KIỂM,
 *   không ghi CẢNH BÁO; lấy dòng đầu của ô trạng thái; không mở lặp hồ sơ khi màn đã có nút lọc trạng thái.
 *   ita.thamDo()          (3.6) xem công cụ nhận ra menu/bảng/ô tìm/tài khoản thế nào
 *   ita.xuat('mau')       (3.6) xuất bảng MẪU LỖI ra CSV
 */

(function () {
'use strict';
// Nguồn nạp của LẦN NÀY: bản userscript đặt cờ ngay trước khi chạy; dán vào Console thì không có cờ → "console".
// (Dán vào Console luôn chạy trong chính trang, nên không cần kiểm tra thêm.)
window.__itaNguon = window.__itaNguonMoi || 'console';
try { delete window.__itaNguonMoi; } catch (e) { window.__itaNguonMoi = undefined; }

