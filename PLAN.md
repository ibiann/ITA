# Tool kiểm giao diện DQTV 3.31 — làm lại theo ma trận v7 của PM

> **Cho người/agent thực hiện:** dùng superpowers:subagent-driven-development (khuyên dùng) hoặc superpowers:executing-plans, làm lần lượt từng việc. Đánh dấu `- [ ]` → `- [x]` khi xong một bước. Dừng giữa chừng thì để nguyên tệp này để phiên sau làm tiếp.

**Mục tiêu:** Một tool dán Console / Tampermonkey, nền 3.26, chấm kết quả theo **mã TC của ma trận v7**, gồm hai lớp kiểm (luật giao diện chung + theo quy trình/UC/TC), với dữ liệu dự án tách khỏi bộ máy.

**Kiến trúc:** Cắt 3.26 thành các tệp theo đúng các mục đã có sẵn (không đổi logic), cộng **một tệp hàm thuần mới** (`may/05-thuan.js`) chứa mọi logic ma trận để kiểm được bằng `node`. Dữ liệu riêng của DQTV (đặc tả, quy tắc, danh mục TC v7, hồ sơ dự án, ngưỡng hiệu năng) nằm trong `goi-du-an/dqtv/`. `cong-cu/dong-goi.py` ghép gói + bộ máy thành **một tệp duy nhất** để dán như cũ. Đổi quy trình, đổi dự án, đổi sang mobile thì thay gói và đóng gói lại, không sửa bộ máy.

**Công nghệ:** JavaScript chạy trong trình duyệt (không thư viện ngoài), Python 3.12 thư viện chuẩn (đóng gói, đọc CSV), Node 26 (`node:test`, `node:assert`) để kiểm hàm thuần.

**Căn cứ:** `~/Downloads/MaTran_UC_TC_DQTV_02112026_v7/` (`tc_all.csv`, `CaiTienTool_theo_MaTran_v7.md`, `cau_hinh_kiem_hieu_nang.json`, sheet «Ánh xạ kết quả») và các quyết định ở mục dưới.

## Trạng thái (03/11/2026 14:20)

- Việc 1–5: **xong**. Mỗi việc đều qua một agent soát riêng, cuối cùng soát toàn bộ một lần, lượt sửa sau soát cuối cũng đã được soát lại.
- Kiểm tự động: `node --test kiem/test_thuan.mjs` 36/36, `python3 -I kiem/test_dong_goi.py` 8/8, `node --check dist/dqtv-kiem-tra-3.31.js` OK, bộ máy 299.896 B.
- Việc 6: **chưa chạy**, chờ người dùng chạy trên giao diện thật.
- Mọi phán quyết và lỗi nhỏ để sau: `SO-THEO-DOI.md` (dòng có `Ruling:` và `minor (deferred)`).
- Để vòng sau, ngoài danh sách cuối tệp: nút «Quét màn này» chưa khoá khi tự kiểm hỏng; «đi vòng bộ chặn» vẫn chạy tiếp như 3.26 (v7 mục 5 đòi dừng lần chạy).

## Quyết định đã chốt (02–03/11/2026)

- Bộ TC chuẩn duy nhất là **v7 của PM** (44.124 TC). Không sinh lại TC từ tài liệu quy trình.
- **Nền 3.26.** Từ 3.30 chỉ chép 3 chỗ sửa: T1 (chặn ghi), T4 (lưới khoảng cách theo token), T5 (bớt báo nhầm). Không chép phần danh mục TC (T2, T3) của 3.30.
- **Không bỏ phép kiểm luật giao diện nào.** Các phép này có TC `KHUNG-CHUNG.*` của PM và là phần đã tìm ra lỗi thật (ví dụ 4580,3%).
- **8.710 TC "chờ PM quyết"**: nạp vào gói nhưng không chấm, không tính phủ, ghi «chờ PM». 6 TC "GIỮ đến khi lỗi đóng" vẫn tính bình thường.
- Tool báo "không thấy" thì không bao giờ được hiểu là app thiếu (bài học vụ 362 bước).
- `cau_hinh_kiem_hieu_nang.json`: nạp nguyên tệp vào gói. Vòng này chỉ mốc HN-00 (lời gọi > 3 s) được dùng. Phần đo M4 làm ở vòng sau.
- Phạm vi theo backlog của PM: **vòng này** làm CT-01, 02, 03, 04, 05, 06, 07, 08, 15. **Để sau:** CT-09, 10 (đo M4); CT-11 đến 14 (ghi dữ liệu, ghi lại/phát lại, tải nhẹ, chạy nối tiếp nhiều tài khoản); CT-16 (kiểm chung bổ sung).

