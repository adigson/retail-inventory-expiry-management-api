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

function dateFromToday(offsetDays) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
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

test('GET /api/products/low-stock uses the default threshold of 10', async () => {
  const response = await request(app).get('/api/products/low-stock');

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.map((product) => product.id), ['p-002']);
});

test('GET /api/products/low-stock accepts a custom threshold inclusively', async () => {
  const response = await request(app)
    .get('/api/products/low-stock')
    .query({ threshold: 24 });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.map((product) => product.id), ['p-001', 'p-002']);
});

test('GET /api/products/low-stock accepts zero and returns no products when none qualify', async () => {
  const response = await request(app)
    .get('/api/products/low-stock')
    .query({ threshold: 0 });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, []);
});

test('GET /api/products/low-stock rejects invalid thresholds', async () => {
  for (const threshold of ['-1', '1.5', 'abc', '', '9007199254740992']) {
    const response = await request(app)
      .get('/api/products/low-stock')
      .query({ threshold });

    assert.equal(response.statusCode, 400, threshold);
    assert.deepEqual(response.body, {
      error: 'Validation failed',
      details: [{
        field: 'threshold',
        message: 'threshold must be a non-negative integer.'
      }]
    });
  }
});

test('GET /api/products/low-stock rejects repeated threshold parameters', async () => {
  const response = await request(app)
    .get('/api/products/low-stock')
    .query({ threshold: ['5', '10'] });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    error: 'Validation failed',
    details: [{
      field: 'threshold',
      message: 'threshold must be a non-negative integer.'
    }]
  });
});

test('GET /api/products/expiring-soon uses the default seven-day window inclusively', async () => {
  const snapshot = snapshotProducts();
  const expiryFixtures = [
    { id: 'expired', expiryDate: dateFromToday(-1) },
    { id: 'expires-today', expiryDate: dateFromToday(0) },
    { id: 'expires-in-seven', expiryDate: dateFromToday(7) },
    { id: 'expires-in-eight', expiryDate: dateFromToday(8) }
  ];

  try {
    products.splice(0, products.length, ...expiryFixtures);

    const response = await request(app).get('/api/products/expiring-soon');

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body.map((product) => product.id), [
      'expires-today',
      'expires-in-seven'
    ]);
  } finally {
    restoreProducts(snapshot);
  }
});

test('GET /api/products/expiring-soon accepts a custom window and zero days', async () => {
  const snapshot = snapshotProducts();
  const expiryFixtures = [
    { id: 'expires-today', expiryDate: dateFromToday(0) },
    { id: 'expires-tomorrow', expiryDate: dateFromToday(1) },
    { id: 'expires-in-two', expiryDate: dateFromToday(2) }
  ];

  try {
    products.splice(0, products.length, ...expiryFixtures);

    const zeroDayResponse = await request(app)
      .get('/api/products/expiring-soon')
      .query({ days: 0 });
    assert.equal(zeroDayResponse.statusCode, 200);
    assert.deepEqual(zeroDayResponse.body.map((product) => product.id), ['expires-today']);

    const customWindowResponse = await request(app)
      .get('/api/products/expiring-soon')
      .query({ days: 2 });
    assert.equal(customWindowResponse.statusCode, 200);
    assert.deepEqual(customWindowResponse.body.map((product) => product.id), [
      'expires-today',
      'expires-tomorrow',
      'expires-in-two'
    ]);
  } finally {
    restoreProducts(snapshot);
  }
});

