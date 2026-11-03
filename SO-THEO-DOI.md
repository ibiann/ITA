# SDD ledger — plan: /home/trungpch/Downloads/dqtv-kiem-tra-3.31/PLAN.md

Spec: không có tệp spec riêng; căn cứ = CaiTienTool_theo_MaTran_v7.md + mục «Quyết định đã chốt» trong PLAN.md. Phán quyết khi thiếu spec là tạm.

## Soát trước khi chạy
| Cặp / việc | Dùng chung | Thấy gì | Phán quyết |
|---|---|---|---|
| V1–V2 | dong_goi.py, may/10,20,30, test_dong_goi.py | V2 B6 bảo "bỏ test byte" — mâu thuẫn với chứng minh của V1 | Ruling: test byte tách vào thư mục tạm rồi ghép, không phụ thuộc may/ thật → V2 không bỏ test — giữ được chứng minh mãi — nếu sai: test chậm hơn chút |
| V2–V3 | dong_goi.py (V2 thêm __dqtvDuAn, V3 thêm bam + DM) | nối tiếp, không đụng | — |
| V2–V4 | 05-thuan.js, test_thuan.mjs, du-an.json | V4 nối tiếp sau V2 | — |
| V3–V4 | V3: dong_goi.py/test_dong_goi.py/hieu-nang.json; V4: 05-thuan.js/test_thuan.mjs/du-an.json | tệp tách rời; V4 cần dạng DM của V3 | Ruling: chạy V3 và V4 song song (người dùng muốn nhanh), dạng DM chép vào đề bài V4 — nếu sai: phải sửa test giả của V4 |
| V4–V5 | V5 dùng chamTheoMaTran/chamKhungChung/gopKetQua | tên khớp giữa V4 và V5 | — |
| V1 | tự khớp | đề bài nói dist/x.js; V3+ dist/dqtv-kiem-tra-3.31.js | ok, hai tên cho hai mục đích |
| V2 | tự khớp | ghiChat chạy lúc nạp, cần __dqtvDuAn trước → dist ghi dữ liệu trước | ok |
| V3 | tự khớp | test_vai_m1 có thể đỏ vì vai lạ trong v7 | để agent báo, không ép |
| V5 | tự khớp | tuKiemChan ở 10-la-chan, lệnh ở 40-bang-dieu-khien | ok |
| V6 | người dùng chạy | agent không đăng nhập được | Ruling: V6 để người dùng, controller chỉ chuẩn bị hướng dẫn — nếu sai: không có |

Ruling: Không dùng git (thư mục mới, người dùng chưa cho commit); gói duyệt = `diff -ruN` giữa ảnh chụp trước việc và thư mục hiện tại — nếu sai: gói duyệt thiếu lịch sử commit, không ảnh hưởng mã.
Ruling: Việc 6 không giao agent; báo người dùng chạy — nếu sai: không có.

