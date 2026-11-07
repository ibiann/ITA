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

### Bước 10 (người dùng duyệt 06/11): chạy một lần ra đủ, không báo «không thấy nút» sai

Lý do: báo cáo 05/11. Tài khoản Trợ lý Quân lực ra 42 màn, đợt 03/11 ra 123: trang tải lại, điểm dừng bản gọn không giữ kết quả. Tool so chữ nút đúng từng chữ (`1.B1.DUNG`: đã mở form «Ghi nhận nhiệm vụ» mà vẫn báo «không thấy nút»), không đọc danh sách bước máy chủ trả về, và gán lý do theo lời ghi (dòng không khớp luật nào rơi vào «ỨNG DỤNG»). Căn cứ bài học: «không thấy» = tool không thấy, không phải app thiếu.

| # | Việc | Cách chứng minh |
|---|---|---|
| 10a | Điểm dừng không mất kết quả: trình duyệt hết chỗ (bản gọn) thì chép đủ vào IndexedDB (`kho()` của `70-nap.js`, kho riêng `dqtv-kiem-tra-ckpt`). Chạy tiếp thì đọc lại theo mã lượt chạy. Lưu thêm kết quả ca nhập ô và kiểm ô (trước đây mất khi tải lại). Không đọc lại được thì đầu báo cáo ghi «N mục menu mất kết quả» | `kiem/test_buoc10.py`: giả hết chỗ, tải lại giữa chừng → báo cáo đủ màn |
| 10b | Tìm nút theo mã bước: bảng ghép mang «Mã bước» của tài liệu (`ma_app`). Không thấy đúng chữ thì tìm nút gần chữ (chữ nút là dãy từ con của tên bước, hoặc ngược lại, ít nhất 2 từ, không trùng tên bước khác của quy trình). Máy chủ xác nhận mã bước trên màn đó → ĐẠT kèm ghi chú chữ khác. Không có xác nhận → CHƯA KIỂM, nhóm CÔNG CỤ | ca `1.B1.DUNG` trên trang mẫu → ĐẠT |
| 10c | Đọc danh sách bước máy chủ trả về (mọi mảng `{action, label, allowed, ready}` trong thân phản hồi GET đã ghi). Cho làm (`allowed`, chưa xong) mà màn không có nút → lỗi app thật (mắt xích 2). Máy chủ không cho → không phải lỗi giao diện. SAI_VAI: máy chủ cho vai này làm → app khác tài liệu (mắt xích 3) | trang mẫu có phản hồi giả |
| 10d | Lý do theo mắt xích: mỗi dòng chưa đạt có `mat_xich` (1 công cụ · 2 màn hình ↔ máy chủ · 3 app ↔ tài liệu · 4 tài liệu ↔ TC v7 · 5 chờ PM · 0 điều kiện chạy). «Không thấy nút» không có xác nhận máy chủ → CHƯA KIỂM, mắt xích 1, không còn «ỨNG DỤNG» | không dòng «không thấy nút» nào ra ỨNG DỤNG mà thiếu căn cứ máy chủ |
| 10e | Bước dời tài liệu cùng họ (qt-8 → qt-8.revocation, qt-D15 → qt-D15.complaint / .submission): TC v7 có TC đề xuất tương ứng (cùng tài liệu đích, loại ca, chữ nút; ô / dữ liệu với TRUONG, NHAP) → không chạy lại, lấy kết quả của mã đề xuất (`chay_duoi`). Không có tương ứng → giữ lý do, ghi «bộ đề xuất chưa có TC tương ứng» | Node: 128 TC v7 nối mã đề xuất; không mã nào chạy hai lần |
| 10f | `cong-cu/so_truoc_sau.py`: so hai báo cáo HTML cùng tài khoản: số màn, TC có kết quả trước mà nay mất. Chạy lại mọi `kiem/test_*`, đóng gói | 03/11 ↔ 05/11 Trợ lý Quân lực phải báo mất 81 màn; báo cáo mới phải 0 TC mất |

### Bước 11 (người dùng duyệt 06/11): kiểm giao diện theo chuẩn và theo TC giao diện của v7

Lý do: tool chưa có bộ kiểm giao diện chuẩn. Các phép kiểm chung (bản 3.26, `kiemui-v4.js`) chưa gắn với mã TC `KHUNG-CHUNG.*` của v7, nên phần lớn chỉ «ghi nhận». v7 có 109 TC `TRO_NANG` ghi rõ «chạy kiểm trợ năng tự động (axe)». WCAG 2.2 là bản chính thức mới nhất (W3C 10/2023, sửa 12/2024; 3.0 còn nháp). Việc 3 (nạp quy cách dự án) để sau.

