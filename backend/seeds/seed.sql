BEGIN;

-- Làm sạch dữ liệu cũ
TRUNCATE TABLE sale_forecasts, orders, follow_ups, opportunities, leads, products, product_categories, campaigns, users, roles RESTART IDENTITY CASCADE;

-- -----------------------------------------------------------------------------
-- 1. BẢNG ROLES 
-- -----------------------------------------------------------------------------
INSERT INTO roles (id, name, description) VALUES
(1, 'ADMIN', 'Quản trị viên toàn quyền hệ thống'),
(2, 'SALE_MANAGER', 'Quản lý toàn diện: Khách hàng tiềm năng, Cơ hội bán hàng, Đơn hàng, Sản phẩm, Chiến dịch tiếp thị, Dự báo doanh số và Báo cáo thống kê'),
(3, 'SALESMAN', 'Nhân viên kinh doanh');

-- -----------------------------------------------------------------------------
-- 2. BẢNG USERS (Mật khẩu chuẩn hóa 11111111 cho tất cả tài khoản)
-- -----------------------------------------------------------------------------
INSERT INTO users (id, username, email, password_hash, full_name, phone, role_id, is_active, created_at) VALUES
-- 3 User chính của bạn:
(1, 'admin', 'dinhtiendat1602@gmail.com', '$2b$10$b5ORgei1knYoXLLX/s1D8.zlK1PJWpGluXDbaTUY5oUpZn.gJvxLy', 'Đinh Tiến Đạt', '0987456321', 1, true, NOW() - INTERVAL '300 days'),
(2, 'manager', 'zen.sniper.vn@gmail.com', '$2b$10$b5ORgei1knYoXLLX/s1D8.zlK1PJWpGluXDbaTUY5oUpZn.gJvxLy', 'zen', '023456329', 2, true, NOW() - INTERVAL '290 days'),
(3, 'sale', 'dinhtiendat1602qd@gmail.com', '$2b$10$b5ORgei1knYoXLLX/s1D8.zlK1PJWpGluXDbaTUY5oUpZn.gJvxLy', 'Trần Thị Salesman', '0909999888', 3, true, NOW() - INTERVAL '280 days'),
-- Các tài khoản bổ trợ đội ngũ kinh doanh & quản lý chi nhánh:
(4, 'admin2', 'admin2@zencrm.com', '$2b$10$b5ORgei1knYoXLLX/s1D8.zlK1PJWpGluXDbaTUY5oUpZn.gJvxLy', 'Nguyễn Hoàng Admin', '0901234004', 1, true, NOW() - INTERVAL '270 days'),
(5, 'manager2', 'manager2@zencrm.com', '$2b$10$b5ORgei1knYoXLLX/s1D8.zlK1PJWpGluXDbaTUY5oUpZn.gJvxLy', 'Hoàng Văn Manager', '0901234005', 2, true, NOW() - INTERVAL '260 days'),
(6, 'sale_an', 'sale.an@zencrm.com', '$2b$10$b5ORgei1knYoXLLX/s1D8.zlK1PJWpGluXDbaTUY5oUpZn.gJvxLy', 'Nguyễn Văn An', '0901234006', 3, true, NOW() - INTERVAL '250 days'),
(7, 'manager_lan', 'manager.lan@zencrm.com', '$2b$10$b5ORgei1knYoXLLX/s1D8.zlK1PJWpGluXDbaTUY5oUpZn.gJvxLy', 'Lê Thị Lan', '0901234007', 2, true, NOW() - INTERVAL '240 days'),
(8, 'sale_bich', 'sale.bich@zencrm.com', '$2b$10$b5ORgei1knYoXLLX/s1D8.zlK1PJWpGluXDbaTUY5oUpZn.gJvxLy', 'Trần Thị Bích', '0901234008', 3, true, NOW() - INTERVAL '230 days'),
(9, 'sale_thai', 'sale.thai@zencrm.com', '$2b$10$b5ORgei1knYoXLLX/s1D8.zlK1PJWpGluXDbaTUY5oUpZn.gJvxLy', 'Lê Văn Thái', '0901234009', 3, true, NOW() - INTERVAL '220 days'),
(10, 'sale_cuong', 'sale.cuong@zencrm.com', '$2b$10$b5ORgei1knYoXLLX/s1D8.zlK1PJWpGluXDbaTUY5oUpZn.gJvxLy', 'Đỗ Mạnh Cường', '0901234010', 3, true, NOW() - INTERVAL '210 days'),
(11, 'sale_ngoc', 'sale.ngoc@zencrm.com', '$2b$10$b5ORgei1knYoXLLX/s1D8.zlK1PJWpGluXDbaTUY5oUpZn.gJvxLy', 'Vũ Thị Ngọc', '0901234011', 3, true, NOW() - INTERVAL '200 days'),
(12, 'sale_bao', 'sale.bao@zencrm.com', '$2b$10$b5ORgei1knYoXLLX/s1D8.zlK1PJWpGluXDbaTUY5oUpZn.gJvxLy', 'Ngô Quốc Bảo', '0901234012', 3, true, NOW() - INTERVAL '190 days'),
(13, 'sale_thao', 'sale.thao@zencrm.com', '$2b$10$b5ORgei1knYoXLLX/s1D8.zlK1PJWpGluXDbaTUY5oUpZn.gJvxLy', 'Đặng Thu Thảo', '0901234013', 3, true, NOW() - INTERVAL '180 days'),
(14, 'sale_phat', 'sale.phat@zencrm.com', '$2b$10$b5ORgei1knYoXLLX/s1D8.zlK1PJWpGluXDbaTUY5oUpZn.gJvxLy', 'Trịnh Tấn Phát', '0901234014', 3, true, NOW() - INTERVAL '170 days'),
(15, 'sale_nam', 'sale.nam@zencrm.com', '$2b$10$b5ORgei1knYoXLLX/s1D8.zlK1PJWpGluXDbaTUY5oUpZn.gJvxLy', 'Lý Hoài Nam', '0901234015', 3, true, NOW() - INTERVAL '160 days'),
(16, 'sale_long', 'sale.long@zencrm.com', '$2b$10$b5ORgei1knYoXLLX/s1D8.zlK1PJWpGluXDbaTUY5oUpZn.gJvxLy', 'Phạm Thành Long', '0901234016', 3, true, NOW() - INTERVAL '150 days'),
(17, 'sale_tuan', 'sale.tuan@zencrm.com', '$2b$10$b5ORgei1knYoXLLX/s1D8.zlK1PJWpGluXDbaTUY5oUpZn.gJvxLy', 'Vương Quốc Tuấn', '0901234017', 3, true, NOW() - INTERVAL '140 days'),
(18, 'sale_phuong', 'sale.phuong@zencrm.com', '$2b$10$b5ORgei1knYoXLLX/s1D8.zlK1PJWpGluXDbaTUY5oUpZn.gJvxLy', 'Nguyễn Hà Phương', '0901234018', 3, true, NOW() - INTERVAL '130 days'),
(19, 'sale_trong', 'sale.trong@zencrm.com', '$2b$10$b5ORgei1knYoXLLX/s1D8.zlK1PJWpGluXDbaTUY5oUpZn.gJvxLy', 'Trần Đình Trọng', '0901234019', 3, true, NOW() - INTERVAL '120 days'),
(20, 'sale_hung', 'sale.hung@zencrm.com', '$2b$10$b5ORgei1knYoXLLX/s1D8.zlK1PJWpGluXDbaTUY5oUpZn.gJvxLy', 'Phan Văn Hùng', '0901234020', 3, true, NOW() - INTERVAL '110 days');

