# Retail Inventory and Expiry Management API

## The problem

Small retail teams need a practical way to keep product records accurate, find items quickly, and spot low stock or approaching expiry. Missing those signals can contribute to stockouts, wasted goods, and avoidable manual work.

This project explores that workflow through a REST API. It is a learning/demo project, not a deployed retail system.

## What I built

The Phase 1 API supports:

- creating, listing, updating, and deleting product records
- filtering products by category and searching by name, SKU, or category
- finding products at or below a configurable stock threshold
- finding products expiring within a configurable date window
- validating product fields and rejecting duplicate SKUs without regard to case
- returning consistent JSON errors for invalid requests and missing resources

The product record contains a name, SKU, category, price, quantity, and expiry date. The API uses Express and Node.js, and its behavior is covered by automated tests using Node's test runner and Supertest.

## Design and trade-offs

The application separates the Express app, product routes, validation middleware, error handling, and product store. A small layered design keeps the request flow easy to follow and the routes testable without a database service.

The current store is in memory. This avoids database setup for the initial learning scope, but product changes are lost when the process restarts. The service is single-process and has no authentication, authorization, or multi-user access controls, so it should not be presented as production-ready.

See the [architecture notes](./architecture.md) for the request-flow diagram and module responsibilities, and the [problem statement](./problem-statement.md) for scope and acceptance criteria.

## Evidence

- Run the automated suite with `npm test`. Tests cover the health route, product CRUD, filters, validation, duplicate SKUs, date-window behavior, and error responses.
- Import the [Postman collection](../postman/retail-inventory-expiry-management.postman_collection.json) to exercise the API manually.
- Review the [Postman screenshots](../submission/postman-screenshots/) for captured examples of the health check, product listing and filtering, low-stock query, and unknown-route response.

These are functional checks of the current demo; no load or performance benchmarks are claimed.

## Next steps

1. Replace the in-memory store with PostgreSQL and migrations, then test persistence and data constraints.
2. Add authentication and role-based authorization for store staff and administrators.
3. Add pagination and audit history, and document operational behavior and security controls.
4. Deploy a usable demo only after the persistent version and its configuration are reliable.

Each step should be tested and documented before describing it as implemented.