| # | Việc | Cách chứng minh |
|---|---|---|
| 11a | axe-core 4.14.0 (Deque, MPL-2.0, `thu-vien/axe-core-4.14.0/`, mã băm khớp npm) đóng gói sẵn trước khối mã; chạy bộ luật WCAG 2.2 A/AA trên mỗi màn và mỗi form đã mở, trừ bảng của tool. Mục báo cáo riêng; dòng vấn đề của màn có `wcag_loi` (căn cứ «chuẩn»). TC `TRO_NANG`: lỗi critical / serious ở màn của quy trình → CẢNH BÁO; không có → CHƯA KIỂM (phần bàn phím công cụ không thử được), không ghi ĐẠT | `kiem/test_buoc11.py`: axe bắt đúng 3 lỗi cố ý trên trang mẫu; chấm TRO_NANG đúng |
| 11b | Gắn phép kiểm chung vào 27 TC `KHUNG-CHUNG.*` (mọi vai) và TC `O_TIM`, `<quy trình>.KHUNG_CHUNG`. Chỉ ĐẠT khi phép kiểm làm đủ thao tác + kết quả mong đợi; làm được một phần → CHƯA KIỂM ghi phần chưa kiểm. Phép khớp TC đổi căn cứ «tự đặt» → «TC v7». Chỉnh cho đúng TC: TIEU_DE_MENU so bằng nhau; THOI_DIEM thêm giờ ISO thô / AM-PM; KHONG_TREO_TAI chờ đủ 10 giây; LO_LOT thêm go build, grep, kết quả git / CI | như 11a, ca dựng sẵn |
| 11c | Rà lại một lượt: người rà độc lập (chỉ đọc) + chạy lại mọi phép thử | mọi `kiem/test_*` đạt |

### Bước 13 (người dùng duyệt 07/11; ĐANG LÀM — xong 13a–13e, còn 13f, 13g): ITA dùng cho nhiều dự án; dự án thứ hai là PMS

Lý do: tên lệnh, khoá tên miền, luật chặn ghi, cách nhận vai và khuôn TC đều đặt theo DQTV. Dán lên PMS (`pms.lab.linksafe.vn`) thì bị khoá tên miền (07/11). DQTV và PMS khác nhau cả ở dữ liệu lẫn cách app chạy, nên tách hai tầng:
- **Máy kiểm** (`may/`, dùng chung): ma trận căn cứ × quan sát, mắt xích, đi màn, luật giao diện chung, axe, chặn ghi theo luật nạp vào, báo cáo.
- **Gói dự án** (`du-an/<tên>/`, nạp bằng «Nạp thư mục» hoặc đóng gói sẵn): hồ sơ (tên miền, lệnh được cho qua, kiểu app, tài khoản → vai) và căn cứ (tài liệu, TC, quy cách giao diện, lỗi đã biết).
- **Kiểu app** (mã nằm trong máy kiểm, gói chọn bằng một dòng): `rest-buoc` cho DQTV (máy chủ trả danh sách bước, vai đọc từ chữ đầu tên tài khoản); `openslides` cho PMS (dữ liệu đi qua luồng nền, quyền theo nhóm của cuộc họp, vai tra theo tên đăng nhập).

