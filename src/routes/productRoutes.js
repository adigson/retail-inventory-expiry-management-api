const express = require('express');

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

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function isValidCalendarDate(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match || match[0].length !== value.length) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year === 0 || month < 1 || month > 12) {
    return false;
  }

  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  return day >= 1 && day <= daysInMonth[month - 1];
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

  if (typeof req.body?.price !== 'number'
    || !Number.isFinite(req.body.price)
    || req.body.price < 0) {
    details.push({ field: 'price', message: 'price must be a non-negative number.' });
  }

  if (!Number.isInteger(req.body?.quantity) || req.body.quantity < 0) {
    details.push({ field: 'quantity', message: 'quantity must be a non-negative integer.' });
  }

  if (!isValidCalendarDate(req.body?.expiryDate)) {
    details.push({
      field: 'expiryDate',
      message: 'expiryDate must be a valid calendar date in YYYY-MM-DD format.'
    });
  }

  if (details.length > 0) {
    return res.status(400).json(validationError(details));
  }

  return next();
}

function notFoundProductResponse(id) {
  return {
    error: 'Product not found',
    details: [{ field: 'id', message: `No product exists with id ${id}.` }]
  };
}

function createProductRoutes(repository) {
  const router = express.Router();

  const ensureProductExists = asyncRoute(async (req, res, next) => {
    const product = await repository.findById(req.params.id);

    if (!product) {
      return res.status(404).json(notFoundProductResponse(req.params.id));
    }

    return next();
  });

  router.get('/low-stock', asyncRoute(async (req, res) => {
    const rawThreshold = req.query.threshold === undefined
      ? '10'
      : req.query.threshold;
    const thresholdIsValid = typeof rawThreshold === 'string' && /^\d+$/.test(rawThreshold);
    const threshold = thresholdIsValid ? Number(rawThreshold) : NaN;

    if (!Number.isSafeInteger(threshold)) {
      return res.status(400).json(validationError([
        {
          field: 'threshold',
          message: 'threshold must be a non-negative integer.'
        }
      ]));
    }

    const lowStockProducts = await repository.listLowStock(threshold);
    return res.status(200).json(lowStockProducts);
  }));

  router.get('/expiring-soon', asyncRoute(async (req, res) => {
    const rawDays = req.query.days === undefined ? '7' : req.query.days;
    const daysIsValid = typeof rawDays === 'string' && /^\d+$/.test(rawDays);
    const days = daysIsValid ? Number(rawDays) : NaN;

    if (!Number.isSafeInteger(days)) {
      return res.status(400).json(validationError([
        {
          field: 'days',
          message: 'days must be a non-negative integer.'
        }
      ]));
    }

    const expiringProducts = await repository.listExpiringSoon(days);
    return res.status(200).json(expiringProducts);
  }));

  router.get('/', asyncRoute(async (req, res) => {
    const category = typeof req.query.category === 'string'
      ? req.query.category.trim().toLowerCase()
      : '';
    const search = typeof req.query.search === 'string'
      ? req.query.search.trim().toLowerCase()
      : '';

    const filteredProducts = await repository.list({ category, search });
    return res.status(200).json(filteredProducts);
  }));

  router.post('/', validateProductPayload, asyncRoute(async (req, res) => {
    const product = await repository.create({
      name: req.body.name,
      sku: req.body.sku,
      category: req.body.category,
      price: req.body.price,
      quantity: req.body.quantity,
      expiryDate: req.body.expiryDate
    });

    return res.status(201).json(product);
  }));

  router.put('/:id', ensureProductExists, validateProductPayload, asyncRoute(async (req, res) => {
    const product = await repository.updateById(req.params.id, {
      name: req.body.name,
      sku: req.body.sku,
      category: req.body.category,
      price: req.body.price,
      quantity: req.body.quantity,
      expiryDate: req.body.expiryDate
    });

    if (!product) {
      return res.status(404).json(notFoundProductResponse(req.params.id));
    }

    return res.status(200).json(product);
  }));

  router.delete('/:id', asyncRoute(async (req, res) => {
    const deleted = await repository.deleteById(req.params.id);
    if (!deleted) {
      return res.status(404).json(notFoundProductResponse(req.params.id));
    }

    return res.status(204).send();
  }));

  return router;
}

module.exports = createProductRoutes;
