# Quy tắc dựng script ITA 5.0 (tách từ DQTV kiểm tra 3.31)

> Dán tệp này vào phiên mới để agent hiểu tool được dựng thế nào, sửa ở đâu, và không được làm gì.
> Thư mục gốc: `~/Downloads/ita-5.0/` (dưới đây mọi đường dẫn tính từ thư mục này).
> Dựng ngày 03/11/2026, đổi tên ITA ngày 05/11/2026 (xem mục 0). Chi tiết từng bước: `PLAN.md`. Mọi phán quyết và lỗi nhỏ để sau: `SO-THEO-DOI.md`.

## 0. Đổi tên ITA 5.0 (05/11/2026)

- Tên công cụ: **ITA**. Lệnh Console chính `ita.*`; `dqtv.*` giữ làm tên phụ (cùng một đối tượng).
- Đã đổi (bằng `cong-cu/doi_ten_ita.py`, không sửa tay): `window.__dqtv*` → `window.__ita*`, `DQTV_CONFIG/MAC_DINH/AUTORUN` → `ITA_*`, `__DQTV_AUDIT` → `__ITA_AUDIT`, `dqtvAudit` → `itaAudit`, nhãn `[dqtv]` → `[ita]`, `#dqtv-panel-host` → `#ita-panel-host`, tên tệp xuất `dqtv-…` → `ita-…`, khoá lưu `dqtv.*.v325/v331` → `ita.*.v50`, `PHIEN_BAN` 3.31 → 5.0.
- KHÔNG đổi (là dữ liệu dự án DQTV, sẽ chuyển vào gói ở bước tách lõi): `tenMienDuocChay` `dqtv.linksafe.vn`, tuyến `/dqtv/…` trong `30-loi-kiem.js` và `50-doi-chieu-dac-ta.js`, `goi-du-an/dqtv`, `KHOA_CU` (dọn khoá DQTV đời cũ).
- Hệ quả: máy đã chạy 3.31 mất cấu hình/điểm dừng đã lưu MỘT lần (khoá mới). Ai đặt `window.DQTV_CONFIG` phải đổi thành `window.ITA_CONFIG`. Phím tắt Alt+Shift+D giữ nguyên.
- Bản 3.31 giữ nguyên ở thư mục riêng cho DQTV nghiệm thu Việc 6.

## 1. Tool này là gì

- Một tệp JavaScript cho mỗi dự án, ghép từ bộ máy chung + gói của dự án đó. Với DQTV: `dist/ita-dqtv-5.0.js` (~6,6 MB), dán vào Console (F12) hoặc Tampermonkey trên `dqtv.linksafe.vn` sau khi đăng nhập.
- Tool đi qua các màn, kiểm hai lớp:
  - **Luật giao diện chung** (chữ cắt, tràn ngang, ô không nhãn, mã chưa dịch, lỗi API…), chấm vào các TC `KHUNG-CHUNG.*` của PM.
  - **Theo quy trình / UC / TC**: đối chiếu đặc tả, chấm theo mã TC của ma trận v7.
- Kết quả ra báo cáo HTML và CSV `ket-qua-ma-tran` (mỗi dòng mang một mã TC có trong v7).
- **Nền là bản 3.26.** Bản 3.31 không viết lại từ đầu: cắt 3.26 thành từng phần, giữ nguyên logic, rồi thêm phần chấm theo ma trận v7.

## 2. Căn cứ (chỉ dùng những nguồn này)

| Nguồn | Dùng làm gì |
|---|---|
| `~/Downloads/dqtv-kiem-tra-dacta-3.26.js` | Nền bộ máy. **Không sửa tệp này.** |
| `~/Downloads/dqtv-kiem-tra-dacta-3.30.js` | Chỉ chép 3 chỗ sửa: T1 chặn ghi, T4 lưới khoảng cách theo token, T5 bớt báo nhầm. Không chép phần danh mục TC (T2, T3). **Không sửa tệp này.** |
| `~/Downloads/MaTran_UC_TC_DQTV_02112026_v7/tc_all.csv` | Bộ TC chuẩn duy nhất của PM: 44.124 TC, trong đó 8.710 TC «chờ PM quyết». |
| `…_v7/CaiTienTool_theo_MaTran_v7.md` | Backlog cải tiến tool (CT-01…CT-16) và sheet «Ánh xạ kết quả». |
| `…_v7/cau_hinh_kiem_hieu_nang.json` | Chép nguyên vào gói. Vòng này chỉ dùng mốc HN-00 (lời gọi > 3 s). |