| # | Việc | Cách chứng minh |
|---|---|---|
| 13a | Đổi tên dqtv → ITA: lệnh `ita.*`, `window.__ita*`, khoá lưu, bảng điều khiển, tên tệp xuất; tệp dán `dist/ita.js`. Dùng lại `cong-cu/doi_ten_ita.py` của bản 5.0 (lấy từ git), không đổi tay. Không giữ tên phụ `dqtv.*` (người dùng chốt 07/11: hai dự án khác nghiệp vụ và cách dùng) | tìm trong `may/`, `bo-doc/` không còn `dqtv`; mọi `kiem/test_*` đạt sau khi đổi tên trong test |
| 13b | Hồ sơ nạp được: bộ đọc `ho-so` (nhận theo nội dung). Chưa nạp hồ sơ → không chạy kiểm, chặn mọi lệnh ghi. `dong_goi.py --du-an <tên>` vẫn ra bản gói sẵn (`dist/ita-dqtv.js`) để DQTV không phải bấm Nạp | trang mẫu: chưa nạp → không chạy, POST bị chặn; nạp hồ sơ mẫu → chạy; bản gói sẵn DQTV qua đủ test cũ |
| 13c | Tách phần riêng DQTV trong `may/` thành kiểu `rest-buoc`: danh sách bước máy chủ `{action, label, allowed}`, tiền tố tên tài khoản, màn việc chung, ô mang `name` = mã ô | `test_buoc10.py` và các test cũ đạt khi hồ sơ ghi `rest-buoc` |
| 13d | Kiểu `openslides`: (1) vai tra theo tên đăng nhập trong hồ sơ; (2) đọc nhóm, quyền của tài khoản trong cuộc họp và trạng thái kiến nghị qua `who-am-i` + autoupdate (GET, chỉ đọc) làm căn cứ «máy chủ» (mắt xích 2); (3) bỏ luồng autoupdate khỏi phép đo chậm / treo; (4) bỏ số cuộc họp trong đường dẫn khi gom màn | trang mẫu giả OpenSlides; trên lab (người dùng chạy) `ita.chutoa` → tool đọc được nhóm Chủ tọa, 12 quyền |
| 13e | Gói `du-an/pms/`: `ho-so.json` (tên miền lab, kiểu `openslides`, lệnh cho qua: `/system/auth/login/`, `/system/auth/who-am-i/`, các presenter đã rà là chỉ đọc; cuộc họp 87; 6 tài khoản `ita.*` → vai: vai «Chủ tọa / Quản trị cuộc họp» của tài liệu gần như có mọi quyền (người dùng chốt 07/11), gán cho cả `ita.thuky` (nhóm Quản trị viên) và `ita.chutoa` (nhóm Chủ tọa, 12 quyền) — hai kết quả khác nhau chính là chỗ nhóm Chủ tọa của app thiếu so với tài liệu, mắt xích 3); `quy-cach.json` lấy từ `openslides-client/CLAUDE.md` §3 (thang khoảng cách, cỡ chữ, bo góc, mốc bề ngang 500/960/1280/1536, nút biểu tượng 36px, vùng bấm 44px) làm căn cứ cho các phép kiểm chung đang «tự đặt»; `loi-da-biet.json` từ các lỗi giao diện trong `DOCS/ERRORS/` | nạp thư mục → báo cáo «Dữ liệu đã nạp» có đủ 3 tệp; phép kiểm có quy cách đổi căn cứ «tự đặt» → «quy cách dự án» |
| 13f | Ma trận ITA = khung có sẵn trong `CaiTienTool_theo_MaTran_v7.md` (người dùng nhắc 07/11; khung không riêng DQTV): 28 loại kiểm thử T01–T28, chế độ M1–M5, loại ca (DUNG, SAI_VAI, XAC_NHAN, SAI_TRANG_THAI, TRUONG, NHAP, XEM, PHAM_VI, TRO_NANG, KHUNG_CHUNG…), khuôn TC của đặc tả 2.2 (`ma, loai_kiem, uu_tien, che_do, loai_ca, vai, can_cu` + trạng thái duyệt), bảng ánh xạ kết quả (mục 5; chữ hiển thị mỗi dự án khai trong hồ sơ). Không đặt khuôn mới. ITA chỉ chạy M1 (chỉ đọc, chốt 04/11); M2 / M3 / M5 (có ghi) ngoài phạm vi; M4 đo hiệu năng để bước sau. DQTV v7 đọc qua bộ đọc chuyển sang khuôn này. Loại TC của PMS (cột «Loại» trong TC.md: chức năng, trạng thái, hiệu năng…) → Txx bằng bảng khai trong `du-an/pms/` (không đoán trong mã). PMS có hai nguồn, mỗi nguồn một bộ đọc: (1) `DOCS/features/F###/UC.md` + `TC.md` — 20 bộ, hơn 200 UC, gần 1.000 TC, 4 cách viết mã (`TC-01`, `TC-F004-001`, tiêu đề cấp 2 hoặc 3, dòng bảng), tất cả đang `status: Draft`; (2) HDSD Phụ lục A (bảng 21 nút × vai) và Phụ lục B (ai xem được gì). Không sinh TC mới. Tool chỉ đọc nên chỉ chấm phần nhìn thấy trước khi ghi (nút có / không, sáng / mờ theo vai và trạng thái, ô và nhãn); bước cần bấm Lưu / gọi API ghi → CHƯA KIỂM «tool chỉ đọc». Bộ thuần STT / âm thanh (F010–F018, F020, F022) không có màn để kiểm → ghi ngoài phạm vi. TC `Draft` vẫn chạy, căn cứ ghi «TC nháp · F### TC-xx» | Node: số TC đọc ra khớp đếm tay từng tệp; DQTV vẫn 21.710 TC sau ghép; trang mẫu: ca của F009 (nút «Kết thúc mục này» có với vai quản trị, không có trong DOM với đại biểu) chấm ĐẠT / LỆCH đúng |
| — | Backlog v7 (mục 8) trong bước 13: CT-01 đã có (bước 4); CT-08 đã có (mắt xích, 10d); CT-04 tách dữ liệu khỏi mã ← 13b; CT-05 khuôn tc[], CT-06 chọn kế hoạch theo Txx / ưu tiên, CT-07 xuất kết quả theo mã TC ← 13f; CT-16 một phần (axe, bước 11). Chưa làm trong bước 13: CT-02 tự kiểm chặn ghi mỗi lần nạp, CT-09/10 đo hiệu năng (M4), CT-11–15 (cần ghi hoặc nhiều tài khoản) | ghi rõ trong mục Trạng thái khi xong 13 |
| 13g | Chạy thật trên lab, chỉ đọc (người dùng chạy): 4 tài khoản trong cuộc họp 87; người dùng gán lại kết quả cho vòng sửa sau | báo cáo từng tài khoản |

