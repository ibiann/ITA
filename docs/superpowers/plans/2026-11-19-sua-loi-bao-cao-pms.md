# ITA 1.7.1 — sửa 8 lỗi báo cáo (lần chạy PMS 18/11) và dọn phần thừa — Kế hoạch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Báo cáo ITA không còn báo nhầm (3 lỗi giả) và không còn làm người đọc hiểu sai (5 chỗ), đo trên 4 báo cáo PMS chạy bằng bản 1.7 ngày 18/11; bỏ phần thừa đã chứng minh được của script (Task 6).

**Architecture:** Chỉ sửa mã của ITA (`may/`), không sửa gì của PMS. Hai hàm nhỏ chuyển ra mức tệp (`may/20-cau-hinh.js`) để thử riêng được; còn lại sửa tại chỗ. Mỗi lỗi có một khẳng định trong một tệp test Chrome mới, viết trước, chạy trượt trên mã 1.7 rồi mới sửa.

**Tech Stack:** JavaScript dán Console (không thư viện mới); test Python + `google-chrome --headless` theo khuôn `kiem/test_ket_luan.py`.

**Spec (căn cứ):** 4 báo cáo `~/Downloads/pms/ita-*-2026-11-18-*.html`; bảng 8 lỗi trong hội thoại 19/11; roadmap quy tắc 4 (chỉ sửa lỗi, không thêm tính năng).

## Global Constraints

- Repo `~/Downloads/ITA-1.7/ITA`, nhánh `dev`. Commit sau mỗi task, **không push** (người dùng tự push).
- Bản **1.7.1**: `PHIEN_BAN` trong `may/20-cau-hinh.js` = mục `## [1.7.1]` trong `CHANGELOG.md` = dòng đầu `dist/*.js`.
- Không thêm phép kiểm mới, không đổi dữ liệu kết quả mà công cụ khác đọc: giữ nguyên các trường `man_cao`, `man_trung_binh`, `man_ghi_nhan` trong kết quả (`cong-cu/so_truoc_sau.py` có thể đọc), chỉ đổi chữ HIỆN.
- Không ghi tên dự án (PMS, DQTV…) vào `may/`; ghi chú tả kiểu web.
- Sau mỗi sửa: đóng gói lại cả 3 bản (`python3 -I cong-cu/dong_goi.py`, `--du-an dqtv`, `--du-an pms`) và `node --check` cả 3.
- Không chạy `kiem/test_buoc8.py`, `kiem/test_buoc9.py` khi kiểm hồi quy (hai test này ghi đè `du-an/dqtv/*.json` trên máy có mã nguồn app); nếu lỡ chạy thì `git checkout -- du-an/dqtv/`.

## Review Focus

1. Đường dẫn API rất dài (> 200 ký tự, nhiều mã số) — báo cáo vẫn đọc được, mã UUID / số vẫn gom về `:id` để một lỗi không thành nhiều dòng.
2. Lỗi JS thật có chữ «ResizeObserver» ở giữa (vd `TypeError: … ResizeObserver is not defined`) — vẫn là lỗi «Sai», chỉ đúng hai câu cảnh báo của trình duyệt mới bị bỏ.
3. Ô tìm ra 0 dòng ở màn A và 7 dòng ở màn B — hai mẫu lỗi khác nhau, không gộp làm một.
4. Nút khoá có chữ «Tiếp theo» nhưng là bước quy trình (vd «Tiếp theo: Trình ký») — vẫn ghi «không ghi lý do», chỉ nút chuyển trang trơn mới được coi là bình thường.
5. Bo góc `0px` ở mọi góc (không bo) — không tính là giá trị bo góc; `50%` chỉ coi là «tròn hẳn» khi quy cách có 9999.

Mỗi dòng có khẳng định ở task sở hữu (đánh dấu **[RF n]**).

---

## Cấu trúc tệp

