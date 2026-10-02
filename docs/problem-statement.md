# Problem Statement

Retailers need to track product quantities and expiry dates to reduce stockouts and limit losses from expired goods. When inventory information is difficult to search or monitor, staff may miss low-stock items, overlook products nearing expiry, or have trouble keeping product records accurate.

This project provides a REST API for managing retail product records. It supports creating, viewing, updating, and deleting products; searching by product details and category; and identifying low-stock or soon-to-expire products.

The current version is a learning/demo API. Product data is stored in memory and is not retained when the server restarts. Persistent storage, authentication, and a user interface are outside the current scope.

## Business scenario

A store team needs a simple way to track inventory records without a full ERP system. The API should allow staff to:

- add new products with product metadata and expiry dates
- update existing records when stock changes or product details change
- quickly find records using category or keyword filtering
- identify stock that is low or near expiry before it becomes a loss event

## User needs

The product must solve the following concerns:

- product records must be easy to create and maintain
- search and filtering must be immediate and case-insensitive where appropriate
- validation must prevent bad data from entering the system
- alerts must help teams act before stockouts or expiry losses occur

## Acceptance criteria

The project is considered complete for its Phase 1 scope when all of the following are true:

- products can be created, listed, updated, and deleted through the API
- product fields enforce the documented validation rules
- duplicate SKUs are rejected consistently
- low-stock and expiring-soon queries return correct results
- invalid requests return useful JSON error responses
- automated tests cover the main success and failure scenarios

## Non-goals

The Phase 1 project does not include:

- database persistence
- user authentication or authorization
- production-grade security hardening
- UI dashboards or reporting tools
- bulk import/export flows
- real-time notifications or background workers

## Roadmap

### Phase 1: core API

Focus on CRUD operations, search, validation, and alert endpoints.

### Phase 2: persistence and reliability

Add durable storage, better error logging, and robust validation at the data-access layer.

### Phase 3: operational tooling

Introduce dashboard reporting, authentication, and role-based access for staff workflows.

### Phase 4: production readiness

Add deployment configuration, CI/CD quality gates, security reviews, and monitoring.