-- -----------------------------------------------------------------------------
-- 3. BẢNG CAMPAIGNS (Chiến dịch tiếp thị trải dài cả năm 2026, có chiến dịch Tháng 10)
-- -----------------------------------------------------------------------------
INSERT INTO campaigns (id, name, description, start_date, end_date, budget, created_by) VALUES
(1, 'Chiến dịch Khai xuân Q1/2026 - Bứt phá doanh số', 'Quảng cáo Google Search & Facebook Ads thu hút doanh nghiệp SME', '2026-01-01', '2026-03-31', 60000000.00, 2),
(2, 'Workshop Giải pháp Chuyển đổi số Đà Nẵng', 'Tổ chức sự kiện trực tiếp tại Khách sạn Mường Thanh Đà Nẵng', '2026-02-15', '2026-02-28', 35000000.00, 2),
(3, 'Google Ads - Từ khóa Camera Giám Sát & An Ninh', 'Tối ưu từ khóa thiết bị an ninh AI doanh nghiệp', '2026-03-01', '2026-05-31', 40000000.00, 2),
(4, 'SEO Content Marketing Tech & AI 2026', 'Xây dựng chuỗi bài viết chuẩn SEO tăng Organic Traffic', '2026-01-01', '2026-06-30', 25000000.00, 5),
(5, 'Triển lãm Công nghệ Quốc tế ICT Vietnam Q2', 'Gian hàng trải nghiệm hệ thống CRM & camera AI thông minh', '2026-05-10', '2026-05-25', 85000000.00, 2),
(6, 'Email Marketing Care - Nâng cấp Bản quyền', 'Gửi ưu đãi nâng cấp phần mềm cho khách hàng thân thiết', '2026-06-01', '2026-06-30', 15000000.00, 5),
(7, 'Facebook Retargeting - Dịch vụ Phần mềm Cloud', 'Bám đuổi khách hàng đã truy cập website dịch vụ', '2026-06-15', '2026-08-15', 30000000.00, 2),
(8, 'Ưu đãi Giữa năm Q3/2026 - Khuyến mãi Vàng', 'Chương trình chiết khấu thiết bị văn phòng và máy ảnh', '2026-07-01', '2026-08-31', 45000000.00, 2),
(9, 'Tiktok Ads - Review Máy ảnh Studio & Livestream', 'Hợp tác KOC quay video trải nghiệm máy ảnh cao cấp', '2026-08-01', '2026-09-30', 25000000.00, 5),
(10, 'Hội thảo Doanh nghiệp Trẻ Miền Trung', 'Kết nối mạng lưới doanh nhân trẻ các tỉnh miền Trung', '2026-08-15', '2026-08-20', 30000000.00, 2),
(11, 'Quảng cáo Youtube Video giới thiệu Zen CRM', 'Video giải pháp CRM tối ưu hóa quy trình bán hàng', '2026-09-01', '2026-10-31', 50000000.00, 2),
(12, 'Chiến dịch Q4/2026 - Tăng tốc Về đích Doanh số', 'Chiến dịch cao điểm tiếp thị toàn diện đa kênh cho quý cuối năm (Đang chạy)', '2026-10-01', '2026-12-31', 90000000.00, 2),
(13, 'Hội chợ Thiết bị An ninh & Công nghệ Số Tháng 10', 'Sự kiện trực tiếp quảng bá Camera AI và giải pháp phần mềm', '2026-10-15', '2026-10-25', 40000000.00, 2),
(14, 'Zalo ZNS Customer Retention & Chăm sóc tự động', 'Gửi thông báo chăm sóc tự động qua Zalo Official Account', '2026-01-01', '2026-12-31', 20000000.00, 5),
(15, 'Sự kiện Tech Day Sinh viên CNTT Đà Nẵng', 'Tài trợ cuộc thi tài năng công nghệ sinh viên', '2026-09-25', '2026-09-26', 18000000.00, 2),
(16, 'LinkedIn B2B Outreach Campaign CSO & CIO', 'Tiếp cận Giám đốc Công nghệ & Giám đốc Bán hàng doanh nghiệp lớn', '2026-07-10', '2026-11-10', 35000000.00, 2),
(17, 'Flash Sale Mừng Ngày 20/10 - Phụ kiện & Thiết bị', 'Chương trình tri ân khách hàng nhân ngày 20 Tháng 10 (Đang diễn ra)', '2026-10-18', '2026-10-22', 20000000.00, 2),
(18, 'Co-marketing cùng Đối tác Công nghệ TechHub', 'Chương trình liên kết giải pháp phần mềm và thiết bị số', '2026-08-01', '2026-11-30', 25000000.00, 5),
(19, 'Sponsorship - Giải Thể thao Doanh nghiệp Đà Nẵng', 'Tài trợ giải đấu thể thao nâng cao sức khỏe & thương hiệu', '2026-10-05', '2026-10-15', 30000000.00, 2),
(20, 'Tư vấn Chuyển đổi số miễn phí 1-1 cho Doanh nghiệp Mới', 'Chương trình đồng hành chuyển đổi số dài hạn', '2026-01-01', '2026-12-31', 15000000.00, 2);

