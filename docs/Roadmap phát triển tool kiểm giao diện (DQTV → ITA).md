# Roadmap phát triển tool kiểm giao diện (DQTV → ITA)

Nov 18, 2026 · @Trung Pham

ITA đang ở **GĐ 8 «Dọn nền»** (bản 1.7, nhánh `gd8-don-nen`); theo vòng đời phần mềm vẫn là chặng **alpha**. Mọi thay đổi theo bản ghi ở `CHANGELOG.md`. Phần A là những gì đã làm theo từng tệp, phần B là việc sắp tới, mỗi giai đoạn có cổng qua đo được.

## Tóm tắt

**Xuất phát.** Một script viết riêng cho DQTV (bản 3 của PM). Bên A dán vào Console để tự kiểm giao diện trước khi chuyển lỗi cho Bên B. Script đã chạy được nhưng còn nhiều lỗ chặn ghi, chữ và quy tắc của DQTV viết cứng trong mã, kết quả chỉ là danh sách lỗi theo từng màn.

**Quá trình phát triển (GĐ 1–7, đã xong)**

- **Làm an toàn:** vá các lỗ chặn ghi, chuyển sang luôn chỉ đọc (GĐ 2).
- **Kiểm sâu hơn:** thêm phép kiểm giao diện (GĐ 2), đối chiếu đặc tả quy trình (GĐ 3), chấm theo TC của PM (GĐ 5).
- **Kết luận có căn cứ:** đi từ danh sách lỗi → gom theo mẫu → ma trận ca kiểm → căn cứ × quan sát (GĐ 2 → 6).
- **Tách khỏi DQTV:** máy kiểm tách khỏi dữ liệu dự án, một tệp `ita.js` dùng cho nhiều dự án, chạy thêm được trên PMS (GĐ 6–7).
- **Giữ cách chạy:** từ đầu tới giờ vẫn dán vào Console, không cần Playwright hay agent.

**Đầu ra mong muốn (GĐ 8–12).** Một tool kiểm giao diện dùng chung mà designer và BA tự dùng được trên bất kỳ web app nào:

- Dán vào Console là chạy, không cài gì.
- Không làm hỏng dữ liệu thật, kể cả trên app lạ.
- Chạy được khi chưa có đặc tả và trên web tiếng Anh; có đặc tả thì kiểm sâu thêm.
- Ra một báo cáo test giao diện: mỗi kết luận có căn cứ, biết rõ số lỗi giả và bỏ sót, ảnh minh chứng không lộ dấu vết của tool.

**Các giai đoạn**

1. GĐ 1: Nhận script, bản 3 của PM (≈ 3.4)
2. GĐ 2: Vá an toàn và thêm phép kiểm giao diện (kiemui v4, 3.5, 3.6)
3. GĐ 3: Đối chiếu đặc tả quy trình (3.17 → 3.23)
4. GĐ 4: Gộp thành trục chính (3.25 → 3.26)
5. GĐ 5: Theo ma trận TC v7 của PM (3.30, 3.31; nhánh đã dừng)
6. GĐ 6: Dựng ITA dùng cho nhiều dự án (ITA 1.0 → 1.4)
7. GĐ 7: Cải thiện sau lần chạy trên PMS (gói ITA-1.6)
8. GĐ 8: Dọn nền (ITA 1.7) ← **đang ở đây**
9. GĐ 9: Kiểm chứng ITA trên app thật
10. GĐ 10: An toàn trên app lạ → ITA 2.0
11. GĐ 11: Một tool cho mọi dự án → ITA 3.0
12. GĐ 12: Mở rộng (web có AI, ca cần ghi, mobile, tên thương hiệu)

## Tầm nhìn và mục tiêu

**Tầm nhìn (đề xuất, rút từ mục tiêu anh đã nêu):** designer và BA tự kiểm giao diện của bất kỳ web app nào, không cần dev, không làm hỏng dữ liệu thật, và nhận về một báo cáo test giao diện có căn cứ.