## Tiến độ
Task 1: dispatched (snapshot snap/t1)
Task 1: minor (deferred): tach_326.py:114 chú thích ghi sai thứ tự dòng 3/4/5 (code đúng vì tìm theo tiền tố)
Task 1: minor (deferred): test thiếu mốc chỉ phủ mốc đầu '0. LÁ CHẮN'
Task 1: minor (deferred): mốc khớp bằng 'chứa chuỗi', có kiểm banner nên chỉ dừng chứ không cắt sai
Task 1: complete (snap/t1 → hiện tại, review clean)
Task 2: dispatched (snapshot snap/t2)
Task 2: Ruling: chanGhi:false vẫn mở ghi → ép chanGhi=true cùng chỗ ép mucQuyTrinh, và lọc chanGhi/mucQuyTrinh/moiTruongKiemThu khỏi du-an.json cau_hinh — ràng buộc "chỉ đọc, luôn luôn" là ràng buộc chung — nếu sai: không tắt được chặn khi cần (chưa ai cần ở vòng này)
Task 2: Ruling: sửa luôn Minor 2 (module.exports đè biến trang), Minor 3 (cảnh báo in một lần + sửa lời khuyên sai ở 60-bao-cao.js:77), Minor 4 (DONG_DL cục bộ) trong cùng vòng — rẻ, Minor 2 có thể làm hỏng trang thật — nếu sai: diff to hơn chút
Task 2: minor (deferred): laPostDuocPhep không so origin (3.30 cũng vậy); cần xác nhận API DQTV cùng origin trước khi siết
Task 2: fix round 1/5 (5 addressed, 0 open; snap/t2f1)
Task 2: Ruling: re-review nêu chanGhi:0/null (falsy) qua over/DQTV_CONFIG vẫn tắt chặn → nâng lên Important (vi phạm "chỉ đọc, luôn luôn"), sửa ở vòng 2: epChiDoc đặt chanGhi=true vô điều kiện — nếu sai: không có
Task 2: minor (deferred): choGhiMoiTruong (30-loi-kiem.js:22-23) còn sống nhưng không tới được vì mucQuyTrinh luôn 1
Task 3: dispatched song song với Task 2 vòng 2 (tệp tách rời: dong_goi.py, test_dong_goi.py, hieu-nang.json) (snapshot snap/t3)
Task 2: fix round 2/5 (1 addressed, 0 open; snap/t2f2)
Task 2: minor (deferred): câu cảnh báo 20-cau-hinh.js:225 ghi "chanGhi:false" trong khi giờ bắt cả 0/null/''/thiếu
Task 2: complete (snap/t2 → hiện tại, 2 vòng sửa, review clean)
Task 4: dispatched song song Task 3 (snapshot snap/t4)
Task 3: Ruling: 18 TC M1 trống Vai trong v7 → chấp nhận, test nới đúng 18 mã đó; khi chấm coi là áp cho mọi tài khoản — nếu sai: các TC đó bị tính cho mọi vai
Task 3: Ruling: ~797 TC M1 ghi vai bằng mã máy (personnel, facilityManager…) hoặc "mọi vai ngoài quy trình"/"KHÔNG giữ vai" → không ánh xạ ở bước đóng gói; hàm chấm (Task 4, sửa bổ sung) nhận thêm tham số vaiTheoQT {qt: mã vai tài khoản giữ trong quy trình | null} lấy từ bảng vai đặc tả; TC áp khi vai trống / tên vai khớp tài khoản / mã vai = vaiTheoQT[qt] / vai phủ định hoặc "mọi vai ngoài quy trình" khi vaiTheoQT[qt] null — nếu sai: phủ TC thiếu cho các vai đó
Task 3: minor (deferred): không gộp tên vai gần giống ("Bộ CHQS tỉnh" vs "Bộ CHQS cấp tỉnh", "Trợ lý Quân lực (xã)") — dữ liệu của PM, không tự đặt đồng nghĩa
Task 3: minor (deferred): json.dumps chưa thoát U+2028/2029 và '</' (dữ liệu hiện tại = 0 lần, an toàn)
Task 3: minor (deferred): test_vai_m1 miễn trừ ">= tổng-18" lỏng, nên liệt kê đúng 18 mã
Task 3: minor (deferred): dist/x.js là tệp thử 4,4 MB, xoá trước khi giao
Task 3: minor (deferred): thiếu du-an.json thì mất bản ghi bam
Task 3: complete (snap/t3 → hiện tại, review clean)
Task 4: Ruling: chấp nhận các lựa chọn của người làm — ô tìm chỉ "[cần xác nhận]" → CẢNH BÁO; THỦ CÔNG/thiếu nhom → "chưa phân loại"; loc.quy_trinh loại TC KHUNG-CHUNG; 28 mã KHUNG-CHUNG theo dữ liệu v7 (đề bài ghi 27) — nếu sai: chỉnh nhỏ trong 05-thuan.js
Task 4: amendment gửi trước review: tham số vaiTheoQT (phán quyết Task 3) (snapshot giữ snap/t4)
Task 4: Ruling: vai "mọi vai có tài khoản" và "mọi vai" = áp cho mọi tài khoản; "mọi vai từng có bước" = áp khi vaiTheoQT[qt] là mã vai (khác null/undefined) — dữ liệu v7 dùng các chuỗi này cho TC chung — nếu sai: TC chung bị tính cho tài khoản không liên quan
Task 4: Ruling: MAN_KHONG_SAP — 0 màn đã kiểm → CHƯA KIỂM; màn sập thấy trong lần chạy → LỆCH; chỉ có màn đã biết sập bị bỏ qua (bo_truoc) → CHƯA KIỂM, dg "không mở lại màn đã biết sập: <duong_dan> (<mã lỗi>)"; còn lại → ĐẠT — tool không thấy thì không kết luận — nếu sai: TC này báo "Chưa chạy được" khi UI-01 còn mở
Task 4: Ruling: thêm js_loi vào khoá ngoài danh mục (lỗi JS thật, không TC nào nhận); truong_loi/quy_trinh_loi thuộc lớp đặc tả/kiểm kê trường, chan_ghi là thông tin → không thêm — nếu sai: thiếu vài dòng ngoài danh mục
Task 4: Ruling: Minor 2 (loc.quy_trinh theo luật engine) chỉ thêm chú thích
Task 4: minor (deferred): 'mọi vai, kể cả vai cao nhất cấp xã/tỉnh' (107 TC, 0 thuộc M1) chưa coi là vai chung
Task 4: fix round 1/5 (3 addressed, 0 open; snap/t4f1)
Task 4: Ruling: 109 TC M1 vai "tài khoản cùng cấp với đơn vị chủ hồ sơ" → áp khi vaiTheoQT[qt] là mã vai (đúng luật 3.26 cho «Phạm vi dữ liệu»: ap = !!vaiTheoQT[qt]) — nếu sai: phủ TC phạm vi lệch
Task 4: Ruling: test dm thật đọc dòng window.__dqtvDanhMucTC từ dist/dqtv-kiem-tra-3.31.js (trong thư mục dự án), không đọc tệp tạm — nếu sai: test bỏ qua khi chưa đóng gói
Task 4: Ruling: vaiTheoQT có khoá với giá trị undefined coi như không có (mọi vai từng có bước không áp)
Task 4: fix round 2/5 (3 addressed, 0 open; snap/t4f2)
Task 4: minor (deferred): chú thích quy tắc vaiTheoQT (05-thuan.js:65-66) chưa ghi «cùng cấp» và «mọi vai từng có bước»
Task 4: minor (deferred): test dm thật bỏ qua bằng console.log+return (báo pass, không báo skip); thiếu khẳng định trực tiếp coQT > 0
Task 4: complete (snap/t4 → hiện tại, 2 vòng sửa + 1 bổ sung, review clean)
Task 5: dispatched (snapshot snap/t5)
Task 5: Ruling: B3 vượt 300 KB (310.542 B) → thay khối nhật ký thay đổi ~11 KB đầu 00-mo-dau.js bằng phần đầu ngắn cho 3.31 + dòng trỏ "lịch sử 3.4–3.26: xem dqtv-kiem-tra-dacta-3.26.js" — CT-04 đòi < 300 KB, lịch sử vẫn còn ở tệp 3.26 — nếu sai: mất ghi chú lịch sử trong bản dán
Task 5: Ruling: B4 → xoá khoá meta.danh_muc_tc (tên tệp tự sinh cũ) khỏi goi-du-an/dqtv/quy-tac.json, không mã nào đọc — nếu sai: không có
Task 5: Ruling: chấp nhận — thêm 1 dòng man_quet ở 30-loi-kiem.js; CSV chỉ che cột Lý do/Tài khoản (cheChuoi che nhầm mã v7); WebSocket báo nhưng không tính vào "đạt" của tuKiemChan (lá chắn chỉ chặn WS khi đang mở form, theo thiết kế 3.26); lệnh mới đặt ở 60-bao-cao.js nơi có đối tượng dqtv — nếu sai: chỉnh nhỏ
Task 5: minor (deferred): lưu kết quả ~1 MB/tài khoản hai lần vào localStorage, có thể đầy hạn mức
Task 5: Ruling: Important 1 → gọi phuDanhMucTC cả khi không có doi_chieu_dac_ta (sửa đúng dòng điều kiện ở 30-loi-kiem.js:1714, hàm đã chịu d null) để KHUNG-CHUNG vẫn chấm khi đối chiếu lỗi; 60-bao-cao.js in một dòng đỏ khi không có ma_tran; sửa câu báo trong xuat('ket-qua-ma-tran') cho đúng nguyên nhân — nếu sai: thêm 1 dòng sửa ở 30
Task 5: Ruling: Important 2 → không lưu ma_tran.dong vào localStorage (giữ dem, ngoai_danh_muc, bam, ban_tool); khi xuất mà thiếu dong thì dựng lại bằng phuDanhMucTC từ kết quả đã lưu; nếu không dựng được thì báo rõ — nếu sai: xuất sau tải lại chậm hơn chút
Task 5: Ruling: sửa luôn Minor 3 (tienDo nói lệnh ghi vẫn bị chặn khi tự kiểm hỏng lúc chạy tiếp) và Minor 6 (keHoach từ chối đối số không phải object); hoãn Minor 4, 5, 7
Task 5: minor (deferred): tuKiemChan gọi lúc quetManNay đang chạy → báo KHÔNG ĐẠT sai (hiếm)
Task 5: minor (deferred): beacon chỉ kiểm Navigator.prototype (khớp lá chắn)
Task 5: minor (deferred): gopKetQua không cảnh báo khi CSV khác mã băm gói
Task 5: fix round 1/5 (6 addressed, 0 open; snap/t5f1)
Task 5: minor (deferred): khi dựng lại ma trận lỗi, báo cáo vẫn in tiêu đề KHUNG-CHUNG trống (60-bao-cao.js:36-37)
Task 5: minor (deferred): bộ máy còn dư 27 B dưới mốc 300 KB
Task 5: complete (snap/t5 → hiện tại, 1 vòng sửa, review clean)
Final: dispatched (gói: snap/t2 [sau Việc 1] → hiện tại)
Final: Ruling: sửa Important 1 (.XEM "không thấy" → Không đạt (chờ phân loại) / cần xác nhận trên giao diện) và Important 2 (ngoài danh mục giữ giá trị lỗi, cắt 80 ký tự) — cùng quyết định "tool không thấy ≠ app thiếu" và phép soát Việc 6 — nếu sai: không có
Final: Ruling: giữ mốc bộ máy < 300.000 B (thập phân, chặt hơn) bằng cách rút chú thích do chính 3.31 viết trong 05-thuan.js; không nới thành 307.200 — nếu sai: không có
Final: Ruling: sửa luôn minor lá chắn bản cũ (tuKiemLaChan thử thêm POST /api/session/extend phải 'block', sai thì báo «lá chắn bản cũ: tải lại trang») vì liên quan an toàn; sửa câu «vai không có trong v7» thành «không có TC M1 theo vai trong v7» — nếu sai: thêm vài chục byte
Final: minor (deferred): quetManNay và nút Quét màn này không khoá khi tự kiểm KHÔNG ĐẠT (chặn ghi vẫn do móc lõi)
Final: minor (deferred): v7 mục 5 «Đi vòng bộ chặn → Dừng lần chạy», bộ máy giữ hành vi 3.26 (ngừng bấm, chạy tiếp) — để vòng sau
Final: fix wave dispatched (snapshot snap/fin)
Task 5: final fix wave 1 (4 addressed, 0 open; snap/fin) — Final: complete, review clean
