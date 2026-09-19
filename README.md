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

## Phase 1 API contract

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

Planned endpoints:

- `POST /api/products` creates a product and returns `201`.
- `GET /api/products` returns all products. Supported filters: `category` and `search`.
- `PUT /api/products/:id` updates a product and returns `200`.
- `DELETE /api/products/:id` deletes a product and returns `204`.
- `GET /api/products/expiring-soon?days=7` returns products expiring within the next number of days.
- `GET /api/products/low-stock?threshold=10` returns products at or below the threshold.

Recommended error shape:

```json
{
  "error": "Human-readable message",
  "details": []
}
```

## Contribution workflow

1. Create a branch from `main`: `feature/<short-task-name>`.
2. Make one focused change and add or update tests.
3. Run `npm test` and check the API manually with Postman or curl.
4. Open a pull request into `main`; do not push directly to `main`.
5. Request one review before merge.

Do not commit `.env` or generated files. Keep route handlers, validation, data access, and error handling in their assigned modules.

## Ownership

See `CONTRIBUTING.md` for the Phase 1 task map and pull request checklist.