-- -----------------------------------------------------------------------------
-- 4. BẢNG PRODUCT_CATEGORIES (ĐÚNG 5 DANH MỤC THEO YÊU CẦU NGƯỜI DÙNG)
-- -----------------------------------------------------------------------------
INSERT INTO product_categories (id, name, description) VALUES
(1, 'Đồ điện tử & Công nghệ', 'Thiết bị máy tính, màn hình đồ họa, lưu trữ SSD và phụ kiện văn phòng cao cấp'),
(2, 'Máy ảnh & Thiết bị Studio', 'Body máy ảnh chuyên nghiệp, ống kính khẩu lớn, flycam và kit livestream'),
(3, 'Phần mềm bản quyền & Giải pháp CRM', 'Bản quyền Zen CRM Standard, Enterprise, hạ tầng Cloud và phần mềm quản trị'),
(4, 'Thiết bị An ninh & Camera AI', 'Camera AI nhận diện khuôn mặt, đầu ghi hình NVR và giải pháp an ninh doanh nghiệp'),
(5, 'Hạ tầng Mạng & Viễn thông', 'Router cân bằng tải doanh nghiệp, thiết bị chuyển mạch và giải pháp mạng');

-- -----------------------------------------------------------------------------
-- 5. BẢNG PRODUCTS (20 sản phẩm phân bổ đều vào 5 danh mục trên)
-- -----------------------------------------------------------------------------
INSERT INTO products (id, product_code, name, description, category_id, unit_price, stock_qty, campaign_id) VALUES
-- Danh mục 2: Máy ảnh & Thiết bị Studio (IDs 1, 2, 3, 8, 9, 10, 18, 19)
(1, 'CAM-SONY-A7M4', 'Sony Alpha A7 Mark IV Body', 'Máy ảnh Full-frame 33MP, quay 4K 60p chuyên nghiệp', 2, 54900000.00, 15, 1),
(2, 'CAM-CANON-R6M2', 'Canon EOS R6 Mark II Body', 'Máy ảnh Canon không gương lật lấy nét tự động Dual Pixel', 2, 59000000.00, 8, 3),
(3, 'LENS-FUJI-35F14', 'Fujinon XF 35mm f/1.4 R', 'Ống kính chân dung khẩu độ lớn cho dòng máy Fujifilm', 2, 13500000.00, 25, 1),
(8, 'LIVE-KIT-STUDIO', 'Trọn bộ Kit Livestream Pro 4K', 'Gồm Micro không dây, Đèn Ring Light, Capture Card 4K', 2, 15500000.00, 18, 9),
(9, 'GIMBAL-DJI-RS3', 'Tay cầm chống rung DJI RS 3 Pro', 'Gimbal chống rung 3 trục cho máy ảnh DSLR/Mirrorless', 2, 14200000.00, 30, 1),
(10, 'LIGHT-GODOX-SL60', 'Đèn Studio Godox SL60W LED', 'Đèn chiếu sáng liên tục nhiệt độ màu 5600K chuẩn studio', 2, 3200000.00, 45, 9),
(18, 'DRONE-DJI-MINI4', 'Flycam DJI Mini 4 Pro Fly More Combo', 'Flycam nhỏ gọn dưới 249g quay video 4K/60fps HDR', 2, 24500000.00, 10, 12),
(19, 'BAG-PEAKDESIGN-20L', 'Balo Peak Design Everyday Backpack 20L', 'Balo đựng máy ảnh thiết kế thông minh chống thấm nước', 2, 6800000.00, 16, 17),

-- Danh mục 4: Thiết bị An ninh & Camera AI (IDs 4, 12, 16)
(4, 'CAM-AI-PRO2000', 'ZenCam AI Smart Bullet 4K', 'Camera an ninh AI phát hiện xâm nhập & nhận diện khuôn mặt', 4, 3800000.00, 120, 13),
(12, 'DRY-BOX-EUREKA', 'Tủ chống ẩm Eureka AD-85L', 'Dung tích 85 lít hút ẩm tự động bằng IC điện tử', 4, 4200000.00, 22, 3),
(16, 'NVR-DAHUA-16CH', 'Đầu ghi hình Dahua 16 Kênh NVR4216', 'Hỗ trợ chuẩn nén H.265+ lưu trữ dữ liệu camera dung lượng cao', 4, 5600000.00, 19, 13),

-- Danh mục 3: Phần mềm bản quyền & Giải pháp CRM (IDs 5, 6, 7)
(5, 'CRM-PKG-STANDARD', 'Gói Bản quyền Zen CRM Standard (1 năm)', 'Bản quyền 10 user dùng full tính năng quản lý Leads & Orders', 3, 12000000.00, 999, 12),
(6, 'CRM-PKG-ENTERPRISE', 'Gói Bản quyền Zen CRM Enterprise (1 năm)', 'Bản quyền Unlimited user, tùy chỉnh Workflow & Báo cáo AI', 3, 28000000.00, 999, 12),
(7, 'WMS-SOFTWARE-V1', 'Phần mềm Quản lý Kho Zen WMS', 'Giải pháp quản lý kho quét mã vạch Barcode/QR realtime', 3, 18000000.00, 999, 2),

-- Danh mục 1: Đồ điện tử & Công nghệ (IDs 11, 13, 14, 15)
(11, 'SSD-SANDISK-2TB', 'SSD di động SanDisk Extreme Pro 2TB', 'Tốc độ đọc 2000MB/s chống nước chống sốc', 1, 4800000.00, 50, 17),
(13, 'MONITOR-DELL-U2723', 'Màn hình Dell UltraSharp U2723QE 4K', 'Màn hình 27 inch IPS Black 100% sRGB chuyên đồ họa', 1, 13900000.00, 14, 17),
(14, 'KEYBOARD-LOGI-MX', 'Bàn phím Logitech MX Keys S', 'Bàn phím gõ êm tích hợp phím tắt thông minh cho văn phòng', 1, 2900000.00, 60, 17),
(15, 'PRINTER-XPRINTER', 'Máy in hóa đơn Xprinter XP-420B', 'Máy in nhiệt trực tiếp in mã vận đơn & hóa đơn bán hàng', 1, 1850000.00, 40, 2),

-- Danh mục 5: Hạ tầng Mạng & Viễn thông (IDs 17, 20)
(17, 'CLOUD-SERVER-STD', 'Dịch vụ Cloud VPS Pro (1 năm)', 'Hạ tầng 4 vCPU, 8GB RAM, 100GB SSD NVMe ổn định 99.9%', 5, 9600000.00, 999, 6),
(20, 'ROUTER-DRAYTEK-2927', 'Router Chịu tải DrayTek Vigor2927', 'Router cân bằng tải 2 WAN chạy 150-200 thiết bị cùng lúc', 5, 4100000.00, 35, 13);

