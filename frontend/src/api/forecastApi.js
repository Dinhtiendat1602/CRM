import axiosClient from './axiosClient';

/**
 * Service API Lập Kế hoạch Doanh số 12 Tháng & Đối soát Performance
 * Tuân thủ SRS v1.1 Mục 3.20 (Setup Plan) & Mục 3.21 (Performance Report)
 */
const forecastApi = {
  /**
   * Thiết lập / Cập nhật kế hoạch doanh số 12 tháng của năm tài chính (SRS 3.20)
   * POST /api/forecasts/setup
   * @param {Object} payload - { fiscal_year, plans: [{ month, target_amount }] }
   */
  setupPlan: (payload) => {
    return axiosClient.post('/forecasts/setup', payload);
  },

  /**
   * Lấy kế hoạch 12 tháng theo năm tài chính (SRS 3.20)
   * GET /api/forecasts/plans?fiscal_year=2026
   * @param {Object} params - { fiscal_year }
   */
  getPlans: (params) => {
    return axiosClient.get('/forecasts/plans', { params });
  },

  /**
   * Lấy báo cáo đối soát 12 tháng Kế hoạch vs Thực tế (SRS 3.21 & BR-07)
   * GET /api/forecasts/performance?fiscal_year=2026
   * @param {Object} params - { fiscal_year }
   */
  getPerformanceReport: (params) => {
    return axiosClient.get('/forecasts/performance', { params });
  },

  /**
   * Lấy danh sách các năm tài chính khả dụng có dữ liệu
   * GET /api/forecasts/years
   */
  getAvailableYears: () => {
    return axiosClient.get('/forecasts/years');
  },
};

export default forecastApi;
