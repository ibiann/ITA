# Tool kiểm giao diện DQTV: làm lại trên nền 3.26, tách mã khỏi dữ liệu

## Mục đích

- Dán vào Console là chạy được: có hoặc không có quy trình, UC, TC đều chạy.
- Quy trình đổi thì nạp tệp mới, không sửa script.
- Mỗi kết quả phải có căn cứ. Không có kết quả nào do người viết script tự đặt.

## Nền và tham chiếu

- Nền: `~/Downloads/dqtv-kiem-tra-dacta-3.26.js`. Giữ nguyên tệp này, không sửa.
- Không dùng: 3.23 (`dqtv-kiem-tra-dacta.js`), 3.30, 3.31, 3.31.1, ITA 5.0.
- Đầu ra của tool cũ (28/10): `~/Downloads/dqtv/test-ui-tool-28-10-2026/`. Phần kiểm giao diện đã đúng, nhưng thiếu đặc tả.
- Bỏ khỏi nền: 118 bảng quy trình (dòng 3 của 3.26), danh mục TC tự sinh (dòng 5), và trong sổ quy tắc (dòng 4) bỏ các ca đã đóng gắn mã TC tự sinh (TR-046 đến TR-049, KHUNG-01, KHUNG-02).

## Quy tắc căn cứ

Mỗi dòng kết quả có hai vế:
- **Căn cứ:** lấy từ đâu (tệp + dòng + mã; điều khoản của chuẩn công khai; mục trong tài liệu dự án đã nạp). Sự việc tự nó là lỗi (máy chủ trả lỗi, trang báo lỗi, màn sập) thì căn cứ ghi là «sự việc».
- **Quan sát:** tool thấy gì, ở đâu (đường dẫn màn, chữ trên nút, mã lỗi).

| Căn cứ | Quan sát | Kết quả |
|---|---|---|
| có | có | Đạt / Không đạt |
| không | có | Ghi nhận (không tính là lỗi) |
| có | không | Chưa kiểm, kèm lý do (tool không thấy không có nghĩa là app thiếu) |

Phép kiểm giao diện chung giữ đủ, không bỏ phép nào. Mỗi phép được gắn căn cứ. Phép nào chưa có căn cứ thì kết quả là Ghi nhận.

## Thư mục

```
dqtv-kiem-tra/
  PLAN.md          tệp này
  may/             máy kiểm (mã): dùng chung, không chứa chữ nào riêng của DQTV
  bo-doc/          bộ đọc: mỗi kiểu tệp nạp vào có một tệp; nhận ra kiểu dữ liệu theo nội dung, không theo tên thư mục
  du-an/dqtv/      mọi thứ riêng của DQTV; tool chạy được cả khi các thư mục này trống
    quy-trinh/     tài liệu quy trình dự án
    uc/            UC
    tc/            TC
    quan-sat/      danh mục màn, nút, trường quét được khi chưa có đặc tả; không trộn vào uc/ tc/
    ket-qua/       báo cáo các lần chạy
  cong-cu/         script tách 3.26, script đóng gói
  kiem/            kiểm tệp sau khi đóng gói
  dist/            tệp duy nhất để dán vào Console
```

Hai tệp đã có trong `du-an/dqtv/`, đều đóng gói kèm vào `dist` (thiếu tệp nào thì bỏ qua, tool vẫn chạy):
- `ho-so.json`: tên miền, gốc đường dẫn `/dqtv`, màn «Việc của tôi», tiền tố tên tài khoản, mã yêu cầu sửa. Mỗi mục ghi nguồn ở `_nguon`. Đường dẫn đăng nhập thêm ở bước 4.
- `loi-da-biet.json`: màn sập đã biết (UI-01).
- Chữ nút mở form / nút cấm bấm là chữ giao diện tiếng Việt chung, không riêng DQTV: để trong `may/20-cau-hinh.js`.

## Các bước

