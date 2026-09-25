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

test('GET /api/products returns all products', async () => {
  const response = await request(app).get('/api/products');

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, products);
});

test('GET /api/products filters by category and search term', async () => {
  const response = await request(app)
    .get('/api/products')
    .query({ category: 'dairy', search: 'milk' });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, [
    {
      id: 'p-002',
      name: 'Fresh Milk 1L',
      sku: 'MILK-1L-001',
      category: 'Dairy',
      price: 3.25,
      quantity: 8,
      expiryDate: '2026-09-25'
    }
  ]);
});

test('GET /api/products filters by category without a search term', async () => {
  const response = await request(app)
    .get('/api/products')
    .query({ category: 'BAKERY' });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.map((product) => product.id), ['p-001']);
});

test('GET /api/products filters by search term across product fields', async () => {
  const response = await request(app)
    .get('/api/products')
    .query({ search: 'tom-can-001' });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.map((product) => product.id), ['p-003']);
});

test('GET /api/products returns an empty list when no products match', async () => {
  const response = await request(app)
    .get('/api/products')
    .query({ search: 'does-not-exist' });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, []);
});

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

test('DELETE /api/products/:id removes an existing product', async () => {
  const snapshot = snapshotProducts();

  try {
    const response = await request(app).delete('/api/products/p-003');

    assert.equal(response.statusCode, 204);
    assert.equal(response.text, '');
    assert.equal(products.some((product) => product.id === 'p-003'), false);
  } finally {
    restoreProducts(snapshot);
  }
});

test('DELETE /api/products/:id returns 404 for a missing product', async () => {
  const snapshot = snapshotProducts();

  try {
    const response = await request(app).delete('/api/products/missing');

    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.body, {
      error: 'Product not found',
      details: [{ field: 'id', message: 'No product exists with id missing.' }]
    });
    assert.deepEqual(products, snapshot);
  } finally {
    restoreProducts(snapshot);
  }
});
