import axiosClient from './axiosClient';

const productApi = {
  // === CATEGORIES APIs ===
  getCategories: () => {
    return axiosClient.get('/categories');
  },

  getCategoryById: (id) => {
    return axiosClient.get(`/categories/${id}`);
  },

  createCategory: (data) => {
    return axiosClient.post('/categories', data);
  },

  updateCategory: (id, data) => {
    return axiosClient.put(`/categories/${id}`, data);
  },

  deleteCategory: (id) => {
    return axiosClient.delete(`/categories/${id}`);
  },

  // === PRODUCTS APIs (SRS 3.15, BR-03) ===
  getProducts: (params) => {
    return axiosClient.get('/products', { params });
  },

  getProductById: (id) => {
    return axiosClient.get(`/products/${id}`);
  },

  createProduct: (data) => {
    return axiosClient.post('/products', data);
  },

  updateProduct: (id, data) => {
    return axiosClient.put(`/products/${id}`, data);
  },

  deleteProduct: (id) => {
    return axiosClient.delete(`/products/${id}`);
  },

  // === 2 APIs ĐẶC THÙ THEO SRS ===
  // GET /api/products/:id/opportunities (SRS 3.16: View Opportunities for Product)
  getProductOpportunities: (id) => {
    return axiosClient.get(`/products/${id}/opportunities`);
  },

  // GET /api/products/:id/orders (SRS 3.17: View Orders for Product)
  getProductOrders: (id) => {
    return axiosClient.get(`/products/${id}/orders`);
  },
};

export default productApi;