Người dùng đã trả lời (07/11): (1) vai chủ tọa theo tài liệu PMS gần như có mọi quyền → chấm theo tài liệu; (2) PMS chưa có TC tự sinh nhưng tài liệu đã có UC (và TC) ở `DOCS/features/` → dùng làm căn cứ; (3) không giữ `dqtv.*`.
Còn chờ: người dùng nói «duyệt» thì bắt đầu từ 13a.

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
- 05/11/2026 (tối): **đưa bộ TC đề xuất 5 quy trình mới vào tool.** Người dùng báo PM cho tự duyệt («tất cả đều có cơ sở chính đáng»).
  - Tệp: `du-an/dqtv/tc/DeXuat_UC_TC_5QT_05112026.zip` = bản chép nguyên `~/Downloads/DeXuat_UC_TC_5QT_05112026.zip` (bản 2, 17:13; trùng từng byte), 1.006 TC, 40 cột như v7. Không sửa tệp.
  - `bo-doc/90-ghep-v7-tai-lieu.js` đọc thêm 2 cách ghi của bộ đề xuất (không có trong 21.425 TC M1 của v7, nên số của v7 không đổi): «mở form, chưa ghi gì» = «mở form»; cột Vai kèm «(thuộc …)» → bỏ phần điều kiện, điều kiện lấy từ tài liệu như TC v7.
  - Kết quả: 285 TC đề xuất thuộc M1 6 loại; chạy 261; không chạy 24 (4 ca sai chặng ở 2.submission vì chặng tài liệu khác app, rà soát 207; 20 ca ở 8.submission vì tài liệu có hai vai cùng tên hiển thị). 721 TC còn lại là M2–M4 / rà tay, tool chỉ đọc nên không chạy. Danh mục sau ghép: 21.710 TC, bảng đối chiếu 104, «Tài liệu chưa có TC v7 nào» rỗng.
  - Tệp dán: `dist` 3.930.771 byte. Phép kiểm: `test_buoc9.py` (sửa số kỳ vọng), `test_dong_goi.py`, `test_buoc5.py`, `test_buoc6.py`, `test_buoc8.py`, `test_buoc7.mjs` đều đạt.
  - Góp ý còn mở cho chủ tệp đề xuất (không ảnh hưởng tool): cột «Mã TC PM 29/10» trống (228 TC dời có mã ở v7), «Lớp kiểm» T25/T26/T27 ghi L1 (v7: LH/L4/L2), tên tệp ở đầu .md, «Người lập».
  - Chưa chạy trên site thật.
