# Script thử khung «Hỏi đáp» AI (DQTV) — 20/11/2026

Mục tiêu: một script riêng, dán Console, thử khung AI theo tài liệu BA; sau này đưa dần phần chạy tốt sang tool chính (`dqtv-kiem-thu-1.8.js`).

| # | Bước | Cách chứng minh | Trạng thái |
|---|---|---|---|
| 1 | Khung xương `dqtv-ai-thu.js`: bắt luồng `/api/ai/ask`, dò khung theo chữ, gửi 9 câu, ra báo cáo HTML + ảnh | `node --check` + `node thu.test.js` | ✅ chạy (phần thuần) |
| 2 | Chạy thật trên trang, 1 tài khoản: xem dò được nút mở khung, ô nhập, nút gửi chưa | Console in `[AI] ...`, có tệp `ai-thu-*.html` | ⏳ chưa chạy — cần bạn dán |
| 3 | Sửa dò DOM theo `outerHTML` khung trong báo cáo (đặt `CFG.nutMo` nếu cần) | chạy lại ra 9 dòng kết quả | ⏳ |
| 4 | Xác nhận ảnh chụp (xin quyền chụp tab) chạy trong Console | báo cáo có ảnh | ⏳ chưa kiểm |
| 5 | Thêm câu theo vai (xã/tỉnh/quân khu/Cục), AI-1 trong hồ sơ, câu tấn công | đối chiếu `BG2.9_GD1_bo-cau-hoi.json` | sau |
| 6 | Đưa dần sang tool chính | so sánh với v7 TC | sau |

## Chưa biết / không đoán
- Mã khung AI không có trong repo `dqtv-app` → nút mở khung dò theo vị trí (nút nổi góc dưới phải) và nhãn; sai thì đặt `CFG.nutMo`.
- «Byte đầu ≤ 10 s»: BA đo P90 với 50 lượt đồng thời; script chỉ có 1 lượt, nên chỉ là tham khảo («Cần xem», không «Sai»).
- Câu từ chối / hỏi lại / không tìm thấy / ý chính: script không tự chấm, in ý BA mong để người đọc chấm.
- Câu trả lời đúng hay sai về luật không do script quyết.

## Nguồn BA
- `dqtv-docs/docs/giai-phap/phuong-an-2/tang-1-tong-quan/PA2_16_TONG_QUAN_GIAI_PHAP_AI.html` (§0.3 ngưỡng, §4.2 API, kịch bản nghiệm thu)
- `dqtv-docs/docs/danh-gia-ai/bg2.9-gd1/BG2.9_GD1_bo-cau-hoi.json` (226 câu; script lấy 7 câu + 2 câu trong ảnh lỗi)

## Sửa 20/11 (v0.2) — mỗi điểm kiểm phải truy về một dòng BA, không có thì chỉ «Cần xem»
- Đọc tài khoản ở góc phải trên (cùng cách `taiKhoan()` của tool chính), đoán vai từ chữ đơn vị (xã/tỉnh/quân khu/Cục); báo cáo ghi «đoán». Đặt tay bằng `__aiThu.CFG.vai`.
- Bộ câu: 118 câu AI-1 của BA lọc theo vai tài khoản (xã: 46 câu). Không lấy AI-2 (di động), AI-3 (phản ánh), AI-4 (tấn công) — không thuộc khung web này / ngoài phạm vi người thiết kế.
- Câu nhiều lượt: gửi nối tiếp, chấm lượt cuối.
- Kiểm ô nhập (không có dòng BA nên chỉ «Cần xem»): ô rỗng, chỉ dấu cách, bấm gửi 2 lần, ký tự `< > & " '` và emoji, câu rất dài.
- Thêm kiểm «chữ lỗi máy» (`undefined`, `NaN`, `[object Object]`) trong câu trả lời, cùng mẫu tool chính.
- Bản cũ: `dqtv-ai-thu.bak-0.1.js`.
- Chưa chạy trên trang thật; chưa biết: ô chọn ngày tham chiếu (BA có kịch bản hỏi theo ngày quá khứ), câu từ nút «Câu hỏi thường gặp».

