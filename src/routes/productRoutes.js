const express = require('express');
const products = require('../data/productStore');
const {
  validateUniqueSkuOnCreate,
  validateUniqueSkuOnUpdate
} = require('../middleware/validateUniqueSku');

const router = express.Router();

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