- 06/11/2026: **xong bước 10 (10a–10f), đóng gói `dist/dqtv-kiem-tra-3.26.2.js`.** Sao lưu trước bước 10: `~/Downloads/dqtv-kiem-tra-backup-20261106/` (có bản `dist` 3.26.1 cũ).
  - 10a: `luuCkpt` hết chỗ localStorage thì ghi bản đầy đủ vào IndexedDB `dqtv-kiem-tra-ckpt` (`luuCkptLon`, `kho()` của `70-nap.js` thêm tham số tên kho); `dqtv.chay` gặp bản gọn thì đọc lại theo mã lượt `luot` (`docCkptLon`). Điểm dừng giữ thêm `tcKq`, `tcDa`, `koKq`, `koDa`, `koDem` (trước đây mất khi tải lại) và `buocMay`. Không đọc lại được → `muc_mat_ket_qua`, đầu báo cáo ghi đỏ «MẤT KẾT QUẢ KHI TRANG TẢI LẠI». Chạy xong xoá bản ở IndexedDB.
  - 10b: `bo-doc/90` gắn `ma_app` («Mã bước» của tài liệu) vào bước; `ganChu` (`20-cau-hinh.js`) tìm nút gần chữ; `TC_NHAP` cũng dùng `ganChu` khi chữ nút khác tên bước (chỉ khi đúng một bước khớp).
  - 10c: `ghiBuocMay` (`30-loi-kiem.js`) ghi mọi mảng `{action, label, allowed, …}` trong thân phản hồi fetch / XHR, theo đường dẫn màn lúc nhận (`buoc_may_chu`, tối đa 5.000).
  - 10d: `TEN_MX`, `PL_MX`, cột thứ 5 của `LUAT_NN`, `mxNhom` (`50-doi-chieu-dac-ta.js`). «Không thấy nút» không có xác nhận máy chủ → CHƯA KIỂM mắt xích 1 (trước: CẢNH BÁO «ỨNG DỤNG»). Báo cáo: cột «Nguyên nhân → việc tiếp» và bảng nhóm ghi «mắt xích N · tên»; CSV thêm cột «Mắt xích» ở cuối.
  - 10e: 170 TC v7 của bước đã dời (2 → 2.submission 49, 8 → 8.revocation 54, D15 → D15.complaint 51, D15 → D15.submission 16) lấy kết quả theo TC đề xuất (`chay_duoi`, mục «TC v7 của bước đã dời tài liệu» trong «Phủ danh mục TC»); 54 TC dời chưa có TC đề xuất tương ứng giữ lý do «chờ PM». TC đề xuất tương ứng mà không chạy được thì TC v7 mang lý do của nó. 64 TC `viewSecretContent*` không phải bước dời (cùng tên ở nhiều tài liệu), giữ nguyên.
  - 10f: `cong-cu/so_truoc_sau.py` (chỉ đọc hai báo cáo HTML). 03/11 → 05/11 Trợ lý Quân lực: 123 → 42 màn, báo đúng 81 màn mất; 05/11 Chính trị viên so với chính nó: 0 mất.
  - Phép kiểm: `kiem/test_buoc10.py` + `kiem/thu_buoc10.html` (MẪU THỬ) đạt: 7 ca chấm nút / máy chủ / mắt xích; tải lại giữa chừng khi giả hết chỗ → chạy tiếp, đủ 8/8 mục menu; đối chứng xoá bản IndexedDB → báo cáo ghi mục mất kết quả. `test_dong_goi.py` (`SO_B10 = 129`), `test_buoc5/6/8/9.py`, `test_buoc7.mjs` đạt.
  - `PHIEN_BAN` = `3.26.2` (khoá lưu giữ `.v3261`).
  - Chưa chạy trên site thật. Chưa biết: app gọi API hồ sơ trước hay sau khi đổi đường dẫn (nếu trước, danh sách bước ghi theo màn danh sách và không dùng được làm căn cứ: dòng ấy rơi về CHƯA KIỂM, không ra kết luận sai).
  - Việc của người dùng: dán `dist/dqtv-kiem-tra-3.26.2.js` chạy lại 7 tài khoản đợt 05/11 và 10 tài khoản chưa chạy; so từng tài khoản bằng `python3 -I cong-cu/so_truoc_sau.py <báo cáo 05/11> <báo cáo mới>`.
