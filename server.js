require('dotenv').config();

const { Pool } = require('pg');
const createApp = require('./src/app');
const { createPostgresProductRepository } = require('./src/data/postgresProductRepository');

const port = process.env.PORT || 3000;
if (!process.env.DATABASE_URL) {
  throw new Error('Set DATABASE_URL in .env before starting the API.');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error);
});

const app = createApp(createPostgresProductRepository(pool));

app.listen(port, () => {
  console.log(`Retail inventory API listening on port ${port}`);
});
