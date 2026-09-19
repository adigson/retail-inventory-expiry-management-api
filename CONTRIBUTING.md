# Contributing

## Phase 1 task map

- Core setup: Adigson and Temmy
- Product store: Emerald
- Create product: kingsleychiso...
- List and filter products: Ezekiel
- Update and delete product: Yahaya
- Product validation middleware: +234901...
- Expiring-soon route: Noah
- Low-stock route: BelieVe
- Global error handler: Jamila
- SKU uniqueness validation: Geoffrey
- Postman collection, tests, slides, and README improvements: late entrants and pending members

## Branch and pull request rules

Use a branch named `feature/<short-task-name>`. Keep commits focused and explain the behavior changed. Every feature pull request must include:

- A short description of the endpoint or middleware behavior.
- Tests for success and failure cases.
- Example request and response when an endpoint changes.
- Confirmation that `npm test` passes.

The maintainer merges only after the route contract, validation behavior, status codes, and error shape have been reviewed.

## Definition of done

Before requesting review, confirm that:

- The endpoint or middleware is implemented in the assigned module.
- Successful and invalid requests have automated tests.
- Missing resources return `404` with the agreed error shape.
- Validation failures return `400` with useful details.
- Duplicate SKUs return `409`.
- The implementation does not break existing tests.
- The GitHub Actions check passes.

## Shared decisions

- IDs are server-generated strings.
- SKU comparisons are case-insensitive.
- Dates use `YYYY-MM-DD` and are interpreted as calendar dates.
- Prices are non-negative numbers.
- Quantities are non-negative integers.
- Alert thresholds are configurable by query parameter and have documented defaults.