- 06/11/2026: **xong bước 11 (11a, 11b, 11c), đóng gói `dist/dqtv-kiem-tra-3.26.3.js` (4,63 MB).** Sao lưu trước bước 11: `~/Downloads/dqtv-kiem-tra-backup-20261106-b11/` (có `dist` 3.26.2).
  - 11a: axe-core 4.14.0 (`thu-vien/axe-core-4.14.0/`, `npm pack`, sha512 khớp npm) đặt trước khối mã trong `dong_goi.py` (`if (!window.axe)`). `chayAxe` (`30-loi-kiem.js`): mỗi màn trong `audit()` (hộp thoại đang mở thì chỉ hộp thoại), mỗi form trong `moVaQuetForm()`; trừ `#dqtv-panel-host`; không giữ HTML hay bộ chọn của phần tử. Kết quả `kiem_tro_nang`, dòng màn `wcag_loi` (căn cứ chuẩn, mức thấp, mỗi luật một mẫu lỗi), mục báo cáo `htmlTroNang` (`60-bao-cao.js`, tên mục WCAG tiếng Việt). Tắt: `dqtv.dat({ kiemTroNang: false })`.
  - 11b: `bo-doc/90` đưa TC M1 `TRO_NANG` (109 + 5), `KHUNG_CHUNG` (27 + 5), `DAU_VAO` → `O_TIM` (109 + 5) vào danh mục (`dt.ca_gd`; `KHUNG-CHUNG.*` ở bảng `KHUNG`, vai `*`). `50-doi-chieu-dac-ta.js`: `KHUNG_CHAM` (20 TC có phép kiểm), `KHUNG_KHONG` (7 TC không có / nghiệp vụ / chờ việc 3), `chamKhung`; màn của quy trình = mẫu đường dẫn, màn danh sách cùng gốc, hồ sơ có bước máy chủ của quy trình, form đúng chữ nút. Phép kiểm chung khớp TC đổi căn cứ sang `TC v7` (`10-la-chan.js`). Thêm `gio_khong_chuan`, chờ 10 giây khi còn đang tải, mẫu lộ lọt go build / grep / git-CI, so tiêu đề menu bằng nhau.
  - 11c: người rà độc lập (chỉ đọc) báo 10 lỗi chính + 5 lỗi nhẹ, đã kiểm và sửa cả 15: hạ ĐẠT của TC giao diện khi dừng giữa chừng; TRAN_NGANG chỉ chấm ở khổ 1366 / 1920 và luôn còn phần «bảng cuộn»; mẫu AM/PM khớp nhầm «14:30 Chưa xử lý» (bỏ SA/CH, `(?![\p{L}\d])`); TIEU_DE_MENU cần đọc được tiêu đề; O_CO_NHAN gộp ô trong form, chưa mở form → CHƯA KIỂM; COT_TIEU_DE, CCCD_12, KHONG_TREO_TAI, DEM_KHOP, DAU_SAO_BAT_BUOC chỉ ra lệch hoặc CHƯA KIỂM; ô tìm chỉ tính lần thử có mốc «có dấu» ra dữ liệu, bỏ lỗi không thuộc ca; màn sập đã biết chỉ tính khi menu tài khoản có màn đó; bỏ bộ chọn axe; MOT_NUT_CHINH đọc đúng cờ thiết kế; form chỉ nối khi đúng chữ nút; `kiemTroNang` vào KIEU; chỉ dựng dữ liệu chấm khi có TC áp cho tài khoản.
  - Phép kiểm: `kiem/test_buoc11.py` + `kiem/thu_buoc11.html` (MẪU THỬ) đạt: axe bắt đúng 3 lỗi cố ý (1.4.3, 4.1.2, 1.1.1), chấm TRO_NANG / KHUNG-CHUNG / O_TIM / `<quy trình>.KHUNG_CHUNG`, 6 ca của người rà không ra ĐẠT. Sửa kỳ vọng: `test_buoc9.py` (danh mục 21.970 TC, 112 bảng), `test_dong_goi.py` (`SO_B11 = 166`), `test_buoc5.py` (camelCase → căn cứ TC v7; trang mẫu chạy với `kiemTroNang: false`). Mọi `kiem/test_*` và `test_buoc7.mjs` đạt.
  - `PHIEN_BAN` = `3.26.3`. Chưa chạy trên site thật; chưa đo axe làm lần chạy thật lâu thêm bao nhiêu (trang mẫu 3 màn: 2 giây).
  - Việc 3 (nạp quy cách dự án làm căn cứ cho `QUY_CHUAN_GIAO_DIEN`) chưa làm, chờ người dùng.