test('GET /api/products/expiring-soon rejects invalid or repeated days values', async () => {
  for (const days of ['-1', '1.5', 'abc', '', '9007199254740992']) {
    const response = await request(app)
      .get('/api/products/expiring-soon')
      .query({ days });

    assert.equal(response.statusCode, 400, days);
    assert.deepEqual(response.body, {
      error: 'Validation failed',
      details: [{
        field: 'days',
        message: 'days must be a non-negative integer.'
      }]
    });
  }

  const repeatedDaysResponse = await request(app)
    .get('/api/products/expiring-soon')
    .query({ days: ['3', '7'] });

  assert.equal(repeatedDaysResponse.statusCode, 400);
  assert.deepEqual(repeatedDaysResponse.body, {
    error: 'Validation failed',
    details: [{
      field: 'days',
      message: 'days must be a non-negative integer.'
    }]
  });
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

test('POST /api/products accepts zero price and quantity', async () => {
  const snapshot = snapshotProducts();

  try {
    const response = await request(app)
      .post('/api/products')
      .send({ ...validProduct, sku: 'ZERO-VALUES-001', price: 0, quantity: 0 });

    assert.equal(response.statusCode, 201);
    assert.equal(response.body.price, 0);
    assert.equal(response.body.quantity, 0);
  } finally {
    restoreProducts(snapshot);
  }
});

test('POST /api/products rejects a missing required field without changing the store', async () => {
  const snapshot = snapshotProducts();
  const productWithoutExpiryDate = { ...validProduct };
  delete productWithoutExpiryDate.expiryDate;

  try {
    const response = await request(app)
      .post('/api/products')
      .send(productWithoutExpiryDate);

    assert.equal(response.statusCode, 400);
    assert.ok(response.body.details.some((detail) =>
      detail.field === 'expiryDate' && detail.message === 'expiryDate is required.'
    ));
    assert.deepEqual(products, snapshot);
  } finally {
    restoreProducts(snapshot);
  }
});

test('POST /api/products rejects invalid product field values without changing the store', async () => {
  const snapshot = snapshotProducts();
  const invalidProducts = [
    { field: 'name', value: '   ' },
    { field: 'sku', value: '' },
    { field: 'category', value: '' },
    { field: 'price', value: -0.01 },
    { field: 'price', value: '10' },
    { field: 'quantity', value: -1 },
    { field: 'quantity', value: 1.5 }
  ];

  try {
    for (const { field, value } of invalidProducts) {
      const response = await request(app)
        .post('/api/products')
        .send({ ...validProduct, [field]: value });

      assert.equal(response.statusCode, 400, `${field}: ${value}`);
      assert.ok(response.body.details.some((detail) => detail.field === field));
      assert.deepEqual(products, snapshot);
    }
  } finally {
    restoreProducts(snapshot);
  }
});

test('POST /api/products rejects invalid calendar dates without changing the store', async () => {
  const snapshot = snapshotProducts();

  try {
    for (const expiryDate of [
      '2026-02-29',
      '2026-02-31',
      '1900-02-29',
      '2026-13-01',
      '2026-01-00',
      '2026-01-01\n',
      '0000-01-01'
    ]) {
      const response = await request(app)
        .post('/api/products')
        .send({ ...validProduct, expiryDate });

      assert.equal(response.statusCode, 400, expiryDate);
      assert.deepEqual(response.body, {
        error: 'Validation failed',
        details: [{
          field: 'expiryDate',
          message: 'expiryDate must be a valid calendar date in YYYY-MM-DD format.'
        }]
      });
      assert.deepEqual(products, snapshot);
    }
  } finally {
    restoreProducts(snapshot);
  }
});

test('POST /api/products accepts valid leap-year dates', async () => {
  const snapshot = snapshotProducts();

  try {
    for (const expiryDate of ['2024-02-29', '2000-02-29']) {
      const response = await request(app)
        .post('/api/products')
        .send({ ...validProduct, expiryDate });

      assert.equal(response.statusCode, 201, expiryDate);
      assert.equal(response.body.expiryDate, expiryDate);
      restoreProducts(snapshot);
    }
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

test('PUT /api/products/:id rejects an invalid calendar date without changing the product', async () => {
  const snapshot = snapshotProducts();
  const existingProduct = snapshot.find((product) => product.id === 'p-001');

  try {
    const response = await request(app)
      .put('/api/products/p-001')
      .send({ ...existingProduct, expiryDate: '2026-02-29' });

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.body, {
      error: 'Validation failed',
      details: [{
        field: 'expiryDate',
        message: 'expiryDate must be a valid calendar date in YYYY-MM-DD format.'
      }]
    });
    assert.deepEqual(products, snapshot);
  } finally {
    restoreProducts(snapshot);
  }
});

test('PUT /api/products/:id rejects invalid field values without changing the product', async () => {
  const snapshot = snapshotProducts();
  const existingProduct = snapshot.find((product) => product.id === 'p-001');

  try {
    const response = await request(app)
      .put('/api/products/p-001')
      .send({ ...existingProduct, quantity: 2.5 });

    assert.equal(response.statusCode, 400);
    assert.ok(response.body.details.some((detail) => detail.field === 'quantity'));
    assert.deepEqual(products, snapshot);
  } finally {
    restoreProducts(snapshot);
  }
});

test('PUT /api/products/:id returns 404 for a missing product', async () => {
  const snapshot = snapshotProducts();

  try {
    const response = await request(app)
      .put('/api/products/missing')
      .send(validProduct);

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