Không sinh TC từ tài liệu quy trình. PM đã bác bộ TC tự sinh (`DanhMucUC-TC_..._de-xuat.xlsx`).

## 3. Cấu trúc: bộ máy + gói dự án, ghép thành một tệp

```
may/                     BỘ MÁY: logic, không chứa dữ liệu riêng DQTV
  00-mo-dau.js           chú thích đầu, mở IIFE
  05-thuan.js            MỚI ở 3.31: hàm thuần chấm ma trận (kiểm được bằng node)
  10-la-chan.js          lá chắn chặn ghi + tự kiểm lá chắn
  20-cau-hinh.js         cấu hình mặc định, lưu/đọc cấu hình, ép chỉ đọc
  30-loi-kiem.js         lõi kiểm (đi màn, đọc DOM, luật giao diện)
  40-bang-dieu-khien.js  bảng điều khiển + nút
  50-doi-chieu-dac-ta.js đối chiếu đặc tả, phuDanhMucTC
  60-bao-cao.js          báo cáo HTML/CSV, lệnh dqtv.*
  90-khoi-dong.js        nạp cấu hình mẫu, khởi động
goi-du-an/dqtv/          GÓI DỰ ÁN: dữ liệu riêng DQTV
  du-an.json             tên, đường dẫn POST được phép, ánh xạ kết quả, bảng luật → KHUNG-CHUNG
  dac-ta.json            118 bảng đặc tả (cắt từ dòng 3 của 3.26)
  quy-tac.json           quy tắc, lỗi sập đã biết, ca đã đóng (cắt từ dòng 4 của 3.26)
  hieu-nang.json         chép nguyên cau_hinh_kiem_hieu_nang.json
cong-cu/
  tach_326.py            cắt 3.26 thành may/* + 2 tệp json. ĐÃ CHẠY MỘT LẦN, KHÔNG CHẠY LẠI.
  dong_goi.py            ghép gói + tc_all.csv + may/*.js → dist/
kiem/
  test_dong_goi.py       kiểm bước ghép (python, assert)
  test_thuan.mjs         kiểm hàm thuần (node:test)
dist/
  dqtv-kiem-tra-3.31.js  TỆP DUY NHẤT ĐỂ DÁN. Do dong_goi.py sinh ra, không sửa tay.
```

Thứ tự trong `dist` (do `dong_goi.py` quyết, không đổi):
1. Các dòng dữ liệu: `window.__dqtvDuAn`, rồi `__dqtvDacTaNap`, `__dqtvQuyTac`, `__dqtvDanhMucTC`, `__dqtvHieuNang`.
2. Rồi `may/*.js` theo thứ tự tên tệp.

`__dqtvDuAn` phải đứng đầu, vì lá chắn đọc danh sách POST được phép ngay khi nạp. `05-thuan.js` phải đứng trước `10-la-chan.js` vì lá chắn dùng `laPostDuocPhep`.

Cách `tach_326.py` cắt: theo **chuỗi mốc** trong 3.26, không theo số dòng (`0. LÁ CHẮN`, `1. CẤU HÌNH MẶC ĐỊNH`, `4. LÕI KIỂM`, `5. BẢNG ĐIỀU KHIỂN`, `ĐẶC TẢ QUY TRÌNH (UC)`, `/* <<DACTA-HET>> */`, `6. NẠP CẤU HÌNH MẪU`). Chứng minh cắt đúng: ghép lại bằng `--dm-cu <3.26>` thì từ dòng 3 trở đi trùng từng byte với 3.26 (test trong `kiem/test_dong_goi.py`, chạy trên thư mục tạm).

## 4. Quy tắc bất biến: mọi lần sửa đều phải giữ

1. **Chỉ đọc, luôn luôn.** `mucQuyTrinh` bị ép về 1 và `chanGhi` bị ép `true` vô điều kiện (cả khi truyền `false`, `0`, `null`). Chế độ ghi (mức 2, 3) chưa làm.
2. **Chỉ POST tới đúng** các đường dẫn trong `du-an.json` → `duong_dan_xac_thuc` (DQTV: `/api/session`, `/api/search`). So **trọn đường dẫn**: `POST /api/session/extend` hay `/api/search-index/rebuild` phải bị chặn. Thiếu gói thì chặn mọi POST.
3. **Mọi dòng kết quả mang mã TC có trong v7.** Ca tool kiểm mà không có mã thì vào mục «Ngoài danh mục — đề nghị PM thêm TC». Không tự đặt mã.
4. **Chữ kết quả đúng sheet «Ánh xạ kết quả» của v7:**
   - ĐẠT → `Đạt`
   - LỆCH → `Không đạt`
   - CẢNH BÁO → `Không đạt (chờ phân loại)`
   - CHƯA KIỂM → `Chưa chạy được`
   - LỚP 4 → `Chuyển bộ chạy R2/R3`
   - KHONG_VAO_MAN → `Chưa chạy được`