- 06/11/2026 (sau báo cáo thật Trợ lý Tác huấn 3.26.2 lúc 03:21, 3.26.3 lúc 04:38): **sửa 4 lỗi của tool, ra `dist/dqtv-kiem-tra-3.26.4.js`.**
  - Hai báo cáo: 96 màn như 05/11, 0 TC mất kết quả (`so_truoc_sau.py`); TC có kết quả 676 → 846 → 910; 10 TC CẢNH BÁO → ĐẠT nhờ danh sách bước máy chủ; axe kiểm 127 màn / form.
  - Sửa: (1) `KHUNG-CHUNG.O_CO_NHAN` ra ĐẠT giả khi axe thấy ô không tên (`select-name` ở form «Mở việc theo luật») → gộp luật axe `label`, `select-name`, `aria-input-field-name`; (2) mẫu «IP nội bộ» bắt nhầm số tiền 10.000.000.000 (mức cao giả) → mỗi phần 0–255, không số 0 đứng đầu; (3) `O_TIM` lấy lỗi lộ dữ liệu của màn → bỏ, chỉ xét lần thử ô tìm (lộ dữ liệu đã có `LO_LOT`); (4) «Việc của tôi» bị tính là màn của mọi quy trình có nút ở đó → chỉ bảng KHUNG xét màn việc chung.
  - Không sửa: nút gần chữ còn lỏng (209 dòng, 2 TC SAI_VAI ra CHƯA KIỂM thay vì ĐẠT: sai về phía thận trọng). Bắt trùng chữ đầu sẽ làm hỏng 2 ca ĐẠT đúng có máy chủ xác nhận (`14.B5a/b` «Văn bản cho phép đạn thật»).
  - `test_buoc11.py` thêm ca (1), (4); mọi `kiem/test_*` đạt. `SO_B11 = 167`.
  - Lỡ xoá `dist` 3.26.3 khi đóng gói 3.26.4 mà chưa chép lưu → đã dựng lại từ mã cùng bản: `~/Downloads/dqtv-kiem-tra-backup-20261106-b11c/dist/dqtv-kiem-tra-3.26.3.js` (4.629.265 byte, bằng đúng bản cũ; chỉ khác giờ đóng gói ở dòng đầu).
- 06/11/2026 (sau báo cáo thật Trợ lý Tác huấn 3.26.4 lúc 05:11): **bước 12 — sửa «không thấy ô» giả ở ca nhập ô, ra `dist/dqtv-kiem-tra-3.26.6.js`.** (Tệp `dist/dqtv-kiem-tra-3.26.5.js` là bản 3.26.4 người dùng đã đổi tên lúc 11:50, giữ nguyên; bản mới đánh số 3.26.6 để không đè.)
  - Báo cáo 05:11: 109 TC nhập ô CHƯA KIỂM «không thấy ô». (1) 75 ca: app ghi thêm «· không bắt buộc» sau nhãn ô tuỳ chọn (`libs/ui-lens/action-dialog.jsx` dòng 741), công cụ so nhãn đúng từng chữ với TC («điện thoại» ≠ «Điện thoại · không bắt buộc») → `nhanTruong` bỏ đuôi đó (sửa luôn dòng TRUONG «form có trường không nêu trong đặc tả: … · không bắt buộc»). (2) ca «không thấy ô» bị khoá ở lần mở form đầu: «Ghi diễn biến» mở trước ở Việc của tôi (form việc khác), form đúng ở Ứng phó sự cố không được thử lại → «không thấy ô» ghi nhưng không khoá, form sau có ô thì chạy lại, thay dòng cũ.
  - Còn lại là form thật không có ô (1.B2, 13a.B11, 20.B16: dòng TRUONG cùng báo «form không có trường») — đúng, không sửa.
  - Không làm (người dùng chốt): kiểm kiểu tấn công (XSS/SQL/header) ngoài phạm vi designer; XEM, TUONG_THICH, danh sách nút Xuất/Nhập: ít giá trị.
  - Chứng minh: `test_buoc8.py` thêm 2 ca (nhãn có đuôi, form cùng chữ nút ở màn sau); đối chứng với `30-loi-kiem.js` cũ ra CHƯA KIỂM cả 2 ca. Mọi `kiem/test_*` đạt. `SO_B12 = 5`. Sao lưu trước sửa: `~/Downloads/dqtv-kiem-tra-backup-20261106-b12/`.