| Mục tiêu | Đo bằng | Hiện trạng |
| --- | --- | --- |
| An toàn | Số lệnh ghi đi ra khỏi trình duyệt trong một lần chạy = 0 | Đạt trên DQTV, PMS (danh sách POST soạn tay); chưa đạt trên app lạ |
| Đúng | Không mất kết quả so với bản trước; đếm được lỗi giả và bỏ sót của ITA | Chưa đo từ bản 1.3 |
| Dùng chung | Số dự án chạy được mà không sửa mã | 2 (DQTV, PMS); chưa có web tiếng Anh |
| Tự phục vụ | Một người khác tự dựng gói dự án chỉ bằng HUONG-DAN.md | Chưa thử |
| Bảo mật | Ảnh minh chứng không lộ bảng hay dấu vết của tool | Là quy tắc, chưa có phép thử tự động |

Theo vòng đời phần mềm, ITA 1.x đang ở chặng **alpha**: kiến trúc đã chốt, nhưng chưa được người khác dùng thử trên app lạ.

## Hành trình các tệp

&#91;embedded content: hành trình các tệp · GĐ 1–7\]

Trục chính là bản 3 → 3.26 → ITA. v4, 3.6 và dacta là các nhánh đã gộp vào 3.26. Nhánh 3.30–3.31 (viền đứt) đã dừng, ITA không dùng.

## GĐ 1 — Nhận script: bản 3 của PM (≈ 3.4, trước 29/10)

Tệp `dqtv-kiem-tra-v3 (1).js` (1.824 dòng) là điểm xuất phát. Tên trong tệp là «bản 3», nhưng đúng là bản 3.4 mà 3.5 nhắc tới: mọi lỗ 3.5 nói đã vá đều còn trong tệp này. Bản 1 và 2 không có tệp.

**Làm được**

- Cách dùng giữ đến ITA: dán vào Console, bảng điều khiển góc phải, Alt+Shift+D.
- Duyệt menu trái → tab lồng → hồ sơ đầu; thử ô tìm (có dấu, không dấu, chuỗi không tồn tại) và ô chọn.
- Kiểm kê trường: mở form Thêm/Sửa, nút nghiệp vụ, bảng lọc, ô chọn tuỳ biến để đọc trường; mở hồ sơ theo trạng thái.
- Đặc tả tự khai `dacTa.quyTac`: trạng thái × vai → nút phải có / không được có. Đây là mầm của tư duy ma trận.
- Nhật ký 300 thao tác, xử lý 401/403, điểm dừng theo tài khoản, tự chạy tiếp sau khi trang tải lại.
- Báo cáo HTML / CSV / JSON và danh mục trường.

**Để lại cho giai đoạn sau**

- Lỗ chặn ghi: `choPhepPost` cho qua mọi phương thức; `form.submit()` lọt; không thấy menu thì `throw` để treo chặn ghi trên trang; so tên máy chủ bằng «chứa chuỗi»; còn chế độ mở ghi mức 2/3.
- Kết quả xếp theo màn; mức lỗi cố định theo loại (API/JS là cao, còn lại thấp).

## GĐ 2 — Vá an toàn và thêm phép kiểm giao diện: kiemui v4, 3.5, 3.6 (trước 30/10)

Nhánh này làm tốt phần «kiểm giao diện thuần» và an toàn. Theo chú thích của 3.6, thứ tự là: v4 có trước, 3.6 = 3.5 cộng các phép kiểm lấy từ v4.

**`kiemui-v4.js` — Kiểm UI 4.0** (viết lại bản 3 của PM thành công cụ dùng chung, 1.411 dòng)

