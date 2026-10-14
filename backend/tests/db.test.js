const test = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');

test.after(async () => {
  await pool.end();
});

test('Database Schema Verification: 10 Tables Exist', async () => {
  const expectedTables = [
    'roles',
    'users',
    'campaigns',
    'product_categories',
    'products',
    'leads',
    'opportunities',
    'follow_ups',
    'orders',
    'sale_forecasts',
  ];

  const query = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  `;
  const result = await pool.query(query);
  const actualTables = result.rows.map((r) => r.table_name);

  for (const table of expectedTables) {
    assert.ok(actualTables.includes(table), `Table ${table} should exist in public schema`);
  }
});

test('Performance Indexes Verification', async () => {
  const query = `
    SELECT indexname 
    FROM pg_indexes 
    WHERE schemaname = 'public';
  `;
  const result = await pool.query(query);
  const indexes = result.rows.map((r) => r.indexname);

  const expectedIndexes = [
    'idx_users_role_id',
    'idx_products_category_id',
    'idx_leads_entered_date',
    'idx_leads_phone_email',
    'idx_leads_name',
    'idx_opportunities_created_at',
    'idx_opp_lead_product',
    'idx_orders_order_date',
    'idx_orders_product_id',
    'idx_orders_lead_id',
  ];

  for (const index of expectedIndexes) {
    assert.ok(indexes.includes(index), `Index ${index} should exist`);
  }
});

test('Seed Data Verification: Roles & Users (Hệ thống có đủ 3 vai trò active)', async () => {
  // Roles
  const roles = await pool.query('SELECT * FROM roles ORDER BY id ASC');
  assert.strictEqual(roles.rows.length, 3);
  assert.strictEqual(roles.rows[0].name, 'ADMIN');
  assert.strictEqual(roles.rows[1].name, 'SALE_MANAGER');
  assert.strictEqual(roles.rows[2].name, 'SALESMAN');

  // Users trong hệ thống: đảm bảo có đủ 3 vai trò ADMIN, SALE_MANAGER, SALESMAN đang hoạt động
  const users = await pool.query(
    'SELECT u.id, u.username, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.is_active = true'
  );
  const userRoles = users.rows.map((u) => u.role_name);
  assert.ok(userRoles.includes('ADMIN'), 'Phải có ít nhất 1 tài khoản ADMIN active trong hệ thống');
  assert.ok(userRoles.includes('SALE_MANAGER'), 'Phải có ít nhất 1 tài khoản SALE_MANAGER active trong hệ thống');
  assert.ok(userRoles.includes('SALESMAN'), 'Phải có ít nhất 1 tài khoản SALESMAN active trong hệ thống');
});

test('Seed Data Verification: Business Entities (Campaign, Products, Leads, Opp, Forecast)', async () => {
  const campaigns = await pool.query('SELECT * FROM campaigns');
  assert.ok(campaigns.rows.length >= 1);

  const categories = await pool.query('SELECT * FROM product_categories');
  assert.ok(categories.rows.length >= 3, 'Phải có ít nhất 3 danh mục sản phẩm (Thiết bị điện tử, Phần mềm bản quyền, Máy ảnh kỹ thuật số)');

  const products = await pool.query('SELECT * FROM products');
  assert.ok(products.rows.length >= 6, 'Phải có ít nhất 6 sản phẩm mẫu');

  const leads = await pool.query('SELECT * FROM leads');
  assert.ok(leads.rows.length >= 2, 'Must have at least 2 seed leads');

  const opps = await pool.query('SELECT * FROM opportunities');
  assert.ok(opps.rows.length >= 1, 'Phải có ít nhất 1 cơ hội mẫu');

  const followUps = await pool.query('SELECT * FROM follow_ups');
  assert.ok(followUps.rows.length >= 1, 'Phải có ít nhất 1 nhật ký follow-up');

  // 12 months forecast for 2026 (SRS 3.20)
  const forecasts = await pool.query('SELECT * FROM sale_forecasts WHERE fiscal_year = 2026 ORDER BY month ASC');
  assert.strictEqual(forecasts.rows.length, 12, 'Must have 12 months of sales forecasts for 2026');
});