| # | Việc | Cách chứng minh |
|---|---|---|
| 1 | Tách phần mã của 3.26 vào `may/` | Ghép lại phải ra đúng từng byte phần mã của 3.26 |
| 2 | Bỏ dữ liệu tự sinh (xem «Nền và tham chiếu») | Tệp `dist` không còn các khối dữ liệu đó |
| 3 | Chuyển chữ riêng DQTV từ `may/` sang `du-an/dqtv/ho-so.json` | Tìm trong `may/` không còn `viec-cua-toi`, `linksafe`, `YC-` |
| 4 | Vá chặn ghi: chỉ cho POST tới đường dẫn đăng nhập có thật trong mã app | Thử trên Chrome chạy ngầm: `extend-age` bị chặn, `/api/session` đi qua |
| 5 | Áp quy tắc căn cứ; bỏ các mặc định ngầm (3.26 dòng 2409, 2589, 2658) | Báo cáo mẫu: không dòng Đạt / Không đạt nào thiếu căn cứ |
| 6 | Nút Nạp và `bo-doc/`: bộ đọc đầu tiên là JSON đặc tả 2.1; bộ đọc v7 chỉ làm khi có lệnh | Không nạp gì vẫn chạy; nạp tệp lạ thì báo «không nhận ra» |
| 7 | Đóng gói `dist`, chạy thử trên Chrome chạy ngầm | Nạp không lỗi. Chạy trên site thật do người dùng làm (chỉ đọc) |

### Bước 7 (người dùng duyệt 05/11): quy trình → UC → TC → giao diện, đóng gói sẵn trong 1 tệp

Nguyên tắc: v7 là thứ cần kiểm (TC, kết quả mong đợi); tài liệu quy trình của Bên B (máy sinh từ sổ và app) là căn cứ để biết TC còn đúng quy trình hiện tại. Không sinh TC từ tài liệu. TC lệch tài liệu → «Chưa chạy được — chờ PM», không kết luận app sai. «Đã duyệt» = Trạng thái TC «PM 29/10 · giữ nguyên» (khai trong `ho-so.json`); «chờ PM quyết» không chạy.

| # | Việc | Cách chứng minh |
|---|---|---|
| 7a | `bo-doc/20-quy-trinh-md.js`: đọc 4 mục máy sinh (vai-tro, chang, buoc, du-lieu) của tài liệu `qt-*.md`, `dm.*.md`, `ngoai63.*.md`; nhận qua dấu mốc `<!-- máy sinh: buoc -->` | Chạy bằng Node trên 119 tài liệu thật: số bước / chặng / vai đọc ra khớp dòng tóm tắt máy sinh của từng tài liệu |
| 7b | `bo-doc/30-v7-tc-csv.js`: đọc `tc_all.csv` (nhận qua tên cột) | Node: 44.124 dòng, 40 cột, khớp đọc bằng Python |
| 7c | `bo-doc/90-ghep-v7-tai-lieu.js`: TC M1 (DUNG, SAI_VAI, XAC_NHAN, SAI_TRANG_THAI, TRUONG, NHAP) đối chiếu tài liệu → bảng cho phần đối chiếu; mỗi dòng kết quả mang mã TC, trạng thái TC, căn cứ tài liệu | Node: số TC khớp / lệch tài liệu khớp phân tích Python (lệch: không còn bước, ghi mã bước, vai trái); Chrome: trang mẫu có nút thật → `1.B1.DUNG` Đạt, căn cứ «TC 1.B1.DUNG · qt-1.md» |
| 7d | Đóng gói sẵn: `dong_goi.py` lấy `du-an/<dự án>/quy-trinh/**` và `tc/**` (cả `.zip`), nén gzip; tool tự giải nén lúc khởi động. Xuất `dqtv.xuat('tc')`: CSV theo mã TC, chữ theo sheet «Ánh xạ kết quả» | Kích thước `dist`; Chrome: không bấm Nạp vẫn có quy trình + TC; CSV đúng cột, chỉ TC của vai đang đăng nhập |

### Bước 8 (người dùng yêu cầu 05/11, theo ý PM «tool còn yếu phần audit trường»): kiểm ô theo khai báo giới hạn của app

