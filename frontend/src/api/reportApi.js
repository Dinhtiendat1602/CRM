import axiosClient from './axiosClient';

/**
 * Service API Báo cáo Bán hàng & Thống kê Toàn diện (Business & Sales Reports)
 * Tuân thủ SRS v1.1 Mục 2.1 (Dành riêng cho Quản lý Bán hàng & Quản trị viên)
 */
const reportApi = {
  /**
   * Báo cáo Tổng quan KPI nhanh (Executive Summary)
   * GET /api/reports/summary
   */
  getSummaryReport: () => {
    return axiosClient.get('/reports/summary');
  },

  /**
   * Báo cáo Thống kê Khách hàng tiềm năng (Leads Reporting)
   * GET /api/reports/leads
   * @param {Object} params - { from_date, to_date, period: 'day'|'month' }
   */
  getLeadReport: (params) => {
    return axiosClient.get('/reports/leads', { params });
  },

  /**
   * Báo cáo Thống kê Đơn hàng & Giá trị đơn (Orders Reporting)
   * GET /api/reports/orders
   * @param {Object} params - { from_date, to_date, period: 'day'|'month' }
   */
  getOrderReport: (params) => {
    return axiosClient.get('/reports/orders', { params });
  },

  /**
   * Báo cáo Thống kê Doanh thu theo Sản phẩm & Danh mục (Revenue Reporting theo SRS 2.1)
   * GET /api/reports/revenue
   * @param {Object} params - { from_date, to_date, period: 'day'|'month' }
   */
  getRevenueReport: (params) => {
    return axiosClient.get('/reports/revenue', { params });
  },
};

export default reportApi;
