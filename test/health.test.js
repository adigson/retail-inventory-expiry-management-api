const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

test('GET /health returns the service status', async () => {
  const response = await request(app).get('/health');

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    status: 'ok',
    service: 'retail-inventory-expiry-management-api'
  });
});

test('GET /unknown-route returns 404', async () => {
  const response = await request(app).get('/unknown-route');

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.body, {
    error: 'Route not found'
  });
});