Lý do: bộ dữ liệu nhập ô của v7 (8 lớp cố định) đoán mốc, lệch khai báo của app — ví dụ «chữ ngắn» 255 trong khi app khai 300; ô «số lượng» coi 0 là sai trong khi app khai tối thiểu 0; không có ca ký tự đặc biệt. App khai giới hạn từng ô một chỗ (`ontology.yaml` → `dqtv-app/libs/registry/limits.gen.mjs`) và ghi rõ ô nhập mang đúng con số máy chủ ép (`libs/ui-lens/limits.js`, `libs/ui-lens/action-dialog.jsx`: mọi ô mang `name` = mã ô). Nhập / xuất tệp, ô ngày, ô tệp để sau.

| # | Việc | Cách chứng minh |
|---|---|---|
| 8a | `cong-cu/sinh_gioi_han_o.mjs`: sinh `du-an/dqtv/gioi-han-o.json` từ `limits.gen.mjs` (ô chữ, ô số; mỗi tên ô kèm nơi khai, bản app); mẫu thử cho 4 pattern của app (số quyết định, CCCD, điện thoại, email) tự đối chiếu với pattern ở cờ `u` (máy chủ) và `v` (thuộc tính pattern của trình duyệt) | Bộ sinh dừng nếu một mẫu đúng không khớp / mẫu sai lại khớp / chuỗi dài tối đa không khớp |
| 8b | `dong_goi.py` kèm `gioi-han-o.json` thành `window.__dqtvGioiHanO` | Bản đóng gói có dòng này |
| 8c | `30-loi-kiem.js` `kiemO()`: chạy sau `chayTC` trong mỗi form đã mở. Ô có `name` trùng tên đã khai: so thuộc tính trên ô (maxlength, minlength, pattern, min, max, step) với khai báo; gõ thử đúng tối đa, quá dài, quá ngắn, ký tự đặc biệt, mẫu đúng / sai, dưới min, trên max, sai bước. Gõ qua bộ soạn thảo của trình duyệt (`execCommand insertText`, maxlength có hiệu lực), không được thì gán thẳng; KHÔNG bấm Lưu; trả lại giá trị cũ. Tên có nhiều khai báo: chỉ dùng khi thuộc tính trên ô khớp đúng một khai báo. Gõ thử mỗi khai báo một lần mỗi lượt chạy | `kiem/test_buoc8.py` + `kiem/thu_kiem_o.html` (form MẪU THỬ, tên ô thật) |
| 8d | Kết quả: ĐẠT / KHÁC KHAI BÁO / CHƯA KIỂM; mỗi dòng có căn cứ «khai báo app «tên ô»: con số (nơi khai) · limits.gen.mjs @bản». Báo cáo HTML có mục riêng «Kiểm ô theo khai báo giới hạn của app — bổ sung, chưa có mã TC v7»; JSON có `kiem_o` | Như 8c |

### Bước 9 (người dùng yêu cầu 05/11): quy trình còn thiếu theo bộ rà soát toàn bộ (RA-QT-TOAN-BO, báo cáo 196–235)

Lý do: bộ rà soát chỉ ra tài liệu 05/11 và app lệch nhau ở mức quy trình và bước (235 mục 3; 234 mục 3; 207 A-13; 214; 230; 204; 226…). Tool chấm theo tài liệu thì TC rơi vào các chỗ ấy ra kết quả giả.

| # | Việc | Cách chứng minh |
|---|---|---|
| 9a | `cong-cu/sinh_trang_thai_qt.py`: so tài liệu `du-an/<dự án>/quy-trinh/` với `core/processes/*/workflow/*.yaml` của app (theo tên bước app, hoặc `useCase: sổ <mã> · step:<mã bước>`) → `du-an/dqtv/trang-thai-quy-trinh.json`: tài liệu app không còn khai báo, bước không có trong khai báo app, «Từ chặng» khác app, tệp khai báo app chưa có tài liệu; mỗi mục kèm số báo cáo rà soát nhắc tới (đọc thẳng zip / thư mục báo cáo) | Kết quả khớp kết luận của rà soát: 3 tài liệu app đã gỡ (196, 214, 230), 5 tệp app chưa có tài liệu (= 6 mã bước của 235 mục 3), `markDecisionUsed` (204), `issueReissueOrder` (226), 2.submission (207 A-13) |
| 9b | `bo-doc/90`: nhận `gop.trang_thai_qt`; TC của tài liệu app không còn, bước không có trong khai báo app → không chạy, nhóm QUY TRÌNH, ghi lý do + số báo cáo; TC sai chặng ở bước có «Từ chặng» khác app → không chạy; bước ấy không giao chặng cho phần đối chiếu | `kiem/test_buoc9.py` |
| 9c | Báo cáo: mục «Độ phủ quy trình — tài liệu × app × TC v7» (tài liệu chưa có TC v7, tài liệu app không còn, app chưa có tài liệu, số bước lệch); mục «Phủ danh mục TC» dùng danh mục v7 sau ghép, TC không chạy ghi đúng lý do của phần ghép | `kiem/test_buoc9.py` |