## Ràng buộc chung (mọi việc đều phải giữ)

- Chỉ đọc, luôn luôn: `mucQuyTrinh` bị ép về 1. Truyền 2 hoặc 3 thì bỏ qua và in cảnh báo (CT-03, vì chế độ ghi chưa làm).
- Chỉ cho POST tới đúng các đường dẫn trong `du-an.json` → `duong_dan_xac_thuc`. DQTV: `["/api/session", "/api/search"]`. So **trọn đường dẫn**, không so một phần.
- Mọi dòng kết quả xuất ra phải mang **mã TC có trong v7**. Ca tool kiểm mà không có mã thì vào mục «ngoài danh mục — đề nghị PM thêm TC», không tự đặt mã.
- Chữ kết quả ghi đúng như sheet «Ánh xạ kết quả» của v7: ĐẠT → `Đạt`; LỆCH → `Không đạt`; CẢNH BÁO → `Không đạt (chờ phân loại)`; CHƯA KIỂM → `Chưa chạy được`; LỚP 4 → `Chuyển bộ chạy R2/R3`; KHONG_VAO_MAN → `Chưa chạy được`.
- Không thêm thư viện. Không đổi tên hàm hoặc lệnh `dqtv.*` đang có.
- Không sửa `~/Downloads/dqtv-kiem-tra-dacta-3.26.js` và `-3.30.js`. Mọi thứ nằm trong `~/Downloads/dqtv-kiem-tra-3.31/`.
- Bản tool ghi là `3.31`. Báo cáo ghi kèm mã băm (sha256, 12 ký tự đầu) của gói và cấu hình.

## Điểm dễ hỏng cần soát (Review Focus)

1. Lệnh ghi có đường dẫn **bắt đầu bằng** một đường dẫn được phép, ví dụ `POST /api/session/extend` hay `/api/search-index/rebuild`, phải **bị chặn**. Test ở Việc 2.
2. Tài khoản giữ vai **không có trong v7** (ví dụ Ban Chỉ huy Phòng thủ khu vực): báo rõ "0 TC theo vai", nhưng lớp `KHUNG-CHUNG` vẫn phải có kết quả. Test ở Việc 4.
3. Ca `.DUNG` mà tool "không thấy nút": ghi `Không đạt (chờ phân loại)`, phân loại «cần xác nhận trên giao diện». Không bao giờ ghi thẳng `Không đạt`. Test ở Việc 4.
4. TC «chờ PM» mà tool vẫn có kết quả: không chấm, ghi `Chờ PM quyết`, không tính vào tỉ lệ phủ. Test ở Việc 4.
5. Dán bộ máy mà **không có gói**, hoặc gói cũ thiếu trường: phần ma trận báo "chưa nạp gói / gói thiếu trường X" và không chạy. Phần luật giao diện vẫn chạy bình thường. Test ở Việc 3 (khuôn gói) và Việc 5 (bước tay).

---

## Sơ đồ tệp

