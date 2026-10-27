<!-- Chức năng: Ma trận phân quyền (Admin, Staff, Customer) và yêu cầu chi tiết của từng chức năng -->

# ĐẶC TẢ PHÂN QUYỀN VÀ YÊU CẦU NGHIỆP VỤ (RBAC & SRS REQUIREMENTS)
> **Dự án:** Zen CRM  
> **Căn cứ:** Software Requirements Specification (SRS) - Version 1.1 (iViettech Education, Oct 24, 2019)  
> **Ghi chú:** Tài liệu này trích xuất trực tiếp từ SRS, không bổ sung yêu cầu ngoài SRS.

---

## 1. CÁC TÁC NHÂN HỆ THỐNG (ACTORS)

Có **3 vai trò người dùng** được SRS (Mục 1.4 - Term) định nghĩa chính thức, cùng 2 tác nhân ngầm định:

| Vai trò | Định nghĩa theo SRS | Màu định danh trong code |
| :--- | :--- | :--- |
| **Sales man** | Who is using CRM to manage and follow up customers. They can use phone, social network or website to follow up customers. | `'SALESMAN'` |
| **Sale manager** | Quản lý toàn diện: Khách hàng tiềm năng (Leads), Cơ hội bán hàng (Opportunities), Đơn hàng (Orders), Sản phẩm, Chiến dịch tiếp thị, Dự báo doanh số và Báo cáo thống kê. | `'SALE_MANAGER'` |
| **Administrator** | Who manage users on the CRM system. | `'ADMIN'` |
| *(Ngầm định)* System Timer | Đếm ngược 30 phút bất hoạt để tự động Logout (SRS 5.3) | — |
| *(Ngầm định)* SMTP Service | Gửi email link reset mật khẩu qua dịch vụ thư ngoài (SRS 3.14) | — |

---

## 2. MA TRẬN PHÂN QUYỀN ĐẦY ĐỦ THEO 3 VAI TRÒ (RBAC MATRIX)

> **Nguồn SRS:** Mục 2.1 (Product Features) — phân chia rõ ràng theo 3 phía: "Sale Man Side", "Sale Manager Side", "Administration Side".

### 2.1. Vai trò 1: Nhân viên bán hàng (Sales Man — `SALESMAN`)
*Các tính năng thuộc phía "Sale Man Side" theo SRS 2.1:*

#### Quản lý Khách hàng tiềm năng (Lead Management — SRS 3.1 → 3.5):
| Chức năng | SRS Ref | Mô tả nghiệp vụ |
| :--- | :--- | :--- |
| Thêm Lead mới | SRS 3.1 | Nhập thông tin cá nhân khách hàng (tên, địa chỉ, SĐT, email, ngày sinh, nghề nghiệp...) |
| Xem danh sách Lead | SRS 3.2 | Phân trang **20 bản ghi mới nhất**, sắp xếp theo ngày nhập, lọc theo ngày nhập |
| Tìm kiếm Lead theo tên | SRS 3.3 | Tìm bằng tên hoặc một phần tên, kết quả hiển thị trong danh sách View of Lead |
| Xem chi tiết Lead | SRS 3.2.3 REQ-4 | Hiển thị đầy đủ thông tin + Danh sách Opportunity liên quan; từ đó Sửa, Xóa, Thêm Opp |
| Sửa Lead | SRS 3.4 | Cho phép chỉnh sửa thông tin, mọi dữ liệu mới phải được xác thực |
| Xóa Lead | SRS 3.5 | Xóa bản ghi khỏi CSDL |

#### Quản lý Cơ hội bán hàng (Opportunity Management — SRS 3.6 → 3.12):
| Chức năng | SRS Ref | Mô tả nghiệp vụ |
| :--- | :--- | :--- |
| Thêm Cơ hội mới | SRS 3.6 | Tạo cơ hội gắn với Lead + Sản phẩm quan tâm + Số lượng + Ngày tạo |
| Xem danh sách Cơ hội | SRS 3.7 | Phân trang **20 bản ghi mới nhất**, sắp xếp & lọc theo ngày nhập |
| Tìm kiếm Cơ hội | SRS 3.8 | Tìm theo **tên Lead** hoặc **tên Sản phẩm** |
| Xem chi tiết Cơ hội | SRS 3.7.3 REQ-4 | Hiển thị thông tin + Lịch sử Follow-up; từ đó Sửa, Xóa, Follow-up, Make Order |
| Sửa Cơ hội | SRS 3.9 | Cập nhật thông tin cơ hội, dữ liệu phải được xác thực |
| Xóa Cơ hội | SRS 3.10 | Xóa bản ghi cơ hội khỏi CSDL |
| **Follow up** | SRS 3.11 | Ghi nhận hoạt động tương tác: Ngày, Nội dung, Phản hồi khách hàng, Kế hoạch tiếp theo |
| **Make an Order** | SRS 3.12 | Chuyển Cơ hội thành Đơn hàng: cập nhật trạng thái + Thêm thông tin thanh toán & giao hàng |

