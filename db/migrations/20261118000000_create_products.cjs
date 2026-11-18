exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL CHECK (btrim(name) <> ''),
      sku TEXT NOT NULL CHECK (btrim(sku) <> ''),
      category TEXT NOT NULL CHECK (btrim(category) <> ''),
      price NUMERIC NOT NULL CHECK (price >= 0),
      quantity INTEGER NOT NULL CHECK (quantity >= 0),
      expiry_date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX products_sku_lower_unique_idx
      ON products (LOWER(sku));
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP TABLE products;');
};