- 07/11/2026: **viết Bước 13 (ITA nhiều dự án + gói PMS) — CHỜ DUYỆT, chưa sửa mã.** Trước đó người dùng đã dọn thư mục chỉ còn nhánh 3.26.6 (xoá chưa commit). Chạy lại `kiem/test_*`: 7/8 đạt; `test_buoc7.mjs` cần `~/Downloads/MaTran_UC_TC_DQTV_02112026_v7/tc_all.csv` (thư mục đã giải nén, hiện chỉ có tệp zip) — không phải lỗi tool. Lab: cuộc họp 87 «ITA – cuộc họp mẫu» + tài khoản `ita.*` (id 38–43) đã dựng.
- 07/11/2026: **người dùng duyệt Bước 13; xong 13a–13e.** Sao lưu trước bước 13: `~/Downloads/ita-backup-20261107-truoc-buoc13/`.
  - 13a: `cong-cu/doi_ten_ita.py` (viết lại cho nhánh 3.26.6, 18 luật) đổi `dqtv.*` → `ita.*`, `window.__dqtv*` → `window.__ita*`, khoá lưu `dqtv.*.v3261` → `ita.*.v1`, kho IndexedDB `ita`, `ita-ckpt`; không giữ tên phụ `dqtv.*`. `KHOA_CU = /^dqtv\./` (`ita.donBoNho()` dọn mọi khoá của công cụ cũ). `PHIEN_BAN = '1.0'`. `dong_goi.py`: không `--du-an` → `dist/ita.js` (chỉ máy kiểm), `--du-an dqtv` → `dist/ita-dqtv.js`. `test_dong_goi.py` (5) đổi tên bản 3.26 gốc bằng chính `doi()` trước khi so dòng.
  - 13b: bộ đọc `bo-doc/05-ho-so.js`; `apHoSo()` (20-cau-hinh.js) thay hồ sơ đóng gói bằng hồ sơ đã nạp (tên miền, lệnh được cho qua, chữ riêng dự án); chưa có hồ sơ → `ita.chay` không chạy, mọi POST bị chặn. `kiem/test_buoc13.py` + `thu_buoc13.html`.
  - 13c/13d: tệp mới `may/35-kieu-app.js`: `kieuApp()`; `ghiBuocMay` chỉ chạy khi `kieu_app = rest-buoc` (DQTV, `du-an/dqtv/ho-so.json` thêm dòng này); kiểu `openslides`: sau khi lá chắn bật, đọc nhóm + quyền của tài khoản trong cuộc họp đang mở (who-am-i → JWT userId → autoupdate `?single=1&k=`), ghi `quyen_may_chu`, báo cáo có dòng «Máy chủ». Ô tên tài khoản theo `chon_tai_khoan` của hồ sơ. Đã thử chuỗi đọc thật trên lab bằng `ita.chutoa` (chỉ đọc): nhóm Chủ tọa 353, 12 quyền. Chưa làm: ánh xạ nút ↔ quyền để quyền máy chủ thành căn cứ mắt xích 2 (cần bảng của 13f).
  - 13e: bộ đọc `bo-doc/06-quy-cach.js` (`loai = quy-cach-giao-dien`); `QUY_CACH` thay ngưỡng `chuanDS`, chỉ ra cỡ chữ / bo góc ngoài danh sách được phép, căn cứ «quy cách dự án — <nguồn>». Gói `du-an/pms/`: `ho-so.json` (pms.lab.linksafe.vn, openslides, POST cho qua: đăng nhập, who-am-i, presenter — rà backend không presenter nào ghi; 6 tài khoản ita.*), `quy-cach.json` (openslides-client/CLAUDE.md §3: lưới 2px, cỡ chữ 12/14/16/18/20/24, bo góc 8/10/9999). Không làm `loi-da-biet.json` cho PMS: `DOCS/ERRORS/` là lỗi đã sửa, chưa thấy màn sập còn mở. `kiem/test_buoc13d.py` (máy chủ thử giả who-am-i + autoupdate) + `thu_buoc13d.html`.
  - Phép kiểm: `test_dong_goi.py` 8/8 (`SO_B13A = 5`, `SO_B13B = 10`, `SO_B13CDE = 10`, tệp mới `35-kieu-app.js`), `test_buoc5/6/8/9/10/11/13/13d` đạt. `test_buoc7.mjs` vẫn chưa chạy được (thiếu thư mục v7 đã giải nén).
  - Còn lại: 13f (bộ đọc UC/TC `DOCS/features/` + HDSD Phụ lục A/B theo khung v7; DQTV v7 sang khuôn chung), 13g (người dùng chạy trên lab). Thêm: dùng `dist/ita.js` + «Nạp thư mục» `du-an/dqtv/` chưa đọc được tc/*.zip, `gioi-han-o.json`, `trang-thai-quy-trinh.json`, `loi-da-biet.json` (trước nay chỉ đóng gói) → DQTV dùng `dist/ita-dqtv.js`. `dist/dqtv-kiem-tra-3.26.5.js` không còn trong dist (không do bước 13 xoá; bản lưu ở thư mục sao lưu).
  - Thêm `du-an/HUONG-DAN.md` (07/11, người dùng hỏi): cách làm gói dự án — tệp bắt buộc / không bắt buộc, từng trường của `ho-so.json` và tìm ở đâu, quy trình lập `post_cho_qua` an toàn, khuôn `quy-cach.json`. Nằm ngoài thư mục từng dự án nên «Nạp thư mục» không nạp nó.
