const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Pool } = require('pg');
const request = require('supertest');
const createApp = require('../src/app');
const { createPostgresProductRepository } = require('../src/data/postgresProductRepository');

const connectionString = process.env.TEST_DATABASE_URL;

function databaseIdentity(value) {
  const url = new URL(value);
  const hostname = url.hostname.replace(/-pooler(?=\.)/, '');
  return `${hostname}:${url.port || '5432'}${url.pathname}`;
}

test('concurrent case-insensitive duplicate SKU creates return one success and one conflict', {
  skip: !connectionString && 'Set TEST_DATABASE_URL to a dedicated test branch.'
}, async () => {
  if (new URL(connectionString).hostname.includes('-pooler')) {
    throw new Error('TEST_DATABASE_URL must be direct so it can also run migrations.');
  }

  const testIdentity = databaseIdentity(connectionString);
  const applicationUrls = [process.env.DATABASE_URL, process.env.DATABASE_URL_UNPOOLED]
    .filter(Boolean);

  if (applicationUrls.some((url) => databaseIdentity(url) === testIdentity)) {
    throw new Error('TEST_DATABASE_URL must not point to the application database.');
  }

  const pool = new Pool({ connectionString });
  const app = createApp(createPostgresProductRepository(pool));
  const sku = `CONCURRENCY-${randomUUID()}`;
  const payload = {
    name: 'Concurrency test product',
    sku,
    category: 'Test',
    price: 1,
    quantity: 1,
    expiryDate: '2099-12-31'
  };

  try {
    const responses = await Promise.all([
      request(app).post('/api/products').send(payload),
      request(app).post('/api/products').send({ ...payload, sku: sku.toLowerCase() })
    ]);

    assert.deepEqual(
      responses.map((response) => response.statusCode).sort(),
      [201, 409]
    );

    const conflictResponse = responses.find((response) => response.statusCode === 409);
    assert.deepEqual(conflictResponse.body, {
      error: 'Duplicate SKU',
      details: [
        {
          field: 'sku',
          message: 'SKU must be unique; another product already uses this SKU.'
        }
      ]
    });

    const { rows } = await pool.query(
      'SELECT COUNT(*)::integer AS count FROM products WHERE LOWER(sku) = LOWER($1)',
      [sku]
    );
    assert.equal(rows[0].count, 1);
  } finally {
    try {
      await pool.query('DELETE FROM products WHERE LOWER(sku) = LOWER($1)', [sku]);
    } finally {
      await pool.end();
    }
  }
});