-- -----------------------------------------------------------------------------
-- 6. BẢNG LEADS (20 khách hàng tiềm năng trải dài đến ngày 20/10/2026, gán phần lớn cho Sale ID 3)
-- -----------------------------------------------------------------------------
INSERT INTO leads (id, first_name, last_name, email, phone, date_of_birth, career, address, campaign_id, assigned_to, entered_date) VALUES
(1, 'Nguyen', 'Van An', 'an.nguyen@khaisang.com', '0912111222', '1990-05-15', 'Kỹ sư phần mềm', '123 Nguyễn Huệ, Q1, TP.HCM', 1, 3, '2026-01-15 08:30:00'),
(2, 'Tran', 'Thi Bich', 'bich.tran@yenbaby.vn', '0912222333', '1988-08-20', 'Quản lý thời trang', '456 Lê Lợi, Q3, TP.HCM', 1, 3, '2026-02-05 09:15:00'),
(3, 'Le', 'Van Thai', 'thai.le@xaydung1dn.com', '0912333444', '1985-11-12', 'Giám đốc xây dựng', '78 Hải Phòng, Hải Châu, Đà Nẵng', 2, 3, '2026-03-10 10:00:00'),
(4, 'Nguyen', 'Thi Bich', 'bich.nguyen@hoami.edu.vn', '0912444555', '1992-03-25', 'Hiệu trưởng mầm non', '12 Nguyễn Thị Minh Khai, Đà Nẵng', 3, 3, '2026-04-12 14:20:00'),
(5, 'Do', 'Manh Cuong', 'cuong@cuongmedia.vn', '0912555666', '1994-07-08', 'Nhiếp ảnh gia', '45 Lý Thường Kiệt, Đồng Hới, Quảng Bình', 4, 3, '2026-05-18 11:10:00'),
(6, 'Vu', 'Thi Ngoc', 'ngoc@ngocdecor.vn', '0912666777', '1991-09-30', 'Chủ cửa hàng nội thất', '88 Lê Duẩn, Thanh Khê, Đà Nẵng', 6, 3, '2026-06-20 16:45:00'),
(7, 'Ngo', 'Quoc Bao', 'bao.ngo@highlandcentral.vn', '0912777888', '1987-01-18', 'Quản lý chuỗi Cafe', '22 Nguyễn Văn Thoại, Ngũ Hành Sơn, Đà Nẵng', 7, 3, '2026-07-15 08:50:00'),
(8, 'Dang', 'Thu Thao', 'thao.dang@oceanviewdn.com', '0912888999', '1993-12-05', 'Trưởng phòng Khách sạn', '456 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng', 8, 3, '2026-08-10 13:30:00'),
(9, 'Trinh', 'Tan Phat', 'phat.camera@gmail.com', '0912999000', '1998-04-14', 'Content Creator', '102 Điện Biên Phủ, Thanh Khê, Đà Nẵng', 9, 6, '2026-08-25 15:15:00'),
(10, 'Ly', 'Hoai Nam', 'nam.ly@mientrunglogistics.vn', '0913111222', '1983-06-22', 'Giám đốc Logistics', 'Cảng Tiên Sa, Sơn Trà, Đà Nẵng', 10, 8, '2026-09-02 09:40:00'),
(11, 'Bui', 'Tuyet Mai', 'mai.bui@globalkids.edu.vn', '0913222333', '1989-10-10', 'Quản lý trung tâm Anh ngữ', '55 Ngô Quyền, Sơn Trà, Đà Nẵng', 11, 3, '2026-09-15 10:25:00'),
(12, 'Hoang', 'Van Khoi', 'khoi@khoinguyenmed.vn', '0913333444', '1982-02-28', 'Chủ siêu thị điện máy', '120 Hùng Vương, Hải Châu, Đà Nẵng', 11, 9, '2026-09-22 14:00:00'),
(13, 'Nguyen', 'Duc Thang', 'thang.nguyen@viettour.com.vn', '0913444555', '1995-08-17', 'Điều hành du lịch', '36 Mạch Đĩnh Chi, Hải Châu, Đà Nẵng', 12, 10, '2026-09-28 16:10:00'),
(14, 'Le', 'Thi Khanh Van', 'van.le@minhkhue.vn', '0913555666', '1990-11-03', 'Luật sư tư vấn', '15 Trần Phú, Hải Châu, Đà Nẵng', 12, 6, '2026-10-02 08:15:00'),
(15, 'Pham', 'Thanh Long', 'long.pham@mayanhbk.vn', '0913666777', '1986-05-19', 'Chủ shop máy ảnh', '234 Lý Thái Tổ, Thanh Khê, Đà Nẵng', 12, 3, '2026-10-05 11:30:00'),
(16, 'Vuong', 'Quoc Tuan', 'tuan@tuanland.vn', '0913777888', '1984-09-12', 'Môi giới Bất động sản', 'KCN Hòa Cầm, Cẩm Lệ, Đà Nẵng', 12, 8, '2026-10-08 13:45:00'),
(17, 'Nguyen', 'Ha Phuong', 'phuong@phuongnamdesign.vn', '0913888999', '1996-01-07', 'Art Director', '12 Nguyễn Văn Linh, Hải Châu, Đà Nẵng', 13, 3, '2026-10-12 09:20:00'),
(18, 'Tran', 'Dinh Trong', 'trong.tran@agrixanh.vn', '0913999000', '1981-03-31', 'Kỹ sư nông nghiệp', 'KCN Hòa Khánh, Liên Chiểu, Đà Nẵng', 13, 9, '2026-10-16 14:50:00'),
(19, 'Do', 'Kim Anh', 'kimanh@spaanh.vn', '0914111222', '1992-06-15', 'Chủ Spa làm đẹp', '45 Phan Châu Trinh, Hải Châu, Đà Nẵng', 17, 3, '2026-10-19 10:05:00'),
(20, 'Phan', 'Van Hung', 'hung.phan@iviettechpartner.vn', '0914222333', '1988-07-24', 'Trưởng bộ phận Đào tạo', '92 Quang Trung, Hải Châu, Đà Nẵng', 17, 3, '2026-10-20 08:30:00');

