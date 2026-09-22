const express = require('express');
const router = express.Router();
const products = require('../data/productStore');

router.post('/', (req, res) => {
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

  // Validate SKU safely
  if (typeof sku !== 'string' || sku.trim() === '') {
    return res.status(400).json({
      error: 'SKU must be a valid string'
    });
  }

  // Validate price and quantity
  if (
    typeof price !== 'number' ||
    !Number.isFinite(price) ||
    price < 0 ||
    typeof quantity !== 'number' ||
    !Number.isFinite(quantity) ||
    quantity < 0 ||
    !Number.isInteger(quantity)
  ) {
    return res.status(400).json({
      error: 'Price must be a non-negative number and quantity must be a non-negative integer'
    });
  }

  // Validate expiry date safely
  if (typeof expiryDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
    return res.status(400).json({
      error: 'expiryDate must be in YYYY-MM-DD format'
    });
  }

  const [year, month, day] = expiryDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return res.status(400).json({
      error: 'expiryDate must be a valid calendar date'
    });
  }

  // Check for duplicate SKU (case-insensitive)
  const duplicateSku = products.some(
    product =>
      typeof product.sku === 'string' &&
      product.sku.toLowerCase() === sku.trim().toLowerCase()
  );

  if (duplicateSku) {
    return res.status(409).json({
      error: 'SKU already exists'
    });
  }

  // Create new product
  const newProduct = {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    sku: sku.trim(),
    category,
    price,
    quantity,
    expiryDate
  };

  products.push(newProduct);

  return res.status(201).json(newProduct);
});

module.exports = router;