| Tệp | Sửa gì |
|---|---|
| `may/20-cau-hinh.js` | thêm `LOI_TRINH_DUYET_VO_HAI`, `ngoaiQuyCach(bang, cho)`, `laNutChuyenTrang(ten)`; `PHIEN_BAN = '1.7.1'` |
| `may/30-loi-kiem.js` | `apiErrs` (dòng ~329), `onErr` + `console.error` (~240–247), nút khoá (~1003–1008), gom mẫu `o_nhap` (~2319) và `chan_ghi` (~2310), thiết kế `vuot` (~2340–2350), dòng console cuối (~2421) |
| `may/10-la-chan.js` | thêm khoá `chan_ghi_nut` vào `NGUYEN_TAC` (~dòng 69) |
| `may/60-bao-cao.js` | dòng đầu (~82), khối thiết kế (~18) |
| `may/40-bang-dieu-khien.js` | dòng tóm tắt (~130) |
| `may/70-nap.js` | `apDungNap`: bỏ tệp trùng nội dung (~150) |
| `kiem/test_bao_cao_ro.py` + `kiem/thu_bao_cao_ro.html` | test mới, một lần chạy Chrome |
| `may/90-khoi-dong.js`, `may/00-mo-dau.js`, `cong-cu/dong_goi.py`, `kiem/thu_trinh_duyet.html` | dọn (Task 6) |
| `CHANGELOG.md`, `dist/` | mục 1.7.1, đóng gói lại |

---

### Task 1: Trang thử và test đỏ cho cả 8 lỗi

**Files:**
- Create: `kiem/thu_bao_cao_ro.html`, `kiem/test_bao_cao_ro.py`

**Interfaces:**
- Produces: `chay() -> dict` trong test (khuôn `test_ket_luan.py`: đóng gói `--du-an pms`, `kiem/ban_thu.py:doi_ten_mien`, nối `window.__itaThu = { html: sangHTML, csv: sangCSVMau, ngoaiQuyCach: (typeof ngoaiQuyCach === 'function' ? ngoaiQuyCach : null), laNutChuyenTrang: (typeof laNutChuyenTrang === 'function' ? laNutChuyenTrang : null) }` trước `})();`). Trang ghi `data-kq` gồm `mau`, `html`, `csv`, `bo_qua`, `du_lieu_nap`, `thiet_ke`, `don_vi` (kết quả gọi thẳng hai hàm, `null` nếu chưa có).

- [ ] **Step 1: Viết trang thử** — menu trái 3 mục; màn A có:
  - `fetch('/api/v1/meetings/267f8972-4236-42cd-bbbd-98be928a1b2c/context')` trả 404 (máy chủ thử `http.server` không có tệp này → 404 sẵn);
  - sau khi tải: `window.dispatchEvent(new ErrorEvent('error', { message: 'ResizeObserver loop completed with undelivered notifications.' }))` và `… { message: 'TypeError: ResizeObserver is not defined' }`;
  - ô `<input type=search placeholder="Tìm">` lọc bảng 3 dòng, không có chữ báo trống;
  - hai nút khoá `<button disabled>← Trước</button>`, `<button disabled>Tiếp theo →</button>` và `<button disabled>Tiếp theo: Trình ký</button>`;
  - phần tử có `border-radius: 0px 0px 12px 12px`, `50%`, `0px`, `999px`.
  Trước `ita.chay`: `await ita.napTep([new File([QC], 'quy-cach.json'), new File([HS], 'ho-so.json'), new File([HS], 'pms/ho-so.json')])` với `QC = {"loai":"quy-cach-giao-dien","nguon":"thử","co_chu_px":[12,14,16],"bo_goc_px":[8,10,9999]}`, `HS` = hồ sơ có `ten_mien: "127.0.0.1"`.

- [ ] **Step 2: Viết khẳng định** (tên trong comment đầu tệp):

