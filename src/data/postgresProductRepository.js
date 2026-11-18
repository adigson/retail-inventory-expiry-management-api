const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    price: Number(row.price),
    quantity: row.quantity,
    expiryDate: row.expiry_date
  };
}

function mapProducts(rows) {
  return rows.map(mapProduct);
}

function getUtcDateRange(days) {
  const today = new Date().toISOString().slice(0, 10);
  const lastIncludedDate = new Date(`${today}T00:00:00.000Z`);
  lastIncludedDate.setUTCDate(lastIncludedDate.getUTCDate() + days);

  if (!Number.isFinite(lastIncludedDate.getTime()) || lastIncludedDate.getUTCFullYear() > 9999) {
    return [today, '9999-12-31'];
  }

  return [today, lastIncludedDate.toISOString().slice(0, 10)];
}

const productColumns = `
  id,
  name,
  sku,
  category,
  price,
  quantity,
  expiry_date::text AS expiry_date
`;

function createPostgresProductRepository(pool) {
  return {
    async list({ category = '', search = '' } = {}) {
      const conditions = [];
      const values = [];

      if (category) {
        values.push(category);
        conditions.push(`LOWER(category) = $${values.length}`);
      }

      if (search) {
        values.push(search);
        conditions.push(
          `POSITION(LOWER($${values.length}) IN LOWER(name || ' ' || sku || ' ' || category)) > 0`
        );
      }

      const whereClause = conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';
      const { rows } = await pool.query(
        `SELECT ${productColumns}
         FROM products
         ${whereClause}
         ORDER BY created_at, id`,
        values
      );

      return mapProducts(rows);
    },

    async listLowStock(threshold) {
      const { rows } = await pool.query(
        `SELECT ${productColumns}
         FROM products
         WHERE quantity <= $1::numeric
         ORDER BY created_at, id`,
        [threshold]
      );

      return mapProducts(rows);
    },

    async listExpiringSoon(days) {
      const dateRange = getUtcDateRange(days);
      const { rows } = await pool.query(
        `SELECT ${productColumns}
         FROM products
         WHERE expiry_date BETWEEN $1::date AND $2::date
         ORDER BY expiry_date, id`,
        dateRange
      );

      return mapProducts(rows);
    },

    async findById(id) {
      if (!uuidPattern.test(id)) {
        return null;
      }

      const { rows } = await pool.query(
        `SELECT ${productColumns}
         FROM products
         WHERE id = $1`,
        [id]
      );

      return rows.length === 0 ? null : mapProduct(rows[0]);
    },

    async create(product) {
      const { rows } = await pool.query(
        `INSERT INTO products (name, sku, category, price, quantity, expiry_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING ${productColumns}`,
        [
          product.name,
          product.sku,
          product.category,
          product.price,
          product.quantity,
          product.expiryDate
        ]
      );

      return mapProduct(rows[0]);
    },

    async updateById(id, product) {
      if (!uuidPattern.test(id)) {
        return null;
      }

      const { rows } = await pool.query(
        `UPDATE products
         SET name = $1,
             sku = $2,
             category = $3,
             price = $4,
             quantity = $5,
             expiry_date = $6
         WHERE id = $7
         RETURNING ${productColumns}`,
        [
          product.name,
          product.sku,
          product.category,
          product.price,
          product.quantity,
          product.expiryDate,
          id
        ]
      );

      return rows.length === 0 ? null : mapProduct(rows[0]);
    },

    async deleteById(id) {
      if (!uuidPattern.test(id)) {
        return false;
      }

      const { rowCount } = await pool.query(
        'DELETE FROM products WHERE id = $1',
        [id]
      );

      return rowCount > 0;
    }
  };
}

module.exports = { createPostgresProductRepository };
