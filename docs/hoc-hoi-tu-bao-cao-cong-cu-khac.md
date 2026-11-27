# Học hỏi từ báo cáo của một công cụ kiểm khác

Ghi ngày 27/11/2026. Nguồn: một báo cáo HTML do công cụ kiểm giao diện khác (bản 1.23.0, chạy 25/11/2026) sinh ra cho một hệ thống quản trị, gồm 38 màn và 126 mục lỗi. Ở đây chỉ ghi điều ITA rút ra, không chép dữ liệu của hệ thống đó.

Nhận xét chung: báo cáo đó trả ra rất nhiều mục nhưng không chỉ ra được vấn đề chính. Có 126 mục, nhưng gom lại chỉ còn khoảng 5 việc phải làm. ITA cũng có nguy cơ tương tự, nhất là khi chạy trên dự án chưa có hồ sơ: mọi luật rơi về «tự đặt», nên báo cáo đầy dòng «Cần xem».

## Bài học 1 — Đầu báo cáo phải là danh sách việc cần sửa

- **Báo cáo kia:** bảng từng màn, gói lỗi, nhóm phân loại, ma trận, kiểm kê trường đều nằm ngang hàng nhau. Người đọc phải tự gom.
- **ITA:** đã làm ở bản sau 1.8, trong `may/60-bao-cao.js`, chưa đóng gói và chưa chạy thử.
  - Khối «Việc cần sửa» ở đầu trang, tối đa 10 dòng, chỉ gồm «Sai» và «Lệch chuẩn», xếp theo mức rồi số màn.
  - Tên lỗi đọc được (`TEN_LOI`) thay cho mã nội bộ.
  - «Cần xem», «Không thống nhất» và thống kê thiết kế khi chưa có quy cách đều gập dưới mục «Gợi ý cần xem — không tính là lỗi».
  - Màn đã kiểm, nút bỏ qua và danh mục trường gập vào «Phụ lục».

## Bài học 2 — Một lỗi thành phần là một việc, không phải N dòng

- **Báo cáo kia:** «hộp thoại không có nút đóng» lặp theo từng form và từng tab, khoảng 26 dòng, dù chỉ cần sửa một thành phần hộp thoại chung. Nhiều dòng dùng chung một mã lỗi nhưng vẫn bị đếm riêng.
- **ITA:** giữ cách gom `mau_loi` (mẫu × số màn). Con số đưa lên đầu báo cáo là **số mẫu lỗi**, không phải số dòng.

## Bài học 3 — Tách lỗi theo người sửa

- **Báo cáo kia:** 60 trên 126 mục là «API thiếu `no-store`», tức tiêu đề HTTP. Lỗi này nằm chung danh sách với lỗi giao diện, làm loãng phần giao diện.
- **ITA:** lỗi giao diện (nhìn thấy trên màn) để riêng. Lỗi máy chủ, bảo mật và hiệu năng đi khối riêng, ghi rõ «gửi dev / Bên B».

## Bài học 4 — Mỗi dòng phải chỉ được đúng chỗ

- **Báo cáo kia:** dòng «9 nút không có tên» liệt kê lớp CSS (`peer h-4 w-4 shrink-0 rounded-sm border`). Đó là dáng hộp tích chọn, không phải nút. Người đọc không biết nút nào.
- **ITA:** chỉ ra thành phần bằng nhãn gần nhất, vùng hoặc form chứa nó, và vai trò (nút, ô tích, liên kết). Không dùng lớp CSS làm tên.

## Bài học 5 — Xếp đúng nhóm

- **Báo cáo kia:** lỗi hộp thoại bị xếp vào «Lỗi khác của ô nhập».
- **ITA:** mỗi phép kiểm có một nhóm cố định theo thành phần (hộp thoại, ô nhập, bảng, bố cục…). Không để nhóm «khác» nuốt lỗi.

## Bài học 6 — Mức tổng phải khớp lỗi thật

- **Báo cáo kia:** tóm tắt ghi rủi ro «LOW», 0 lỗi cao. Cùng báo cáo lại có 5 lỗi bảo mật (thiếu CSP, token đọc được bằng JavaScript) nằm ở mục riêng, không tính vào tổng.
- **ITA:** mọi khối có kết luận «Sai» đều phải vào phần đếm đầu báo cáo. Không để khối phụ có lỗi mà phần tóm tắt nói «không có lỗi».