```
~/Downloads/dqtv-kiem-tra-3.31/
  PLAN.md
  may/                         bộ máy, không chứa dữ liệu riêng DQTV
    00-mo-dau.js               3.26 dòng 6 → trước "0. LÁ CHẮN" (chú thích, mở IIFE, __dqtvNguon)
    05-thuan.js                MỚI: hàm thuần (xem các khối Giao diện), xuất cho node
    10-la-chan.js              mục 0. LÁ CHẮN
    20-cau-hinh.js             mục 1. CẤU HÌNH MẶC ĐỊNH + 2. LƯU / ĐỌC CẤU HÌNH + 3. CỜ ĐIỀU KHIỂN
    30-loi-kiem.js             mục 4. LÕI KIỂM (dqtvAudit giữ nguyên một khối)
    40-bang-dieu-khien.js      mục 5. BẢNG ĐIỀU KHIỂN + lệnh dqtv.* (tới trước "ĐẶC TẢ QUY TRÌNH")
    50-doi-chieu-dac-ta.js     từ khối chú thích "ĐẶC TẢ QUY TRÌNH" tới /* <<DACTA-HET>> */
    60-bao-cao.js              sau <<DACTA-HET>> tới trước "6. NẠP CẤU HÌNH MẪU"
    90-khoi-dong.js            mục 6 tới hết tệp
  goi-du-an/dqtv/
    du-an.json                 hồ sơ dự án: tên, cấu hình đè, đường dẫn xác thực, ánh xạ kết quả, ánh xạ luật → KHUNG-CHUNG
    dac-ta.json                118 bảng đặc tả (3.26 dòng 3)
    quy-tac.json               quy tắc, lỗi sập đã biết, ca đã đóng (3.26 dòng 4)
    hieu-nang.json             chép nguyên cau_hinh_kiem_hieu_nang.json
  cong-cu/
    tach_326.py                cắt 3.26 thành may/* và hai tệp json (chạy một lần)
    dong_goi.py                tc_all.csv + gói + may/* → dist/dqtv-kiem-tra-3.31.js
  kiem/
    test_dong_goi.py           kiểm bước đóng gói (python, assert)
    test_thuan.mjs             kiểm hàm thuần (node:test)
  dist/
    dqtv-kiem-tra-3.31.js      tệp duy nhất để dán Console / Tampermonkey
```

Thứ tự ghép trong `dist`: các dòng dữ liệu (`window.__dqtvDuAn`, `__dqtvDacTaNap`, `__dqtvQuyTac`, `__dqtvDanhMucTC`, `__dqtvHieuNang`, `DQTV_CONFIG`), rồi `may/*.js` theo thứ tự tên tệp.

Thư mục này **không phải kho git**. Muốn lưu từng bước bằng git thì phải hỏi người dùng trước. Mặc định không commit, bước "chốt" của mỗi việc là chạy kiểm.

---

### Việc 1: Tách 3.26 thành bộ máy + gói, ghép lại phải ra y nguyên

**Tệp:**
- Tạo: `cong-cu/tach_326.py`, `cong-cu/dong_goi.py` (bản đầu, chỉ ghép), `kiem/test_dong_goi.py`
- Tạo (do script sinh): `may/00..90-*.js` (trừ `05-thuan.js`), `goi-du-an/dqtv/dac-ta.json`, `goi-du-an/dqtv/quy-tac.json`

**Giao diện:**
- Sinh ra: `python3 cong-cu/dong_goi.py --goi goi-du-an/dqtv --ra dist/x.js [--dm-cu <tệp.js>]`. Có `--dm-cu` thì lấy nguyên dòng `window.__dqtvDanhMucTC` của tệp đó; chỉ dùng để chứng minh ghép lại ra y nguyên.
- `tach_326.py <đường dẫn 3.26>` cắt theo **chuỗi mốc** (không theo số dòng): `0. LÁ CHẮN`, `1. CẤU HÌNH MẶC ĐỊNH`, `4. LÕI KIỂM`, `5. BẢNG ĐIỀU KHIỂN`, `ĐẶC TẢ QUY TRÌNH (UC)`, `/* <<DACTA-HET>> */`, `6. NẠP CẤU HÌNH MẪU`. Mỗi mốc lấy cả dòng `/* ===… *` ngay trên nó. Không thấy mốc nào thì dừng và báo tên mốc đó.

- [ ] **B1: Viết test** `test_ghep_lai_y_nguyen`: chạy tach rồi `dong_goi.py --dm-cu ~/Downloads/dqtv-kiem-tra-dacta-3.26.js`. Assert từ dòng 3 trở đi, `dist/x.js` **trùng từng byte** với 3.26 từ dòng 3 trở đi. Hai dòng đầu là chú thích phiên bản, được phép khác.
- [ ] **B2: Chạy** `python3 -I kiem/test_dong_goi.py` → FAIL (chưa có script).
- [ ] **B3: Viết** `tach_326.py`. Dòng 3 → `dac-ta.json`, dòng 4 → `quy-tac.json` (bỏ tiền tố `window.… = ` và dấu `;` cuối, ghi JSON `ensure_ascii=False`, giữ nguyên thứ tự khoá). Dòng 6 tới hết → `may/*.js` theo mốc.
- [ ] **B4: Viết** `dong_goi.py` bản ghép. Dòng dữ liệu ghi lại **đúng dạng 3.26**: `window.__dqtvDacTaNap = ` + `json.dumps(…, ensure_ascii=False, separators=(',',':'))` + `;`.
- [ ] **B5: Chạy test** → PASS. Ghép không ra y nguyên thì sửa cách ghi JSON (khoảng trắng, thứ tự). Không được sửa bộ so sánh.
- [ ] **B6: Chốt:** `node --check dist/x.js` không lỗi.

