const { pool } = require('../src/config/db');

async function seedSalesmanProducts() {
  const assignments = [
    // 1. Tran Thi Salesman (ID 3): Phân quyền nhóm Thiết bị điện tử + Laptop + Máy ảnh tiêu biểu (12 sản phẩm)
    [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [3, 7], [3, 8], [3, 9], [3, 10], [3, 13], [3, 15],

    // 2. Nguyen Van An (ID 6): Chuyên Thiết bị điện tử & Phụ kiện công nghệ (8 sản phẩm)
    [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6], [6, 7], [6, 8],

    // 3. Tran Thi Bich (ID 8): Chuyên Máy ảnh kỹ thuật số & Ống kính quang học (6 sản phẩm)
    [8, 13], [8, 14], [8, 15], [8, 16], [8, 17], [8, 18],

    // 4. Le Van Thai (ID 9): Chuyên Phần mềm bản quyền, Cloud & An toàn thông tin (6 sản phẩm)
    [9, 9], [9, 10], [9, 11], [9, 12], [9, 1], [9, 2],

    // 5. Do Manh Cuong (ID 10): Phụ trách thiết bị doanh nghiệp cao cấp & Laptop (7 sản phẩm)
    [10, 1], [10, 3], [10, 6], [10, 9], [10, 10], [10, 13], [10, 14],

    // 6. Vu Thi Ngoc (ID 11): Chuyên Điện thoại thông minh & Máy tính bảng (5 sản phẩm)
    [11, 2], [11, 3], [11, 4], [11, 7], [11, 8],

    // 7. Ngo Quoc Bao (ID 12): Chuyên Máy ảnh & Phụ kiện studio (6 sản phẩm)
    [12, 13], [12, 14], [12, 15], [12, 16], [12, 17], [12, 18],

    // 8. Dang Thu Thao (ID 13): Bán hàng đa ngành (8 sản phẩm)
    [13, 1], [13, 2], [13, 4], [13, 6], [13, 9], [13, 11], [13, 13], [13, 15],

    // 9. Trinh Tan Phat (ID 14): Thiết bị văn phòng & Phần mềm (6 sản phẩm)
    [14, 1], [14, 5], [14, 6], [14, 8], [14, 9], [14, 10],

    // 10. Ly Hoai Nam (ID 15): Công nghệ di động (5 sản phẩm)
    [15, 2], [15, 3], [15, 4], [15, 7], [15, 8],

    // 11. Pham Thanh Long (ID 16): Nhiếp ảnh gia & Thiết bị quay (6 sản phẩm)
    [16, 13], [16, 14], [16, 15], [16, 16], [16, 17], [16, 18],

    // 12. Vuong Quoc Tuan (ID 17): Giải pháp phần mềm & Laptop (6 sản phẩm)
    [17, 1], [17, 9], [17, 10], [17, 11], [17, 12], [17, 6],

    // 13. Nguyen Ha Phuong (ID 18): Sản phẩm Apple & Phụ kiện (5 sản phẩm)
    [18, 2], [18, 3], [18, 4], [18, 7], [18, 8],

    // 14. Tran Dinh Trong (ID 19): Tổng hợp (7 sản phẩm)
    [19, 1], [19, 2], [19, 5], [19, 9], [19, 13], [19, 15], [19, 17],

    // 15. Phan Van Hung (ID 20): Bán lẻ & Dự án nhỏ (6 sản phẩm)
    [20, 1], [20, 2], [20, 3], [20, 6], [20, 9], [20, 14]
  ];

  let insertedCount = 0;
  for (const [userId, prodId] of assignments) {
    const res = await pool.query(
      'INSERT INTO salesman_products (user_id, product_id, assigned_by) VALUES ($1, $2, 2) ON CONFLICT (user_id, product_id) DO NOTHING;',
      [userId, prodId]
    );
    if (res.rowCount > 0) insertedCount++;
  }

  console.log(`✅ Đã nạp thành công ${insertedCount} phân quyền sản phẩm mới vào DB!`);

  const summary = await pool.query(`
    SELECT u.id, u.username, u.full_name, COUNT(sp.product_id)::int as assigned_count
    FROM users u
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN salesman_products sp ON u.id = sp.user_id
    WHERE r.name = 'SALESMAN'
    GROUP BY u.id, u.username, u.full_name
    ORDER BY u.id ASC;
  `);

  console.log('📊 Danh sách phân quyền của 15 nhân viên bán hàng:');
  console.table(summary.rows);

  await pool.end();
}

seedSalesmanProducts().catch((err) => {
  console.error('Lỗi seed phân quyền:', err);
  pool.end();
});
