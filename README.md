# Retail Inventory and Expiry Management API

Phase 1 REST API for managing retail products, expiry alerts, and low-stock alerts.

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer

## Run locally

```bash
npm install
copy .env.example .env
npm run dev
```

The API runs on `http://localhost:3000` by default. Verify the shared baseline with:

```bash
curl http://localhost:3000/health
```

## Endpoint Reference

Base URL: `http://localhost:3000`

All product responses use JSON. Product fields are:

| Field | Type | Rules |
| --- | --- | --- |
| `id` | string | Server-generated and unique |
| `name` | string | Required, non-empty |
| `sku` | string | Required, unique, case-insensitive |
| `category` | string | Required, non-empty |
| `price` | number | Required, must be greater than or equal to 0 |
| `quantity` | integer | Required, must be greater than or equal to 0 |
| `expiryDate` | `YYYY-MM-DD` string | Required, valid calendar date |

### Health check

`GET /health`

Returns `200 OK` with the service status:

```json
{
  "status": "ok",
  "service": "retail-inventory-expiry-management-api"
}
```

### List and search products

`GET /api/products`

Optional query parameters:

- `category`: exact category match, case-insensitive.
- `search`: case-insensitive substring search across product name, SKU, and category.

Returns `200 OK` with a JSON array.

### Create a product

`POST /api/products`

Send all product fields except `id` as JSON. Returns `201 Created` with the new product. Invalid fields return `400 Bad Request`; duplicate SKUs return `409 Conflict`.

### Update a product

`PUT /api/products/:id`

Send all product fields except `id` as JSON. Returns `200 OK` with the updated product. Invalid fields return `400 Bad Request`; duplicate SKUs return `409 Conflict`; an unknown ID returns `404 Not Found`.

### Delete a product

`DELETE /api/products/:id`

Returns `204 No Content` when deleted, or `404 Not Found` if the product ID does not exist.

### Low-stock alert

`GET /api/products/low-stock?threshold=10`

Returns products with quantity less than or equal to the threshold. The default threshold is `10`; it must be a non-negative integer. Invalid thresholds return `400 Bad Request`.

### Expiry alert

`GET /api/products/expiring-soon?days=7`

Returns products expiring from the current UTC calendar date through the given number of days ahead, inclusive. The default is `7`; expired products are excluded. Invalid values return `400 Bad Request`.

### Errors

Errors use JSON. For example:

```json
{
  "error": "Route not found",
  "details": []
}
```

Validation errors return `400 Bad Request`, duplicate SKUs return `409 Conflict`, missing products or routes return `404 Not Found`, malformed JSON returns `400 Bad Request`, oversized request bodies return `413 Payload Too Large`, and unexpected server errors return `500 Internal Server Error`.

Unexpected errors are logged by the server and return a generic message without exposing internal details.

## Postman collection

Import [`postman/retail-inventory-expiry-management.postman_collection.json`](./postman/retail-inventory-expiry-management.postman_collection.json) into Postman. The collection uses `http://localhost:3000` as its `baseUrl` by default; update the collection variable if the API is running on another port.

Run the requests in order to exercise the create, update, and delete flow. The create request generates a unique SKU and stores the returned product ID for the following update and delete requests. The API uses in-memory sample data, so changes do not persist after the server restarts.

## Project documents

- [Problem statement](./docs/problem-statement.md)
- [Architecture](./docs/architecture.md)
- [Group 5c demo slides](./submission/group-5c-retail-inventory-expiry-management-demo.pptx)
- Postman evidence screenshots:
  - [Health check](./submission/postman-screenshots/health-check.png)
  - [Product list](./submission/postman-screenshots/product-list.png)
  - [Category and search filter](./submission/postman-screenshots/product-filter-category-search.png)
  - [Low-stock alert](./submission/postman-screenshots/low-stock-alert.png)
  - [Unknown-route 404](./submission/postman-screenshots/unknown-route-404.png)

## Contribution workflow

1. Create a branch from `main`: `feature/<short-task-name>`.
2. Make one focused change and add or update tests.
3. Run `npm test` and check the API manually with Postman or curl.
4. Open a pull request into `main`; do not push directly to `main`.
5. Request one review before merge.

Do not commit `.env` or generated files. Keep route handlers, validation, data access, and error handling in their assigned modules.

The repository includes a GitHub Actions test check. Enable branch protection for `main` and require the CI check plus at least one approving review before merging pull requests.

## Ownership

See `CONTRIBUTING.md` for the Phase 1 task map and pull request checklist.