```python
# 1 đường dẫn đủ, mã gom về :id
assert any(m['loai'] == 'api_loi' and '/api/v1/meetings/:id/context' in m['chi_tiet'] for m in k['mau'])
assert all('98be928' not in m['chi_tiet'] or ':id' in m['chi_tiet'] for m in k['mau'])
# 2 dòng đầu không còn mức cũ
assert not re.search(r'cao \d+, trung bình \d+', k['html'])
# 3 cảnh báo ResizeObserver không là lỗi; lỗi thật có chữ ResizeObserver vẫn là Sai   [RF 2]
js = [m for m in k['mau'] if m['loai'] == 'js_loi']
assert not any('loop completed' in m['chi_tiet'] for m in js)
assert any('ResizeObserver is not defined' in m['chi_tiet'] and m['ket_luan'] == 'Sai' for m in js)
# 4 «0 dòng» giữ số 0
assert any(m['loai'] == 'o_nhap' and '0 dòng' in m['chi_tiet'] for m in k['mau'])
assert not any(m['loai'] == 'o_nhap' and 'N dòng nhưng' in m['chi_tiet'] for m in k['mau'])
# 6 bo góc: chỉ 999px ngoài quy cách                                                   [RF 5]
assert k['don_vi']['ngoai'] == ['999px'], k['don_vi']
# 7 nút chuyển trang khoá = bình thường; nút bước quy trình khoá vẫn «không ghi lý do»  [RF 4]
bq = {b['chu']: b['ly_do'] for b in k['bo_qua']}
assert 'bình thường' in bq['← Trước'] and 'bình thường' in bq['Tiếp theo →']
assert 'không ghi lý do' in bq['Tiếp theo: Trình ký']
# 8 hồ sơ cùng nội dung chỉ liệt kê một lần
assert sum(1 for x in k['du_lieu_nap'] if x['bo_doc'] == 'ho-so') == 1
```

  `k['don_vi']` = `{ ngoai: __itaThu.ngoaiQuyCach({'0px 0px 12px 12px':1,'50%':1,'0px':1,'999px':1,'10px':1}, [8,10,9999]) }`. Lỗi 5 (nhãn `chan_ghi`) kiểm ở Task 4 bằng trang có nút gửi ngay.

- [ ] **Step 3: Chạy, xác nhận trượt trên mã 1.7**

Run: `python3 -I kiem/test_bao_cao_ro.py`
Expected: `AssertionError` ở khẳng định số 1 (chi_tiet còn bị cắt ở 60 ký tự).

- [ ] **Step 4: Commit** — `git add kiem/thu_bao_cao_ro.html kiem/test_bao_cao_ro.py && git commit -m "Test 1.7.1: 8 lỗi báo cáo từ lần chạy PMS (đỏ trên 1.7)"`

### Task 2: Chữ trên báo cáo — đường dẫn đủ, bỏ mức cũ, giữ số 0 (lỗi 1, 2, 4)

**Files:** Modify `may/30-loi-kiem.js` (~329, ~2319, ~2421), `may/60-bao-cao.js` (~82), `may/40-bang-dieu-khien.js` (~130).

**Interfaces:**
- Consumes: `demHien(ds)` có sẵn ở `may/10-la-chan.js` (trả `"Sai 9 · Cần xem 12"`).

- [ ] **Step 1:** `apiErrs`: bỏ `.slice(0, 60)`, thay bằng `.slice(0, 200)` (đường dẫn đã bỏ phần `?`). **[RF 1]**: thêm vào test một fetch 404 tới đường dẫn 250 ký tự, khẳng định `chi_tiet` ≤ 200 ký tự và vẫn có `:id`.
- [ ] **Step 2:** gom `o_nhap` (~2319): `.replace(/\d+/g, 'N')` → `.replace(/\b(?!0\b)\d+/g, 'N')`. **[RF 3]**: trang thử thêm ô lọc thứ hai ra 7 dòng → khẳng định hai mẫu `o_nhap` khác `chi_tiet`.
- [ ] **Step 3:** dòng đầu `60-bao-cao.js:82`: thay `cao ${kq.man_cao}, trung bình ${kq.man_trung_binh}, cần xem ${kq.man_ghi_nhan || 0}` bằng `${kq.man_co_van_de} màn có vấn đề`; `40-bang-dieu-khien.js:130`: `cao …, TB …` → `${kq.man_co_van_de} có vấn đề`; console `30-loi-kiem.js:2421`: `(cao: …, TB: …)` → `(' + demHien(mau_loi) + ')'`. Giữ nguyên các trường dữ liệu.
- [ ] **Step 4:** Run `python3 -I kiem/test_bao_cao_ro.py` → khẳng định 1, 2, 4 qua (các số sau còn trượt).
- [ ] **Step 5:** Commit `Báo cáo: đường dẫn API không cắt ở 60 ký tự, bỏ chữ mức cũ ở dòng đầu, gom mẫu lỗi giữ số 0`.

### Task 3: Lỗi giả — cảnh báo trình duyệt, bo góc, nút chuyển trang (lỗi 3, 6, 7)

**Files:** Modify `may/20-cau-hinh.js`, `may/30-loi-kiem.js` (~240–247, ~1003–1008, ~2347).

