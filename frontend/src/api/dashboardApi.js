import axiosClient from './axiosClient';

/**
 * Service API Dashboard Thống kê & Hoạt động Thời gian thực
 */
const dashboardApi = {
  /**
   * Lấy toàn bộ số liệu thống kê KPIs và bản ghi gần nhất từ database
   */
  getStats: () => {
    return axiosClient.get('/dashboard/stats');
  },
};

export default dashboardApi;