- An toàn: bịt 15 lỗ chốt chặn; bỏ hẳn chế độ mở ghi; khoá tên miền (`tenMienDuocChay`, `tenMienCam`); POST tìm kiếm cho qua nhưng ghi lại; WebSocket chặn suốt lần chạy.
- Phép kiểm mới: dữ liệu nhạy cảm, chữ cắt không tooltip, chuỗi dài không ngắt, mã enum lộ, ngày/số trộn định dạng, tiêu đề lệch menu, nhiều nút chính, bộ lọc vô tác dụng.
- Toàn app: hệ thống thiết kế (cỡ chữ, màu, bo góc, đổ bóng, lệch lưới 4px, cùng nhãn khác kiểu nút) và ngôn từ (Xoá/Xóa, hoa/thường, lẫn tiếng Anh, chữ tổ hợp NFD).
- Báo cáo: gom theo mẫu lỗi kèm nguyên tắc vi phạm (Nielsen, WCAG, Jakob, Hick), một thang mức cao / trung bình / thấp, «cần xác nhận».
- Dùng lại cho dự án khác: gói ngôn ngữ vi/en, hồ sơ dự án `duAn(...)`, nút Thăm dò, tên lệnh `kiemUI.*` song song `dqtv.*`.
- Thiếu so với dòng 3.x: không kiểm kê trường, không mở form, không đặc tả.

**`dqtv-kiem-tra-v3.6.user.js` — bản 3.5 + 3.6** (Tampermonkey, 2.268 dòng)

- 3.5 vá 9 điểm của 3.4: lá chắn cài ở `document-start` nên chặn được cả lệnh app giữ sẵn; chặn `form.submit()`; `choPhepPost` chỉ áp cho POST; phát hiện lệnh đi vòng bộ chặn; so chữ đã chuẩn hoá Unicode; lỗi giữa chừng cũng gỡ móc; so tên máy chủ chính xác, khoá mở ghi không lưu; nút nghiệp vụ và tự chạy tiếp chỉ khi lá chắn có từ đầu trang; escape dữ liệu trên bảng điều khiển.
- 3.6 lấy các phép kiểm của v4, chỉ đọc và chỉ thêm trường mới, không đổi mức cũ; thêm `thamDo()`, `xuat('mau')`.
- Giữ phần v4 không có: kiểm kê trường, mở form Thêm/Sửa và nút nghiệp vụ để đọc trường, mở hồ sơ theo trạng thái, nhật ký 300 thao tác, điểm dừng theo tài khoản, xử lý 401/403, tự chạy tiếp sau tải lại.
- Còn sót: vẫn giữ chế độ mở ghi mức 2/3 (v4 đã bỏ); POST tới `/search`, `/query`, `extend`, `renew` vẫn được qua.

## GĐ 3 — Đối chiếu đặc tả quy trình: 3.17 → 3.23 (tới 29/10)

Tệp `dqtv-kiem-tra-dacta.js` (đóng gói 29/10, 113 bảng đặc tả). `dqtv-kiem-tra-dacta (5).js` giống hệt tệp này, cùng mã băm. Nhánh này chạy song song với GĐ 2.

**Làm được**

- 3.17–3.19: nạp bảng đặc tả (chuỗi khép kín, bảng khung, 103 bảng chuyển từ tài liệu Bên B); tệp đóng gói thay cả bộ đặc tả cũ.
- 3.20: chạy bộ TC chuẩn ngay trong lần chạy, gồm ca nhập ô (gõ giá trị, rời ô, đọc ô nhận hay báo lỗi).
- Ma trận ca kiểm: đúng vai (DUNG), sai vai (SAI\_VAI), sai trạng thái, nhập ô (NHAP); ca SAI\_VAI chỉ tính ĐẠT khi đã mở được màn.
- 3.21–3.23: nhận vai cả khi cửa sổ hẹp; mở hồ sơ theo từng trạng thái; bước có điều kiện mà không thấy nút thì ghi CHƯA KIỂM, không kết luận sai.
- Có khoá tên miền `dqtv.linksafe.vn` và che dữ liệu nhạy cảm.

**Để lại:** chưa có các vá an toàn của 3.5/3.6 (lá chắn từ đầu trang, chặn `form.submit()`, `choPhepPost` chỉ áp cho POST).

