import axiosClient from './axiosClient';

const leadApi = {
  /**
   * Lấy danh sách Khách tiềm năng (SRS 3.2, BR-03, BR-04, BR-05)
   * @param {Object} params { page, limit, search, sortBy, sortOrder, startDate, endDate }
   */
  getLeads: (params) => {
    return axiosClient.get('/leads', { params });
  },

  /**
   * Xem chi tiết Khách tiềm năng kèm danh sách Opportunities (SRS 3.2.3 REQ-4)
   * @param {number|string} id
   */
  getLeadById: (id) => {
    return axiosClient.get(`/leads/${id}`);
  },

  /**
   * Kiểm tra trùng Email / Số điện thoại realtime (BR-02, SRS 3.1.2 REQ-4)
   * @param {Object} params { email, phone }
   */
  checkDuplicate: (params) => {
    return axiosClient.get('/leads/check-duplicate', { params });
  },

  /**
   * Tạo Khách tiềm năng mới (SRS 3.1)
   * @param {Object} data
   */
  createLead: (data) => {
    return axiosClient.post('/leads', data);
  },

  /**
   * Cập nhật thông tin Khách tiềm năng (SRS 3.4)
   * @param {number|string} id
   * @param {Object} data
   */
  updateLead: (id, data) => {
    return axiosClient.put(`/leads/${id}`, data);
  },

  /**
   * Xóa Khách tiềm năng (SRS 3.5)
   * @param {number|string} id
   */
  deleteLead: (id) => {
    return axiosClient.delete(`/leads/${id}`);
  },
};

export default leadApi;
