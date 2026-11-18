const express = require('express');
const cors = require('cors');
const createProductRoutes = require('./routes/productRoutes');
const errorHandler = require('./middleware/errorHandler');

function createApp(productRepository) {
  if (!productRepository) {
    throw new Error('A product repository is required to create the app.');
  }

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'retail-inventory-expiry-management-api' });
  });

  app.use('/api/products', createProductRoutes(productRepository));

  app.use((req, res) => {
    res.status(404).json({
      error: 'Route not found',
      details: []
    });
  });

  app.use(errorHandler);

  return app;
}

module.exports = createApp;
