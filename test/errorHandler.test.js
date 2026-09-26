const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const errorHandler = require('../src/middleware/errorHandler');
const app = require('../src/app');

test('POST /api/products returns JSON for malformed request bodies', async () => {
  const response = await request(app)
    .post('/api/products')
    .set('Content-Type', 'application/json')
    .send('{"name":');

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    error: 'Invalid JSON request',
    details: [{ field: 'body', message: 'Request body must contain valid JSON.' }]
  });
});

test('unexpected errors return a generic JSON response and are logged', async () => {
  const errorApp = express();
  errorApp.get('/failure', (req, res, next) => {
    next(new Error('sensitive internal detail'));
  });
  errorApp.use(errorHandler);

  const originalConsoleError = console.error;
  let loggedError;

  try {
    console.error = (error) => {
      loggedError = error;
    };

    const response = await request(errorApp).get('/failure');

    assert.equal(response.statusCode, 500);
    assert.deepEqual(response.body, {
      error: 'Internal server error',
      details: []
    });
    assert.equal(response.text.includes('sensitive internal detail'), false);
    assert.equal(loggedError?.message, 'sensitive internal detail');
  } finally {
    console.error = originalConsoleError;
  }
});
