import { describe, it } from 'node:test';
import assert from 'node:assert';

/**
 * Test Suite Frontend Quản lý Đơn hàng & Chốt đơn (Orders & Make Order UI)
 * Tuân thủ SRS v1.1 Mục 3.12 (Make an Order), BR-03 (Phân trang 20 dòng), BR-05 (Lọc ngày), BR-07
 */

// 1. Logic validation form Chốt đơn hàng (MakeOrderModal - SRS 3.12.3 REQ-1)
function validateMakeOrderForm({ quantity, stock_qty, payment_info, shipping_address }) {
  const errors = {};
  const qty = parseInt(quantity, 10);
  const stock = parseInt(stock_qty, 10);

  if (isNaN(qty) || qty <= 0) {
    errors.quantity = 'Số lượng chốt đơn phải lớn hơn 0.';
  } else if (!isNaN(stock) && qty > stock) {
    errors.quantity = `Số lượng yêu cầu (${qty}) vượt quá tồn kho hiện có (${stock} sản phẩm)!`;
  }

  if (!payment_info || !payment_info.trim()) {
    errors.payment_info = 'Thông tin thanh toán là bắt buộc khi chốt đơn.';
  }

  if (!shipping_address || !shipping_address.trim()) {
    errors.shipping_address = 'Địa chỉ giao hàng là bắt buộc khi chốt đơn.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    isStockInsufficient: !isNaN(stock) && !isNaN(qty) && qty > stock,
    errors,
  };
}

// 2. Logic tính toán giá trị đơn hàng bảo tồn & tồn kho thời gian thực
function calculateOrderTotals(quantity, unitPrice, currentStock) {
  const qty = Math.max(0, parseInt(quantity, 10) || 0);
  const price = Math.max(0, parseFloat(unitPrice) || 0);
  const stock = Math.max(0, parseInt(currentStock, 10) || 0);

  return {
    totalAmount: qty * price,
    remainingStock: stock - qty,
    isStockInsufficient: qty > stock,
  };
}

// 3. Logic xây dựng Query Params cho OrderListPage (BR-03, BR-05, SRS 3.12)
function buildOrderQueryParams({
  page = 1,
  limit = 20,
  search = '',
  status = '',
  from_date = '',
  to_date = '',
  sortBy = 'order_date',
  sortOrder = 'DESC',
}) {
  const params = {
    page: Number(page) || 1,
    limit: Number(limit) || 20, // Chuẩn BR-03: 20 dòng
    sortBy: sortBy || 'order_date',
    sortOrder: sortOrder || 'DESC',
  };

  if (search && search.trim()) {
    params.search = search.trim();
  }
  if (status && status.trim()) {
    params.status = status.trim();
  }
  if (from_date && from_date.trim()) {
    params.from_date = from_date.trim();
  }
  if (to_date && to_date.trim()) {
    params.to_date = to_date.trim();
  }

  return params;
}

// 4. Logic kiểm tra format mã đơn hàng hợp lệ ORD-YYYYMMDD-XXXX
function isValidOrderCode(code) {
  if (!code || typeof code !== 'string') return false;
  const regex = /^ORD-\d{8}-[A-Z0-9]{4}$/;
  return regex.test(code);
}

// 5. Logic tính tổng hợp KPI (Summary cards)
function calculateOrderSummary(orders) {
  if (!Array.isArray(orders)) {
    return { totalOrders: 0, totalRevenue: 0, totalItems: 0 };
  }

  return orders.reduce(
    (acc, ord) => {
      acc.totalOrders += 1;
      acc.totalRevenue += Number(ord.total_amount || 0);
      acc.totalItems += Number(ord.quantity || 0);
      return acc;
    },
    { totalOrders: 0, totalRevenue: 0, totalItems: 0 }
  );
}