**Interfaces:**
- Produces (mức tệp, `may/20-cau-hinh.js`):
  - `LOI_TRINH_DUYET_VO_HAI = /^(JS: )?ResizeObserver loop (completed with undelivered notifications|limit exceeded)\.?$/` — so trên cả câu, không so «chứa».
  - `ngoaiQuyCach(bang: {giaTri: n}, cho: number[]) -> string[]` — tách từng phần cách bởi khoảng trắng; bỏ phần `0`/`0px`; `50%` (và phần ≥ 9999px) tính là 9999 khi `cho` có 9999; trả các khoá còn phần không thuộc `cho`.
  - `laNutChuyenTrang(ten: string) -> boolean` — `true` chỉ khi cả nhãn là chữ chuyển trang (`trước`, `trang trước`, `sau`, `trang sau`, `tiếp`, `tiếp theo`, `previous`, `prev`, `next`) có thể kèm mũi tên `← → ‹ › « » < >`; nhãn có thêm chữ khác (`Tiếp theo: Trình ký`) → `false`.

- [ ] **Step 1:** Viết ba thứ trên ở `may/20-cau-hinh.js`.
- [ ] **Step 2:** `onErr` và `console.error` (~240–247): thông điệp khớp `LOI_TRINH_DUYET_VO_HAI` → `nk('bỏ qua cảnh báo trình duyệt', msg)` và `return` trước `ERR.push`.
- [ ] **Step 3:** thiết kế (~2347): thay `ngoaiQC` nội bộ bằng `ngoaiQuyCach`.
- [ ] **Step 4:** nút khoá (~1003): nếu `laNutChuyenTrang(tenNut(e))` → chỉ `skipped.push({ man, chu: tenNut(e), ly_do: 'nút chuyển trang đang khoá (đang ở trang đầu / cuối) — bình thường' })`, không `ghiTruong`, `return`.
- [ ] **Step 5:** Run `python3 -I kiem/test_bao_cao_ro.py` → khẳng định 3, 6, 7 qua.
- [ ] **Step 6:** Commit `Bỏ 3 lỗi giả: cảnh báo ResizeObserver, bo góc 0px / 50%, nút chuyển trang khoá`.

### Task 4: Nhãn đúng cho thiết kế và lệnh ghi (lỗi 5, 6b)

**Files:** Modify `may/10-la-chan.js` (~69), `may/30-loi-kiem.js` (~2310, ~2340–2350), `may/60-bao-cao.js` (~18); thêm vào `kiem/thu_bao_cao_ro.html` một nút `Có mặt` gọi `fetch('/system/action', {method:'POST'})` khi bấm (không mở form).

**Interfaces:**
- Produces: `dsKq.vuot_quy_cach: string[]` (Sai — trái giá trị được phép của quy cách dự án) và `dsKq.vuot_nguong: string[]` (Cần xem — ngưỡng đếm `chuanDS` của công cụ, kể cả khi đã nạp quy cách, trừ khoá quy cách tự khai trong `QUY_CACH.chuanDS`); giữ `dsKq.vuot_chuan = [...vuot_quy_cach, ...vuot_nguong]` cho bảng điều khiển và dữ liệu cũ.

- [ ] **Step 1: Thêm khẳng định**

```python
cg = [m for m in k['mau'] if m['loai'] == 'chan_ghi' and m['chi_tiet'].startswith('[công cụ bấm')]
assert cg and all('Màn chỉ xem' not in m['nguyen_tac'] for m in cg)
assert 'Sai — lệch quy cách dự án' in k['html'] and 'Cần xem — vượt ngưỡng công cụ' in k['html']
```

- [ ] **Step 2:** Run → trượt.
- [ ] **Step 3:** `NGUYEN_TAC.chan_ghi_nut = 'Nút gửi lệnh ghi ngay khi bấm: cần hỏi xác nhận hoặc mở form'`; trong nhánh `chan_ghi` (~2310), mẫu có `chi_tiet` bắt đầu `[công cụ bấm` thì gán `o.nguyen_tac = NGUYEN_TAC.chan_ghi_nut` (giữ `loai`, kết luận, căn cứ).
- [ ] **Step 4:** tách `vuot` (~2340–2350) thành hai danh sách như Interfaces; `60-bao-cao.js:18` in hai khối: «Sai — lệch quy cách dự án» (chỉ khi `vuot_quy_cach` có phần tử) và «Cần xem — vượt ngưỡng công cụ».
- [ ] **Step 5:** Run `python3 -I kiem/test_bao_cao_ro.py` → đạt hết trừ khẳng định 8.
- [ ] **Step 6:** Commit `Nhãn đúng: lệnh ghi do công cụ bấm nút gửi ngay; tách lệch quy cách dự án khỏi ngưỡng đếm của công cụ`.