## GĐ 4 — Gộp thành trục chính: 3.25 → 3.26 (30/10)

Tệp `dqtv-kiem-tra-dacta-3.26.js` (118 bảng đặc tả). 3.25 gộp 3.23 với 3.6, tức GĐ 2 và GĐ 3. Bản 3.26 là nền của mọi bản về sau, kể cả ITA.

**Làm được**

- 3.25: mỗi kết quả chưa ĐẠT có nhóm nguyên nhân (ỨNG DỤNG / QUY TRÌNH / TC / THIẾU / CÔNG CỤ / THỦ CÔNG) và việc tiếp theo.
- 3.25: không chấm ĐẠT khi vắng bằng chứng; phủ danh mục TC của PM; dừng giữa chừng vẫn tải báo cáo phần đã chạy.
- 3.26: đặc tả sinh từ tài liệu quy trình Bên B (109 quy trình); bước hệ thống tự làm thì kiểm không vai nào thấy nút.
- 3.26: không mở trước màn đã biết là sập; báo cáo ghi lý do dừng và các mục menu chưa chạy.

**Để lại**

- Nút Thăm dò mất lúc gộp (bảng điều khiển vẫn gọi `thamDo()` nhưng lệnh không còn).
- Lệnh ghi `extend`, `renew` vẫn lọt chặn.
- TC do tool tự sinh (22.623 TC) không được PM dùng.

## GĐ 5 — Theo ma trận TC v7 của PM: 3.30, 3.31 (02–04/11, nhánh đã dừng)

Tệp `dqtv-kiem-tra-dacta-3.30.js` và `dqtv-kiem-tra-3.31.zip`. Nhánh này mọc từ 3.26. ITA không dùng nhánh này, và PLAN của ITA không ghi lý do.

**Làm được**

- 3.30 (02/11): danh mục TC đổi sang ma trận v7 của PM (44.124 TC); chỉ cho đi POST `/api/session` và `/api/search`, chặn được `extend-age` mà 3.26 để lọt; kiểm thiết kế theo token dự án.
- 3.31 (03–04/11): cắt thành bộ máy `may/` và gói `goi-du-an/dqtv`; luôn chỉ đọc; chấm theo ánh xạ kết quả của PM; hàm chấm thuần với test 36/36 và 8/8.

**Để lại:** chưa chạy trên site thật (Việc 6 của 3.31); nút Thăm dò vẫn hỏng.

## GĐ 6 — Dựng ITA dùng cho nhiều dự án: ITA 1.0 → 1.4 (03–11/11)

Repo `ibiann/ITA`, nhánh `dev`, dựng lại từ 3.26 (GĐ 4). Tổ chức thành bộ máy `may/`, bộ đọc tệp `bo-doc/` và gói dự án `du-an/<tên>`.

| Ngày | Bản | Việc chính |
| --- | --- | --- |
| 05/11 | 3.26.1 | Tách mã 3.26 vào `may/` (ghép lại đúng từng byte); chữ riêng DQTV sang `ho-so.json`; chỉ cho POST đăng nhập và tìm; quy tắc căn cứ; nút Nạp + `bo-doc/` |
| 05/11 | 3.26.1 | Quy trình → UC → TC v7 → giao diện; kiểm ô theo giới hạn khai báo của app; trạng thái quy trình tài liệu × app |
| 06/11 | 3.26.2 → 3.26.6 | Điểm dừng IndexedDB; tìm nút theo mã bước; đọc danh sách bước máy chủ trả về; mắt xích nguyên nhân; axe WCAG 2.2; 3.26.6 dùng nghiệm thu DQTV |
| 07/11 | ITA 1.0 | Đổi `dqtv.*` → `ita.*`; hồ sơ dự án nạp được; kiểu app `rest-buoc` (DQTV) và `openslides` (PMS) |
| 10/11 | 1.1 → 1.3 | 401 theo dịch vụ, mất phiên thì dừng hẳn; kiểm giao diện thuần khi chưa có hồ sơ; khoá an toàn không đặt lại được; một tệp `ita.js` + Nạp thư mục |
| 11/11 | 1.4 | Chạy được khi không có menu trái; thử biên ô theo DOM; bất biến sắp xếp / phân trang; ô chọn tuỳ biến |