## Trạng thái

- 05/11/2026: đã tạo các thư mục và tệp này.
- 05/11/2026: **xong bước 1 và 2.**
  - Bước 1: `cong-cu/tach.py` (lấy từ `tach_326.py` của 3.31, bỏ phần ghi dữ liệu) cắt 3.26 thành 8 tệp trong `may/`. Ghép 5 dòng đầu của 3.26 với `may/*.js` ra đúng sha256 `b099c7e5…cf02` của 3.26.
  - Bước 2: `du-an/dqtv/loi-da-biet.json` chỉ giữ `loi_sap` (UI-01). Bỏ `tc_dong` (6 ca gắn mã TC tự sinh) và `nguon_da_duyet`. Không có tệp đặc tả hay danh mục TC nào.
  - Bước 2, sửa thêm 8 dòng trong `may/` để dữ liệu cũ trong trình duyệt không quay lại: khoá lưu `.v325` đổi thành `.v3261`; `KHOA_CU` thêm v325 để `dqtv.donBoNho()` xoá được khoá của 3.25/3.26; `PHIEN_BAN` = `3.26.1`.
  - `cong-cu/dong_goi.py` ra `dist/dqtv-kiem-tra-3.26.1.js` (284 KB).
  - `kiem/test_dong_goi.py`: 5/5 đạt (không còn dữ liệu tự sinh; sổ lỗi chỉ UI-01; khoá mới; `node --check`; `may/` khác 3.26 đúng 8 dòng đã định).
  - Nạp thử trong Chrome chạy ngầm, trang mẫu file://: có `dqtv`, bảng điều khiển hiện ra, 0 bảng đặc tả, không có danh mục TC, sổ lỗi có UI-01, không có lỗi JS. Chưa chạy trên site thật.
  - Chưa làm: chặn ghi vẫn như 3.26 (`extend`, `renew` vẫn lọt), đó là bước 4. **Chưa dán `dist` lên site thật trước khi xong bước 4.**
- 05/11/2026: **xong bước 3.**
  - Tạo `du-an/dqtv/ho-so.json`. Mã đọc hồ sơ qua `window.__dqtvHoSo` (biến `DU_AN` trong `20-cau-hinh.js`; tên `HO_SO` đã có sẵn trong 3.26 cho bộ cấu hình nhanh/đầy đủ nên không dùng).
  - Đổi 25 dòng: `20-cau-hinh.js` (đọc hồ sơ, khoá tên miền, `boGoc`), `30-loi-kiem.js` (tên màn bỏ gốc đường dẫn), `50-doi-chieu-dac-ta.js` (màn việc chung, tiền tố tài khoản, mã YC).
  - Không có hồ sơ: in cảnh báo, không khoá tên miền, không có màn việc chung, không bỏ tiền tố tài khoản, không ghi mã YC.
  - Chưa đụng: danh sách chữ đoán «ô quyết định nghiệp vụ» (`50-doi-chieu-dac-ta.js`, dòng có `kết luận|thẩm quyền|…`). Đây là luật người viết tự đặt, để bước 5 xử lý.
  - `kiem/test_dong_goi.py` 7/7 đạt: thêm (6) dòng mã trong `may/` không còn `linksafe`, `viec-cua-toi`, `Việc của tôi`, `YC-…`, `/dqtv`, mẫu tiền tố; (7) nạp trong Chrome chạy ngầm bằng `kiem/thu_trinh_duyet.html`, có hồ sơ: khoá `dqtv.linksafe.vn`, nhận vai «PK Phòng Kế hoạch tổng hợp» = PK; không hồ sơ: không khoá, vai = «ngoài đặc tả»; cả hai không lỗi JS.
  - `may/` khác 3.26 tổng 33 dòng (8 của bước 2 + 25 của bước 3).