#### Quản lý Hồ sơ cá nhân (User Profile — SRS 3.13, 3.14):
| Chức năng | SRS Ref | Mô tả nghiệp vụ |
| :--- | :--- | :--- |
| Đăng nhập | SRS 3.13 | Xác thực tài khoản, nhận JWT Token và vai trò |
| Đăng xuất | SRS 3.13 | Hủy phiên làm việc |
| Cập nhật Profile | SRS 3.13 | Thay đổi thông tin cá nhân (tên, SĐT, mật khẩu) |
| Quên mật khẩu | SRS 3.14 | Nhập email → hệ thống gửi link reset qua SMTP nếu email khớp |

---

### 2.2. Vai trò 2: Quản lý bán hàng (Sale Manager — `SALE_MANAGER`)
*Các tính năng thuộc thẩm quyền của Sale Manager theo SRS 2.1:*  
*Quyền hạn chính: Quản lý toàn diện Khách hàng tiềm năng (Leads), Cơ hội bán hàng (Opportunities), Đơn hàng (Orders), Quản lý Sản phẩm, Chiến dịch tiếp thị, Dự báo & Kế hoạch doanh số 12 tháng, cùng các Báo cáo tổng hợp.*

#### Quản lý Sản phẩm (Product Management — SRS 3.15 → 3.17):
| Chức năng | SRS Ref | Mô tả nghiệp vụ |
| :--- | :--- | :--- |
| Thêm Sản phẩm | SRS 3.15 | Tương tự Add Lead — Thêm sản phẩm vào danh mục |
| Xem danh sách Sản phẩm | SRS 3.15 | Danh sách sản phẩm, tìm kiếm theo tên hoặc mã SP |
| Sửa Sản phẩm | SRS 3.15 | Cập nhật thông tin sản phẩm |
| Xóa Sản phẩm | SRS 3.15 | Xóa sản phẩm khỏi danh mục |
| Xem Cơ hội theo Sản phẩm | SRS 3.16 | Tại chi tiết SP → nhấn "View Opportunity" → liệt kê tất cả Cơ hội liên quan SP đó |
| Xem Đơn hàng theo Sản phẩm | SRS 3.17 | Tại chi tiết SP → liệt kê tất cả Đơn hàng liên quan SP đó |

#### Quản lý Chiến dịch (Campaign Management — SRS 3.18 → 3.19):
| Chức năng | SRS Ref | Mô tả nghiệp vụ |
| :--- | :--- | :--- |
| Thêm Chiến dịch | SRS 3.18 | Nhập: Tên, Mô tả, Ngày bắt đầu, Ngày kết thúc, Ngân sách |
| Sửa / Xóa / Tìm kiếm Chiến dịch | SRS 3.18 | Tương tự Lead Management |
| Gán Sản phẩm vào Chiến dịch | SRS 3.18 | Khi thêm sản phẩm, có thể chọn chiến dịch để gắn sản phẩm vào |
| Báo cáo Hiệu quả Chiến dịch | SRS 3.19 | Thống kê số Lead & Opportunity thu được từ chiến dịch; Xem danh sách Lead từ chiến dịch |

#### Dự báo & Kế hoạch Doanh số (Sale Forecast & Planning — SRS 3.20 → 3.21):
| Chức năng | SRS Ref | Mô tả nghiệp vụ |
| :--- | :--- | :--- |
| Thiết lập Kế hoạch Doanh số | SRS 3.20 | Nhập chỉ tiêu doanh thu dự báo cho 12 tháng trong năm (đơn vị $) |
| Báo cáo Đối soát Plan vs Actual | SRS 3.21 | Bảng đối soát 12 tháng: `Month` \| `Plan($)` \| `Actually Value($)` \| `%` |

#### Hệ thống Báo cáo tổng hợp (Reports — SRS 2.1):
*(SRS ghi chú: "Requirement is not described. You can define them")*
| Chức năng | SRS Ref | Mô tả nghiệp vụ |
| :--- | :--- | :--- |
| Báo cáo Lead | SRS 2.1 | Số lượng Lead theo Ngày hiện tại / Tháng / Năm |
| Báo cáo Đơn hàng | SRS 2.1 | Số lượng Đơn hàng theo Ngày hiện tại / Tháng / Năm |
| Báo cáo Doanh thu theo Sản phẩm | SRS 2.1 | Doanh thu theo Ngày / Tháng / Năm chi tiết theo từng Sản phẩm |