Tư duy kết luận nâng lên bậc **căn cứ × quan sát**: mỗi kết luận phải có căn cứ và quan sát, kèm mắt xích nguyên nhân 0–5.

**Để lại:** từ bản 1.3 chưa chạy lại trên DQTV và PMS thật; một số test cần Chrome hoặc bản 3.26 gốc nên chưa chạy được trên máy sạch.

## GĐ 7 — Cải thiện sau lần chạy trên PMS: gói ITA-1.6 (13–17/11)

Gói `ITA-1_6.zip`, commit cuối `634c86e` ngày 17/11. Tên gói 1.6 theo đợt gộp «dqtv-script (only)» 1.6 ngày 12/11, nhưng mã vẫn ghi `PHIEN_BAN = '1.4'`.

**Làm được**

- Trang «Rào cản khi đem ITA sang dự án mới» (16/11): 6 rào cản, xếp mức và cỡ việc.
- Bỏ Tampermonkey; đo thời gian theo từng mục menu (chờ trang yên, axe).
- An toàn khi bấm: không bao giờ bấm «đặt lại / reset»; chế độ giao diện thuần không bấm nút nghiệp vụ.
- Báo cáo liệt kê đủ mọi màn có lỗi; chỉ dùng bốn chữ kết luận Sai / Lệch chuẩn / Không thống nhất / Cần xem.
- Giả lỗi đọc dữ liệu để xem màn có báo lỗi không; bỏ tên DQTV, PMS khỏi mã dùng chung.

**Để lại**

- Rào cản 1 (bấm nút lạ, POST trên app lạ) mới gỡ một phần; WebSocket chỉ bị chặn khi đang mở form.
- Nút Thăm dò vẫn hỏng; số bản lệch giữa mã và gói. *(Đã sửa ở GĐ 8, bản 1.7.)*
- Ba thứ của v4 chưa bao giờ sang trục chính: gói chữ vi/en, `tenMienCam`, ghi lại POST đã cho qua.

## GĐ 8 — Dọn nền: ITA 1.7 (18/11, đang làm)

Nhánh `gd8-don-nen`, **chưa commit**, chưa gộp vào `dev`. Không thêm phép kiểm mới (quy tắc 4) — chỉ sửa lỗi và dọn test. Chi tiết: `CHANGELOG.md` mục [1.7].

**Làm được**