## Sửa 20/11 (v0.3) — panel 3 tab như ITA
- Tab Chạy (▶ Chạy · ■ Dừng · ⬇ Tải báo cáo, thanh tiến độ, tài khoản/vai), Cấu hình (vai, phần nào chạy, chụp ảnh, thời gian chờ; tự lưu), Kết quả (đếm Sai/Cần xem/Chưa thử được/Đạt, lọc, bấm dòng xem chi tiết).
- Đã thử trên trang giả (Chrome headless, `localhost`): chạy ra 3 mục, ANH-2 ra «Sai» khi luồng bị cắt, Dừng giữ 3 mục đã xong và bỏ câu dở, 3 tab hiện đúng.
- Chưa thử trên trang DQTV thật.
- Bản trước: `dqtv-ai-thu.bak-0.2.js`.

## Sửa 20/11 (v0.4) — hộp gọn nền trắng góc trái dưới
- Bỏ 3 tab và viền/đầu xanh theo ý người dùng: một hộp trắng, 3 nút (Chạy · Dừng · Tải báo cáo), thanh tiến độ, dòng đếm Sai/Cần xem/Chưa thử được/Đạt, chọn vai, thu gọn ▁, gỡ ✕. Kéo được.
- Cấu hình phần nào chạy / chụp ảnh / thời gian chờ vẫn nằm trong `__aiThu.CFG` (không còn màn chỉnh). Bản 3 tab: `dqtv-ai-thu.bak-0.3-3tab.js`.
- Đã thử trên trang giả (Chrome headless): bấm Chạy ra 3 mục, nút Tải sáng lên. Chưa thử trên trang DQTV thật.

## Sửa 20/11 (v0.5) — đủ như hộp ITA, nền trắng, góc trái dưới
- Trả lại đủ 3 tab (Chạy · Cấu hình · Kết quả) của bản 0.3, đổi kiểu: đầu hộp trắng, không viền/đầu xanh, nút Chạy viền đen, thanh tiến độ xám; thêm nút ✕ Gỡ; đặt góc trái dưới (cao 44 px để khỏi đè thanh trạng thái đáy trang).
- Bản gọn 0.4: `dqtv-ai-thu.bak-0.4-gon.js`; bản 3 tab xanh: `dqtv-ai-thu.bak-0.3-3tab.js`.
- Đã thử trên trang giả (Chrome headless): bấm Chạy ra 3 mục; tab Kết quả đếm đúng, bấm dòng mở chi tiết. Chưa thử trên trang DQTV thật.

## Sửa 20/11 (v0.6) — 4 lỗi làm sai số liệu báo cáo (ghi chú của người dùng)
1. «mang = Đạt» cho HTTP 409/503 → nay «Đạt» chỉ khi HTTP 2xx VÀ luồng kết thúc không lỗi; ngoài ra ghi nhãn mới **«Lỗi hệ thống»** kèm mã HTTP và đầu thân trả về.
2. Chấm «trích dẫn = Đạt» từ câu trả lời cũ → hai gốc: (a) tách chữ mới bằng «chữ cũ nằm ở đầu», sai khi tin nhắn chèn giữa khung, nay so đầu và cuối; (b) không có chữ mới vẫn lấy bong bóng AI cuối làm câu trả lời, nay thành «màn không hiện chữ mới». Mạng lỗi thì không chấm nội dung.
3. «Byte đầu» chấm Đạt → nay đo «chữ đầu hiện trên màn» (0,25 s/lần), chỉ «Ghi nhận» vì 1 lượt không phải P90; vượt 10 s mới «Cần xem».
4. Câu nhiều lượt chỉ chụp/ghi lượt cuối → nay mỗi lượt chấm mạng + nhãn + chữ lỗi và chụp riêng, ghi nguyên chuỗi lượt (câu hỏi, câu trả lời, vết mạng) vào báo cáo; chỉ lượt cuối chấm nội dung theo BA.
- Đã thử: `node thu.test.js` (phần thuần) và trang giả Chrome headless có HTTP 409/503 và câu 2 lượt. Chưa thử trên trang DQTV thật.
- Bản trước: `dqtv-ai-thu.bak-0.5.js`.
