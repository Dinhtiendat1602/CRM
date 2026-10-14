const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

test('GET /api/health should return status 200 and health info', async () => {
  const response = await request(app).get('/api/health');
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.success, true);
  assert.strictEqual(response.body.message, 'Zen CRM API is healthy and running');
  assert.ok(response.body.timestamp);
});

test('Undefined route should return 404 or handled response', async () => {
  const response = await request(app).get('/api/non-existent-route-check');
  assert.strictEqual(response.status, 404);
});