- **Số bản:** mã, gói và CHANGELOG cùng ghi **1.7**. Bỏ qua 1.5 và 1.6 trong mã vì hai số này đã dùng cho gói «dqtv-script (only)» ngày 12/11. Một CHANGELOG duy nhất ở gốc repo.
- **Ma trận năng lực** (`docs/ma-tran-nang-luc.md`, sinh bằng `cong-cu/ma_tran_nang_luc.py`): 21 năng lực × 6 bản dựng có tệp (3.26.6, 3.31, ITA 5.0, ITA 1.0, ITA 1.6, ITA 1.7). Mỗi ô là một mẫu tìm trong mã, ai cũng chạy lại được.
- **Thăm dò:** `ita.thamDo()` và nút «🔍 Thăm dò» chạy lại được (mất từ 3.26). Không có tệp 3.6 nên không chép nguyên văn; lệnh gọi đúng chế độ thăm dò sẵn có trong lõi. Có test riêng `kiem/test_tham_do.py`.
- **Sửa lỗi lõi: app định tuyến bằng `#`** (`#/a`). Từ bản 1.1 ITA bỏ phần `#` ở hai chỗ: (1) khoá so trùng mục menu → chỉ kiểm mục đầu; (2) tuyến của màn → một màn sập kéo theo các mục sau bị bỏ, báo cáo ghi tuyến sai. Đã sửa cả hai; test bước 11 kiểm đủ 3/3 màn, test mới `test_dinh_tuyen_hash.py`.
- **Sửa lỗi lõi: chạy chậm trên app có luồng phản hồi** (SSE, autoupdate, long-poll). ITA chờ đọc xong thân mọi phản hồi, luồng không bao giờ xong nên mọi lần chờ trang yên kéo tới `waitMax` 10 giây. Nay không chờ luồng, đọc thân có hạn; test mới `test_luong_khong_dung.py`: từ hết hạn 3/3 lần xuống ~1,3 giây mỗi màn. Đây là sửa lỗi; việc đo và xếp mức rào cản Tốc độ vẫn ở GĐ 9.
- **Sửa lỗi lõi: thân phản hồi đã bị app đọc trước** (thấy trên PMS 18/11, lỗi đỏ `clone … Response body is already used`). ITA cộng bộ đếm chờ rồi mới gặp lỗi nên không bao giờ trừ → mọi lần chờ kéo tới 10 giây. Nay bỏ qua phản hồi đó, không lộ lỗi ra Console.
- **Cài jsdom:** `package.json` (chỉ cho test) + `npm install`; kịch bản test 14, 17 ưu tiên `node_modules` của repo.
- **Trả nợ test:** 12 tệp test viết trước GĐ 7 được cập nhật theo các thay đổi cố ý của GĐ 6–7 (khoá tên miền theo hồ sơ, bốn chữ kết luận, «TC của dự án», logo trong menu, giao diện thuần). Mỗi chỗ ghi `[GĐ 8]` trỏ về commit gây đổi. Hàm chung `kiem/ban_thu.py` đổi tên miền của bản thử sang `127.0.0.1`.
- **Chặn ghi đè dữ liệu dự án:** `cong-cu/sinh_trang_thai_qt.py` (test 9 gọi) khi thiếu mã nguồn app vẫn sinh tệp thiếu nguồn và ghi đè `du-an/dqtv/trang-thai-quy-trinh.json`. Nay dừng, không ghi gì.

**Kết quả bộ test trên nhánh (18/11, lần chạy cả bộ thứ hai)**

| | Mã gốc `cb4efef` (đầu `dev`) | Nhánh `gd8-don-nen` |
| --- | --- | --- |
| Số test | 21 | 24 (thêm `test_tham_do`, `test_dinh_tuyen_hash`, `test_luong_khong_dung`) |
| Đạt | 11 | **21** |
| Trượt vì kỳ vọng cũ | 7: test 5, 6, 10, 11, 13, `test_buoc14.sh`, `test_buoc17.sh` | 0 |
| Chưa chạy được trên máy sạch | 3 | 3: `test_buoc8`, `test_buoc9` (cần mã nguồn `dqtv-app`), `test_dong_goi` (cần 3.26 gốc) |

Lần chạy cả bộ đầu tiên trên nhánh, `test_buoc16` trượt vì `test_buoc9` vừa ghi đè `trang-thai-quy-trinh.json`; sau khi chặn ghi đè, lần chạy cả bộ thứ hai `test_buoc16` đạt. Hai test mới đều trượt trên lõi gốc `cb4efef` (đối chứng).

**Còn lại để đóng GĐ 8**

- Đưa 3.26 gốc (`dqtv-kiem-tra-dacta-3.26.js`, không phải 3.26.6) vào `dist/goc/` → chạy `test_dong_goi`, tính lại `SO_B14` … `SO_B17`. Tệp không có trong repo lẫn lịch sử git.
- Ghi lý do bỏ 3.23, 3.30, 3.31, 3.31.1, ITA 5.0: `PLAN.md` chỉ ghi «Không dùng», không ghi vì sao (quy tắc 5). Cần người quyết định ghi.
- Ma trận năng lực còn thiếu 4 cột: bản 3, v4, 3.6, dacta 3.23 (không có tệp).
- Test 8, 9 cần mã nguồn `dqtv-app` (`~/dqtv/dqtv-app`) để sinh giới hạn ô và trạng thái quy trình; máy sạch không có.
- Gộp `gd8-don-nen` vào `dev` sau khi duyệt (quy tắc 1).