describe('Frontend Orders & Make an Order UI Unit Tests (feat-015)', () => {
  describe('1. MakeOrderModal Form Validation (SRS 3.12.3 REQ-1)', () => {
    it('phải từ chối form khi thiếu thông tin thanh toán (payment_info)', () => {
      const res = validateMakeOrderForm({
        quantity: 2,
        stock_qty: 10,
        payment_info: '',
        shipping_address: '123 Nguyễn Huệ, Q.1, TP.HCM',
      });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.payment_info);
    });

    it('phải từ chối form khi thiếu địa chỉ nhận hàng (shipping_address)', () => {
      const res = validateMakeOrderForm({
        quantity: 2,
        stock_qty: 10,
        payment_info: 'Thanh toán tiền mặt (COD)',
        shipping_address: '   ',
      });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.shipping_address);
    });

    it('phải từ chối form khi số lượng chốt <= 0', () => {
      const res = validateMakeOrderForm({
        quantity: 0,
        stock_qty: 10,
        payment_info: 'Chuyển khoản',
        shipping_address: '123 Lê Lợi',
      });
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.quantity);
    });

    it('phải cảnh báo lỗi và đánh dấu isStockInsufficient khi số lượng vượt quá tồn kho (SRS 3.12, AC-08)', () => {
      const res = validateMakeOrderForm({
        quantity: 15,
        stock_qty: 8,
        payment_info: 'Chuyển khoản ngân hàng',
        shipping_address: '456 Hai Bà Trưng, Q.3',
      });
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.isStockInsufficient, true);
      assert.ok(res.errors.quantity.includes('vượt quá tồn kho'));
    });

    it('phải chấp nhận form khi đầy đủ thông tin hợp lệ và tồn kho thỏa mãn', () => {
      const res = validateMakeOrderForm({
        quantity: 3,
        stock_qty: 10,
        payment_info: 'Thanh toán tiền mặt khi nhận hàng (COD)',
        shipping_address: '789 Điện Biên Phủ, Bình Thạnh',
      });
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.isStockInsufficient, false);
      assert.strictEqual(Object.keys(res.errors).length, 0);
    });
  });

  describe('2. Realtime Order Totals & Stock Calculation (SRS 3.12)', () => {
    it('phải tính toán chính xác tổng tiền và số tồn kho còn lại', () => {
      const res = calculateOrderTotals(3, 25000000, 10);
      assert.strictEqual(res.totalAmount, 75000000);
      assert.strictEqual(res.remainingStock, 7);
      assert.strictEqual(res.isStockInsufficient, false);
    });

    it('phải phát hiện thiếu tồn kho nếu số lượng chốt lớn hơn kho', () => {
      const res = calculateOrderTotals(12, 10000000, 5);
      assert.strictEqual(res.totalAmount, 120000000);
      assert.strictEqual(res.remainingStock, -7);
      assert.strictEqual(res.isStockInsufficient, true);
    });
  });

  describe('3. Order List Query Parameters (BR-03 & BR-05)', () => {
    it('phải áp dụng phân trang chuẩn 20 dòng theo BR-03', () => {
      const params = buildOrderQueryParams({});
      assert.strictEqual(params.page, 1);
      assert.strictEqual(params.limit, 20);
      assert.strictEqual(params.sortBy, 'order_date');
      assert.strictEqual(params.sortOrder, 'DESC');
    });

    it('phải hỗ trợ tìm kiếm và lọc khoảng ngày theo BR-05', () => {
      const params = buildOrderQueryParams({
        page: 2,
        search: 'ORD-20261015',
        status: 'COMPLETED',
        from_date: '2026-10-01',
        to_date: '2026-10-31',
        sortBy: 'total_amount',
        sortOrder: 'ASC',
      });
      assert.strictEqual(params.page, 2);
      assert.strictEqual(params.limit, 20);
      assert.strictEqual(params.search, 'ORD-20261015');
      assert.strictEqual(params.status, 'COMPLETED');
      assert.strictEqual(params.from_date, '2026-10-01');
      assert.strictEqual(params.to_date, '2026-10-31');
      assert.strictEqual(params.sortBy, 'total_amount');
      assert.strictEqual(params.sortOrder, 'ASC');
    });
  });

  describe('4. Order Code Format Validation', () => {
    it('phải chấp nhận mã đơn hàng đúng format ORD-YYYYMMDD-XXXX', () => {
      assert.strictEqual(isValidOrderCode('ORD-20261015-A1B2'), true);
      assert.strictEqual(isValidOrderCode('ORD-20260101-99ZZ'), true);
    });

    it('phải từ chối các mã đơn sai format hoặc null', () => {
      assert.strictEqual(isValidOrderCode('ORD-123'), false);
      assert.strictEqual(isValidOrderCode('INV-20261015-A1B2'), false);
      assert.strictEqual(isValidOrderCode(''), false);
      assert.strictEqual(isValidOrderCode(null), false);
    });
  });

  describe('5. Order Summary KPI Calculation', () => {
    it('phải tính đúng tổng đơn, tổng doanh thu và tổng sản phẩm xuất kho', () => {
      const sampleOrders = [
        { total_amount: 15000000, quantity: 2 },
        { total_amount: 30000000, quantity: 1 },
        { total_amount: 5000000, quantity: 5 },
      ];
      const summary = calculateOrderSummary(sampleOrders);
      assert.strictEqual(summary.totalOrders, 3);
      assert.strictEqual(summary.totalRevenue, 50000000);
      assert.strictEqual(summary.totalItems, 8);
    });
  });
});