### Việc 2: Lá chắn và an toàn (CT-01, CT-03 + chép T1, T4, T5 từ 3.30)

**Tệp:**
- Tạo: `may/05-thuan.js`, `kiem/test_thuan.mjs`, `goi-du-an/dqtv/du-an.json` (bản đầu)
- Sửa: `may/10-la-chan.js` (hàm `ghiChat`), `may/20-cau-hinh.js` (`chuanDS`, `choPhepPost`, hàm `cauHinh` có `Object.assign(... over || {})`), `may/30-loi-kiem.js` (lọc dòng `tbody tr` thêm bỏ dòng Σ; vòng `paddingTop…columnGap` thêm `khoangCach`; dấu `*` do CSS vẽ; lý do bỏ nút `aria-expanded`/`aria-haspopup`), `cong-cu/dong_goi.py` (ghi `window.__dqtvDuAn` trước mọi thứ)

**Giao diện:**
- Sinh ra (trong `05-thuan.js`, gắn vào `window.__dqtvThuan` và `module.exports` khi có `module`):
  - `laPostDuocPhep(method: string, url: string, dsDuongDan: string[], goc: string) → boolean`: chỉ `true` khi method là POST **và** pathname (bỏ query/hash, bỏ một `/` cuối) **bằng đúng** một phần tử `dsDuongDan`.
- `du-an.json` (bản đầu): `{ "ten": "DQTV", "phien_ban_goi": "2026-11-03", "duong_dan_xac_thuc": ["/api/session", "/api/search"], "cau_hinh": { "slowMs": 3000 } }`
- Thứ tự trong `dist`: `05-thuan.js` phải đứng **trước** `10-la-chan.js`, vì lá chắn cài ngay khi nạp.

- [ ] **B1: Viết test** `laPostDuocPhep`:
  - Cho qua: `POST /api/session`, `POST https://dqtv.linksafe.vn/api/search?q=a`, `POST /api/search/`.
  - Chặn: `POST /api/duty-registrations/1/extend-age`, `POST /api/x/extend-deadline`, `POST /api/session/extend`, `POST /api/search-index/rebuild`, `PUT /api/session`, `DELETE /api/search`.
- [ ] **B2: Chạy** `node --test kiem/test_thuan.mjs` → FAIL.
- [ ] **B3: Viết** `laPostDuocPhep`. Trong `ghiChat` của lá chắn và trong `cauHinh`, dùng hàm này với `window.__dqtvDuAn.duong_dan_xac_thuc`. Thiếu gói thì dùng danh sách rỗng, tức là chặn mọi POST.
- [ ] **B4: Ép chỉ đọc (CT-03):** trong `cauHinh`, sau `Object.assign`, nếu `mucQuyTrinh > 1` thì đặt về 1 và `console.warn('[dqtv] 3.31 chỉ chạy chỉ đọc; mucQuyTrinh 2/3 chưa làm (CT-11)')`.
- [ ] **B5: Chép T4, T5** đúng như hunk 3.30 (đối chiếu bằng `diff` hai tệp 3.26/3.30, các hunk có `[3.30]`). `chuanDS`: `coChuToiDa: 8`, `khoangCach: [2, 6, 10, 18, 30, 42]`.
- [ ] **B6: Chạy** test node → PASS. Chạy lại `test_dong_goi.py` (bỏ test byte, vì bộ máy đã đổi có chủ đích) và `node --check dist/x.js`.

### Việc 3: Gói TC v7 trong bước đóng gói (CT-04, CT-05)

**Tệp:**
- Sửa: `cong-cu/dong_goi.py`, `kiem/test_dong_goi.py`
- Tạo: `goi-du-an/dqtv/hieu-nang.json` (chép nguyên)

