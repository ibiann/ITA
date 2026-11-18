# Ma trận năng lực ITA

Lập ngày 18/11/2026 (GĐ 8) bằng `cong-cu/ma_tran_nang_luc.py`. Mỗi ô «có» nghĩa là **mã của bản dựng có phần đó** (tìm theo mẫu ghi trong công cụ); ô không chứng minh phần đó chạy đúng — chạy đúng hay không xem ở test. Soát lại mỗi lần gộp hoặc nâng bản (roadmap, quy tắc 2).

Nguồn từng cột (đều lấy từ lịch sử git của repo, chạy lại được):

| Cột | Tệp | Commit |
|---|---|---|
| 3.26.6 | `dist/dqtv-kiem-tra-3.26.6.js` | `8b9084f` |
| 3.31 | `dist/dqtv-kiem-tra-3.31.js` | `c5e7681` |
| ITA 5.0 | `dist/ita-dqtv-5.0.js` | `5b0db8f` |
| ITA 1.0 | `dist/ita.js` | `c7185fc` |
| ITA 1.6 | `dist/chung/ita.js` (mã ghi `1.4`) | `634c86e` |
| ITA 1.7 | dựng từ `may/` nhánh `gd8-don-nen` | — |

| Nhóm | Năng lực | 3.26.6 | 3.31 | ITA 5.0 | ITA 1.0 | ITA 1.6 | ITA 1.7 |
|---|---|---|---|---|---|---|---|
| An toàn | Chặn ghi qua fetch và XHR | có | có | có | có | có | có |
| An toàn | Chặn form.submit() | có | có | có | có | có | có |
| An toàn | Chặn sendBeacon | có | có | có | có | có | có |
| An toàn | WebSocket bị chặn suốt lần chạy (không chỉ lúc bấm nút) | — | — | — | — | — | — |
| An toàn | Khoá tên miền được chạy (tenMienDuocChay) | có | có | có | có | có | có |
| An toàn | Danh sách tên miền cấm (tenMienCam, từ v4) | — | — | — | — | — | — |
| Khám phá | Chạy được khi không có menu trái | — | — | — | — | có | có |
| Khám phá | Lệnh Thăm dò có thật (ita.thamDo / dqtv.thamDo) | — | — | — | — | — | có |
| Kiểm | Kiểm kê trường (mở form để đọc trường) | có | có | có | có | có | có |
| Kiểm | WCAG bằng axe-core | có | — | — | có | có | có |
| Kiểm | Thử biên ô theo thuộc tính DOM | — | — | — | — | có | có |
| Kiểm | Bất biến lọc / sắp xếp / phân trang | — | — | — | — | có | có |
| Kiểm | Giả lỗi đọc dữ liệu từng màn | — | — | — | — | có | có |
| Đặc tả | Đối chiếu đặc tả quy trình | có | có | có | có | có | có |
| Đặc tả | Đọc danh mục TC ma trận v7 | có | có | có | có | có | có |
| Dự án | Hồ sơ dự án nạp được (__itaHoSo) | — | — | — | có | có | có |
| Dự án | Nạp cả thư mục dự án | có | — | — | có | có | có |
| Bền | Điểm dừng lưu ở IndexedDB khi quá lớn | có | — | — | có | có | có |
| Bền | Đo thời gian chờ theo mục menu | — | — | — | — | có | có |
| Báo cáo | Bốn chữ kết luận (Sai / Lệch chuẩn / Không thống nhất / Cần xem) | — | — | — | — | có | có |
| Vết | KHÔNG còn vết Tampermonkey / userscript | — | — | — | — | có | có |

## Chưa lập được

- **Bản 3 của PM (≈ 3.4), `kiemui-v4.js`, 3.5/3.6 (`dqtv-kiem-tra-v3.6.user.js`), dacta 3.23:** không có tệp trong repo. Roadmap ghi các tệp này ở máy người dùng; đưa vào repo (ví dụ `dist/goc/`) rồi chạy lại công cụ thì thêm được 4 cột.
- **«Ghi lại POST đã cho qua» (v4):** chưa có mẫu tìm đáng tin. `ghiQua` / `QUA_MOC` trong các bản trên chỉ dùng để phát hiện lệnh đi vòng bộ chặn, không phải tính năng này.
- **Gói chữ vi/en (v4):** không bản nào ở trên có; chưa có tệp v4 để đối chiếu cách v4 đặt tên.

## Đọc nhanh

- WebSocket ở mọi bản chỉ bị chặn **khi đang bấm nút** (`chanGhi && DANG_MO_NUT`), khớp mục «Để lại» của GĐ 7.
- `tenMienCam` (v4) chưa từng sang trục chính.
- axe, IndexedDB, Nạp thư mục vắng ở 3.31 / ITA 5.0 vì hai nhánh này mọc từ 3.26 trước khi ba phần đó được thêm (3.26.1–3.26.3).
- Lệnh Thăm dò mất từ 3.26 tới 1.6; có lại ở 1.7.
