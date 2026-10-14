-- Dữ liệu seed mẫu tự động sinh
-- Mật khẩu mặc định của 3 tài khoản là: 11111111 (đã băm bcrypt 10 rounds)
INSERT INTO roles (id, name, description) VALUES
  (1, 'ADMIN', 'Quản trị viên toàn quyền hệ thống'),
  (2, 'SALE_MANAGER', 'Trưởng phòng kinh doanh / Quản lý bán hàng'),
  (3, 'SALESMAN', 'Nhân viên kinh doanh')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (username, email, password_hash, full_name, phone, role_id) VALUES
  ('admin', 'admin@zencrm.com', '$2b$10$HYcACfDIw90IGbHQ4XrgfOJNkf5A2agYe4Dh90OwL/Oly7ZDkFOgq', 'System Administrator', '0900000001', 1),
  ('manager', 'manager@zencrm.com', '$2b$10$HYcACfDIw90IGbHQ4XrgfOJNkf5A2agYe4Dh90OwL/Oly7ZDkFOgq', 'Nguyen Van Manager', '0900000002', 2),
  ('salesman', 'salesman@zencrm.com', '$2b$10$HYcACfDIw90IGbHQ4XrgfOJNkf5A2agYe4Dh90OwL/Oly7ZDkFOgq', 'Tran Thi Salesman', '0900000003', 3)
ON CONFLICT (username) DO NOTHING;