**Giao diện:**
- Sinh ra: `dong_goi.py --goi goi-du-an/dqtv --tc <tc_all.csv> --ra dist/dqtv-kiem-tra-3.31.js`
- Dạng `window.__dqtvDanhMucTC` (bản 2):
  ```
  { "phien_ban": 2,
    "meta": { "tep": "tc_all.csv", "so_tc": 44124, "bam": "<sha256 12 ký tự>" },
    "vai": [ "<tên vai chuẩn>", … ],
    "loai_ca": [ "<cột Loại ca tool>", … ],
    "bo_chay": [ "<cột Bộ chạy đích>", … ],
    "tc": [ [ma, ma_uc, txx, uu_tien(0 Cao|1 Trung bình|2 Thấp), bo_chay_idx, loai_ca_idx, [vai_idx…], nhom(0 tính|1 chờ PM) ], … ] }
  ```
- `nhom = 1` khi cột «Trạng thái TC» có chữ `chờ PM quyết`.
- Chuẩn hoá vai: `AC-XXX (Tên)` → `Tên`; `tài khoản cùng đơn vị, KHÔNG giữ vai: …` → giữ nguyên chuỗi (vai phủ định, không khớp tài khoản); nhiều vai ngăn bằng `;` hoặc `, ` khi mỗi phần là một vai đã biết → tách.
- Kiểm khuôn khi đóng gói: thiếu cột nào trong `Mã TC, Mã UC, Loại kiểm thử, Ưu tiên, Vai, Bộ chạy đích, Loại ca tool, Trạng thái TC` thì dừng và in tên cột. Mã TC trùng thì dừng và in mã.
- Mã băm: sha256 của từng tệp nguồn (`tc_all.csv`, `du-an.json`, `dac-ta.json`, `quy-tac.json`, `hieu-nang.json`) ghi vào `window.__dqtvDuAn.bam`.

- [ ] **B1: Viết test:**
  - `test_dem_tc`: `so_tc == 44124`, `len(tc) == 44124`, số `nhom==1` == **8710**.
  - `test_giu_6`: 6 TC trạng thái `GIỮ đến khi lỗi đóng` có `nhom==0`.
  - `test_vai_m1`: mọi TC có `bo_chay` bắt đầu `M1`, cột Vai không rỗng, có ít nhất 1 `vai_idx`.
  - `test_thieu_cot`: CSV mẫu bỏ cột `Mã UC` → script thoát mã ≠ 0, thông báo có chữ `Mã UC`.
- [ ] **B2: Chạy** → FAIL.
- [ ] **B3: Viết** phần đọc CSV (`csv.DictReader`, `encoding='utf-8-sig'`), chuẩn hoá vai, nén, mã băm.
- [ ] **B4: Chạy** → PASS. In kích thước `dist`. Dự kiến 6–8 MB. Quá 12 MB thì báo người dùng trước khi làm tiếp.

### Việc 4: Hàm thuần chấm theo ma trận (CT-06, CT-07, CT-08, CT-15)

**Tệp:**
- Sửa: `may/05-thuan.js`, `kiem/test_thuan.mjs`, `goi-du-an/dqtv/du-an.json` (thêm `anh_xa_ket_qua`, `luat_khung_chung`)

**Giao diện (đều trong `05-thuan.js`):**
- `vaiCuaTaiKhoan(taiKhoan: string, dm) → number[]`: chỉ số vai khớp tài khoản. Dùng cách khớp của 3.26 (`chuanDT`: bỏ `*`, gộp khoảng trắng, chữ thường; tài khoản chứa tên vai, tên vai dài hơn 3 ký tự).
- `chamTheoMaTran(ketQuaTool: {ma, kq, dg, nhom?, nguyen_nhan?}[], dm, duAn, taiKhoan: string, loc?: {loai_kiem?: string[], uu_tien?: string[], bo_chay?: string[], quy_trinh?: string[]}) → { dong: DongMaTran[], ngoai_danh_muc: {ma, kq}[], dem: {[ket_qua]: number} }`
  - `DongMaTran = { ma_tc, ma_uc, loai_kiem, ket_qua, phan_loai, ly_do }`
  - Chỉ xét TC thuộc vai của tài khoản (hoặc không ghi vai), có `bo_chay` M1, khớp `loc`.
  - `nhom==1` → `ket_qua: "Chờ PM quyết"`, không đưa vào `dem` phủ.
  - Có kết quả tool cùng mã → đổi chữ theo `duAn.anh_xa_ket_qua`. Không có → `Chưa chạy được`, lý do «công cụ không sinh được kết quả».
  - Mã `.DUNG` và `dg` bắt đầu bằng `không thấy` → `Không đạt (chờ phân loại)`, `phan_loai: "cần xác nhận trên giao diện"`.
  - `phan_loai` cho dòng không đạt (CT-08), theo nhóm của 3.26: `ỨNG DỤNG`, `AUTO` → `lỗi app`; `QUY TRÌNH`, `TC` → `lệch tài liệu Bên B`; `CÔNG CỤ` → `dương tính giả`; `THIẾU` → `môi trường`.
  - Kết quả tool có mã không thuộc v7 → `ngoai_danh_muc`.