- 05/11/2026: **xong bước 4.** Từ đây dán `dist` lên site thật được (chỉ đọc).
  - Căn cứ trong mã app: `POST /api/session` = đăng nhập (`libs/http/serve.mjs:451`); `POST /api/search` = tìm, app đánh dấu `readOnly` (`core/platform/server/mount.mjs:78`, `clients/staff-web/src/api.js:190`); `/api/auth/*` đều là GET; app không có POST giữ phiên. `extend-age` (`core/processes/militia-enlistment/server/routes.mjs:399`) và `extend-deadline` (`core/processes/discipline/server/routes.mjs:289`) là lệnh ghi nghiệp vụ thật, 3.26 để lọt.
  - `ho-so.json` thêm `post_cho_qua: ["/api/session", "/api/search"]`. Hàm `postDuocDi` (`10-la-chan.js`) so đúng đường dẫn, cùng tên miền, chỉ với POST. Lá chắn (`ghiChat`) và lõi kiểm (`isWrite`) cùng dùng hàm này. Không có hồ sơ thì không POST nào đi.
  - Bỏ `choPhepPost` (cấu hình, kiểu, phép kiểm «quá rộng», `MAU_GHI`): không ai đặt lại được bằng `dqtv.dat`.
  - Luôn chỉ đọc (người dùng đã chốt 04/11): `30-loi-kiem.js` ép `chanGhi = true`, `choGhiMoiTruong = false`; truyền `chanGhi:false`, `mucQuyTrinh` 2/3, `moiTruongKiemThu` thì in cảnh báo và bỏ qua. Báo cáo ghi `muc_quy_trinh: 1`.
  - `kiem/test_dong_goi.py` 8/8 đạt. Phép (8) chạy máy chủ thử 127.0.0.1 + `kiem/thu_chan_ghi.html` trong Chrome chạy ngầm: 12 ca quyết định đúng; gửi thật: `/api/session` đi qua (máy chủ trả 501), `extend-age` bị chặn; đang chạy kiểm với `chanGhi:false, mucQuyTrinh:3, moiTruongKiemThu:[127.0.0.1]` vẫn chặn PUT và POST nghiệp vụ; không hồ sơ thì `/api/session`, `/api/search` cũng bị chặn.
  - Lần thử đầu báo `extend-age` đi qua: do trang thử bật lá chắn trước khi tool khởi động xong (lúc khởi động không có lượt chạy dở, tool nhả lá chắn: `nhaLaChan`). Sửa trang thử, không phải lỗi tool.
  - `may/` khác 3.26 tổng 51 dòng (8 + 25 + 18). `dist` 287 KB.
  - Chưa chạy trên site thật.
