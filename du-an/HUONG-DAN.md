# Làm gói dự án cho ITA

Mỗi dự án là một thư mục `du-an/<tên>/`. Trên trang của dự án: dán `dist/chung/ita.js` vào Console (MỘT tệp cho mọi dự án), bấm «⇪ Nạp thư mục», chọn thư mục này — chỉ lần đầu: dữ liệu lưu trong trình duyệt theo tên miền, lần sau tự đọc lại. Tool nhận từng tệp theo nội dung, tệp nào không nhận ra thì báo «không nhận ra» và bỏ qua. Từ bản 1.3, nạp thư mục cho ĐÚNG dữ liệu như bản đóng gói `dist/rieng/ita-<dự án>.js` (đọc cả TC trong `.zip`, sổ lỗi đã biết, giới hạn ô, trạng thái quy trình); bản đóng gói chỉ còn là cách tiện thêm. Gõ `ita.duLieu()` để xem loại dữ liệu nào đang có / thiếu; báo cáo có mục «Dữ liệu dự án».

| Tệp | Bắt buộc | Có thì tool chấm thêm |
|---|---|---|
| `ho-so.json` | **Có** (hoặc chế độ giao diện thuần) | — (thiếu thì tool hỏi một lần «Kiểm giao diện thuần trên <tên miền>?»: đồng ý → hồ sơ tạm khoá đúng tên miền đang mở, mọi POST bị chặn; từ chối → không chạy) |
| `quy-cach.json` | Không | cỡ chữ, bo góc, khoảng cách theo quy cách của dự án thay vì ngưỡng công cụ |
| `ho-so-mau.json` | Không | (bản 1.1) mở thẳng từng hồ sơ mẫu theo chặng — dataset của TC (mã `HSM-…`) → hồ sơ thật trên môi trường kiểm |
| `quy-trinh/`, `uc/`, `tc/` | Không | nút theo vai, bước quy trình, trường của form, kết quả theo mã TC (`tc/` nhận `.csv` hoặc `.zip` chứa `.csv`) |
| `loi-da-biet.json` | Không | bỏ qua màn đã biết là sập (thiếu: tool mở màn đó, app sập có thể làm dừng lần chạy) |
| `gioi-han-o.json`, `trang-thai-quy-trinh.json` | Không | kiểm ô theo giới hạn khai báo của app; độ phủ tài liệu × workflow. Sinh bằng script từ mã nguồn app (`cong-cu/sinh_gioi_han_o.mjs`, `cong-cu/sinh_trang_thai_qt.py`) |

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
| `mau_man_loi` | Không | (bản 1.2) biểu thức chính quy (không phân biệt hoa thường) của chữ trên MÀN SẬP riêng của app, vd DQTV `gặp lỗi và đã dừng lại\|đã dừng lại để không hiện số liệu sai`. Gộp với mẫu chung của công cụ. **Không** ghi chữ của thông báo nổi khi một thao tác lỗi (vd PMS «Đã xảy ra lỗi»): công cụ sẽ tưởng màn sập và bỏ qua màn | xem màn báo lỗi app hiện khi một màn hỏng (error boundary) |
| `kiem_phien` | Không | (bản 1.1) `{ "phuong_thuc", "duong_dan" }` lệnh chỉ đọc để kiểm phiên đăng nhập chính còn không khi gặp 401. POST thì đường dẫn phải có trong `post_cho_qua`. Không khai: tool tự xét (app về màn đăng nhập? dịch vụ khác vẫn trả về bình thường? 401 chỉ ở dịch vụ phụ?) | lệnh app gọi lúc mở trang để lấy tài khoản đang đăng nhập |
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

## ho-so-mau.json (không bắt buộc, bản 1.1)

TC ghi hồ sơ mẫu bằng mã (cột «Chuẩn bị dữ liệu», vd `HSM-2-SIGNING`). Tệp này nối mã đó với hồ sơ THẬT đã tạo sẵn trên môi trường kiểm. Hồ sơ phải có sẵn trong app: tool chỉ đọc, không tạo được.

```json
{
  "loai": "ho-so-mau",
  "ho_so": [
    { "ma": "HSM-2-SIGNING", "duong_dan": "/dqtv/outgoing-documents/<id>", "quy_trinh": "2", "chang": "SIGNING", "nhan_chang": "Chờ ký", "tai_khoan": "chỉ huy trưởng" }
  ]
}
```

Bắt buộc mỗi mục: `ma`, `duong_dan` (bắt đầu bằng `/`). `nhan_chang`: chữ chặng hiện trên giao diện — tool đặt tên màn `[hồ sơ mẫu] <mã> › «<nhãn chặng>»` để phần đối chiếu đặc tả biết hồ sơ ở chặng nào. `tai_khoan`: chỉ mở khi tên tài khoản đang chạy có chứa chữ này. Sau vòng menu, tool mở thẳng từng hồ sơ (điều hướng trong app, không tải lại trang), kiểm như hồ sơ đầu và mở form của các nút. Báo cáo có mục «Hồ sơ mẫu (dataset)»: mở được / app chuyển sang trang khác (hồ sơ không còn, sai quyền) / khác tài khoản.

## Thử gói trước khi dùng thật

Trên môi trường kiểm thử: dán `dist/chung/ita.js`, «⇪ Nạp thư mục», xem Console liệt kê tệp đã nhận và tệp «không nhận ra». Gõ `ita.cauHinh().tenMienDuocChay`: phải ra đúng tên miền trong hồ sơ.