- `chamKhungChung(dongMan: object[], timThu: object[], duAn) → {ma, kq, dg}[]`: với mỗi mục trong `duAn.luat_khung_chung` (`{ "ma": "KHUNG-CHUNG.CHU_CAT", "khoa": ["cat_chu_khong_tooltip", "tieu_de_bi_cat"] }`):
  - Không có màn nào đã kiểm → `CHƯA KIỂM`.
  - Có màn mà một khoá không rỗng → `LỆCH`, `dg` = tên các màn (tối đa 5).
  - Còn lại → `ĐẠT`.
  - TC `KHUNG-CHUNG` không có trong bảng ánh xạ → `CHƯA KIỂM`, `dg: "công cụ chưa có phép kiểm"`.
  - Khoá có giá trị mà không thuộc TC nào (`phan_tram_vo_ly`, `nghi_ngo_so_lech`, `chuoi_dai_khong_ngat`, `dinh_dang_so_tron`) → trả thêm dạng `{ma: null, khoa, man}` để vào `ngoai_danh_muc`.
- `gopKetQua(...dsDong: DongMaTran[][]) → DongMaTran[]`: gộp theo `ma_tc`. Ưu tiên `Không đạt` > `Không đạt (chờ phân loại)` > `Đạt` > `Chưa chạy được` > `Chờ PM quyết`. Không trùng, không sót.

**Bảng `luat_khung_chung` ghi vào `du-an.json`** (khoá = tên trường dòng màn của 3.26):

| Mã TC | Khoá |
|---|---|
| `KHUNG-CHUNG.MAN_KHONG_SAP` | màn trong danh sách sập (`SAP`) |
| `KHUNG-CHUNG.LOI_API` | `api_loi`, `rong_nhung_api_loi` |
| `KHUNG-CHUNG.KHONG_TREO_TAI` | `van_dang_tai` |
| `KHUNG-CHUNG.MA_CHUA_DICH` | `ma_enum_lo`, `chu_la` |
| `KHUNG-CHUNG.CHU_CAT` | `cat_chu_khong_tooltip`, `tieu_de_bi_cat` |
| `KHUNG-CHUNG.TIEU_DE_MENU` | `tieu_de_lech_menu` |
| `KHUNG-CHUNG.MOT_NUT_CHINH` | `nut_chinh_nhieu` |
| `KHUNG-CHUNG.THOI_DIEM` | `dinh_dang_ngay_tron` |
| `KHUNG-CHUNG.LO_LOT` | `du_lieu_nhay_cam` |
| `KHUNG-CHUNG.O_CO_NHAN` | `o_khong_nhan` |
| `KHUNG-CHUNG.TRAN_NGANG` | `tran_ngang` |
| `KHUNG-CHUNG.DEM_KHOP` | `so_dong_vuot_tong` |
| `KHUNG-CHUNG.THOI_GIAN_PHAN_HOI` | `api_cham` |
| `KHUNG-CHUNG.QUY_CHUAN_GIAO_DIEN` | tổng hợp thiết kế vượt `chuanDS` (cỡ chữ, màu, bo góc, đổ bóng, lệch lưới) |
| `KHUNG-CHUNG.TIM.KHONG_CO` / `.KHOANG_TRANG` / `.KHONG_DAU` | lần thử ô tìm `không tồn tại` / `thừa khoảng trắng` / `không dấu` (giá trị `ten` trong `giaTriTim`; tên trường kết quả xem `tryInputs` trong `30-loi-kiem.js`) |

