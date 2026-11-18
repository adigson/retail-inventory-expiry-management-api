# Architecture

This project follows a small Express.js layered design intended for a learning/demo API. The architecture keeps the application simple, easy to test, and easy to reason about as a single service.

```mermaid
flowchart LR
    Client[Postman or API client] --> Express[Express application]
    Express --> Middleware[CORS and JSON middleware]
    Middleware --> Routes[Health and product routes]
    Routes --> Validation[Product validation]
    Validation --> Repository[PostgreSQL repository]
    Repository --> Database[(PostgreSQL)]
    Routes --> Errors[404 and error handling]
    Errors --> Client
    Database --> Repository
    Repository --> Routes
    Routes --> Client
```

## Module responsibilities

### Application entry

The server starts in `server.js` and loads the Express app from `src/app.js`. It initializes environment variables from `.env` when present and starts listening on the configured port.

### Route layer

Routes are defined in the `src/routes` and related modules. They handle HTTP methods, validate request parameters, call the service logic, and return responses in the contract expected by the client.

### Validation and database constraints

Request validation checks field presence, type checks, numeric bounds, and date validity. PostgreSQL enforces non-empty values, non-negative price and quantity, and case-insensitive SKU uniqueness. The unique index is required to protect concurrent writes.

### Data layer

The PostgreSQL repository exposes operations for listing, creating, updating, deleting, and querying products. The server uses a pooled connection string; migration commands use the direct connection string.

### Error handling

A shared error handler normalizes failures into consistent JSON responses. It ensures that invalid requests, missing resources, malformed JSON, and unexpected server errors all return a predictable shape.

## Request lifecycle

A typical request follows this path:

1. A client sends an HTTP request to the Express app.
2. Middleware processes CORS and JSON parsing.
3. The matching route handler receives the request.
4. Validation checks run for required fields and business rules.
5. The repository executes a parameterized query against PostgreSQL.
6. The route returns an HTTP status code and JSON payload.
7. Any exception is caught by the global error handler and returned as a normalized JSON error.

## Design decisions

- Single-process service: suitable for demo and classroom use.
- PostgreSQL repository: keeps persistence concerns out of route handlers.
- Database unique index: guarantees SKU uniqueness even when requests arrive concurrently.
- Centralized validation: consistent rules across create and update flows.
- Shared error responses: predictable API behavior for clients and tests.
- Minimal dependencies: easier onboarding and simpler maintenance.

## Trade-offs

The current design is intentionally limited to match the learning/demo goal. It does not include user management, authorization, or deployment hardening.
