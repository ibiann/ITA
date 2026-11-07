# Làm gói dự án cho ITA

Mỗi dự án là một thư mục `du-an/<tên>/`. Trên trang của dự án: dán `dist/ita.js` vào Console, bấm «⇪ Nạp thư mục», chọn thư mục này. Tool nhận từng tệp theo nội dung, tệp nào không nhận ra thì báo «không nhận ra» và bỏ qua.

| Tệp | Bắt buộc | Có thì tool chấm thêm |
|---|---|---|
| `ho-so.json` | **Có** | — (thiếu thì tool không chạy, để khỏi dán nhầm lên hệ thống thật) |
| `quy-cach.json` | Không | cỡ chữ, bo góc, khoảng cách theo quy cách của dự án thay vì ngưỡng công cụ |
| `quy-trinh/`, `uc/`, `tc/` | Không | nút theo vai, bước quy trình, trường của form, kết quả theo mã TC |

Không có quy trình / UC / TC thì tool vẫn kiểm: màn sập, lỗi máy chủ, lỗi trang, lộ dữ liệu, trợ năng WCAG. Phần cần tài liệu ghi «Chưa kiểm» kèm lý do.

## ho-so.json

Mẫu tối thiểu (chép ra rồi sửa):

```json
{
  "ten": "Tên dự án",
  "ten_mien": "test.du-an.vn",
  "post_cho_qua": [],
  "_nguon": { "ten_mien": "…", "post_cho_qua": "…" }
}
```

| Trường | Bắt buộc | Ghi gì | Tìm ở đâu |
|---|---|---|---|
| `ten` | Có | tên dự án, hiện trên báo cáo | — |
| `ten_mien` | Có | đúng tên máy của **môi trường kiểm thử**, không có `https://`, không có đường dẫn | thanh địa chỉ |
| `post_cho_qua` | Có | đường dẫn các lệnh POST **chỉ đọc**: đăng nhập, giữ phiên, tìm, đọc dữ liệu. Ghi đường dẫn, không ghi `?…`, không có `/` ở cuối. Để `[]` thì mọi POST bị chặn khi chạy | xem mục dưới |
| `kieu_app` | Không | `rest-buoc`: máy chủ trả danh sách bước `{action, label, allowed}` trong phản hồi GET (DQTV). `openslides`: app dựng trên OpenSlides (PMS). Không thuộc kiểu nào: bỏ trống | hỏi người làm app, hoặc xem phản hồi trong tab Network |
| `chon_tai_khoan` | Không | bộ chọn CSS của chỗ hiện tên tài khoản đang đăng nhập. Không ghi thì tool đoán theo khối chữ ở góc phải trên, dễ dính cả số thông báo | DevTools: chuột phải vào tên tài khoản → Inspect. Chọn thẻ / thuộc tính ổn định (vd `os-account-button span[title]`), tránh tên lớp sinh tự động |
| `goc_duong_dan` | Không | phần đầu đường dẫn chung của app, tool bỏ đi khi đặt tên màn (vd `/dqtv`) | thanh địa chỉ |
| `man_viec_chung` | Không | `{ "nhan", "duong_dan" }` của màn mọi vai đều thấy (vd «Việc của tôi»), để không tính là màn của một quy trình | menu của app |
| `tien_to_tai_khoan` | Không | biểu thức chính quy của phần chữ vai đứng đầu tên tài khoản cần bỏ (vd `^[A-ZĐ]{2,3} (?=\S)`) | tên tài khoản trên đầu trang |
| `tai_khoan` | Không | `[{ "dang_nhap", "ten_hien", "vai", "nhom_app" }]` tài khoản kiểm thử và vai theo tài liệu. **Không ghi mật khẩu** | người quản trị môi trường kiểm thử |
| `_nguon` | Nên có | mỗi trường lấy từ đâu (tệp + dòng trong mã app, tài liệu, người cung cấp). Báo cáo dựa vào đây khi ghi căn cứ | — |

### Cách lập `post_cho_qua` — phần an toàn, làm kỹ

1. Đăng nhập môi trường kiểm thử, mở DevTools → Network, lọc phương thức POST.
2. Chỉ **xem**: mở menu, mở danh sách, mở hồ sơ, gõ ô tìm. Không bấm Lưu, Duyệt, Xoá.
3. Mỗi POST hiện ra là ứng viên. Với từng đường dẫn, xác nhận trong mã máy chủ hoặc với người làm app rằng nó **không ghi dữ liệu**. Ghi chỗ xác nhận vào `_nguon.post_cho_qua`.
4. Không chắc thì **không đưa vào**. Lệnh bị chặn thì màn đó có thể báo lỗi, báo cáo ghi «chặn ghi», không tính là lỗi app. Đưa nhầm lệnh ghi vào thì tool có thể làm thay đổi dữ liệu thật.
5. Một đường dẫn dùng chung cho cả đọc lẫn ghi (phân biệt bằng nội dung gửi) thì không đưa vào.

Ví dụ đã làm: `du-an/dqtv/ho-so.json` (kiểu `rest-buoc`), `du-an/pms/ho-so.json` (kiểu `openslides`).

## quy-cach.json (không bắt buộc)

```json
{
  "loai": "quy-cach-giao-dien",
  "nguon": "tài liệu quy cách của dự án, mục …",
  "chuanDS": { "luoi": 4 },
  "co_chu_px": [12, 14, 16, 20],
  "bo_goc_px": [4, 8, 9999]
}
```

`loai` phải đúng `quy-cach-giao-dien` để tool nhận ra. `luoi`: khoảng cách phải là bội của số px này. `co_chu_px`, `bo_goc_px`: các giá trị được phép (9999 = bo tròn hẳn); giá trị khác hiện trong báo cáo ở mục «Lệch quy cách dự án». Chỉ ghi số có trong tài liệu quy cách của dự án, không tự đặt. Ví dụ: `du-an/pms/quy-cach.json`.

## Thử gói trước khi dùng thật

Trên môi trường kiểm thử: dán `dist/ita.js`, «⇪ Nạp thư mục», xem Console liệt kê tệp đã nhận và tệp «không nhận ra». Gõ `ita.cauHinh().tenMienDuocChay`: phải ra đúng tên miền trong hồ sơ.
