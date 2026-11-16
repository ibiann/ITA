# dm.mobilization-product · dm.mobilization-product

<!-- máy sinh: tom-tat -->
> **Hồ sơ:** tên bước, chặng, ô dữ liệu dưới đây là mã trong sổ.
>
> 2 bước · 0 chặng · 2 vai · 0 bảng quyết định · 0 hạn · 0 khớp nối.
>
> **Nguồn:** sổ nghiệp vụ `dm.mobilization-product`. Các bảng do máy sinh từ nguồn này.
<!-- hết: tom-tat -->

<!-- viết tay: dien-giai -->
## Diễn giải

*Phần này viết tay, diễn giải lại điều các bảng bên dưới ghi.*

### Quy trình này để làm gì

Hồ sơ mang mã `dm.mobilization-product`, có năm ô: `productCode`, `productKind` (nhận `weapon_equipment` hoặc `technical_material`), `productName`, `unitOfMeasure`, `catalogueBasis`. Hồ sơ không có chặng: các bước không đổi trạng thái hồ sơ.

### Khi nào bắt đầu

Có hai bước mở hồ sơ:

- `addMobilizationProduct` — vai `ministryStaff` làm.
- `seedMobilizationProducts` — Hệ thống tự làm, không do người nào bấm.

Cả hai ghi cùng năm ô trên: `productCode` là ô lưu trên hồ sơ, bốn ô còn lại là ô đưa vào ở bước. Không bước nào đòi gì trước.

### Diễn ra thế nào

Hồ sơ chỉ có hai bước mở nêu trên; sau khi mở không còn bước nào làm tiếp.

### Kết thúc và để lại gì

Hồ sơ không chuyển chặng; mỗi lần mở để lại một hồ sơ với năm ô đã ghi.

### Điều kiện chặn

Không bước nào có điều kiện phải có trước hay kết quả chặn riêng.
<!-- hết viết tay -->

## 1. Đường đi ngắn nhất qua các chặng

<!-- máy sinh: luong-chinh -->
Hồ sơ không chuyển chặng — xem bảng bước ở mục 7.
<!-- hết: luong-chinh -->

## 2. Hồ sơ và việc nó để lại

<!-- máy sinh: muc-tieu -->
Không có bước tạo hồ sơ nào của quy trình khác nối về hồ sơ này.
<!-- hết: muc-tieu -->

## 3. Khởi phát và kết thúc

<!-- máy sinh: khoi-phat -->
**2 cửa vào** — bước mở hồ sơ:

| Bước mở | Ai mở | Hồ sơ vào chặng | App bắt buộc nhập |
|---|---|---|---|
| `addMobilizationProduct` | `ministryStaff` | — | — |
| `seedMobilizationProducts` | Hệ thống tự làm | — | — |
<!-- hết: khoi-phat -->

## 4. Vai trò

<!-- máy sinh: vai-tro -->
| Vai trong sổ | Tên trong app | Điều kiện | Làm những bước |
|---|---|---|---|
| `ministryStaff` | `ministryStaff` |  | `addMobilizationProduct` |
| `system` | Hệ thống tự làm |  | `seedMobilizationProducts` |
<!-- hết: vai-tro -->

## 5. Nhánh phụ

<!-- máy sinh: nhanh-phu -->
**Cửa vào khác:** 2 bước cùng mở hồ sơ — xem mục 3.

<!-- hết: nhanh-phu -->

## 6. Các chặng và việc làm ở từng chặng

<!-- máy sinh: chang -->
Hồ sơ này không có chặng — các bước không đổi trạng thái hồ sơ.
<!-- hết: chang -->

## 7. Bảng bước

<!-- máy sinh: buoc -->
| # | Bước | Mã bước | Ai thực hiện | Từ chặng | Sang chặng | Phải có trước | Ghi lại |
|---|---|---|---|---|---|---|---|
| 1 | `addMobilizationProduct` | `addMobilizationProduct` | `ministryStaff` | — (mở hồ sơ) | giữ nguyên | — | `productCode`, `productKind`, `productName`, `unitOfMeasure`, `catalogueBasis` |
| 2 | `seedMobilizationProducts` | `seedMobilizationProducts` | Hệ thống tự làm | — (mở hồ sơ) | giữ nguyên | — | `productCode`, `productKind`, `productName`, `unitOfMeasure`, `catalogueBasis` |

### Khi không đạt điều kiện

Mặc định: không đúng người, hồ sơ không ở đúng chặng, hoặc thiếu thứ "phải có trước" thì bước bị chặn, hồ sơ giữ nguyên. Bảng dưới chỉ kê những bước có kết quả riêng.

| # | Bước | Kết quả riêng |
|---|---|---|
| 2 | `seedMobilizationProducts` | bước này không do người nào bấm |

### Điều kiện "phải có trước" bằng lời

Cột "Phải có trước" ở bảng bước có hai loại: ô dữ liệu thường (bước chỉ đòi ô ấy đã có giá trị) và điều kiện hệ tự xét. Bảng này diễn các điều kiện hệ tự xét theo đúng công thức sổ ghi; số ở cột cuối là số thứ tự bước.

Không bước nào đòi điều kiện hệ tự xét — mọi thứ "phải có trước" đều là ô dữ liệu thường.
<!-- hết: buoc -->

## 8. Bảng quyết định, hạn, việc ngoài hệ

<!-- máy sinh: quyet-dinh -->

<!-- hết: quyet-dinh -->

## 9. Dữ liệu của hồ sơ

<!-- máy sinh: du-lieu -->
Các ô mà bước trong sổ ghi hoặc đòi. Số trong hai cột cuối là số thứ tự bước ở bảng bước (mục 7).

| Ô dữ liệu | Mã | Kiểu (app) | Giá trị cho phép | Loại ô (sổ) | Bước ghi | Bước đòi | Mô tả trong app |
|---|---|---|---|---|---|---|---|
| — | `productCode` |  |  | lưu trên hồ sơ (`stored`) | 1, 2 | — |  |
| — | `productKind` |  | `weapon_equipment`, `technical_material` | đưa vào ở bước (`input`) | 1, 2 | — |  |
| — | `productName` |  |  | đưa vào ở bước (`input`) | 1, 2 | — |  |
| — | `unitOfMeasure` |  |  | đưa vào ở bước (`input`) | 1, 2 | — |  |
| — | `catalogueBasis` |  |  | đưa vào ở bước (`input`) | 1, 2 | — |  |

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
| **Mã trong sổ** | `dm.mobilization-product` |
<!-- hết: thong-tin -->