## Bài học 7 — Có cách lọc báo cáo ra phần cần

- **Báo cáo kia:** phải viết công cụ ngoài để lọc «lỗi gì ở màn nào».
- **ITA (đề xuất, chưa làm):** thêm cách xuất «lỗi theo màn». Gộp tab con vào màn gốc, ô trùng ở nhiều tab ghi một lần kèm tên tab. ITA đã có `ita.xuat(...)` và CSV mẫu lỗi (`sangCSVMau`), nên nên thêm vào đó, không làm công cụ mới.

## Bài học 8 — Đủ dữ liệu, nhưng màn đọc phải gọn (áp cho cả bản chung và bản riêng)

- **Báo cáo kia:** bảng danh mục 451 trường in hết ra trang, trộn dòng có lỗi với dòng chỉ là thông tin như «đang hiện» hay «cột có sẵn nhưng đang ẩn» (89 dòng). Phải đủ, nhưng đọc thì như rác.
- **Nguyên tắc ITA:** **đủ ở dữ liệu xuất, gọn ở trang đọc.**
  - `ita.xuat()` (JSON) và CSV giữ đủ mọi trường, mọi dòng, không cắt.
  - Trang HTML chỉ mở sẵn phần phải hành động: «Việc cần sửa», mẫu lỗi «Sai» / «Lệch chuẩn», lỗi theo màn, **trường có lỗi**.
  - Dòng chỉ mang thông tin (đang hiện, đang ẩn, đang trống, số lựa chọn…) không bao giờ lẫn vào bảng lỗi. Chúng nằm ở danh mục đầy đủ, gập trong Phụ lục.
  - Một chữ «lỗi» chỉ dùng cho dòng có kết luận. Ghi chú thì gọi là ghi chú.
- **Áp cho cả hai bản:** bản chung (`dist/chung/ita.js`) và bản riêng (`dist/rieng/ita-<dự án>.js`) đều đóng gói từ cùng `may/`, nên chỉ sửa một chỗ ở `may/60-bao-cao.js`. Không sửa riêng từng bản.
- **ITA:** đã làm trong `may/60-bao-cao.js`, chưa đóng gói. Bảng «Trường có lỗi» chỉ gồm trường có lỗi và mở sẵn. «Danh mục trường đầy đủ» gập ở Phụ lục.

## Phép kiểm báo cáo kia có, ITA chưa có (đề xuất, chưa làm)

Nếu thêm, mặc định để «Cần xem» cho tới khi có căn cứ: TC của dự án hoặc điều khoản WCAG.

| Phép kiểm | Căn cứ có thể dùng | Ghi chú |
|---|---|---|
| Hộp thoại thiếu nút đóng nhìn thấy | WCAG 2.1.2 (không bẫy bàn phím) chỉ khi Esc cũng không đóng được | Dễ báo nhầm: nút ✕ chỉ có biểu tượng, hoặc Esc / bấm ra ngoài vẫn đóng được. Phải thử Esc trước khi kết luận |
| Hộp thoại thiếu tiêu đề | WCAG 4.1.2 (`role=dialog` cần tên) | axe có thể đã bắt một phần, cần kiểm trùng |
| Cột bảng không tiêu đề | WCAG 1.3.1 | Cột ô tích chọn hoặc cột thao tác vẫn cần tên ẩn |
| Ô chọn mở ra không có lựa chọn | Sự việc, nếu ô không phụ thuộc ô khác | Ghi «Cần xem» khi ô có thể phụ thuộc ô trước |
| API bị gọi trùng trong một lần mở màn | Tự đặt | Chỉ ghi nhận, khối hiệu năng |
| Tiêu đề bảo mật HTTP (CSP, HttpOnly…) | Chuẩn công khai (OWASP) | Ngoài phạm vi giao diện. Nếu làm thì khối riêng, gửi dev |

## Không học theo

- Đẩy mọi mục vào «chờ xác nhận» (126/126 `needs-review`). Báo cáo không phân biệt được lỗi chắc với lỗi đoán. ITA giữ chữ kết luận theo căn cứ.
- Trộn lỗi hạ tầng vào danh sách lỗi giao diện.
- Đếm mục theo từng form hay từng tab rồi đưa con số đó lên tóm tắt.