- [ ] **B1: Viết test** (dữ liệu giả nhỏ dựng ngay trong test, không đọc gói thật):
  - `cho_pm_khong_cham`: TC `nhom 1` có kết quả ĐẠT → `Chờ PM quyết`, không có trong `dem`.
  - `dung_khong_thay`: `{ma:"1.B1.DUNG", kq:"LỆCH", dg:"không thấy nút …"}` → `Không đạt (chờ phân loại)`.
  - `anh_xa_chu`: LỆCH → `Không đạt`, CẢNH BÁO → `Không đạt (chờ phân loại)`, LỚP 4 → `Chuyển bộ chạy R2/R3`.
  - `ngoai_danh_muc`: mã `9.B9.DUNG` không có trong dm → nằm trong `ngoai_danh_muc`.
  - `vai_khong_co`: tài khoản `BC Ban Chỉ huy Phòng thủ khu vực Tỉnh Hà Tĩnh` → `dong` không có TC theo vai, nhưng `chamKhungChung` vẫn trả đủ TC KHUNG-CHUNG đã ánh xạ.
  - `khung_chung`: 2 màn, một màn có `tran_ngang: "30px"` → `TRAN_NGANG` LỆCH. 0 màn → CHƯA KIỂM. Màn có `phan_tram_vo_ly` → `ma: null`.
  - `loc`: `loc.loai_kiem=["T07"]` → chỉ còn TC T07.
  - `gop`: cùng mã, một lần `Đạt`, một lần `Không đạt` → `Không đạt`. Tổng số mã sau gộp bằng hợp các mã.
- [ ] **B2: Chạy** `node --test kiem/test_thuan.mjs` → FAIL.
- [ ] **B3: Viết** bốn hàm. Thêm `anh_xa_ket_qua` (chép đúng chữ sheet «Ánh xạ kết quả») và `luat_khung_chung` vào `du-an.json`.
- [ ] **B4: Chạy** → PASS.

### Việc 5: Nối vào tool, báo cáo, lệnh xuất (CT-02, CT-07, CT-15)

**Tệp:**
- Sửa: `may/50-doi-chieu-dac-ta.js` (thay ruột `phuDanhMucTC`, giữ tên; `CO_TC` đọc dm bản 2), `may/60-bao-cao.js` (mục báo cáo mới), `may/40-bang-dieu-khien.js` (lệnh), `may/10-la-chan.js` (tự kiểm), `may/90-khoi-dong.js` (kiểm gói khi nạp)

**Giao diện:**
- Dùng: `chamTheoMaTran`, `chamKhungChung`, `gopKetQua`, `laPostDuocPhep` của Việc 2 và 4.
- Sinh ra:
  - `ketQua.ma_tran = { dong, ngoai_danh_muc, dem, bam: window.__dqtvDuAn.bam, ban_tool: "3.31" }` gắn vào kết quả lần chạy, cạnh `phu_danh_muc_tc`.
  - `dqtv.xuat('ket-qua-ma-tran')` → CSV BOM UTF-8, cột: `Mã TC, Mã UC, Loại kiểm thử, Kết quả chạy, Phân loại, Lý do, Thời điểm, Tài khoản, Bản tool, Mã băm gói`.
  - `dqtv.gopKetQua(...chuoiCSV)` → CSV gộp bằng `gopKetQua`.
  - `dqtv.keHoach(loc)` → lưu `loc` cho lần chạy sau. `dqtv.keHoach()` in bộ lọc đang dùng.
  - `dqtv.tuKiemChan() → {dat: boolean, chi_tiet: {kenh, bi_chan}[]}`: thử `fetch`, `XMLHttpRequest`, `form.submit`, `navigator.sendBeacon`, `WebSocket.send` tới đường dẫn giả `/__dqtv_tu_kiem__`, kèm kiểm `navigator.serviceWorker.controller` (có thì cảnh báo). Tự chạy khi nạp. `dat=false` thì nút Chạy bị khoá, có dòng lý do.
- Kiểm gói khi nạp: thiếu `window.__dqtvDuAn`, hoặc `__dqtvDanhMucTC.phien_ban !== 2` → bảng điều khiển ghi «chưa nạp gói dự án / gói cũ». Phần ma trận tắt, phần luật giao diện vẫn chạy.
- Báo cáo HTML: thay mục «Phủ danh mục TC của PM» bằng «Kết quả theo ma trận v7» gồm:
  - Bảng đếm theo `Kết quả chạy`.
  - Bảng `KHUNG-CHUNG`.
  - Mục «Chờ PM quyết» (chỉ đếm).
  - Mục «Ngoài danh mục — đề nghị PM thêm TC».
  - Dòng mã băm gói.

