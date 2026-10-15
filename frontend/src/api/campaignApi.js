import axiosClient from './axiosClient';

/**
 * Service API Quản lý Chiến dịch Tiếp thị & Báo cáo Hiệu quả
 * Tuân thủ SRS v1.1 Mục 3.18, 3.19 & BR-03 (Phân trang 20 dòng)
 */
const campaignApi = {
  /**
   * Lấy danh sách chiến dịch tiếp thị (hỗ trợ phân trang, tìm kiếm, lọc ngày, lọc status)
   * GET /api/campaigns
   * @param {Object} params - { page, limit, search, status, from_date, to_date, sortBy, sortOrder }
   */
  getCampaigns: (params) => {
    return axiosClient.get('/campaigns', { params });
  },

  /**
   * Lấy chi tiết chiến dịch tiếp thị kèm danh sách sản phẩm và thống kê sơ bộ
   * GET /api/campaigns/:id
   * @param {number|string} id
   */
  getCampaignById: (id) => {
    return axiosClient.get(`/campaigns/${id}`);
  },

  /**
   * Thêm mới chiến dịch tiếp thị
   * POST /api/campaigns
   * @param {Object} payload - { name, description, start_date, end_date, budget }
   */
  createCampaign: (payload) => {
    return axiosClient.post('/campaigns', payload);
  },

  /**
   * Cập nhật thông tin chiến dịch tiếp thị
   * PUT /api/campaigns/:id
   * @param {number|string} id
   * @param {Object} payload - { name, description, start_date, end_date, budget }
   */
  updateCampaign: (id, payload) => {
    return axiosClient.put(`/campaigns/${id}`, payload);
  },

  /**
   * Xóa chiến dịch tiếp thị
   * DELETE /api/campaigns/:id
   * @param {number|string} id
   */
  deleteCampaign: (id) => {
    return axiosClient.delete(`/campaigns/${id}`);
  },

  /**
   * Gán danh sách sản phẩm vào chiến dịch tiếp thị (SRS 3.18.1)
   * POST /api/campaigns/:id/products
   * @param {number|string} id
   * @param {number[]} productIds
   */
  assignProducts: (id, productIds) => {
    return axiosClient.post(`/campaigns/${id}/products`, { product_ids: productIds });
  },

  /**
   * Gỡ một sản phẩm khỏi chiến dịch tiếp thị (SRS 3.18.1)
   * DELETE /api/campaigns/:id/products/:productId
   * @param {number|string} id
   * @param {number|string} productId
   */
  removeProduct: (id, productId) => {
    return axiosClient.delete(`/campaigns/${id}/products/${productId}`);
  },

  /**
   * Lấy báo cáo hiệu quả chiến dịch tiếp thị (Campaign Performance Report - SRS 3.19)
   * GET /api/campaigns/:id/report
   * @param {number|string} id
   */
  getCampaignReport: (id) => {
    return axiosClient.get(`/campaigns/${id}/report`);
  },
};

export default campaignApi;