## Sắp tới: GĐ 8–12

&#91;embedded content: roadmap sắp tới · 5 giai đoạn, 4 cổng\]

Ô tô đậm là GĐ 9: kiểm chứng ITA đứng trước mọi tính năng mới, vì từ bản 1.3 ITA chưa được chạy trên app thật. DQTV và PMS chỉ là nơi thử vì đã có hồ sơ; roadmap không đi vào nghiệp vụ của hai dự án này. Cột «Để lại» của GĐ 1–7 là nguồn của các việc dưới đây.

| GĐ | Việc chính | Căn cứ |
| --- | --- | --- |
| 8 · Now | Thống nhất số bản + CHANGELOG; ma trận năng lực 8 bản; sửa `ita.thamDo` (chép từ 3.6); đưa 3.26 gốc vào repo, trả nợ `SO_B14` / `SO_B17`, cài jsdom; ghi lý do bỏ 3.30, 3.31, ITA 5.0 | Mã ITA; PLAN bước 16–17 |
| 9 · Now | Kiểm chứng ITA, không phải test dự án: chạy `ita.js` + Nạp thư mục trên hai app đã có hồ sơ (DQTV, PMS) làm nơi thử; so với kết quả của bản trước bằng `so_truoc_sau.py`; đếm lỗi giả và bỏ sót của ITA; xếp mức rào cản Tốc độ từ số đo bước 19 | PLAN ghi «chưa chạy trên site thật» |
| 10 · Next | Bấm nút theo danh sách cho phép khi chưa có đặc tả; lượt dò POST; lấy lại từ v4: chặn WebSocket cả lần chạy, `tenMienCam`, ghi POST đã cho qua; tự kiểm lá chắn (CT-02) | Rào cản 1; `kiemui-v4.js`; backlog v7 |
| 11 · Next | Gói chữ vi/en; kiểm lõi sạch chữ DQTV; nhận thanh đầu trang theo vị trí; token CSS chỉ kết luận «Không thống nhất»; bộ đọc UC/TC chung (13f); kiểu app theo dự án | Rào cản 2–5; PLAN 13f |
| 12 · Later | Web có AI (khu AI không bấm); ca cần ghi, nhiều tài khoản, hiệu năng (cần cổng mở ghi); mobile Flutter: tìm hiểu trước vì không có DOM; tên thương hiệu | PLAN 17/11; backlog v7 CT-09–15 |

## Cách làm xuyên suốt

Tool đã có tư duy ma trận trong cách kết luận, nhưng việc phát triển tool thì chưa có ma trận để theo dõi chính nó. Vì vậy các tính năng của v4 rơi mất khi gộp nhánh. Năm quy tắc dưới đây để không lặp lại chuyện đó.

1. **Một trục phát triển:** chỉ nhánh `dev`; nhánh tính năng ngắn, gộp xong thì xoá. Không mở bản song song như v4, 3.6 và dacta đã từng chạy cùng lúc.
2. **Ma trận năng lực:** mỗi dòng một năng lực, mỗi cột một bản. Soát lại mỗi lần gộp hoặc nâng bản.
3. **Số bản theo SemVer:** số chính chỉ tăng khi qua cổng (2.0 = an toàn trên app lạ, 3.0 = dùng cho mọi dự án); số phụ cho từng bước; một CHANGELOG duy nhất.
4. **Qua cổng mới sang giai đoạn sau:** không thêm tính năng mới khi giai đoạn trước chưa chạy thật.
5. **Ghi lý do cho mọi quyết định lớn:** chọn nền nào, bỏ bản nào, vì sao.

**Không làm:** Tampermonkey; bản Playwright/Node cho web; biến Laws of UX thành lỗi trong báo cáo.
