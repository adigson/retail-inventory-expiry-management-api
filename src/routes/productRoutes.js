const express = require('express');
const products = require('../data/productStore');
const {
  validateUniqueSkuOnCreate,
  validateUniqueSkuOnUpdate
} = require('../middleware/validateUniqueSku');

const router = express.Router();


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

const requiredFields = [
  'name',
  'sku',
  'category',
  'price',
  'quantity',
  'expiryDate'
];

function validationError(details) {
  return {
    error: 'Validation failed',
    details
  };
}

function validateProductPayload(req, res, next) {
  const details = [];

  for (const field of requiredFields) {
    if (req.body?.[field] === undefined) {
      details.push({ field, message: `${field} is required.` });
    }
  }

  if (typeof req.body?.name !== 'string' || req.body.name.trim() === '') {
    details.push({ field: 'name', message: 'name must be a non-empty string.' });
  }

  if (typeof req.body?.sku !== 'string' || req.body.sku.trim() === '') {
    details.push({ field: 'sku', message: 'sku must be a non-empty string.' });
  }

  if (typeof req.body?.category !== 'string' || req.body.category.trim() === '') {
    details.push({ field: 'category', message: 'category must be a non-empty string.' });
  }

  if (typeof req.body?.price !== 'number' || req.body.price < 0) {
    details.push({ field: 'price', message: 'price must be a non-negative number.' });
  }

  if (!Number.isInteger(req.body?.quantity) || req.body.quantity < 0) {
    details.push({ field: 'quantity', message: 'quantity must be a non-negative integer.' });
  }

  if (
    typeof req.body?.expiryDate !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(req.body.expiryDate)
  ) {
    details.push({
      field: 'expiryDate',
      message: 'expiryDate must use the YYYY-MM-DD format.'
    });
  }

  if (details.length > 0) {
    return res.status(400).json(validationError(details));
  }

  return next();
}

function ensureProductExists(req, res, next) {
  const product = products.find((item) => item.id === req.params.id);

  if (!product) {
    return res.status(404).json({
      error: 'Product not found',
      details: [{ field: 'id', message: `No product exists with id ${req.params.id}.` }]
    });
  }

  return next();
}

router.post('/', validateProductPayload, validateUniqueSkuOnCreate, (req, res) => {
  const product = {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: req.body.name,
    sku: req.body.sku,
    category: req.body.category,
    price: req.body.price,
    quantity: req.body.quantity,
    expiryDate: req.body.expiryDate
  };

  products.push(product);
  return res.status(201).json(product);
});

router.put(
  '/:id',
  ensureProductExists,
  validateProductPayload,
  validateUniqueSkuOnUpdate,
  (req, res) => {
    const product = products.find((item) => item.id === req.params.id);

    Object.assign(product, {
      name: req.body.name,
      sku: req.body.sku,
      category: req.body.category,
      price: req.body.price,
      quantity: req.body.quantity,
      expiryDate: req.body.expiryDate
    });

    return res.status(200).json(product);
  }
);

module.exports = router;
