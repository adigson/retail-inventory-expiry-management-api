const products = require('../data/productStore');

const duplicateSkuError = {
  error: 'Duplicate SKU',
  details: [
    {
      field: 'sku',
      message: 'SKU must be unique; another product already uses this SKU.'
    }
  ]
};

function normalizeSku(sku) {
  return typeof sku === 'string' ? sku.toLowerCase() : null;
}

function hasDuplicateSku(sku, excludedProductId) {
  const normalizedSku = normalizeSku(sku);

  if (normalizedSku === null) {
    return false;
  }

  return products.some((product) => {
    if (excludedProductId && product.id === excludedProductId) {
      return false;
    }

    return normalizeSku(product.sku) === normalizedSku;
  });
}

function validateUniqueSkuOnCreate(req, res, next) {
  if (hasDuplicateSku(req.body?.sku)) {
    return res.status(409).json(duplicateSkuError);
  }

  return next();
}

function validateUniqueSkuOnUpdate(req, res, next) {
  if (hasDuplicateSku(req.body?.sku, req.params.id)) {
    return res.status(409).json(duplicateSkuError);
  }

  return next();
}

module.exports = {
  hasDuplicateSku,
  normalizeSku,
  validateUniqueSkuOnCreate,
  validateUniqueSkuOnUpdate
};