-- -----------------------------------------------------------------------------
-- 7. BẢNG OPPORTUNITIES (20 cơ hội bán hàng trải dài từ T1 đến T10/2026)
-- -----------------------------------------------------------------------------
INSERT INTO opportunities (id, lead_id, product_id, quantity, expected_close_date, status, notes, created_by, created_at) VALUES
(1, 1, 6, 1, '2026-01-28', 'ORDERED', 'Đã chốt hợp đồng CRM Enterprise cho Kỹ sư Khải Sáng', 3, '2026-01-16 09:00:00'),
(2, 2, 15, 2, '2026-02-15', 'ORDERED', 'Đã xuất 2 máy in hóa đơn Xprinter cho shop Yến Baby', 3, '2026-02-06 10:30:00'),
(3, 3, 7, 1, '2026-03-25', 'ORDERED', 'Đã chốt phần mềm quản lý kho WMS cho công ty Xây Dựng 1', 3, '2026-03-12 11:00:00'),
(4, 4, 4, 35, '2026-04-20', 'ORDERED', 'Chốt hợp đồng lắp đặt 35 Camera AI cho mầm non Họa Mi', 3, '2026-04-14 14:00:00'),
(5, 5, 1, 2, '2026-05-22', 'ORDERED', 'Chốt 2 máy ảnh Sony A7M4 kèm thẻ nhớ cho Cường Media', 3, '2026-05-19 15:30:00'),
(6, 6, 5, 2, '2026-06-25', 'ORDERED', 'Chốt 2 gói phần mềm Zen CRM Standard cho Ngọc Decor', 3, '2026-06-21 09:45:00'),
(7, 7, 20, 3, '2026-07-28', 'ORDERED', 'Chốt đơn 3 bộ Router DrayTek 2927 cho Highland Central', 3, '2026-07-16 16:15:00'),
(8, 8, 5, 1, '2026-08-18', 'ORDERED', 'Chốt gói CRM Standard năm thứ 2 cho KS Ocean View', 3, '2026-08-11 10:20:00'),
(9, 9, 8, 1, '2026-08-30', 'ORDERED', 'Chốt trọn bộ Kit Livestream Pro 4K cho Tiktoker Phát Camera', 6, '2026-08-26 13:40:00'),
(10, 10, 17, 2, '2026-09-10', 'ORDERED', 'Chốt 2 năm Cloud VPS hạ tầng server cho Logistics Miền Trung', 8, '2026-09-03 14:50:00'),
(11, 11, 5, 3, '2026-09-25', 'ORDERED', 'Chốt 3 gói CRM Standard cho hệ thống Anh Ngữ Global Kids', 3, '2026-09-16 11:15:00'),
(12, 12, 4, 30, '2026-10-10', 'ORDERED', 'Chốt đơn đại lý 30 camera AI cho Điện máy Khôi Nguyên', 9, '2026-09-24 15:00:00'),
(13, 13, 18, 1, '2026-10-20', 'ORDERED', 'Chốt đơn Flycam DJI Mini 4 Pro mừng ngày 20/10 cho Việt Tour', 10, '2026-09-29 09:30:00'),
-- Các cơ hội đang đàm phán trong tháng 10:
(14, 14, 6, 1, '2026-10-28', 'PROPOSAL', 'Đã gửi báo giá gói CRM Enterprise bảo mật cao cho công ty Luật', 6, '2026-10-03 10:00:00'),
(15, 15, 3, 5, '2026-10-25', 'QUALIFIED', 'Khách hàng hẹn xem trực tiếp 5 ống kính Fujinon 35mm f/1.4', 3, '2026-10-06 14:20:00'),
(16, 16, 20, 2, '2026-11-05', 'CONTACTED', 'Tư vấn mở rộng hệ thống mạng DrayTek cho văn phòng BĐS', 8, '2026-10-09 11:45:00'),
(17, 17, 13, 2, '2026-10-30', 'PROPOSAL', 'Gửi báo giá 2 màn hình Dell UltraSharp 4K cho Phương Nam Design', 3, '2026-10-13 16:30:00'),
(18, 18, 7, 1, '2026-11-15', 'NEW', 'Khảo sát nhu cầu quản lý kho nông sản thông minh cho Agrixanh', 9, '2026-10-17 08:50:00'),
(19, 19, 5, 1, '2026-10-25', 'QUALIFIED', 'Khách quan tâm gói CRM Standard tích hợp đặt lịch hẹn Spa', 3, '2026-10-19 14:10:00'),
(20, 20, 5, 5, '2026-11-10', 'NEW', 'Đàm phán hợp đồng 5 gói CRM Standard tài trợ đào tạo iViettech', 3, '2026-10-20 09:15:00');