5. **Tool «không thấy» ≠ app thiếu.** Ca `.DUNG` / `.XEM` mà tool không thấy nút ghi `Không đạt (chờ phân loại)`, phân loại «cần xác nhận trên giao diện». Không bao giờ ghi thẳng `Không đạt`.
6. **8.710 TC «chờ PM quyết»** nạp vào gói nhưng không chấm, không tính phủ, ghi `Chờ PM quyết`. 6 TC «GIỮ đến khi lỗi đóng» vẫn tính bình thường.
7. **Không bỏ phép kiểm luật giao diện nào.** Chúng có TC `KHUNG-CHUNG.*` của PM và là phần đã tìm ra lỗi thật (ví dụ `4580,3%`).
8. Không thêm thư viện. Không đổi tên hàm hay lệnh `ita.*` đang có. Tên phụ `dqtv.*` phải luôn trỏ cùng đối tượng với `ita.*` (`window.ita = window.dqtv = {…}`).
9. **Bộ máy (`may/*.js`) dưới 300.000 B** (CT-04). Hiện 299.673 B (sau đổi tên), còn dư khoảng 300 B. Thêm mã thì phải rút chú thích do 3.31 viết, không nới mốc.
10. Báo cáo ghi bản `3.31` và mã băm sha256 (12 ký tự) của từng tệp gói và `tc_all.csv`.
11. Gói thiếu hoặc cũ (`__dqtvDanhMucTC.phien_ban !== 2`): phần ma trận tắt và báo rõ. Phần luật giao diện vẫn chạy.

## 5. Cách đã làm (và cách làm khi sửa tiếp)

**Quy trình:** lập kế hoạch → làm từng việc → kiểm → soát → ghi sổ.
- Viết các bước vào `PLAN.md`, mỗi bước kèm cách chứng minh nó chạy đúng.
- Mỗi việc viết test trước (để thấy đỏ), rồi viết mã, rồi chạy test thấy xanh.
- Mỗi việc có một agent soát riêng (chỉ báo, không sửa). Lỗi soát ra thì sửa theo vòng, mỗi vòng soát lại phần vừa sửa.
- Cuối cùng soát toàn bộ một lần.
- Mỗi quyết định khi tài liệu không nói rõ ghi vào `SO-THEO-DOI.md` theo dạng `Ruling: <quyết gì> — <vì sao> — <sai thì mất gì>`. Lỗi nhỏ để sau ghi `minor (deferred)`.
- Thư mục **không phải kho git**. Không `git init`, không commit nếu người dùng chưa cho. Trước mỗi việc chụp một bản sao để so `diff -ruN`.

**Năm việc đã làm:**

| Việc | Nội dung | Tệp chính |
|---|---|---|
| 1 | Cắt 3.26 thành bộ máy + gói; ghép lại phải ra y nguyên | `cong-cu/*`, `may/*`, `kiem/test_dong_goi.py` |
| 2 | Lá chắn: POST so trọn đường dẫn, ép chỉ đọc; chép T1, T4, T5 từ 3.30 | `05-thuan.js` (`laPostDuocPhep`), `10-la-chan.js`, `20-cau-hinh.js`, `30-loi-kiem.js` |
| 3 | Đóng gói `tc_all.csv` v7 thành danh mục TC bản 2 (nén theo chỉ số, chuẩn hoá vai, kiểm cột, mã băm) | `dong_goi.py`, `hieu-nang.json` |
| 4 | Hàm thuần chấm ma trận: `vaiCuaTaiKhoan`, `chamTheoMaTran`, `chamKhungChung`, `gopKetQua` | `05-thuan.js`, `du-an.json` (`anh_xa_ket_qua`, `luat_khung_chung`) |
| 5 | Nối vào tool: mục báo cáo «Kết quả theo ma trận v7», `dqtv.xuat('ket-qua-ma-tran')`, `dqtv.gopKetQua`, `dqtv.keHoach`, `dqtv.tuKiemChan` | `50`, `60`, `40`, `10`, `90` |
| 6 | Người dùng chạy trên giao diện thật, agent đọc báo cáo | **Chưa chạy** |

