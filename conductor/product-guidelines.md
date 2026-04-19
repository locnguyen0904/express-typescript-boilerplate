# Product Guidelines

## 1. Code Quality & Consistency
- **Strong Typing:** Embrace TypeScript fully. Avoid `any` types; strictly type all variables, function parameters, and return types. Use Zod for runtime type checking and validation.
- **Linting and Formatting:** Adhere strictly to the project's ESLint and Prettier configurations. All code must pass `npm run lint` and `npm run prettier:fix` before being committed.
- **Consistent Naming:** Use `camelCase` for variables and functions, `PascalCase` for classes and interfaces, and `UPPER_SNAKE_CASE` for environment variables and constants.

## 2. API Design & Best Practices
- **RESTful Principles:** Follow standard REST conventions for endpoints. Use plural nouns for resources (e.g., `/users`, not `/user`).
- **Standardized Responses:** Utilize the core Response classes (`ResponseSuccess`, `ResponseError`) to ensure a consistent JSON structure across all API endpoints.
- **Documentation:** Maintain accurate, up-to-date API documentation using `zod-to-openapi` and Swagger UI.

## 3. Architecture & Modularity
- **Separation of Concerns:** Strictly follow the Controller-Service-Repository pattern. Controllers handle HTTP routing/validation, Services handle business logic, and Repositories handle database interactions.
- **Dependency Injection:** Use Inversify to inject dependencies, promoting modularity and making the application easier to test.

## 4. Security & Performance
- **Security First:** Never trust user input. Always validate via Zod. Ensure all endpoints are protected appropriately using the configured authentication (JWT) and security middlewares (Helmet, CSRF).
- **Asynchronous Processing:** Offload heavy or time-consuming tasks (e.g., email sending, data processing) to background queues using BullMQ.