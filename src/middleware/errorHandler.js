function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON request',
      details: [{ field: 'body', message: 'Request body must contain valid JSON.' }]
    });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Request body too large',
      details: [{ field: 'body', message: 'Request body exceeds the allowed size.' }]
    });
  }

  if (error.code === '23505' && error.constraint === 'products_sku_lower_unique_idx') {
    return res.status(409).json({
      error: 'Duplicate SKU',
      details: [
        {
          field: 'sku',
          message: 'SKU must be unique; another product already uses this SKU.'
        }
      ]
    });
  }

  console.error(error);
  return res.status(500).json({
    error: 'Internal server error',
    details: []
  });
}

module.exports = errorHandler;