**Khi sửa tiếp, theo đúng thứ tự:**
1. Xác định phần cần sửa thuộc **bộ máy** (logic) hay **gói** (dữ liệu DQTV). Dữ liệu riêng dự án đặt trong gói, không viết cứng vào `may/`.
2. Logic chấm mới thì viết ở `may/05-thuan.js` dạng hàm thuần, có test trong `kiem/test_thuan.mjs`. Phần đụng DOM, trang, bảng điều khiển thì nằm ở các tệp `may/` tương ứng.
3. Sửa trong `may/` hoặc `goi-du-an/`, **không sửa `dist/`**.
4. Ghép lại và chạy đủ bộ kiểm ở mục 6.
5. Ghi phán quyết, nếu có, vào `SO-THEO-DOI.md`. Đánh dấu bước trong `PLAN.md`.

## 6. Lệnh ghép và kiểm (chạy từ thư mục gốc)

```bash
# Ghép tệp dán
python3 cong-cu/dong_goi.py --tc ~/Downloads/MaTran_UC_TC_DQTV_02112026_v7/tc_all.csv --ra dist/ita-dqtv-5.0.js

# Kiểm: phải dùng Node 26 (node mặc định của máy là v12, không có --test)
~/.nvm/versions/node/v26.7.0/bin/node --test kiem/test_thuan.mjs   # mong đợi 36/36
python3 -I kiem/test_dong_goi.py                                   # mong đợi 8 dòng "đạt"
~/.nvm/versions/node/v26.7.0/bin/node --check dist/ita-dqtv-5.0.js
du -cb may/*.js | tail -1                                          # phải < 300000
```

Kết quả ngày 04/11/2026: 36/36, 8/8, `--check` OK, bộ máy 299.896 B.

## 7. Lỗi đã biết và việc để sau

- **Nút «Thăm dò» hỏng:** `TypeError: dqtv.thamDo is not a function`. Nút gọi `dqtv.thamDo()` (`may/40-bang-dieu-khien.js:86-90`), nhưng lệnh này không được khai báo. Khối dựng bảng nằm ở `may/30-loi-kiem.js:1115-1125` (`if (C.__thamDo)`), nhưng không có chỗ nào bật nó. Lỗi có từ 3.26 và 3.30. Bản chạy được có trong `~/Downloads/kiemui-v4.js` (hàm ở dòng 1062, xuất ở dòng 1334). **Chưa sửa.**
- Nút «Quét màn này» chưa khoá khi tự kiểm lá chắn KHÔNG ĐẠT (lệnh ghi vẫn bị chặn ở lõi).
- «Đi vòng bộ chặn» vẫn ngừng bấm rồi chạy tiếp như 3.26. Mục 5 của v7 đòi dừng cả lần chạy.
- Chưa làm: đo hiệu năng M4 (CT-09, 10); ghi dữ liệu, ghi lại/phát lại, tải nhẹ, chạy nối tiếp nhiều tài khoản (CT-11…14); kiểm chung bổ sung (CT-16).
- Một số TC `KHUNG-CHUNG` chưa có phép kiểm (`CCCD_12`, `DANH_MUC_VAI`, `GHI_CHU_THEO_CHANG`, `KHONG_CAP_HUYEN`, `LUA_CHON_TRUNG`, `VAN_BAN_KY_NGOAI_HE`…). Chúng ghi `Chưa chạy được — công cụ chưa có phép kiểm`.
- Không có phép kiểm riêng cho mobile. Chạy cùng tệp ở chế độ thiết bị của DevTools thì chỉ các luật chung (tràn ngang, chữ cắt, ô không nhãn…) còn áp.
- Các lỗi nhỏ khác: xem các dòng `minor (deferred)` trong `SO-THEO-DOI.md`.

## 8. Không được làm

- Không sửa `dqtv-kiem-tra-dacta-3.26.js` và `-3.30.js`.
- Không chạy lại `cong-cu/tach_326.py` vào thư mục này. Lệnh đó ghi đè `may/` bằng nội dung 3.26, mất hết phần sửa của 3.31.
- Không sửa tay `dist/`.
- Không nới lá chắn, không thêm đường POST nếu người dùng chưa đồng ý.
- Không bỏ phép kiểm luật giao diện. Không tự đặt mã TC.
- Không coi Việc 6 là đạt khi người dùng chưa chạy và gửi báo cáo.
- Không đụng máy chủ hay nghiệp vụ DQTV. Tool chỉ đọc giao diện.
- `~/Downloads/test-tool/ITA/` là bản người dùng chép ra để tự phát triển riêng. Sửa 3.31 thì không sửa sang ITA, và ngược lại, trừ khi người dùng nói rõ.
