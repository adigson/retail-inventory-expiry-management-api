const express = require('express');
const router = express.Router();
const products = require('../data/productStore');

router.post('/products', (req, res) => {
  const {
    name,
    sku,
    category,
    price,
    quantity,
    expiryDate
  } = req.body;

  // Check required fields
  if (
    !name ||
    !sku ||
    !category ||
    price === undefined ||
    quantity === undefined ||
    !expiryDate
  ) {
    return res.status(400).json({
      error: 'All fields are required'
    });
  }

  // Validate price and quantity
  if (
    typeof price !== 'number' ||
    price < 0 ||
    typeof quantity !== 'number' ||
    quantity < 0
  ) {
    return res.status(400).json({
      error: 'Price and quantity must be non-negative numbers'
    });
  }

  // Validate expiry date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
    return res.status(400).json({
      error: 'expiryDate must be in YYYY-MM-DD format'
    });
  }

  // Check for duplicate SKU
  const duplicateSku = products.some(
    product => product.sku.toLowerCase() === sku.toLowerCase()
  );

  if (duplicateSku) {
    return res.status(409).json({
      error: 'SKU already exists'
    });
  }

  // Create new product
  const newProduct = {
    id: `p-${Date.now()}`,
    name,
    sku,
    category,
    price,
    quantity,
    expiryDate
  };

  products.push(newProduct);

  return res.status(201).json(newProduct);
});

module.exports = router;
