const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

const validProduct = () => ({
  name: 'Test Product',
  sku: `TEST-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  category: 'General',
  price: 100,
  quantity: 10,
  expiryDate: '2027-12-31'
});

test('POST /api/products creates a product successfully', async () => {
  const product = validProduct();

  const response = await request(app)
    .post('/api/products')
    .send(product);

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.name, product.name);
  assert.equal(response.body.sku, product.sku);
  assert.equal(response.body.price, product.price);
  assert.equal(response.body.quantity, product.quantity);
  assert.equal(response.body.expiryDate, product.expiryDate);
});

test('POST /api/products rejects missing fields', async () => {
  const product = validProduct();
  delete product.name;

  const response = await request(app)
    .post('/api/products')
    .send(product);

  assert.equal(response.statusCode, 400);
});

test('POST /api/products rejects invalid price', async () => {
  const product = validProduct();
  product.price = 'invalid';

  const response = await request(app)
    .post('/api/products')
    .send(product);

  assert.equal(response.statusCode, 400);
});

test('POST /api/products rejects invalid quantity', async () => {
  const product = validProduct();
  product.quantity = 'invalid';

  const response = await request(app)
    .post('/api/products')
    .send(product);

  assert.equal(response.statusCode, 400);
});

test('POST /api/products rejects decimal quantity', async () => {
  const product = validProduct();
  product.quantity = 10.5;

  const response = await request(app)
    .post('/api/products')
    .send(product);

  assert.equal(response.statusCode, 400);
});

test('POST /api/products rejects invalid calendar dates', async () => {
  const product = validProduct();
  product.expiryDate = '2026-02-31';

  const response = await request(app)
    .post('/api/products')
    .send(product);

  assert.equal(response.statusCode, 400);
});

test('POST /api/products rejects duplicate SKUs', async () => {
  const product = validProduct();

  const firstResponse = await request(app)
    .post('/api/products')
    .send(product);

  assert.equal(firstResponse.statusCode, 201);

  const secondResponse = await request(app)
    .post('/api/products')
    .send({
      ...product,
      name: 'Another Product'
    });

  assert.equal(secondResponse.statusCode, 409);
});

test('POST /api/products rejects case-insensitive duplicate SKUs', async () => {
  const product = validProduct();
  product.sku = `CASE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const firstResponse = await request(app)
    .post('/api/products')
    .send(product);

  assert.equal(firstResponse.statusCode, 201);

  const secondResponse = await request(app)
    .post('/api/products')
    .send({
      ...product,
      sku: product.sku.toLowerCase(),
      name: 'Another Case Product'
    });

  assert.equal(secondResponse.statusCode, 409);
});

test('POST /api/products rejects invalid SKU values', async () => {
  const product = validProduct();
  product.sku = 12345;

  const response = await request(app)
    .post('/api/products')
    .send(product);

  assert.equal(response.statusCode, 400);
});

test('POST /api/products rejects invalid expiryDate values', async () => {
  const product = validProduct();
  product.expiryDate = 2027;

  const response = await request(app)
    .post('/api/products')
    .send(product);

  assert.equal(response.statusCode, 400);
});
