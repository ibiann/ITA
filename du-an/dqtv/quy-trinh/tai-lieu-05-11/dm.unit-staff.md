# dm.unit-staff · dm.unit-staff

<!-- máy sinh: tom-tat -->
> **Hồ sơ:** tên bước, chặng, ô dữ liệu dưới đây là mã trong sổ.
>
> 3 bước · 0 chặng · 2 vai · 0 bảng quyết định · 0 hạn · 0 khớp nối.
>
> **Nguồn:** sổ nghiệp vụ `dm.unit-staff`. Các bảng do máy sinh từ nguồn này.
<!-- hết: tom-tat -->

<!-- viết tay: dien-giai -->
## Diễn giải

*Phần này viết tay, diễn giải lại điều các bảng bên dưới ghi.*

### Quy trình này để làm gì

Đây là danh mục người của đơn vị. Hai bước ghi các ô `person`, `unitCode`, `unitLevel`, `targetSuperiorUnits`; một bước ghi `successorUnit`, `unitValidTo`, `previousOwnerUnit` và đơn vị chủ hồ sơ. Hồ sơ không có chặng; các bước không đổi trạng thái hồ sơ.

### Khi nào bắt đầu

Có ba cửa vào, mỗi cửa là một bước mở hồ sơ: `assignUserToUnit`, `mergeOrgUnit`, `seedUnitStaff`.

### Diễn ra thế nào

Ba bước đứng riêng, không theo thứ tự nào:

- `assignUserToUnit` — do vai `accountAdmin` làm. Bước đòi trước điều kiện `actorManagesUnit` (hệ tự xét): người đang làm là người của đơn vị ghi ở ô `unitCode` của hồ sơ, hoặc là người của một đơn vị nằm trong ô `targetSuperiorUnits` của hồ sơ. Bước ghi `person`, `unitCode`, `unitLevel`, `targetSuperiorUnits`.
- `seedUnitStaff` — Hệ thống tự làm, không do người nào bấm; ghi lại đúng bốn ô như bước trên.
- `mergeOrgUnit` — ghi `successorUnit`, `unitValidTo`, `previousOwnerUnit` và đơn vị chủ hồ sơ.

### Kết thúc và để lại gì

Hồ sơ không có chặng kết thúc: dòng đã ghi nằm lại trong danh mục. Điều kiện `actorManagesUnit` được xét theo chính danh mục này.

### Điều kiện chặn

Chỉ có một điều kiện: `assignUserToUnit` đòi `actorManagesUnit` (nội dung nêu ở trên). Không đạt thì bước bị chặn.
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
**3 cửa vào** — bước mở hồ sơ:

| Bước mở | Ai mở | Hồ sơ vào chặng | App bắt buộc nhập |
|---|---|---|---|
| `assignUserToUnit` | `accountAdmin` | — | — |
| `mergeOrgUnit` | — | — | — |
| `seedUnitStaff` | Hệ thống tự làm | — | — |
<!-- hết: khoi-phat -->

## 4. Vai trò

<!-- máy sinh: vai-tro -->
| Vai trong sổ | Tên trong app | Điều kiện | Làm những bước |
|---|---|---|---|
| `accountAdmin` | `accountAdmin` |  | `assignUserToUnit` |
| `—` | `—` |  | `mergeOrgUnit` |
| `system` | Hệ thống tự làm |  | `seedUnitStaff` |
<!-- hết: vai-tro -->

## 5. Nhánh phụ

<!-- máy sinh: nhanh-phu -->
**Cửa vào khác:** 3 bước cùng mở hồ sơ — xem mục 3.

<!-- hết: nhanh-phu -->

## 6. Các chặng và việc làm ở từng chặng

<!-- máy sinh: chang -->
Hồ sơ này không có chặng — các bước không đổi trạng thái hồ sơ.
<!-- hết: chang -->

## 7. Bảng bước

