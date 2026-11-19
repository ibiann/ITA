# CHANGELOG — ITA

Một tệp duy nhất ghi mọi bản của ITA. Số bản theo quy tắc trong `docs/Roadmap…md` («Cách làm xuyên suốt», mục 3):
số chính chỉ tăng khi qua cổng (2.0 = an toàn trên app lạ, 3.0 = dùng cho mọi dự án); số phụ cho từng bước.
Số bản trong mã (`PHIEN_BAN`, `may/20-cau-hinh.js`), số trong CHANGELOG và số trên gói phát hành phải là **một**.
Chi tiết từng bước: `PLAN.md`. Lịch sử trước ITA (bản 3 của PM → 3.26.6): roadmap, GĐ 1–5.

## [1.7] — 18/11/2026 · GĐ 8 «Dọn nền» · commit `0743b07` trên `dev`

Không thêm phép kiểm mới (roadmap quy tắc 4: chưa qua cổng thì không thêm tính năng). Chỉ sửa lỗi và dọn test.

**Số bản**
- Thống nhất số bản: mã, gói và CHANGELOG cùng ghi **1.7**. Trước đó gói GĐ 7 tên «1.6» nhưng mã vẫn ghi `1.4`.
- Bỏ qua 1.5 và 1.6 trong mã vì hai số này đã là số của gói chỉ cho DQTV («dqtv-script (only)» 1.5, 1.6, ngày 12/11); dùng lại sẽ trùng.

**Sửa**
- `ita.thamDo()` / nút «🔍 Thăm dò» chạy lại được. Lệnh mất từ bản 3.26: nút và chế độ thăm dò trong lõi (`itaAudit({ __thamDo })`) vẫn còn, chỉ thiếu lệnh `ita.thamDo`, nên bấm nút báo lỗi. Không có tệp 3.6 để chép nguyên văn; lệnh mới viết theo khuôn `ita.quetManNay` và gọi đúng chế độ thăm dò sẵn có trong lõi.
- App định tuyến bằng dấu `#` (`#/a`, `#!/a`): ITA chỉ kiểm **mục menu đầu tiên**, các mục sau bị bỏ với lý do «mục menu cùng đường dẫn». Lỗi có từ bản 1.1 (bước 14): khoá so trùng của mục menu chỉ lấy `pathname + search`, bỏ phần `#`, nên mọi mục menu của app dùng `#` trùng khoá nhau. Nay phần `#` bắt đầu bằng `/` hoặc `!/` được tính là đường dẫn (`may/30-loi-kiem.js`, `khMenu`). Tìm ra nhờ trả nợ test bước 11 (trang thử dùng `#/mau`, `#/mau-2`, `#/mau-3`): trước khi sửa chỉ kiểm 1/3 màn, sau khi sửa đủ 3/3.
- App định tuyến bằng `#`, phần thứ hai: tuyến của màn (`chuanTuyen`) cũng bỏ phần `#`, nên mọi màn chung một tuyến «/trang». Hệ quả: một màn sập thì các mục menu sau có link dạng `/trang#/x` bị bỏ như «màn sập», và báo cáo ghi tuyến của màn sập sai (`/thu.html` thay vì `/thu.html#/b`). Nay tuyến giữ phần `#/…` / `#!/…`; link chỉ có phần `#/x` được gắn vào trang hiện tại; `#` trơn và neo `#muc` giữ như cũ. Test mới `kiem/test_dinh_tuyen_hash.py` (mã gốc trượt).
- **Chạy chậm trên app có luồng phản hồi** (SSE, autoupdate, long-poll…): ITA đọc thân mọi phản hồi fetch và chờ đọc xong, luồng không bao giờ xong nên **mọi** lần «chờ trang yên» kéo tới `waitMax` (10 giây). Nay:
  - phản hồi kiểu luồng (`text/event-stream`, `ndjson`, `jsonl`, `json-seq`, `multipart/x-mixed-replace`) — fetch: không đọc thân, không chờ; XHR: thôi chờ ngay khi nhận đầu phản hồi;
  - phản hồi kiểu khác: vẫn đọc thân, nhưng thôi chờ khi ngừng nhận byte 1,5 giây hoặc quá 4 giây (huỷ bản sao ITA đọc; app vẫn nhận phản hồi gốc nguyên vẹn);
  - mỗi dịch vụ có luồng ghi một dòng «luồng không chờ» trong nhật ký.
  Test mới `kiem/test_luong_khong_dung.py` (luồng fetch giả + luồng XHR thật qua máy chủ thử): mã gốc 3/3 lần chờ hết hạn (6 giây mỗi lần); mã mới không lần nào, ~1,3 giây mỗi màn.
