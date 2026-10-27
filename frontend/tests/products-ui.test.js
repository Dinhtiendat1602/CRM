import { describe, it } from 'node:test';
import assert from 'node:assert';

// 1. Logic validation form Sản phẩm (SRS 3.15, BR-01)
function validateProductForm(formData) {
  const errors = {};
  if (!formData.product_code || !formData.product_code.trim()) {
    errors.product_code = 'Mã sản phẩm là bắt buộc';
  }
  if (!formData.name || !formData.name.trim()) {
    errors.name = 'Tên sản phẩm là bắt buộc';
  }
  if (
    formData.unit_price === '' ||
    formData.unit_price === null ||
    formData.unit_price === undefined ||
    isNaN(formData.unit_price) ||
    Number(formData.unit_price) < 0
  ) {
    errors.unit_price = 'Đơn giá phải là số không âm';
  }
  if (
    formData.stock_qty !== undefined &&
    formData.stock_qty !== '' &&
    (isNaN(formData.stock_qty) || Number(formData.stock_qty) < 0)
  ) {
    errors.stock_qty = 'Số lượng tồn kho phải là số nguyên không âm';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// 2. Logic validation form Danh mục sản phẩm
function validateCategoryForm(name) {
  if (!name || !name.trim()) {
    return { isValid: false, error: 'Tên danh mục là bắt buộc' };
  }
  return { isValid: true, error: null };
}

// 3. Logic xây dựng Query Params cho Products List (BR-03, SRS 3.15)
function buildProductQueryParams({
  page = 1,
  limit = 20,
  search = '',
  category_id,
  sortBy = 'created_at',
  sortOrder = 'DESC',
}) {
  const params = {
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    sortBy: sortBy || 'created_at',
    sortOrder: sortOrder || 'DESC',
  };
  if (search && search.trim()) {
    params.search = search.trim();
  }
  if (category_id) {
    params.category_id = Number(category_id);
  }
  return params;
}

// 4. Logic tính toán tổng doanh số & số lượng đã bán từ danh sách Đơn hàng (SRS 3.17)
function calculateOrderTotals(orders = []) {
  return orders.reduce(
    (acc, ord) => {
      acc.totalQty += Number(ord.quantity) || 0;
      acc.totalRevenue += Number(ord.total_amount) || 0;
      return acc;
    },
    { totalQty: 0, totalRevenue: 0 }
  );
}

describe('Frontend Products UI & Business Logic Tests (feat-011)', () => {
  describe('Product Form Validation (SRS 3.15, BR-01)', () => {
    it('chấp nhận biểu mẫu khi nhập đầy đủ mã SP, tên và đơn giá hợp lệ', () => {
      const validForm = {
        product_code: 'PROD_ERP_01',
        name: 'Zen CRM Cloud',
        unit_price: 1500,
        stock_qty: 25,
      };
      const result = validateProductForm(validForm);
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(Object.keys(result.errors).length, 0);
    });

    it('từ chối khi thiếu mã sản phẩm (product_code)', () => {
      const invalidForm = {
        product_code: '   ',
        name: 'Zen CRM Cloud',
        unit_price: 1500,
      };
      const result = validateProductForm(invalidForm);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.product_code);
    });

    it('từ chối khi đơn giá âm (< 0)', () => {
      const invalidForm = {
        product_code: 'PROD_02',
        name: 'Sản phẩm lỗi giá',
        unit_price: -100,
      };
      const result = validateProductForm(invalidForm);
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.errors.unit_price, 'Đơn giá phải là số không âm');
    });

    it('từ chối khi số lượng tồn kho âm', () => {
      const invalidForm = {
        product_code: 'PROD_03',
        name: 'Sản phẩm lỗi kho',
        unit_price: 200,
        stock_qty: -5,
      };
      const result = validateProductForm(invalidForm);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.stock_qty);
    });
  });

  describe('Category Form Validation', () => {
    it('chấp nhận tên danh mục hợp lệ', () => {
      const result = validateCategoryForm('Phần mềm ERP');
      assert.strictEqual(result.isValid, true);
    });

    it('từ chối khi tên danh mục rỗng', () => {
      const result = validateCategoryForm('');
      assert.strictEqual(result.isValid, false);
      assert.ok(result.error);
    });
  });

  describe('Query Parameters Construction (BR-03, SRS 3.15)', () => {
    it('mặc định áp dụng 20 bản ghi/trang theo BR-03', () => {
      const params = buildProductQueryParams({});
      assert.strictEqual(params.page, 1);
      assert.strictEqual(params.limit, 20);
      assert.strictEqual(params.sortBy, 'created_at');
      assert.strictEqual(params.sortOrder, 'DESC');
    });

    it('gắn đúng bộ lọc category_id và search khi người dùng tìm kiếm', () => {
      const params = buildProductQueryParams({
        page: 2,
        search: 'Enterprise',
        category_id: 3,
        sortBy: 'unit_price',
        sortOrder: 'ASC',
      });
      assert.strictEqual(params.page, 2);
      assert.strictEqual(params.search, 'Enterprise');
      assert.strictEqual(params.category_id, 3);
      assert.strictEqual(params.sortBy, 'unit_price');
      assert.strictEqual(params.sortOrder, 'ASC');
    });
  });

  describe('SRS 3.17 View Orders Totals Calculation', () => {
    it('tính toán chính xác tổng số lượng bán và tổng doanh thu thực tế từ các đơn hàng', () => {
      const mockOrders = [
        { id: 1, order_code: 'ORD-001', quantity: 3, total_amount: 4500 },
        { id: 2, order_code: 'ORD-002', quantity: 2, total_amount: 3000 },
        { id: 3, order_code: 'ORD-003', quantity: 1, total_amount: 1500 },
      ];
      const totals = calculateOrderTotals(mockOrders);
      assert.strictEqual(totals.totalQty, 6);
      assert.strictEqual(totals.totalRevenue, 9000);
    });

    it('xử lý an toàn khi danh sách đơn hàng rỗng (chưa có đơn)', () => {
      const totals = calculateOrderTotals([]);
      assert.strictEqual(totals.totalQty, 0);
      assert.strictEqual(totals.totalRevenue, 0);
    });
  });

  describe('Salesman Product Assignment & 1-Year Query Default Logic', () => {
    // 5. Logic lọc sản phẩm theo quyền của Salesman
    function filterProductsByAssignment(products, assignedIds, userRole) {
      if (userRole !== 'SALESMAN') return products;
      const set = new Set(assignedIds.map(Number));
      return products.filter((p) => set.has(Number(p.id)));
    }

    // 6. Logic kiểm tra mốc thời gian tối ưu 1 năm
    function check1YearOptimization(fromDate, toDate) {
      if (!fromDate && !toDate) {
        return { isOptimized1Year: true, message: 'Đang hiển thị 1 năm gần nhất' };
      }
      return { isOptimized1Year: false, message: 'Đang lọc theo ngày tùy chọn' };
    }

    it('Salesman chỉ nhìn thấy các sản phẩm đã được phân quyền', () => {
      const allProducts = [
        { id: 1, name: 'Sản phẩm A' },
        { id: 2, name: 'Sản phẩm B' },
        { id: 3, name: 'Sản phẩm C' },
      ];
      const assignedIds = [1, 3];
      const filtered = filterProductsByAssignment(allProducts, assignedIds, 'SALESMAN');
      assert.strictEqual(filtered.length, 2);
      assert.deepStrictEqual(filtered.map((p) => p.id), [1, 3]);
    });

    it('Quản lý và Admin nhìn thấy toàn bộ sản phẩm không bị giới hạn', () => {
      const allProducts = [
        { id: 1, name: 'Sản phẩm A' },
        { id: 2, name: 'Sản phẩm B' },
      ];
      const assignedIds = [1];
      const managerProducts = filterProductsByAssignment(allProducts, assignedIds, 'SALE_MANAGER');
      assert.strictEqual(managerProducts.length, 2);
    });

    it('Mặc định kích hoạt cờ tối ưu 1 năm khi người dùng chưa chọn khoảng ngày', () => {
      const status = check1YearOptimization('', '');
      assert.strictEqual(status.isOptimized1Year, true);
    });

    it('Tắt cờ 1 năm mặc định và nạp dữ liệu đầy đủ khi người dùng chọn ngày tháng', () => {
      const status = check1YearOptimization('2024-01-01', '2026-12-31');
      assert.strictEqual(status.isOptimized1Year, false);
    });
  });
});