<!-- máy sinh: buoc -->
| # | Bước | Mã bước | Ai thực hiện | Từ chặng | Sang chặng | Phải có trước | Ghi lại |
|---|---|---|---|---|---|---|---|
| 1 | `assignUserToUnit` | `assignUserToUnit` | `accountAdmin` | — (mở hồ sơ) | giữ nguyên | `actorManagesUnit` | `person`, `unitCode`, `unitLevel`, `citizen` |
| 2 | `mergeOrgUnit` | `mergeOrgUnit` | — | — (mở hồ sơ) | giữ nguyên | — | `successorUnit`, `unitValidTo`, `previousOwnerUnit`, đơn vị chủ hồ sơ |
| 3 | `seedUnitStaff` | `seedUnitStaff` | Hệ thống tự làm | — (mở hồ sơ) | giữ nguyên | — | `person`, `unitCode`, `unitLevel`, `citizen` |

### Khi không đạt điều kiện

Mặc định: không đúng người, hồ sơ không ở đúng chặng, hoặc thiếu thứ "phải có trước" thì bước bị chặn, hồ sơ giữ nguyên. Bảng dưới chỉ kê những bước có kết quả riêng.

| # | Bước | Kết quả riêng |
|---|---|---|
| 3 | `seedUnitStaff` | bước này không do người nào bấm |

### Điều kiện "phải có trước" bằng lời

Cột "Phải có trước" ở bảng bước có hai loại: ô dữ liệu thường (bước chỉ đòi ô ấy đã có giá trị) và điều kiện hệ tự xét. Bảng này diễn các điều kiện hệ tự xét theo đúng công thức sổ ghi; số ở cột cuối là số thứ tự bước.

| Điều kiện | Đúng khi | Bước đòi |
|---|---|---|
| `actorManagesUnit` | người đang làm là người của đơn vị ghi ở ô `unitCode` của hồ sơ này HOẶC là người của một đơn vị nằm trong ô `targetSuperiorUnits` của hồ sơ này (theo danh mục người của đơn vị, `dm.unit-staff`) | 1 |
<!-- hết: buoc -->

## 8. Bảng quyết định, hạn, việc ngoài hệ

<!-- máy sinh: quyet-dinh -->

<!-- hết: quyet-dinh -->

## 9. Dữ liệu của hồ sơ

<!-- máy sinh: du-lieu -->
Các ô mà bước trong sổ ghi hoặc đòi. Số trong hai cột cuối là số thứ tự bước ở bảng bước (mục 7).

| Ô dữ liệu | Mã | Kiểu (app) | Giá trị cho phép | Loại ô (sổ) | Bước ghi | Bước đòi | Mô tả trong app |
|---|---|---|---|---|---|---|---|
| — | `person` |  |  | lưu trên hồ sơ (`stored`) | 1, 3 | — |  |
| — | `unitCode` |  |  | lưu trên hồ sơ (`stored`) | 1, 3 | — |  |
| — | `unitLevel` |  | `commune`, `province`, `region`, `central`, `organization`, `ministry`, `centre`, `facility` | lưu trên hồ sơ (`stored`) | 1, 3 | — |  |
| — | `citizen` |  |  | lưu trên hồ sơ (`stored`) | 1, 3 | — |  |
| — | `successorUnit` |  |  | lưu trên hồ sơ (`stored`) | 2 | — |  |
| — | `unitValidTo` |  |  |  | 2 | — |  |
| — | `previousOwnerUnit` |  |  | lưu trên hồ sơ (`stored`) | 2 | — |  |
| đơn vị chủ hồ sơ | `ownerUnit` |  |  |  | 2 | — |  |
| — | `actorManagesUnit` |  | có hay chưa | hệ suy ra (`derived`) | — | 1 |  |

9 ô. Cột "Loại ô" là cách sổ phân loại ô, in kèm đúng chữ của sổ; ô nào người dùng phải nhập xem bảng "Theo khai báo của app" ở mục 7.
<!-- hết: du-lieu -->

## 10. Khớp nối với quy trình khác

<!-- máy sinh: khop-noi -->
Hồ sơ này không có mối nối với hồ sơ của quy trình khác.
<!-- hết: khop-noi -->

## 11. Thông tin chung

<!-- máy sinh: thong-tin -->
| | |
|---|---|
| **Mã trong sổ** | `dm.unit-staff` |
<!-- hết: thong-tin -->