### Task 5: Dữ liệu nạp trùng nội dung chỉ dùng và liệt kê một lần (lỗi 8)

**Files:** Modify `may/70-nap.js` (~150, vòng `for (const t of ds)` trong `apDungNap`).

- [ ] **Step 1:** Trước vòng lặp: bỏ tệp có cùng `bo_doc` + `bam` với tệp khác, giữ tệp `luc` mới nhất (so theo thứ tự trong `ds` nếu `luc` trùng).
- [ ] **Step 2:** Run `python3 -I kiem/test_bao_cao_ro.py` → đạt toàn bộ.
- [ ] **Step 3:** Commit `Nạp: hai tệp cùng loại cùng nội dung chỉ dùng và liệt kê một lần`.

### Task 6: Dọn phần thừa đã chứng minh được (không bỏ năng lực nào)

Đo ngày 19/11 trên `dist/chung/ita.js` (1.136.110 byte):

| Phần | Byte | Tỉ lệ | Xử lý |
|---|---|---|---|
| axe-core 4.14.0 (đã nén sẵn, `thu-vien/`) | ~693.000 | 61 % | Giữ — là phép kiểm WCAG |
| Máy kiểm (`may/`) | ~443.000 | 39 % | Trong đó ghi chú ~81.000 |
| Ghi chú nguyên dòng trong bản đóng gói | 58.131 | 5 % | Bỏ khi đóng gói (bước 4), nguồn `may/` giữ nguyên |
| Hàm khai mà không dùng | 0 | — | Rà bằng tên: chỉ `caiLaChan`, `keo` — là hàm tự gọi, không thừa |
| `dist/rieng/ita-dqtv.js` 4,7 MB | ~3,6 MB là TC + tài liệu đóng gói | — | Giữ — là dữ liệu dự án, không phải mã |

Chỉ bỏ thứ **không còn nơi nào sinh ra hoặc trùng việc** với thứ khác; mỗi mục có bằng chứng:

**Files:** Modify `may/90-khoi-dong.js`, `may/10-la-chan.js` (~112–113), `may/60-bao-cao.js` (~137, ~160–161), `may/00-mo-dau.js`, `cong-cu/dong_goi.py`, `kiem/thu_trinh_duyet.html` (~15).

- [ ] **Step 1: Bỏ đường nạp đặc tả cũ `window.__itaDacTaNap`** (`90-khoi-dong.js` ~17–18). Bằng chứng: không bản đóng gói nào sinh dòng này (`grep -c "__itaDacTaNap =" dist/**/*.js` = 0; `test_dong_goi.py` còn khẳng định nó KHÔNG có). Bỏ luôn trường `co_DacTaNap` ở `kiem/thu_trinh_duyet.html`.
- [ ] **Step 2: Bỏ `KHONG_LUU` / `locLuu`** (`10-la-chan.js` ~112–113, chỗ dùng ở `60-bao-cao.js` ~137, ~156). Bằng chứng: ba khoá `chanGhi`, `mucQuyTrinh`, `moiTruongKiemThu` đã bị `KHOA_KHOA` (`20-cau-hinh.js` ~222) từ chối từ bản 1.2 — hai lớp chặn cùng một việc. Thay `locLuu(over)` bằng `over` sau khi xác nhận `locHopLe` đã lọc `KHOA_KHOA` trước khi lưu; nếu chưa lọc thì giữ `locLuu` và ghi lý do.
- [ ] **Step 3: Bỏ dòng xoá «điểm dừng dùng chung của bản trước»** (`60-bao-cao.js` ~160–161). Bằng chứng: từ bản 1.0 (đổi `dqtv.*` → `ita.*`) điểm dừng luôn lưu theo tài khoản (`ckptKey()`), khoá trơn `ita.ckpt.v1` không còn được ghi.
- [ ] **Step 4: Đóng gói bỏ ghi chú nguyên dòng** (`cong-cu/dong_goi.py`, chỉ phần máy kiểm, không đụng axe và dữ liệu): bỏ dòng mà phần đầu là `//`, và khối `/* … */` bắt đầu ở đầu dòng (trừ `/*!` giấy phép). Không đụng ghi chú cuối dòng (có thể nằm trong chuỗi / mẫu HTML). Kiểm: `node --check` 3 bản; khẳng định mới trong `kiem/test_dong_goi.py` hoặc `test_bao_cao_ro.py`: bản đóng gói nhỏ hơn bản trước ≥ 50.000 byte và vẫn có `/*! axe`.
- [ ] **Step 5: Rút `may/00-mo-dau.js`** (10.503 byte, toàn ghi chú lịch sử 3.x — «Bản 3.6 THÊM», «[S4] Khóa lưu riêng…») còn ≤ 20 dòng: ITA là gì, thứ tự tệp `may/`, lệnh chính, trỏ `CHANGELOG.md` / roadmap. Lịch sử đã có trong git và CHANGELOG.
- [ ] **Step 6:** Run toàn bộ test như Task 7 bước 3 (lệnh ở đó) → không test nào đổi kết quả so với trước Task 6.
- [ ] **Step 7:** Commit `Dọn: bỏ đường nạp đặc tả cũ, lớp chặn khoá trùng, xoá điểm dừng cũ, ghi chú khi đóng gói (−~60 KB)`.

