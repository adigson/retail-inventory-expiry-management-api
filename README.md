# Retail Inventory and Expiry Management API

Phase 1 REST API for managing retail products, expiry alerts, and low-stock alerts.

**Case study:** [Read about the problem, design decisions, current scope, evidence, and next steps](./docs/case-study.md).

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer

## Run locally

```bash
npm install
copy .env.example .env
npm run db:migrate
npm run dev
```

The API runs on `http://localhost:3000` by default. Verify the shared baseline with:

```bash
curl http://localhost:3000/health
```

## PostgreSQL setup

The API stores products in PostgreSQL. The migration creates the `products` table, validates database-level field constraints, and enforces case-insensitive SKU uniqueness with a unique index on `LOWER(sku)`.

1. Copy `.env.example` to `.env`. Keep `.env` local; it is ignored by Git.
2. Set `DATABASE_URL` to the pooled connection string for app queries.
3. Set `DATABASE_URL_UNPOOLED` to the direct connection string for migrations.
4. Run `npm run db:migrate` to apply migrations to the selected development branch.

The migration command uses the direct URL intentionally. Do not use the portfolio database or a production branch for development.

For the concurrency integration test, create a separate Neon test branch, set `TEST_DATABASE_URL` to its direct connection string, then run:

```bash
npm run db:migrate:test
npm test
```

The test checks that simultaneous requests with case-insensitive duplicate SKUs produce one success and one `409 Conflict`. It refuses to use the same database as `DATABASE_URL`.

## Local verification checklist

Use the following quick checks before considering the API ready for review:

1. Install dependencies, configure `.env`, and run `npm run db:migrate`.
2. Start the service.
3. Confirm health is available: `GET /health` should return `200 OK` and the service name.
4. Create a product via `POST /api/products` using a valid payload.
5. Confirm the new product appears in `GET /api/products`.
6. Exercise filter queries: category, search, low-stock, and expiring-soon.
7. Validate failure paths: invalid payloads, duplicate SKUs, unknown IDs, and malformed JSON.
8. Run the automated tests: `npm test`.

## Request validation rules

All product requests share the same field validation contract:

- `name`: required, non-empty string.
- `sku`: required, unique, case-insensitive comparison.
- `category`: required, non-empty string.
- `price`: required, numeric value greater than or equal to `0`.
- `quantity`: required, integer value greater than or equal to `0`.
- `expiryDate`: required, valid `YYYY-MM-DD` calendar date; invalid dates return `400`.

Additional API-specific rules:

- `GET /api/products` supports optional `category` and `search` query filters.
- `GET /api/products/low-stock` accepts an optional `threshold` query parameter; default is `10` and it must be a non-negative integer.
- `GET /api/products/expiring-soon` accepts an optional `days` query parameter; default is `7` and it must be a non-negative integer.
- Duplicate SKUs are rejected with `409 Conflict` even when their casing differs.
- Unknown product IDs return `404 Not Found`.

## Example requests and responses

### Create a valid product

Request:

```http
POST /api/products
Content-Type: application/json

{
  "name": "Milk",
  "sku": "MILK-001",
  "category": "Dairy",
  "price": 2.75,
  "quantity": 18,
  "expiryDate": "2026-10-30"
}
```

Successful response:

```json
{
  "id": "d0ff2d1e-3451-4e7e-8ebb-a60770eb6789",
  "name": "Milk",
  "sku": "MILK-001",
  "category": "Dairy",
  "price": 2.75,
  "quantity": 18,
  "expiryDate": "2026-10-30"
}
```

### Duplicate SKU error

Request:

```http
POST /api/products
Content-Type: application/json

{
  "name": "Milk Deluxe",
  "sku": "milk-001",
  "category": "Dairy",
  "price": 3.25,
  "quantity": 12,
  "expiryDate": "2026-11-05"
}
```

Response:

```json
{
  "error": "Duplicate SKU",
  "details": [
    {
      "field": "sku",
      "message": "SKU must be unique; another product already uses this SKU."
    }
  ]
}
```

### Search and filter response

Request:

```http
GET /api/products?category=dairy&search=milk
```

Response:

```json
[
  {
    "id": "d0ff2d1e-3451-4e7e-8ebb-a60770eb6789",
    "name": "Milk",
    "sku": "MILK-001",
    "category": "Dairy",
    "price": 2.75,
    "quantity": 18,
    "expiryDate": "2026-10-30"
  }
]
```

## Troubleshooting

### Port already in use

If `localhost:3000` is already occupied, update the `PORT` value in `.env` or start the service with a different environment variable before running the API.

### Health route fails

Check that the app started successfully and that dependencies are installed:

```bash
npm install
npm start
```

Then confirm:

```bash
curl http://localhost:3000/health
```

### Request validation errors

Validation errors usually mean one of the following:

- required field omitted
- numeric value is negative or not numeric
- quantity is not an integer
- date is malformed or invalid
- duplicate SKU exists

### Tests fail after a change

Run the project test suite to identify exactly what behavior regressed:

```bash
npm test
```

## Current limitations and next steps

This learning/demo project is not deployed for retail use. Current limitations include:

- there is no authentication or authorization layer
- there is no web UI or dashboard
- there is no pagination for large collections

Planned next steps for a broader production-ready version include:

- add a seed script with sample inventory data
- add user and role management
- add audit logs and API security controls
- add pagination, sorting, and bulk operations
- provide dashboards for stock and expiry risk monitoring

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

- [Case study](./docs/case-study.md)
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