-- -----------------------------------------------------------------------------
-- 8. BẢNG FOLLOW_UPS (20 nhật ký tương tác)
-- -----------------------------------------------------------------------------
INSERT INTO follow_ups (id, opportunity_id, follow_date, contact_method, content, customer_response, next_plan, created_by) VALUES
(1, 1, '2026-01-20 09:30:00', 'MEETING', 'Gặp trực tiếp Giám đốc trình bày Slide giải pháp Zen CRM Enterprise', 'Khách thích giao diện trực quan và tính năng đối soát doanh số', 'Gửi bản dự thảo hợp đồng qua email', 3),
(2, 2, '2026-02-10 14:00:00', 'PHONE', 'Gọi tư vấn tính năng in hóa đơn nhiệt Xprinter XP-420B', 'Khách đồng ý mua 2 chiếc phục vụ đợt sale', 'Xuất đơn giao hàng COD', 3),
(3, 3, '2026-03-18 15:30:00', 'MEETING', 'Khảo sát kho Xây Dựng 1 Đà Nẵng', 'Giám đốc chốt phần mềm quản lý kho Zen WMS', 'Ký hợp đồng triển khai', 3),
(4, 4, '2026-04-16 11:00:00', 'PHONE', 'Chốt phương án thi công lắp 35 camera AI cho mầm non', 'Đồng ý tạm ứng 50%', 'Xuất kho và bàn giao', 3),
(5, 5, '2026-05-20 16:00:00', 'PHONE', 'Khách test trực tiếp máy ảnh Sony A7M4 tại showroom', 'Hài lòng về chất lượng ảnh và lấy nét', 'Xuất hóa đơn 2 máy ảnh A7M4', 3),
(6, 6, '2026-06-22 09:00:00', 'EMAIL', 'Gửi hợp đồng gói Zen CRM Standard cho chuỗi nội thất', 'Đồng ý chuyển khoản thanh toán 100%', 'Bàn giao tài khoản admin', 3),
(7, 7, '2026-07-20 13:45:00', 'MEETING', 'Tư vấn Router DrayTek cho chuỗi cà phê Highland Central', 'Khách đồng ý lắp đặt 3 chi nhánh', 'Giao hàng và hỗ trợ cấu hình VPN', 3),
(8, 8, '2026-08-14 10:00:00', 'MEETING', 'Chăm sóc định kỳ Khách sạn Ocean View', 'Gia hạn gói phần mềm CRM thêm 1 năm', 'Tạo hóa đơn gia hạn thành công', 3),
(9, 9, '2026-08-28 14:30:00', 'PHONE', 'Tư vấn bộ Kit Livestream Pro 4K', 'Khách chuyển khoản cọc và nhận hàng', 'Giao hàng nhanh trong ngày', 6),
(10, 10, '2026-09-06 16:15:00', 'MEETING', 'Tư vấn gói Cloud VPS Pro 2 năm cho Logistics', 'Đồng ý ký hợp đồng thuê server', 'Kích hoạt VPS và bàn giao thông số', 8),
(11, 11, '2026-09-18 11:00:00', 'PHONE', 'Gửi demo tính năng CRM cho trung tâm Anh Ngữ', 'Khách duyệt mua 3 gói Standard', 'Tạo đơn hàng trên hệ thống', 3),
(12, 12, '2026-10-02 10:30:00', 'MEETING', 'Họp chính sách giá sỉ đại lý 30 camera AI', 'Thống nhất mức chiết khấu 12%', 'Ký hợp đồng xuất bán 30 camera', 9),
(13, 13, '2026-10-18 09:15:00', 'PHONE', 'Khách hàng Việt Tour chốt mua Flycam DJI Mini 4 Pro', 'Đồng ý thanh toán chuyển khoản nhận quà 20/10', 'Xuất đơn hàng trong ngày 20/10', 10),
(14, 14, '2026-10-05 10:30:00', 'EMAIL', 'Gửi bản báo giá và thỏa thuận bảo mật NDA cho công ty Luật', 'Khách đang xem xét điều khoản', 'Hẹn trao đổi lại vào thứ 5', 6),
(15, 15, '2026-10-08 14:00:00', 'PHONE', 'Liên hệ Bách Khoa Camera về 5 lens Fujinon', 'Khách hẹn tuần sau qua xem', 'Chuẩn bị sẵn hàng tại kho', 3),
(16, 16, '2026-10-12 15:00:00', 'PHONE', 'Tư vấn thiết bị mạng Router DrayTek', 'Khách hỏi thêm về tính năng chịu tải', 'Gửi catalog sản phẩm', 8),
(17, 17, '2026-10-15 11:30:00', 'MEETING', 'Demo màn hình Dell UltraSharp 4K cho cty thiết kế', 'Khách đánh giá cao độ chuẩn màu', 'Gửi báo giá chính thức', 3),
(18, 18, '2026-10-18 09:00:00', 'PHONE', 'Tiếp cận doanh nghiệp Agrixanh', 'Khách có nhu cầu quản lý tồn kho nông sản', 'Đặt lịch khảo sát kho tuần tới', 9),
(19, 19, '2026-10-19 15:30:00', 'MEETING', 'Tư vấn phần mềm CRM cho chủ Spa Ánh Kim', 'Khách rất hào hứng với tính năng ZNS', 'Gửi hợp đồng mẫu', 3),
(20, 20, '2026-10-20 10:00:00', 'PHONE', 'Trao đổi với iViettech về gói CRM đào tạo', 'Hai bên thống nhất ký kết vào tuần sau', 'Chuẩn bị hồ sơ đối tác', 3);

-- -----------------------------------------------------------------------------
-- 9. BẢNG ORDERS (20 ĐƠN HÀNG TRẢI DÀI TỪ THÁNG 1 ĐẾN THÁNG 10/2026 - ĐẾN HÔM NAY 20/10)
-- Đảm bảo báo cáo đối soát 12 tháng hiển thị đầy đủ doanh số thực tế từ T1 -> T10!
-- -----------------------------------------------------------------------------
INSERT INTO orders (id, order_code, opportunity_id, lead_id, product_id, quantity, unit_price, total_amount, order_date, payment_info, shipping_address, status, created_by) VALUES
-- Tháng 1/2026 (Kế hoạch: 100M -> Thực tế đạt: 109.800.000 đ)
(1, 'ORD-20260115-0001', NULL, 1, 1, 2, 54900000.00, 109800000.00, '2026-01-15 10:30:00', 'Chuyển khoản Vietcombank', '123 Nguyễn Huệ, Q1, TP.HCM', 'COMPLETED', 3),
(2, 'ORD-20260128-0002', 1, 1, 6, 1, 28000000.00, 28000000.00, '2026-01-28 14:00:00', 'Chuyển khoản Doanh nghiệp', '123 Nguyễn Huệ, Q1, TP.HCM', 'COMPLETED', 3),

-- Tháng 2/2026 (Kế hoạch: 120M -> Thực tế đạt: 132.500.000 đ)
(3, 'ORD-20260215-0003', 2, 2, 15, 2, 1850000.00, 3700000.00, '2026-02-15 09:30:00', 'Thanh toán COD', '456 Lê Lợi, Q3, TP.HCM', 'COMPLETED', 3),
(4, 'ORD-20260225-0004', NULL, 2, 2, 2, 59000000.00, 118000000.00, '2026-02-25 15:45:00', 'Chuyển khoản BIDV', '456 Lê Lợi, Q3, TP.HCM', 'COMPLETED', 3),
(5, 'ORD-20260228-0005', NULL, 3, 3, 1, 13500000.00, 13500000.00, '2026-02-28 16:30:00', 'Chuyển khoản Techcombank', '78 Hải Phòng, Đà Nẵng', 'COMPLETED', 6),

-- Tháng 3/2026 (Kế hoạch: 150M -> Thực tế đạt: 163.000.000 đ)
(6, 'ORD-20260315-0006', NULL, 4, 1, 2, 54900000.00, 109000000.00, '2026-03-15 11:00:00', 'Chuyển khoản ACB', '12 Nguyễn Thị Minh Khai, Đà Nẵng', 'COMPLETED', 3),
(7, 'ORD-20260325-0007', 3, 3, 7, 3, 18000000.00, 54000000.00, '2026-03-25 14:20:00', 'Chuyển khoản Doanh nghiệp', '78 Hải Phòng, Đà Nẵng', 'COMPLETED', 3),

