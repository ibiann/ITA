# dm.militia-unit

<!-- máy sinh: tom-tat -->
> **Hồ sơ:** tên bước, chặng, ô dữ liệu dưới đây là mã trong sổ.
>
> 2 bước · 2 chặng · 1 vai · 1 bảng quyết định · 0 hạn · 0 khớp nối.
>
> **Nguồn:** sổ nghiệp vụ `dm.militia-unit`. Các bảng do máy sinh từ nguồn này.
<!-- hết: tom-tat -->

## 1. Đường đi ngắn nhất qua các chặng

<!-- máy sinh: luong-chinh -->
Đường ít bước nhất từ lúc mở hồ sơ tới chặng kết thúc xa nhất. Máy chọn theo số chặng, không theo ý nghĩa nghiệp vụ — trình tự công việc thật xem phần Diễn giải và bảng "Việc làm ở từng chặng" ở mục 6.

| # | Ai làm | Làm gì | Hồ sơ sang chặng |
|---|---|---|---|
| 1 | Hệ thống tự làm | `establishMilitiaUnit` | `ESTABLISHED` |
| 2 | Hệ thống tự làm | `disbandMilitiaUnit` | `DISBANDED` |

```mermaid
flowchart LR
    S0(["Mở hồ sơ"])
    S1["ESTABLISHED"]
    S0 -->|"establishMilitiaUnit"| S1
    S2["DISBANDED"]
    S1 -->|"disbandMilitiaUnit"| S2
```
<!-- hết: luong-chinh -->

## 2. Hồ sơ và việc nó để lại

<!-- máy sinh: muc-tieu -->
Không có bước tạo hồ sơ nào của quy trình khác nối về hồ sơ này.
<!-- hết: muc-tieu -->

## 3. Khởi phát và kết thúc

<!-- máy sinh: khoi-phat -->
**1 cửa vào** — bước mở hồ sơ:

| Bước mở | Ai mở | Hồ sơ vào chặng | App bắt buộc nhập |
|---|---|---|---|
| `establishMilitiaUnit` | Hệ thống tự làm | `ESTABLISHED` | — |

**Kết thúc:** *`ESTABLISHED`* (`ESTABLISHED`), *`DISBANDED`* (`DISBANDED`)
<!-- hết: khoi-phat -->

## 4. Vai trò

<!-- máy sinh: vai-tro -->
| Vai trong sổ | Tên trong app | Điều kiện | Làm những bước |
|---|---|---|---|
| `system` | Hệ thống tự làm |  | `establishMilitiaUnit` · `disbandMilitiaUnit` |
<!-- hết: vai-tro -->

## 5. Nhánh phụ

<!-- máy sinh: nhanh-phu -->
Không có bước nào ngoài luồng chính.
<!-- hết: nhanh-phu -->

## 6. Các chặng và việc làm ở từng chặng

<!-- máy sinh: chang -->
| Chặng | Tên hiển thị | Vào bằng bước | Kết thúc? |
|---|---|---|---|
| `ESTABLISHED` | — | `establishMilitiaUnit` | **kết thúc** — vẫn còn bước làm được |
| `DISBANDED` | — | `disbandMilitiaUnit` | **kết thúc** |

```mermaid
stateDiagram-v2
    state "ESTABLISHED" as s0
    state "DISBANDED" as s1
    [*] --> s0: establishMilitiaUnit
    s0 --> s1: disbandMilitiaUnit
    s0 --> [*]
    s1 --> [*]
```

### Việc làm ở từng chặng

Hồ sơ đang ở chặng nào thì làm được những bước nào.

| Hồ sơ đang ở chặng | Bước làm tại chặng (hồ sơ đứng yên) | Bước đưa hồ sơ sang chặng khác |
|---|---|---|
| **`ESTABLISHED`** | — | `disbandMilitiaUnit` — Hệ thống tự làm → *`DISBANDED`* |
| **`DISBANDED`** | — | — (kết thúc) |
<!-- hết: chang -->

## 7. Bảng bước