- **Lỗi đỏ «Failed to execute 'clone' on 'Response': Response body is already used» trên PMS** (video 18/11, bản 1.7 đầu tiên, dòng 738): khi app đã đọc / đang giữ thân phản hồi trước khi tới lượt ITA, `r.clone()` ném lỗi. Lỗi có từ trước (bản cũ cũng gọi `r.clone()` sau khi đã cộng `pendingJson`), hệ quả kép: lỗi đỏ lộ ra Console của app, và `pendingJson` cộng mà không bao giờ trừ → **mọi** lần chờ trang yên sau đó kéo tới `waitMax` 10 giây (bảng ITA đứng lâu ở «1/13 Trang chủ»). Nay: thân đã đọc hoặc không clone được thì ITA bỏ qua phản hồi đó, không đếm vào bộ chờ, ghi một dòng nhật ký «không chờ phản hồi». Thêm hai ca vào `test_luong_khong_dung.py` (thân đã đọc, thân đang bị giữ): bản 1.7 vừa gửi hết hạn 3/3 lần chờ, bản sửa không lần nào và không lỗi `clone` nào lộ ra. Chưa xác định vì sao PMS trả thân đã đọc (lớp bọc fetch của app hay zone.js) — ITA nay chịu được cả hai.

**Test**
- Thêm `kiem/test_tham_do.py` (Chrome): lệnh tồn tại, nhận đúng menu / vùng chính / bảng / ô tìm, không bấm, không đổi đường dẫn, không gửi lệnh mạng. Đối chứng: mã 1.6 (`634c86e`) trượt («ita.thamDo không phải là hàm»).
- Thêm `package.json` (chỉ cho test: `jsdom` 24.1.3, `fake-indexeddb` 6.2.8). Cài: `npm install` ở thư mục gốc repo. Bản dán Console không cần gói nào.
- `kiem/test_buoc14.sh`, `kiem/test_buoc17.sh`: không đặt `NODE_PATH` thì dùng `node_modules` của repo (trước đây nhảy ra thư mục cha của repo nên không tìm thấy jsdom).
- Thêm `.gitignore` (`node_modules/`, `cong-cu/__pycache__/`).

**Trả nợ test** (test viết trước GĐ 7, chưa cập nhật theo các thay đổi cố ý của GĐ 6–7; mã không đổi, chỉ sửa kỳ vọng — mỗi chỗ sửa có ghi chú `[GĐ 8]` trỏ về commit gây đổi)
- Khoá tên miền (từ 1.2 chỉ lấy từ hồ sơ, `ita.chay({ tenMienDuocChay: null })` bị bỏ qua): bản thử của test 5, 6, 8, 9, 10, 11 và `test_dong_goi` nay đổi `ten_mien` của hồ sơ đóng gói sang `127.0.0.1` bằng hàm chung `kiem/ban_thu.py` (`doi_ten_mien`). Trước đó các test này không chạy được lần nào (ITA từ chối chạy trên 127.0.0.1) hoặc treo tới hết giờ.
- Test 13: chưa có hồ sơ thì ITA hỏi «kiểm giao diện thuần?» (từ 1.1); Chrome chạy ngầm không trả lời hộp thoại nên trang treo. Test giả người dùng chọn «Không» và kiểm thêm là câu hỏi có hiện.
- Test 14: 401 ở dịch vụ phụ khi phiên chính còn → mức «ghi nhận» / «Cần xem» kèm lý do (`b0fcecf`); giao diện thuần không bấm «Bắt đầu phiên họp» (`30e73d5`). Thêm bỏ qua lỗi mang cờ `__ita` (lỗi đọc giả do ITA cố ý tạo) ở `unhandledRejection` của test 14, 16, 17 — lỗi khác vẫn làm test trượt.
- Test 17: logo trong khối menu bị lọc hẳn (`4389a52`) → kiểm «/app chỉ một lần, logo không thành màn» thay cho bước «cùng đường dẫn».
- Test 5, 6, 11: chữ căn cứ «TC v7» → «TC của dự án <mã>» (`83bae52`, `97c8506`); mục «GHI NHẬN — không có căn cứ» → «Cần xem — đặc tả không nói gì…»; mã camelCase không có TC dự án → «tự đặt»; danh sách bộ đọc thêm 4 bộ của bước 14–16; zip giờ được giải nén nên zip hỏng ghi «không giải nén được».
- Test 11: dòng có lỗi WCAG chắc chắn thì mức của dòng theo lỗi đó; phần «tiêu đề lệch menu» được kiểm qua lý do «cần xác nhận» thay vì mức của cả dòng.
- `cong-cu/sinh_trang_thai_qt.py`: thiếu mã nguồn app thì dừng, không ghi gì. Trước đây vẫn sinh tệp thiếu nguồn và ghi đè `du-an/dqtv/trang-thai-quy-trinh.json` mỗi lần chạy test 9 — làm test 16 trượt theo.
- Kết quả cả bộ: mã gốc `cb4efef` đạt 11/21 (7 trượt vì kỳ vọng cũ); nhánh này đạt 21/24 (thêm 3 test mới, cả 3 trượt trên mã gốc). Ba test còn lại cần thứ không có trên máy sạch: `test_buoc8`, `test_buoc9` (mã nguồn `dqtv-app`), `test_dong_goi` (3.26 gốc).
- `dist/` đóng gói lại: `chung/ita.js`, `rieng/ita-dqtv.js`, `rieng/ita-pms.js` cùng ghi 1.7 (trước đó `dist/rieng/ita-dqtv.js` cũ vẫn ghi 1.4, test 5–6 đọc thẳng tệp này).

