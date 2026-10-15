import axiosClient from './axiosClient';

const oppApi = {
  /**
   * Lấy danh sách Cơ hội bán hàng (SRS 3.7, BR-03, BR-04, BR-05)
   * @param {Object} params { page, limit, search, status, from_date, to_date, lead_id, product_id, sortBy, sortOrder }
   */
  getOpportunities: (params) => {
    return axiosClient.get('/opportunities', { params });
  },

  /**
   * Xem chi tiết Cơ hội kèm lịch sử Follow-up và Đơn hàng (SRS 3.7.3 REQ-4)
   * @param {number|string} id
   */
  getOpportunityById: (id) => {
    return axiosClient.get(`/opportunities/${id}`);
  },

  /**
   * Lấy danh mục 6 trạng thái cơ hội chuẩn hóa
   */
  getStatuses: () => {
    return axiosClient.get('/opportunities/statuses');
  },

  /**
   * Kiểm tra trùng lặp cơ hội đang mở giữa Lead và Product (BR-02, SRS 3.6.2 REQ-4)
   * @param {Object} params { lead_id, product_id, exclude_id }
   */
  checkDuplicate: (params) => {
    return axiosClient.get('/opportunities/check-duplicate', { params });
  },

  /**
   * Thêm mới Cơ hội bán hàng (SRS 3.6)
   * @param {Object} data { lead_id, product_id, quantity, expected_close_date, status, notes, confirm_duplicate }
   */
  createOpportunity: (data) => {
    return axiosClient.post('/opportunities', data);
  },

  /**
   * Cập nhật thông tin Cơ hội bán hàng (SRS 3.9)
   * @param {number|string} id
   * @param {Object} data { product_id, quantity, expected_close_date, status, notes }
   */
  updateOpportunity: (id, data) => {
    return axiosClient.put(`/opportunities/${id}`, data);
  },

  /**
   * Xóa Cơ hội bán hàng (SRS 3.10)
   * @param {number|string} id
   */
  deleteOpportunity: (id) => {
    return axiosClient.delete(`/opportunities/${id}`);
  },

  /**
   * Ghi nhận nhật ký chăm sóc khách hàng (SRS 3.11)
   * @param {number|string} oppId
   * @param {Object} data { follow_date, contact_method, content, customer_response, next_plan, new_status }
   */
  addFollowUp: (oppId, data) => {
    return axiosClient.post(`/opportunities/${oppId}/follow-ups`, data);
  },

  /**
   * Lấy danh sách lịch sử tương tác Follow-up của một cơ hội (SRS 3.11)
   * @param {number|string} oppId
   */
  getFollowUps: (oppId) => {
    return axiosClient.get(`/opportunities/${oppId}/follow-ups`);
  },

  /**
   * Chốt đơn hàng từ Cơ hội bán hàng (Make an Order - SRS 3.12, BR-03, BR-07)
   * @param {number|string} oppId
   * @param {Object} data { payment_info, shipping_address, order_date, quantity, notes }
   */
  makeOrder: (oppId, data) => {
    return axiosClient.post(`/opportunities/${oppId}/make-order`, data);
  },
};

export default oppApi;