-- Tháng 4/2026 (Kế hoạch: 130M -> Thực tế đạt: 133.000.000 đ)
(8, 'ORD-20260420-0008', 4, 4, 4, 35, 3800000.00, 133000000.00, '2026-04-20 10:15:00', 'Chuyển khoản Vietinbank', '12 Nguyễn Thị Minh Khai, Đà Nẵng', 'COMPLETED', 3),

-- Tháng 5/2026 (Kế hoạch: 140M -> Thực tế đạt: 153.800.000 đ)
(9, 'ORD-20260515-0009', NULL, 5, 11, 8, 4800000.00, 38400000.00, '2026-05-15 14:00:00', 'Chuyển khoản Doanh nghiệp', '45 Lý Thường Kiệt, Quảng Bình', 'COMPLETED', 3),
(10, 'ORD-20260522-0010', 5, 5, 1, 2, 54900000.00, 109800000.00, '2026-05-22 16:30:00', 'Chuyển khoản Vietcombank', '45 Lý Thường Kiệt, Quảng Bình', 'COMPLETED', 3),

-- Tháng 6/2026 (Kế hoạch: 160M -> Thực tế đạt: 169.000.000 đ)
(11, 'ORD-20260618-0011', NULL, 6, 13, 10, 13900000.00, 139000000.00, '2026-06-18 09:30:00', 'Chuyển khoản Techcombank', '88 Lê Duẩn, Đà Nẵng', 'COMPLETED', 3),
(12, 'ORD-20260625-0012', 6, 6, 5, 2, 12000000.00, 24000000.00, '2026-06-25 15:00:00', 'Chuyển khoản BIDV', '88 Lê Duẩn, Đà Nẵng', 'COMPLETED', 3),

-- Tháng 7/2026 (Kế hoạch: 150M -> Thực tế đạt: 156.300.000 đ)
(13, 'ORD-20260715-0013', NULL, 7, 2, 2, 59000000.00, 118000000.00, '2026-07-15 11:20:00', 'Chuyển khoản Vietcombank', '22 Nguyễn Văn Thoại, Đà Nẵng', 'COMPLETED', 3),
(14, 'ORD-20260728-0014', 7, 7, 20, 3, 4100000.00, 12300000.00, '2026-07-28 14:45:00', 'Chuyển khoản MBBank', '22 Nguyễn Văn Thoại, Đà Nẵng', 'COMPLETED', 3),
(15, 'ORD-20260730-0015', NULL, 8, 8, 2, 15500000.00, 31000000.00, '2026-07-30 16:00:00', 'Chuyển khoản ACB', '456 Võ Nguyên Giáp, Đà Nẵng', 'COMPLETED', 3),

-- Tháng 8/2026 (Kế hoạch: 170M -> Thực tế đạt: 177.500.000 đ)
(16, 'ORD-20260818-0016', 8, 8, 5, 1, 12000000.00, 12000000.00, '2026-08-18 10:30:00', 'Chuyển khoản Vietcombank', '456 Võ Nguyên Giáp, Đà Nẵng', 'COMPLETED', 3),
(17, 'ORD-20260830-0017', 9, 9, 8, 1, 15500000.00, 15500000.00, '2026-08-30 14:15:00', 'Chuyển khoản MoMo', '102 Điện Biên Phủ, Đà Nẵng', 'COMPLETED', 6),
(18, 'ORD-20260831-0018', NULL, 10, 1, 3, 54900000.00, 164700000.00, '2026-08-31 16:45:00', 'Chuyển khoản Doanh nghiệp', 'Cảng Tiên Sa, Đà Nẵng', 'COMPLETED', 8),

-- Tháng 9/2026 (Kế hoạch: 180M -> Thực tế đạt: 186.200.000 đ)
(19, 'ORD-20260910-0019', 10, 10, 17, 2, 9600000.00, 19200000.00, '2026-09-10 11:00:00', 'Chuyển khoản ACB', 'Cảng Tiên Sa, Đà Nẵng', 'COMPLETED', 8),
(20, 'ORD-20260925-0020', 11, 11, 5, 3, 12000000.00, 36000000.00, '2026-09-25 15:30:00', 'Chuyển khoản VPBank', '55 Ngô Quyền, Đà Nẵng', 'COMPLETED', 3),
(21, 'ORD-20260928-0021', NULL, 12, 2, 2, 59000000.00, 118000000.00, '2026-09-28 16:20:00', 'Chuyển khoản Doanh nghiệp', '120 Hùng Vương, Đà Nẵng', 'COMPLETED', 9),

-- Tháng 10/2026 (Kế hoạch: 200M -> Thực tế đạt đến ngày 20/10: 172.500.000 đ)
(22, 'ORD-20261010-0022', 12, 12, 4, 30, 3800000.00, 114000000.00, '2026-10-10 10:15:00', 'Chuyển khoản Doanh nghiệp', '120 Hùng Vương, Đà Nẵng', 'COMPLETED', 9),
(23, 'ORD-20261018-0023', NULL, 13, 14, 10, 2900000.00, 29000000.00, '2026-10-18 14:00:00', 'Chuyển khoản BIDV', '36 Mạch Đĩnh Chi, Đà Nẵng', 'COMPLETED', 10),
-- Đơn hàng đúng ngày hôm nay 20/10/2026:
(24, 'ORD-20261020-0024', 13, 13, 18, 1, 24500000.00, 24500000.00, '2026-10-20 09:30:00', 'Chuyển khoản Vietcombank mừng 20/10', '36 Mạch Đĩnh Chi, Hải Châu, Đà Nẵng', 'COMPLETED', 3),
(25, 'ORD-20261020-0025', NULL, 19, 11, 1, 4800000.00, 4800000.00, '2026-10-20 10:45:00', 'Thanh toán trực tiếp tại quầy ngày 20/10', '45 Phan Châu Trinh, Hải Châu, Đà Nẵng', 'COMPLETED', 3);

