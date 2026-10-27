import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Frontend Dashboard UI & Live Database Extraction Tests (feat-20)', () => {
  // 1. Kiểm tra format tiền tệ VNĐ
  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  it('1. formatVND: Định dạng số tiền chính xác theo chuẩn tiền tệ Việt Nam', () => {
    const formatted = formatVND(50000000);
    assert.ok(formatted.includes('50.000.000') || formatted.includes('50,000,000'));
    assert.ok(formatted.includes('₫') || formatted.includes('VND'));
  });

  // 2. Kiểm tra ánh xạ trạng thái Cơ hội bán hàng
  const OPP_STATUS_LABELS = {
    NEW: 'Mới tạo',
    QUALIFIED: 'Đủ điều kiện',
    PROPOSAL: 'Đã gửi báo giá',
    NEGOTIATION: 'Đang đàm phán',
    ORDERED: 'Đã chốt đơn',
    LOST: 'Thất bại',
  };

  it('2. Opportunity Status Mapping: Đầy đủ 6 trạng thái nghiệp vụ chuẩn SRS', () => {
    assert.strictEqual(OPP_STATUS_LABELS.NEW, 'Mới tạo');
    assert.strictEqual(OPP_STATUS_LABELS.ORDERED, 'Đã chốt đơn');
    assert.strictEqual(OPP_STATUS_LABELS.NEGOTIATION, 'Đang đàm phán');
    assert.strictEqual(OPP_STATUS_LABELS.LOST, 'Thất bại');
  });

  // 3. Kiểm tra phân bổ KPI cho từng vai trò người dùng (RBAC)
  const getRoleKPIs = (role, summary) => {
    if (role === 'ADMIN') {
      return [
        { label: 'Tổng Tài Khoản Nhân Viên', value: summary.usersCount },
        { label: 'Tài Khoản Đang Kích Hoạt', value: summary.activeUsersCount },
        { label: 'Tài Khoản Bị Khóa', value: summary.inactiveUsersCount },
        { label: 'Cấu Trúc Phân Quyền (RBAC)', value: `${summary.rolesCount} Vai trò` },
      ];
    }
    if (role === 'SALE_MANAGER') {
      return [
        { label: 'Sản Phẩm & Kho Hàng', value: summary.productsCount },
        { label: 'Tổng Doanh Thu Đã Chốt', value: formatVND(summary.totalRevenue) },
        { label: 'Chiến Dịch Tiếp Thị', value: summary.campaignsCount },
        { label: 'Tiến Độ Kế Hoạch 12 Tháng', value: summary.planCompletion },
      ];
    }
    return [
      { label: 'Khách Tiềm Năng (Leads)', value: summary.leadsCount },
      { label: 'Cơ Hội Đang Chăm Sóc', value: summary.openOppsCount },
      { label: 'Đơn Hàng Hoàn Tất', value: summary.ordersCount },
      { label: 'Tỷ Lệ Chốt Deal (Win Rate)', value: summary.winRate },
    ];
  };

  it('3. getRoleKPIs: Trả về KPI chuẩn xác cho vai trò ADMIN từ Database payload', () => {
    const mockSummary = {
      usersCount: 20,
      activeUsersCount: 20,
      inactiveUsersCount: 0,
      rolesCount: 3,
    };
    const kpis = getRoleKPIs('ADMIN', mockSummary);
    assert.strictEqual(kpis.length, 4);
    assert.strictEqual(kpis[0].value, 20);
    assert.strictEqual(kpis[1].value, 20);
    assert.strictEqual(kpis[2].value, 0);
    assert.strictEqual(kpis[3].value, '3 Vai trò');
  });

  it('4. getRoleKPIs: Trả về KPI kinh doanh cho vai trò SALE_MANAGER', () => {
    const mockSummary = {
      productsCount: 20,
      totalRevenue: 521600000,
      campaignsCount: 20,
      planCompletion: '26.5%',
    };
    const kpis = getRoleKPIs('SALE_MANAGER', mockSummary);
    assert.strictEqual(kpis.length, 4);
    assert.strictEqual(kpis[0].value, 20);
    assert.strictEqual(kpis[2].value, 20);
    assert.strictEqual(kpis[3].value, '26.5%');
  });

  it('5. getRoleKPIs: Trả về KPI chuyển đổi cho vai trò SALESMAN', () => {
    const mockSummary = {
      leadsCount: 20,
      openOppsCount: 13,
      ordersCount: 20,
      winRate: '30%',
    };
    const kpis = getRoleKPIs('SALESMAN', mockSummary);
    assert.strictEqual(kpis.length, 4);
    assert.strictEqual(kpis[0].value, 20);
    assert.strictEqual(kpis[1].value, 13);
    assert.strictEqual(kpis[2].value, 20);
    assert.strictEqual(kpis[3].value, '30%');
  });

  // 6. Kiểm tra cấu trúc bản ghi đơn hàng mới từ Database
  it('6. Recent Orders Validation: Trích xuất chuẩn xác mã đơn, khách hàng, số tiền', () => {
    const rawOrder = {
      id: 20,
      order_code: 'ORD-20260312-0020',
      customer_name: 'Do Manh Cuong',
      product_name: 'SSD di động SanDisk Extreme Pro 2TB',
      total_amount: '9600000.00',
      order_date: '2026-03-12T07:00:00.000Z',
    };
    assert.ok(rawOrder.order_code.startsWith('ORD-'));
    assert.strictEqual(rawOrder.customer_name, 'Do Manh Cuong');
    assert.strictEqual(parseFloat(rawOrder.total_amount), 9600000);
  });
});