---

### 2.3. Vai trò 3: Quản trị viên (Administrator — `ADMIN`)
*Các tính năng thuộc phía "Administration Side" theo SRS 2.1:*  
*(SRS ghi chú: "Requirement is not described. You can define them")*

| Chức năng | SRS Ref | Mô tả nghiệp vụ |
| :--- | :--- | :--- |
| Xem danh sách tất cả tài khoản | SRS 2.1 | Danh sách toàn bộ User/Role trong hệ thống |
| Tạo tài khoản nhân viên mới | SRS 2.1 | Tạo User mới với thông tin và mật khẩu mặc định ban đầu |
| Reset mật khẩu | SRS 2.1 | Đặt lại mật khẩu cho nhân viên khi gặp sự cố đăng nhập |
| Kích hoạt / Khóa tài khoản | SRS 2.1 | Active hoặc De-active tài khoản nhân viên |
| Gán vai trò | SRS 2.1 | Assign user role: `SALESMAN` hoặc `SALE_MANAGER` |

---

## 3. QUY TẮC RÀNG BUỘC NGHIỆP VỤ ĐẶC THÙ (BUSINESS RULES)

| Mã | Tên quy tắc | SRS Ref | Đặc tả đầy đủ |
| :--- | :--- | :--- | :--- |
| **BR-01** | Trường bắt buộc & Xác thực | SRS 3.1.2 REQ-2, REQ-3 / 3.6.2 REQ-2, REQ-3 | Biểu mẫu phải đánh dấu rõ trường bắt buộc (`*`); Backend validate 100% trước khi INSERT/UPDATE; Trả lỗi HTTP 400 nếu thiếu hoặc không hợp lệ. |
| **BR-02** | Chống trùng lặp (Duplicate) | SRS 3.1.2 REQ-4 / 3.6.2 REQ-4 | Hệ thống phải giúp người dùng **dễ dàng phát hiện** dữ liệu trùng lặp. *(Làm rõ theo phân tích: Lead căn cứ trùng qua `email` hoặc `phone`; Opp căn cứ trùng qua cặp Lead-Product chưa kết thúc)* |
| **BR-03** | Phân trang 20 bản ghi | SRS 3.2.3 REQ-1 / 3.7.3 REQ-1 | Mặc định hiển thị đúng **20 bản ghi mới nhất** trên trang đầu tiên. Hỗ trợ chuyển trang. |
| **BR-04** | Sắp xếp theo ngày nhập | SRS 3.2.3 REQ-2 / 3.7.3 REQ-2 | Người dùng có thể sắp xếp danh sách theo `entered date`. |
| **BR-05** | Lọc theo ngày nhập | SRS 3.2.3 REQ-3 / 3.7.3 REQ-3 | Người dùng có thể lọc danh sách theo `entered date`. |
| **BR-06** | Lịch sử Follow-up hiển thị đầy đủ | SRS 3.11.3 REQ-1 | Lịch sử Follow-up lưu: `date`, `content of follow`, `response of customer`, `next plan`. Hiển thị đầy đủ tại màn hình chi tiết Cơ hội. |
| **BR-07** | Make an Order (Chốt đơn) | SRS 3.12.3 REQ-1 | Chuyển trạng thái Opportunity thành Order + Bổ sung: Ngày chốt, Thông tin thanh toán, Thông tin giao hàng. *(Làm rõ: thực hiện bằng DB Transaction; kiểm tra tồn kho; không xóa bản ghi Opportunity gốc)* |
| **BR-08** | Reset mật khẩu qua Email | SRS 3.14.3 REQ-1, REQ-2 | Nhập email đã đăng ký → hệ thống so khớp → gửi link reset nếu khớp. |
| **BR-09** | Gán Sản phẩm vào Chiến dịch | SRS 3.18.1 | Khi thêm sản phẩm, người dùng **có thể** chọn một chiến dịch để gán sản phẩm vào chiến dịch đó. |
| **BR-10** | Báo cáo Plan vs Actual | SRS 3.21.3 REQ-1 | Bảng đối soát 12 dòng (Tháng 1-12). `%` = *(Actually Value / Plan) × 100*. *(Làm rõ: `Actually Value` = tổng `total_amount` các đơn hàng trong tháng đó)* |
| **BR-11** | Bảo mật phiên làm việc Timeout | SRS 5.3 | Hệ thống tự động Logout nếu **không có hành động nào** trong vòng **30 phút**. Phân quyền theo vai trò. |

---