-- -----------------------------------------------------------------------------
-- 10. BẢNG SALE_FORECASTS (Chỉ tiêu 12 tháng năm 2026)
-- -----------------------------------------------------------------------------
INSERT INTO sale_forecasts (id, fiscal_year, month, target_amount, created_by, created_at) VALUES
-- Kế hoạch 12 tháng Năm tài chính 2026
(1, 2026, 1, 100000000.00, 2, NOW()),
(2, 2026, 2, 120000000.00, 2, NOW()),
(3, 2026, 3, 150000000.00, 2, NOW()),
(4, 2026, 4, 130000000.00, 2, NOW()),
(5, 2026, 5, 140000000.00, 2, NOW()),
(6, 2026, 6, 160000000.00, 2, NOW()),
(7, 2026, 7, 150000000.00, 2, NOW()),
(8, 2026, 8, 170000000.00, 2, NOW()),
(9, 2026, 9, 180000000.00, 2, NOW()),
(10, 2026, 10, 200000000.00, 2, NOW()),
(11, 2026, 11, 220000000.00, 2, NOW()),
(12, 2026, 12, 250000000.00, 2, NOW()),
-- Kế hoạch 8 tháng Năm tài chính 2025
(13, 2025, 5, 80000000.00, 2, NOW()),
(14, 2025, 6, 90000000.00, 2, NOW()),
(15, 2025, 7, 95000000.00, 2, NOW()),
(16, 2025, 8, 100000000.00, 2, NOW()),
(17, 2025, 9, 110000000.00, 2, NOW()),
(18, 2025, 10, 115000000.00, 2, NOW()),
(19, 2025, 11, 130000000.00, 2, NOW()),
(20, 2025, 12, 150000000.00, 2, NOW());

-- -----------------------------------------------------------------------------
-- 11. BẢNG SALESMAN_PRODUCTS (Phân quyền sản phẩm cho Nhân viên bán hàng)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salesman_products (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    assigned_by INT REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_salesman_products_user ON salesman_products(user_id);
CREATE INDEX IF NOT EXISTS idx_salesman_products_product ON salesman_products(product_id);

INSERT INTO salesman_products (user_id, product_id, assigned_by) VALUES
  -- 1. Tran Thi Salesman (ID 3): Thiết bị điện tử + Laptop + Máy ảnh tiêu biểu (12 SP)
  (3, 1, 2), (3, 2, 2), (3, 3, 2), (3, 4, 2), (3, 5, 2),
  (3, 6, 2), (3, 7, 2), (3, 8, 2), (3, 9, 2), (3, 10, 2),
  (3, 13, 2), (3, 15, 2),
  -- 2. Nguyen Van An (ID 6): Thiết bị điện tử & Phụ kiện công nghệ (8 SP)
  (6, 1, 2), (6, 2, 2), (6, 3, 2), (6, 4, 2), (6, 5, 2),
  (6, 6, 2), (6, 7, 2), (6, 8, 2),
  -- 3. Tran Thi Bich (ID 8): Máy ảnh kỹ thuật số & Ống kính quang học (6 SP)
  (8, 13, 2), (8, 14, 2), (8, 15, 2), (8, 16, 2), (8, 17, 2), (8, 18, 2),
  -- 4. Le Van Thai (ID 9): Phần mềm bản quyền, Cloud & Bảo mật (6 SP)
  (9, 9, 2), (9, 10, 2), (9, 11, 2), (9, 12, 2), (9, 1, 2), (9, 2, 2),
  -- 5. Do Manh Cuong (ID 10): Thiết bị doanh nghiệp cao cấp & Laptop (7 SP)
  (10, 1, 2), (10, 3, 2), (10, 6, 2), (10, 9, 2), (10, 10, 2), (10, 13, 2), (10, 14, 2),
  -- 6. Vu Thi Ngoc (ID 11): Điện thoại thông minh & Máy tính bảng (5 SP)
  (11, 2, 2), (11, 3, 2), (11, 4, 2), (11, 7, 2), (11, 8, 2),
  -- 7. Ngo Quoc Bao (ID 12): Máy ảnh & Phụ kiện studio (6 SP)
  (12, 13, 2), (12, 14, 2), (12, 15, 2), (12, 16, 2), (12, 17, 2), (12, 18, 2),
  -- 8. Dang Thu Thao (ID 13): Bán hàng đa ngành (8 SP)
  (13, 1, 2), (13, 2, 2), (13, 4, 2), (13, 6, 2), (13, 9, 2), (13, 11, 2), (13, 13, 2), (13, 15, 2),
  -- 9. Trinh Tan Phat (ID 14): Thiết bị văn phòng & Phần mềm (6 SP)
  (14, 1, 2), (14, 5, 2), (14, 6, 2), (14, 8, 2), (14, 9, 2), (14, 10, 2),
  -- 10. Ly Hoai Nam (ID 15): Công nghệ di động (5 SP)
  (15, 2, 2), (15, 3, 2), (15, 4, 2), (15, 7, 2), (15, 8, 2),
  -- 11. Pham Thanh Long (ID 16): Nhiếp ảnh gia & Thiết bị quay (6 SP)
  (16, 13, 2), (16, 14, 2), (16, 15, 2), (16, 16, 2), (16, 17, 2), (16, 18, 2),
  -- 12. Vuong Quoc Tuan (ID 17): Giải pháp phần mềm & Laptop (6 SP)
  (17, 1, 2), (17, 9, 2), (17, 10, 2), (17, 11, 2), (17, 12, 2), (17, 6, 2),
  -- 13. Nguyen Ha Phuong (ID 18): Sản phẩm Apple & Phụ kiện (5 SP)
  (18, 2, 2), (18, 3, 2), (18, 4, 2), (18, 7, 2), (18, 8, 2),
  -- 14. Tran Dinh Trong (ID 19): Thiết bị & Giải pháp tổng hợp (7 SP)
  (19, 1, 2), (19, 2, 2), (19, 5, 2), (19, 9, 2), (19, 13, 2), (19, 15, 2), (19, 17, 2),
  -- 15. Phan Van Hung (ID 20): Bán lẻ & Dự án nhỏ (6 SP)
  (20, 1, 2), (20, 2, 2), (20, 3, 2), (20, 6, 2), (20, 9, 2), (20, 14, 2)
ON CONFLICT (user_id, product_id) DO NOTHING;

-- Cập nhật lại giá trị Sequence trong Postgres
SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('campaigns_id_seq', (SELECT MAX(id) FROM campaigns));
SELECT setval('product_categories_id_seq', (SELECT MAX(id) FROM product_categories));
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('leads_id_seq', (SELECT MAX(id) FROM leads));
SELECT setval('opportunities_id_seq', (SELECT MAX(id) FROM opportunities));
SELECT setval('follow_ups_id_seq', (SELECT MAX(id) FROM follow_ups));
SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));
SELECT setval('sale_forecasts_id_seq', (SELECT MAX(id) FROM sale_forecasts));
SELECT setval('salesman_products_id_seq', COALESCE((SELECT MAX(id) FROM salesman_products), 1));

COMMIT;