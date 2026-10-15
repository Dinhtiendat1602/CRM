const request = require('supertest');

/**
 * Helper hỗ trợ đăng nhập linh hoạt cho các bài kiểm thử:
 * Ưu tiên các tài khoản thật trong database (admin1, manager1, sale1)
 * và fallback sang các tài khoản mặc định (admin, manager, salesman)
 */
async function getSalesmanToken(app) {
  let res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'sale1', password: '11111111' });
  if (res.body.data?.token) return res.body.data.token;

  res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'salesman', password: '11111111' });
  return res.body.data?.token;
}

async function getManagerToken(app) {
  let res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'manager1', password: '11111111' });
  if (res.body.data?.token) return res.body.data.token;

  res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'manager1', password: '22222222' });
  if (res.body.data?.token) return res.body.data.token;

  res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'manager', password: '11111111' });
  return res.body.data?.token;
}

async function getAdminToken(app) {
  let res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin1', password: '11111111' });
  if (res.body.data?.token) return res.body.data.token;

  res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: '11111111' });
  return res.body.data?.token;
}

module.exports = {
  getSalesmanToken,
  getManagerToken,
  getAdminToken,
};