**Không tự bỏ — chờ người dùng quyết** (là năng lực còn dùng được, bỏ thì mất một cột ở ma trận năng lực):
- `window.ITA_MAC_DINH` (tệp cấu hình mẫu từ bản 3.5; nay có bộ cấu hình và hồ sơ dự án).
- Bộ lệnh dán đặc tả `ita.napDacTa / xemDacTa / xoaDacTa / vaiDacTa` (nay có «Nạp thư mục»).
- Ghi kịch bản bằng tay `ita.ghi / dungGhi`.
- Ghi chú lịch sử trong thân mã (`[3.5]`, `[S1]`, `[1.1]`… ~145 chỗ): đã bỏ khỏi bản đóng gói ở bước 4; rút trong nguồn là việc riêng, nhiều rủi ro, ít lợi.

### Task 7: Bản 1.7.1, hồi quy, đóng gói

**Files:** Modify `may/20-cau-hinh.js` (`PHIEN_BAN`), `CHANGELOG.md`, `dist/chung/ita.js`, `dist/rieng/ita-dqtv.js`, `dist/rieng/ita-pms.js`.

- [ ] **Step 1:** `PHIEN_BAN = '1.7.1'`; thêm `## [1.7.1] — <ngày> · GĐ 8–9 · sửa lỗi báo cáo từ lần chạy PMS 18/11` liệt kê 8 lỗi (mỗi dòng: báo cáo ghi gì → thực tế → sửa ở đâu) và kết quả test.
- [ ] **Step 2:** Đóng gói 3 bản; `node --check` cả 3; dòng đầu mỗi bản ghi `bản 1.7.1`.
- [ ] **Step 3:** Hồi quy — mọi `kiem/test_*.py` trừ `test_buoc8`, `test_buoc9`:

Run: `for t in kiem/test_*.py; do case $t in *buoc8*|*buoc9*) continue;; esac; echo "$t: $(timeout 400 python3 -I $t 2>&1 | tail -1 | cut -c1-90)"; done; git status --short du-an/`
Expected: mọi dòng «đạt», trừ `test_dong_goi` (thiếu 3.26 gốc, như trước); `du-an/` không đổi. Test nào trước đó đạt mà nay trượt vì chữ hiện đổi (`cao …, trung bình …`, «N dòng») → sửa kỳ vọng, ghi `[1.7.1]` cạnh chỗ sửa.

- [ ] **Step 4:** Commit `Bản 1.7.1: đóng gói lại, CHANGELOG` — không push.

---

## Ngoài kế hoạch (chờ người dùng)

- **Cảnh báo tab bị ẩn** (Thư ký: mục Bóc băng 1.482 giây, axe ~26 giây/lần, một lần chờ 60 giây): chờ người dùng xác nhận lúc chạy có chuyển tab / máy ngủ không. Nếu có: kế hoạch riêng (đo `document.visibilityState`, ghi «tab ẩn X giây — số đo thời gian không tin được» vào bảng thời gian).
- Giả mất mạng trên app dùng WebSocket: roadmap GĐ 10.