- 05/11/2026: **xong bước 5.** Sao lưu trước bước 5: `~/Downloads/dqtv-kiem-tra-sao-luu-sau-buoc4/`.
  - Phép kiểm giao diện chung: bảng `CAN_CU_KIEM` (`10-la-chan.js`) gắn mỗi phép một loại căn cứ: «sự việc» (api_loi, js_loi, du_lieu_nhay_cam, rong_nhung_api_loi, so_dong_vuot_tong, chu_la khi là NaN/undefined/[object Object]…), «chuẩn» (o_khong_nhan: WCAG 2.2 SC 1.3.1, 4.1.2; tran_ngang chỉ khi khổ ≤ 320px: SC 1.4.10), «đặc tả» (quy_trinh_loi từ cấu hình dacTa). Còn lại «tự đặt». Không bỏ phép kiểm nào.
  - `30-loi-kiem.js`: mức (cao / trung bình / thấp) chỉ tính phép có căn cứ; màn chỉ có phép tự đặt ghi «ghi nhận». Mỗi dòng vấn đề và mỗi mẫu lỗi có `can_cu`. Ô tìm / lọc: chỉ lỗi máy chủ, lỗi trang, số dòng vượt tổng được tính mức; kỳ vọng tìm kiếm do công cụ đặt → ghi nhận. Thiết kế và ngôn từ ghi rõ «ngưỡng công cụ», chỉ ghi nhận.
  - `50-doi-chieu-dac-ta.js`: mọi dòng đi qua một chốt `them()`. Kết luận ĐẠT / LỆCH / CẢNH BÁO phải có căn cứ (tệp › bảng › mục › nguồn mục) và quan sát; thiếu căn cứ → GHI NHẬN; thiếu quan sát → CHƯA KIỂM. Bảng khung không là căn cứ.
  - Bỏ mặc định ngầm: `nguon_da_duyet` không còn mặc định `['UC']` (chưa khai → không có LỆCH); bỏ luật đoán «ô quyết định nghiệp vụ» theo chữ trong nhãn và 4 luật nguyên nhân AUTO-ĐIỀN; ô có giá trị sẵn mà đặc tả không ghi mặc định → GHI NHẬN.
  - Đặc tả không nói → GHI NHẬN: quyền xem không khai cho vai, trường thừa trên form, nút khoá không ghi lý do (khi đặc tả không có `khoa_khi`). Không so được → CHƯA KIỂM: trường đặc tả đòi mà chưa có nhãn, trường nối chưa xác định.
  - Báo cáo HTML / CSV: thêm cột Căn cứ; GHI NHẬN để trong mục thu gọn riêng; dòng tóm tắt có số «ghi nhận». `ho-so.json`: bỏ 2 mã YC gắn với luật đoán đã bỏ (còn `buoc_he_thong`).
  - `kiem/test_buoc5.py` + `kiem/thu_can_cu.html` (bảng đặc tả MẪU THỬ, không phải dữ liệu dự án) 5/5 đạt: căn cứ của phép kiểm chung; 12 dòng kết luận đều có căn cứ và quan sát; không khai nguồn đã duyệt thì không có LỆCH, khai `UC` thì có; quyền xem không khai, trường thừa, ô có giá trị sẵn, bảng khung → GHI NHẬN; báo cáo có cột Căn cứ; chạy thật trên trang mẫu (Chrome chạy ngầm, 127.0.0.1): màn có NaN + ô không nhãn → «thấp» kèm căn cứ, màn chỉ có 150% → «ghi nhận».
  - `kiem/test_dong_goi.py` 8/8 đạt; `may/` khác 3.26 tổng 128 dòng (33 + 18 + 77).
  - Hệ quả cần biết: chưa nạp tài liệu dự án thì phần lớn phát hiện giao diện chung (chữ cắt, tiêu đề cắt, lưới, cỡ chữ, ngôn từ, ô tìm…) chuyển sang «ghi nhận». Nạp quy cách dự án / TC có căn cứ (bước 6 trở đi) thì mới tính lại mức.
  - Chưa chạy trên site thật.