<!-- máy sinh: buoc -->
| # | Bước | Mã bước | Ai thực hiện | Từ chặng | Sang chặng | Phải có trước | Ghi lại |
|---|---|---|---|---|---|---|---|
| 1 | `establishMilitiaUnit` | `establishMilitiaUnit` | Hệ thống tự làm | — (mở hồ sơ) | `ESTABLISHED` | — | `id`, `unitType`, `unitStatus`, đơn vị chủ hồ sơ, nối `dossierEstablishedUnit` |
| 2 | `disbandMilitiaUnit` | `disbandMilitiaUnit` | Hệ thống tự làm | `ESTABLISHED` | `DISBANDED` | — | `unitStatus`, `disbandedAt` |

### Khi không đạt điều kiện

Mặc định: không đúng người, hồ sơ không ở đúng chặng, hoặc thiếu thứ "phải có trước" thì bước bị chặn, hồ sơ giữ nguyên. Bảng dưới chỉ kê những bước có kết quả riêng.

| # | Bước | Kết quả riêng |
|---|---|---|
| 1 | `establishMilitiaUnit` | bước này không do người nào bấm |
| 2 | `disbandMilitiaUnit` | bước này không do người nào bấm |

### Điều kiện "phải có trước" bằng lời

Cột "Phải có trước" ở bảng bước có hai loại: ô dữ liệu thường (bước chỉ đòi ô ấy đã có giá trị) và điều kiện hệ tự xét. Bảng này diễn các điều kiện hệ tự xét theo đúng công thức sổ ghi; số ở cột cuối là số thứ tự bước.

Không bước nào đòi điều kiện hệ tự xét — mọi thứ "phải có trước" đều là ô dữ liệu thường.
<!-- hết: buoc -->

## 8. Bảng quyết định, hạn, việc ngoài hệ

<!-- máy sinh: quyet-dinh -->
**Bảng `unit-standing-from-type`** — xét ở bước *—*; đầu vào: `unitType`. 3 dòng, dòng đầu tiên khớp thì dừng.

| Thứ tự dò (số sổ ghi) | Dòng | Khi | Thì |
|---|---|---|---|
| — | `not-standing` | `unitType` là `local` hoặc `mobile` hoặc `maritime` hoặc `specialist` | `not_standing` |
| — | `standing` | `unitType` là `standing` | `standing` |
| — | `type-unset` | chưa có `unitType` | `not_standing` |

<!-- hết: quyet-dinh -->

## 9. Dữ liệu của hồ sơ

<!-- máy sinh: du-lieu -->
Các ô mà bước trong sổ ghi hoặc đòi. Số trong hai cột cuối là số thứ tự bước ở bảng bước (mục 7).

| Ô dữ liệu | Mã | Kiểu (app) | Giá trị cho phép | Loại ô (sổ) | Bước ghi | Bước đòi | Mô tả trong app |
|---|---|---|---|---|---|---|---|
| — | `id` |  |  | lưu trên hồ sơ (`stored`) | 1 | — |  |
| — | `unitType` |  | `local`, `mobile`, `standing`, `maritime`, `specialist` | lưu trên hồ sơ (`stored`) | 1 | — |  |
| — | `unitStatus` |  | `ESTABLISHED`, `DISBANDED` | lưu trên hồ sơ (`stored`) | 1, 2 | — |  |
| đơn vị chủ hồ sơ | `ownerUnit` |  |  | lưu trên hồ sơ (`stored`) | 1 | — |  |
| — | `disbandedAt` |  |  | lưu trên hồ sơ (`stored`) | 2 | — |  |

5 ô. Cột "Loại ô" là cách sổ phân loại ô, in kèm đúng chữ của sổ; ô nào người dùng phải nhập xem bảng "Theo khai báo của app" ở mục 7.
<!-- hết: du-lieu -->

## 10. Khớp nối với quy trình khác

<!-- máy sinh: khop-noi -->
Hồ sơ này không có mối nối với hồ sơ của quy trình khác.
<!-- hết: khop-noi -->

## 11. Thông tin chung

<!-- máy sinh: thong-tin -->
| | |
|---|---|
| **Mã trong sổ** | `dm.militia-unit` |
<!-- hết: thong-tin -->
