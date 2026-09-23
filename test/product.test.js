const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const products = require('../src/data/productStore');

const duplicateSkuResponse = {
  error: 'Duplicate SKU',
  details: [
    {
      field: 'sku',
      message: 'SKU must be unique; another product already uses this SKU.'
    }
  ]
};

const validProduct = {
  name: 'Test Product',
  sku: 'TEST-001',
  category: 'Test',
  price: 10,
  quantity: 5,
  expiryDate: '2026-12-31'
};

function snapshotProducts() {
  return structuredClone(products);
}

function restoreProducts(snapshot) {
  products.splice(0, products.length, ...snapshot);
}

test('POST /api/products rejects a duplicate SKU with identical casing', async () => {
  const snapshot = snapshotProducts();

  try {
    const response = await request(app)
      .post('/api/products')
      .send({ ...validProduct, sku: 'BREAD-WW-001' });

    assert.equal(response.statusCode, 409);
    assert.deepEqual(response.body, duplicateSkuResponse);
    assert.deepEqual(products, snapshot);
  } finally {
    restoreProducts(snapshot);
  }
});

test('POST /api/products rejects a duplicate SKU with different casing', async () => {
  const snapshot = snapshotProducts();

  try {
    const response = await request(app)
      .post('/api/products')
      .send({ ...validProduct, sku: 'bread-ww-001' });

    assert.equal(response.statusCode, 409);
    assert.deepEqual(response.body, duplicateSkuResponse);
    assert.deepEqual(products, snapshot);
  } finally {
    restoreProducts(snapshot);
  }
});

test('POST /api/products accepts a unique SKU', async () => {
  const snapshot = snapshotProducts();

  try {
    const response = await request(app)
      .post('/api/products')
      .send(validProduct);

    assert.equal(response.statusCode, 201);
    assert.equal(response.body.name, validProduct.name);
    assert.equal(response.body.sku, validProduct.sku);
    assert.equal(products.length, snapshot.length + 1);
    assert.equal(products.at(-1).sku, validProduct.sku);
  } finally {
    restoreProducts(snapshot);
  }
});

test('PUT /api/products/:id allows a product to retain its own SKU', async () => {
  const snapshot = snapshotProducts();
  const existingProduct = snapshot.find((product) => product.id === 'p-001');

  try {
    const response = await request(app)
      .put('/api/products/p-001')
      .send({
        name: 'Whole Wheat Bread Updated',
        sku: existingProduct.sku,
        category: existingProduct.category,
        price: existingProduct.price,
        quantity: existingProduct.quantity + 1,
        expiryDate: existingProduct.expiryDate
      });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.id, 'p-001');
    assert.equal(response.body.sku, existingProduct.sku);
    assert.equal(response.body.quantity, existingProduct.quantity + 1);
  } finally {
    restoreProducts(snapshot);
  }
});

test('PUT /api/products/:id rejects another product\'s SKU', async () => {
  const snapshot = snapshotProducts();
  const existingProduct = snapshot.find((product) => product.id === 'p-001');
  const conflictingProduct = snapshot.find((product) => product.id === 'p-002');

  try {
    const response = await request(app)
      .put('/api/products/p-001')
      .send({
        name: existingProduct.name,
        sku: conflictingProduct.sku.toLowerCase(),
        category: existingProduct.category,
        price: existingProduct.price,
        quantity: existingProduct.quantity,
        expiryDate: existingProduct.expiryDate
      });

    assert.equal(response.statusCode, 409);
    assert.deepEqual(response.body, duplicateSkuResponse);
    assert.deepEqual(products, snapshot);
  } finally {
    restoreProducts(snapshot);
  }
});
