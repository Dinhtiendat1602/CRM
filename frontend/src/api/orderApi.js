import axiosClient from './axiosClient';

/**
 * Service API Quản lý Đơn hàng & Chốt đơn (Orders & Make an Order)
 * Tuân thủ SRS v1.1 Mục 3.12, BR-03, BR-05, BR-07
 */
const orderApi = {
  /**
   * Lấy danh sách đơn hàng đã chốt
   * Query params: page, limit, search, status, from_date, to_date, lead_id, product_id, sortBy, sortOrder
   * GET /api/orders
   */
  getOrders: (params) => {
    return axiosClient.get('/orders', { params });
  },

  /**
   * Lấy chi tiết một đơn hàng theo ID hoặc mã đơn order_code
   * GET /api/orders/:id
   */
  getOrderById: (idOrCode) => {
    return axiosClient.get(`/orders/${idOrCode}`);
  },

  /**
   * Thực hiện chốt đơn hàng từ cơ hội bán hàng (Make an Order)
   * Sử dụng PostgreSQL ACID Transaction Row-Level Locking, trừ tồn kho và đổi status sang ORDERED
   * POST /api/opportunities/:id/make-order
   */
  makeOrder: (oppId, payload) => {
    return axiosClient.post(`/opportunities/${oppId}/make-order`, payload);
  },

  /**
   * Tạo đơn hàng trực tiếp qua endpoint /api/orders (nếu cần)
   * POST /api/orders
   */
  createOrder: (payload) => {
    return axiosClient.post('/orders', payload);
  },
};

export default orderApi;
