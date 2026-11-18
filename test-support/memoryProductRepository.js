const { randomUUID } = require('node:crypto');

function duplicateSkuError() {
  return Object.assign(new Error('Duplicate SKU'), {
    code: '23505',
    constraint: 'products_sku_lower_unique_idx'
  });
}

function assertUniqueSku(products, sku, excludedId) {
  const normalizedSku = sku.toLowerCase();
  const isDuplicate = products.some((product) =>
    product.id !== excludedId && product.sku.toLowerCase() === normalizedSku
  );

  if (isDuplicate) {
    throw duplicateSkuError();
  }
}

function createMemoryProductRepository(products) {
  return {
    async list({ category = '', search = '' } = {}) {
      return products.filter((product) => {
        const matchesCategory = !category
          || product.category.toLowerCase() === category;
        const searchableText = `${product.name} ${product.sku} ${product.category}`
          .toLowerCase();
        const matchesSearch = !search || searchableText.includes(search);

        return matchesCategory && matchesSearch;
      });
    },

    async listLowStock(threshold) {
      return products.filter((product) => product.quantity <= threshold);
    },

    async listExpiringSoon(days) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const todayDayNumber = today.getTime() / 86400000;
      const lastIncludedDayNumber = todayDayNumber + days;

      return products.filter((product) => {
        const expiryDayNumber = Date.parse(`${product.expiryDate}T00:00:00.000Z`) / 86400000;
        return expiryDayNumber >= todayDayNumber
          && expiryDayNumber <= lastIncludedDayNumber;
      });
    },

    async findById(id) {
      return products.find((product) => product.id === id) || null;
    },

    async create(product) {
      assertUniqueSku(products, product.sku);
      const createdProduct = { id: randomUUID(), ...product };
      products.push(createdProduct);
      return createdProduct;
    },

    async updateById(id, product) {
      const existingProduct = products.find((item) => item.id === id);
      if (!existingProduct) {
        return null;
      }

      assertUniqueSku(products, product.sku, id);
      Object.assign(existingProduct, product);
      return existingProduct;
    },

    async deleteById(id) {
      const productIndex = products.findIndex((product) => product.id === id);
      if (productIndex === -1) {
        return false;
      }

      products.splice(productIndex, 1);
      return true;
    }
  };
}

module.exports = { createMemoryProductRepository };