- 05/11/2026: **xong bước 6.** Bước 7 chờ lệnh.
  - Tệp mới `may/70-nap.js`: danh sách bộ đọc `BO_DOC`; nút «⇪ Nạp tệp», «⇪ Nạp thư mục» trên thẻ Chạy (`40-bang-dieu-khien.js`); lệnh `dqtv.nap()`, `dqtv.napThuMuc()`, `dqtv.napTep(files)`, `dqtv.xemNap()`, `dqtv.xoaNap()`.
  - Mỗi tệp đi qua `bo-doc/*.js`; bộ đọc nhận ra theo nội dung. Tệp nén (zip, xlsx, nhận qua 2 byte đầu `PK`) và tệp không bộ đọc nào nhận ra → «không nhận ra», không dùng, liệt kê trên bảng và Console.
  - Tệp đã nhận lưu ở IndexedDB `dqtv-kiem-tra` (localStorage quá nhỏ); lúc khởi động `90-khoi-dong.js` đọc lại (`apDungNap`) trước khi chạy tiếp sau tải lại. Mỗi bảng mang `__tep` để cột Căn cứ trỏ về tệp.
  - Bộ đọc đầu tiên `bo-doc/10-dac-ta-json.js` (`dac-ta-json-2.1`): JSON một bảng hoặc mảng bảng; MỌI bảng phải có `dinh_danh` kèm mã và một trong `buoc` / `ban_giao` / `vai`, không thì cả tệp không nhận. Bảng giữ nguyên, không sửa.
  - Báo cáo HTML có dòng «Dữ liệu đã nạp» (tệp, bộ đọc, số bảng, mã băm, lúc nạp); không nạp gì thì ghi «chỉ kiểm giao diện chung». Kết quả JSON có `du_lieu_nap`.
  - `cong-cu/dong_goi.py` gói kèm `bo-doc/*.js` giữa `may/` số < 90 và `90-khoi-dong.js`; thêm `--ra`.
  - `kiem/test_buoc6.py` + `kiem/thu_nap.html` (bảng MẪU THỬ) 4/4 đạt, nạp 2 lần trên cùng hồ sơ Chrome: chưa nạp thì 0 bảng; có 2 nút; 1 tệp đặc tả được nhận, 5 tệp lạ (zip, csv, JSON khác khuôn, JSON hỏng, tệp có 1 bảng sai khuôn) bị báo không nhận ra; nạp xong chạy thật thì có `MAU.B1.DUNG` ĐẠT với căn cứ «tệp mau-thu.json › bảng MAU › B1.DUNG»; tải lại trang vẫn còn; `xoaNap()` xoá hết.
  - Chế độ thời gian ảo của Chrome (`--dump-dom --virtual-time-budget`) làm `indexedDB.open()` treo (đã khoanh vùng bằng trang thử riêng). Phép kiểm bước 6 dùng `kiem/mo_chrome.mjs`: Node điều khiển Chrome bằng thời gian thật qua cổng gỡ lỗi, không cài thêm gì.
  - `kiem/test_dong_goi.py` 8/8 (biết `70-nap.js` là tệp mới; dò chữ riêng DQTV cả `bo-doc/`); `kiem/test_buoc5.py` 5/5. `may/` khác 3.26 tổng 136 dòng (33 + 18 + 77 + 8) + tệp mới `70-nap.js`.
  - Chưa kiểm: bấm nút thật để mở hộp chọn tệp / thư mục của trình duyệt (không tự động hoá được hộp chọn tệp); tên tệp khi chọn cả thư mục (`webkitRelativePath`). Chưa chạy trên site thật.
  - Chưa có: bộ đọc cho v7 (zip, xlsx, csv) — chỉ làm khi có lệnh; cách để dữ liệu nạp khai `nguon_da_duyet` (hiện chỉ đọc từ sổ quy tắc đóng gói).
- 05/11/2026: **xong bước 8 ở mã nguồn; CHƯA đóng gói lại `dist`.** Sao lưu trước bước 8: `~/Downloads/dqtv-kiem-tra-sao-luu-truoc-buoc8/`.
  - Làm trong lúc bước 7 đang dở: `bo-doc/90-ghep-v7-tai-lieu.js` gọi `GHEP` mà `may/` chưa khai `GHEP`, nên chạy `dong_goi.py` lúc này ra tệp lỗi «GHEP is not defined». Vì vậy `dist/dqtv-kiem-tra-3.26.1.js` giữ nguyên bản 15:06 (chưa có bước 7, bước 8). Xong 7c/7d thì chạy lại `dong_goi.py` là có bước 8 (dong_goi đã kèm `gioi-han-o.json`).
  - `du-an/dqtv/gioi-han-o.json`: 995 tên ô (3.641 chỗ khai), 31 tên có nhiều khai báo khác nhau; app `ux` @ `74cf68c0` (04/11). App đổi khai báo thì chạy lại `node cong-cu/sinh_gioi_han_o.mjs`.
  - `kiem/test_buoc8.py` đạt: tự đóng gói bản thử bằng `dong_goi.py` trên bản chép (bỏ bộ đọc dùng `GHEP` khi `may/` chưa khai), không ghi đè `dist/`. Trên trang mẫu: không bấm Lưu, không lỗi JS, mọi ô trả lại giá trị cũ; ô đúng khai báo → ĐẠT; ô thiếu maxlength → KHÁC KHAI BÁO (gõ 4.001 ký tự vẫn nhận); ô số thiếu min / max → KHÁC KHAI BÁO (nhận -1, nhận 1.000.000.001); ô có maxlength cắt chữ khi gõ quá dài; số quyết định nhận 2 mẫu đúng, chặn 4 mẫu sai; ký tự đặc biệt giữ nguyên; báo cáo HTML có mục mới.
  - Giới hạn đã biết: trình duyệt chỉ xét minlength khi chính người dùng gõ phím; gõ giả lập không đủ để nó báo. Ô mang đúng minlength mà không thấy báo → CHƯA KIỂM có lý do (không kết luận). Công cụ không bấm Lưu nên không thấy máy chủ từ chối.
  - `kiem/test_dong_goi.py` 8/8 (thêm `SO_B8 = 121`: 120 dòng ở `30-loi-kiem.js`, 1 dòng ở `60-bao-cao.js`, chỉ thêm, không sửa dòng cũ); `test_buoc5.py` 5/5; `test_buoc6.py` 4/4. `may/` khác 3.26 tổng 257 dòng.
  - Chưa chạy trên site thật.