- [ ] **B1:** Viết phần nối. `phuDanhMucTC` giữ tên và chỗ gọi; ruột gọi `chamTheoMaTran` + `chamKhungChung`.
- [ ] **B2: Chốt máy:** `python3 cong-cu/dong_goi.py …` rồi `node --check dist/dqtv-kiem-tra-3.31.js`. Chạy `python3 -I kiem/test_dong_goi.py` và `node --test kiem/test_thuan.mjs` → đều PASS.
- [ ] **B3: Chốt kích thước bộ máy:** tổng `may/*.js` dưới 300 KB (`du -cb may/*.js`).
- [ ] **B4: Soát chữ:** `grep -c "DanhMucTC_DQTV_30102026_tu-sinh" dist/*.js` phải ra 0.

### Việc 6: Chạy thật trên giao diện (người dùng chạy, agent đọc báo cáo)

Agent không đăng nhập được `dqtv.linksafe.vn`, nên **việc này chưa xong cho tới khi người dùng chạy và gửi báo cáo**. Không được coi là đạt khi chưa chạy.

- [ ] **B1:** Người dùng đăng nhập tài khoản **BC Ban Chỉ huy Phòng thủ khu vực Tỉnh Hà Tĩnh** (cùng tài khoản với báo cáo mẫu 01/11), dán `dist/dqtv-kiem-tra-3.31.js`, gõ `dqtv.tuKiemChan()`. Mong đợi `dat: true`, cả 5 kênh `bi_chan: true`.
- [ ] **B2:** Bấm Chạy, tải báo cáo HTML và CSV `ket-qua-ma-tran`.
- [ ] **B3: Agent so với báo cáo mẫu** `~/Downloads/31-10-2026 test/dqtv-bc-ban-chi-huy-phong-thu-khu-vuc-tinh-ha-2026-11-01-17-19.html`:
  - Lỗi `4580,3%` có trong mục «ngoài danh mục».
  - `TIEU_DE_MENU` và `THOI_DIEM` ra `Không đạt`.
  - `MAN_KHONG_SAP` ra `Không đạt` (báo cáo mẫu có 1 màn sập).
  - Không còn báo lệch lưới cho 6px, 10px, 18px.
  - Mọi dòng CSV có mã nằm trong `tc_all.csv` (agent kiểm bằng python).
- [ ] **B4:** Chạy thêm một tài khoản **có vai trong v7**, ví dụ Chỉ huy trưởng Ban CHQS xã. Mong đợi: số «TC theo vai» > 0, và không có dòng `.DUNG` nào ghi thẳng `Không đạt` chỉ vì "không thấy".

---

## Không làm vòng này (ghi lại để khỏi sót)

- Đo hiệu năng M4 (CT-09, CT-10). `hieu-nang.json` đã có trong gói, chờ dùng.
- Ghi dữ liệu M2, ghi lại/phát lại M3, tải nhẹ M5, chạy nối tiếp nhiều tài khoản (CT-11 đến CT-14). Mã `kichBan` / mức 2 của 3.26 để nguyên, không gọi tới được vì đã ép chỉ đọc.
- Gói ngôn ngữ tiếng Anh của kiemui-v4: chưa có dự án tiếng Anh. Chữ riêng của DQTV đè qua `du-an.json` → `cau_hinh` (thành `DQTV_CONFIG`, 3.26 đã đọc sẵn).
- Mobile: chạy cùng tệp trong chế độ thiết bị của trình duyệt. Chưa cần gì riêng.
- TC `KHUNG-CHUNG` chưa có phép kiểm (`CCCD_12`, `DANH_MUC_VAI`, `GHI_CHU_THEO_CHANG`, `KHONG_CAP_HUYEN`, `LUA_CHON_TRUNG`, `VAN_BAN_KY_NGOAI_HE`; một phần `DAU_SAO_BAT_BUOC`, `KHONG_CHON_SAN`, `NUT_KHOA_LY_DO`): ghi `Chưa chạy được — công cụ chưa có phép kiểm`. Thêm sau (CT-16).

## Khi một bước hỏng hai lần

Dừng. Ghi vào đây: bước nào, đã thử gì, lỗi gì. Rồi lập lại kế hoạch cho bước đó trước khi làm tiếp.