## [1.6] — 13–17/11/2026 · GĐ 7 · gói `ITA-1_6.zip`, commit cuối `634c86e` (mã ghi nhầm `1.4`)

- Gỡ vết Tampermonkey khỏi `may/` (Bước 18).
- Đo thời gian theo mục menu: chờ trang yên (số lần, lâu nhất, hết hạn, lý do), axe (Bước 19).
- Gộp nhánh 16/11: bỏ dấu xung đột trong `dist`, giữ bộ lọc tab [1.1]; chia `dist/` thành `goc/`, `chung/`, `rieng/` (`5294670`).
- Lọc logo chỉ khi khối logo / header nằm trong vùng menu: thanh menu trên không còn bị bỏ hết (`4389a52`, `kiem/test_logo_tren.py`).
- An toàn khi bấm: giao diện thuần không bấm nút nghiệp vụ; không bao giờ bấm đặt lại / khôi phục / reset (`30e73d5`, `kiem/test_nut_nghiep_vu.py`).
- Báo cáo đủ chỗ xảy ra: mẫu lỗi, bảng thiết kế, ngôn từ, CSV không còn cắt (`8f1ab7b`, `kiem/test_du_cho.py`).
- Bốn chữ kết luận theo căn cứ — Sai / Lệch chuẩn / Không thống nhất / Cần xem; ITA không chắc thì hạ về Cần xem; một thành phần một dòng (`b0fcecf`, `kiem/test_ket_luan.py`).
- Giả lỗi đọc dữ liệu từng màn: màn phải báo lỗi, không hiện trống / treo / trắng (`b7f1c52`, `kiem/test_gia_loi_doc.py`).
- Gom chữ: mọi bảng chỉ dùng bốn chữ kết luận + Đạt / Chưa thử được; 8 phép kiểm KHUNG-CHUNG theo danh mục TC dự án (`83bae52`).
- Duyệt tab: link cùng chữ khác đường dẫn chỉ mở link đầu (`b8d9785`, `kiem/test_link_lap.py`).
- Lõi bỏ tên dự án (DQTV, PMS) khỏi ghi chú và mã dùng chung (`97c8506`).
- Tải báo cáo không gắn link tải vào trang (`8744186`, `kiem/test_tai_tep.py`).
- Danh sách dạng thẻ: mở mục đầu như hồ sơ đầu, link mở từng mục không thành tab (`634c86e`).

## [1.4] — 11/11/2026 · Bước 17
- Chạy được khi không có menu trái (thanh điều hướng trên, link nội bộ, chỉ màn hiện tại); thử biên ô theo thuộc tính DOM; bất biến lọc / sắp xếp / phân trang; ô chọn tuỳ biến (`kiem/test_buoc17.sh`).

## [1.3] — 10/11/2026 · Bước 16
- Một tệp `ita.js` cho mọi dự án: «Nạp thư mục» đọc đủ như bản đóng gói (TC trong .zip, sổ lỗi, giới hạn ô, trạng thái quy trình); `ita.duLieu()` (`kiem/test_buoc16.mjs`).

## [1.2] — 10/11/2026 · Bước 15
- Khoá an toàn không đặt lại được bằng `ita.dat`; danh sách chỉ cộng thêm; kiểm khoảng giá trị; bộ cấu hình nhanh / chuẩn / sâu / kiểm kê trường / bảo mật chỉ áp cho lần chạy; báo cáo ghi cấu hình và nguồn.

## [1.1] — 10/11/2026 · Bước 14
- 401 theo dịch vụ, mất phiên thật thì dừng hẳn; sửa khám phá (link trùng menu, ô lịch / phân trang không phải tab, chữ cấm chỉ xét đầu nhãn); mức WCAG theo axe; kiểm giao diện thuần khi chưa có hồ sơ; hồ sơ mẫu `ho-so-mau.json` (`kiem/test_buoc14.sh`).

## [1.0] — 07/11/2026 · Bước 13 (13a–13e)
- Đổi `dqtv.*` → `ita.*`; hồ sơ dự án nạp được; kiểu app `rest-buoc` và `openslides`. Nền: 3.26.6.

## Nhánh không dùng
- 3.23, 3.30, 3.31, 3.31.1, ITA 5.0: `PLAN.md` (07/11) ghi «Không dùng» nhưng **không ghi lý do**. Lý do: *chờ người quyết định ghi vào đây* (roadmap GĐ 8).