- 05/11/2026: **xong 7c (nối), 7d (đóng gói sẵn) và bước 9; đã đóng gói lại `dist`.** Phiên làm (khác phiên làm 7a–7c) theo yêu cầu người dùng «xem còn thiếu quy trình thì update vào tool để chạy cho đúng lại».
  - 7c nối: `70-nap.js` khai `GHEP`; `apDungNap` gom mọi dữ liệu các bộ đọc trả về (trừ `dac_ta`) theo tên khoá, chạy hàm ghép, đưa bảng ghép vào đối chiếu; danh mục TC sau ghép → `DM_V7` (khuôn của `phuDanhMucTC`, kèm `khong_chay` có lý do và nhóm). `50-doi-chieu-dac-ta.js` đọc `window.__dqtvDanhMucTC || DM_V7`.
  - 7d: `dong_goi.py` kèm sẵn `du-an/dqtv/quy-trinh/**/*.md` và `tc/**` (zip → `tc_all.csv`, chỉ giữ 14 cột tool đọc, đủ 44.124 dòng), gzip + base64 ở `window.__dqtvGoiSan`; `docGoiSan()` giải nén bằng `DecompressionStream`. Tệp đóng gói sẵn chỉ dùng cho loại (bộ đọc) người dùng chưa tự nạp. `dist` 3,86 MB. Chưa làm: xuất `dqtv.xuat('tc')` theo sheet «Ánh xạ kết quả».
  - Bước 9: `trang-thai-quy-trinh.json` từ app `ux` @ `e6780ced` (phần `core/processes` = `origin/dev` `6017c8b0`), 119 tài liệu, báo cáo rà soát `RA-QT-TOAN-BO.zip`. Danh mục TC v7 sau ghép: 21.425 TC M1 6 loại; chạy 14.648; không chạy 6.777 (TC/chờ PM 6.376, công cụ 267, quy trình 134 = 87 TC của 3 tài liệu app không còn + 27 bước không có trong khai báo app + 20 ca sai chặng). Bảng đối chiếu 99 (102 trừ 3 quy trình app không còn).
  - Phép kiểm: `test_buoc9.py` (mới) đạt — không bấm Nạp vẫn có 119 tài liệu + 44.124 TC, nạp xong ~1,5 giây; `test_dong_goi.py` 8/8 (`SO_B9 = 9`); `test_buoc5.py` 5/5; `test_buoc6.py` 4/4 (gỡ dòng dữ liệu đóng gói khỏi bản thử để kiểm riêng nút Nạp; danh sách bộ đọc thêm `quy-trinh-md`, `v7-tc-csv`); `test_buoc7.mjs` đạt; `test_buoc8.py` đạt. `may/` khác 3.26 tổng 266 dòng + tệp mới `70-nap.js`.
  - App hoặc tài liệu đổi: chạy lại `cong-cu/sinh_trang_thai_qt.py`, `cong-cu/sinh_gioi_han_o.mjs`, rồi `cong-cu/dong_goi.py`.
  - Chưa chạy trên site thật.
