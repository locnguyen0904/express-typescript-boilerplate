# Architecture

Design decisions and patterns used in this project.

## Layered Architecture

```
Request → Routes → Controller → Service → Repository → Interface → PostgreSQL (Drizzle)
```

| Layer      | Responsibility                        | Knows About |
| ---------- | ------------------------------------- | ----------- |
| Routes     | HTTP routing, middleware, validation  | Controller  |
| Controller | Request handling, response formatting | Service     |
| Service    | Business logic, orchestration         | Repository  |
| Repository | Data access, queries                  | Interface   |
| Interface  | TypeScript types                      | Drizzle     |

### Why This Pattern?

- **Separation of concerns:** Each layer has one responsibility
- **Testability:** Mock dependencies at any layer
- **Scalability:** Swap implementations without affecting other layers
- **Maintainability:** Changes isolated to relevant layer

## Repository Pattern

### Base Repository

Located at `core/repository.core.ts`, provides standard CRUD operations:

```typescript
export abstract class Repository<T extends BaseDocument> {
  constructor(protected readonly table: any) {}

  async create(data: Partial<T>): Promise<T>;
  async createMany(data: Partial<T>[]): Promise<T[]>;

  async findById(id: string): Promise<T | null>;
  async findOne(filter: Record<string, unknown>): Promise<T | null>;
  async find(filter: Record<string, unknown>): Promise<T[]>;
  async findAll(options: PaginationOptions): Promise<PaginatedResult<T>>;
  async count(filter: Record<string, unknown>): Promise<number>;
  async exists(filter: Record<string, unknown>): Promise<boolean>;

  async updateById(id: string, data: Partial<T>): Promise<T | null>;
  async updateOne(filter: Record<string, unknown>, data: Partial<T>): Promise<T | null>;
  async updateMany(filter: Record<string, unknown>, data: Partial<T>): Promise<number>;

  async deleteById(id: string): Promise<T | null>;
  async deleteOne(filter: Record<string, unknown>): Promise<T | null>;
  async deleteMany(filter: Record<string, unknown>): Promise<number>;
}
```

### Domain Repository Example

```typescript
export class UserRepository extends Repository<IUser> {
  constructor() {
    super(users);
  }

  // Domain-specific queries
  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email });
  }

  async isEmailTaken(email: string, excludeUserId?: string): Promise<boolean> {
    const filter: Record<string, unknown> = { email };
    if (excludeUserId) {
        // ... logic
    }
    return this.exists(filter);
  }
}
```

## Dependency Injection

Using Manual DI with a composition root in `src/container.ts`.

All shared instances are created once and wired together with plain constructors. Routes and runtime code import resolved instances from the container instead of resolving classes through a DI framework.

```typescript
// Repository - plain class
export class UserRepository extends Repository<IUser> {
  constructor() {
    super(users);
  }
}

// Service - constructor dependencies stay explicit
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventService: EventService
  ) {}
}

// Controller - plain constructor injection
export class UserController {
  constructor(private readonly userService: UserService) {}
}

// container.ts - composition root
const userRepository = new UserRepository();
const userService = new UserService(userRepository, eventService);
export const userController = new UserController(userService);
```

### Why DI?

- **Testability:** Replace with mocks easily
- **Loose coupling:** Classes don't construct dependencies
- **Simple runtime:** No decorators, metadata reflection, or container magic
- **Single instances:** Shared services stay singleton-like through the composition root

## Response Classes

Standardized API responses via response classes:

```typescript
// Success responses
new OK({ data: user }).send(res); // 200
new CREATED({ data: user }).send(res); // 201
new LIST({
  // 200 with pagination
  data: result.docs,
  total: result.totalDocs,
  page: result.page,
  pages: result.totalPages,
  limit: result.limit,
}).send(res);

// Errors (throw from Service or Controller)
throw new NotFoundError('User not found'); // 404 → RFC 9457 problem detail
throw new BadRequestError('Invalid input'); // 400
throw new UnAuthorizedError('Not logged in'); // 401
throw new ForbiddenError('Access denied'); // 403
```

### Response Format

```json
{
  "status": "success",
  "message": "OK",
  "data": { ... }
}
```

```json
{
  "status": "success",
  "message": "OK",
  "data": [...],
  "total": 100,
  "page": 1,
  "pages": 10,
  "limit": 10
}
```

## Error Handling

### Express 5 Async Support

Express 5 natively handles rejected promises in async middleware and route handlers. No wrapper needed:

```typescript
// Routes bind controller methods directly
router.get('/:id', controller.findOne.bind(controller));
```

### Error Flow

```
Controller throws → Express catches → Global Error Handler → RFC 9457 Response
```

### RFC 9457 Problem Details

Error responses follow [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) format with `Content-Type: application/problem+json`:

```json
{
  "type": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404",
  "title": "Not Found",
  "status": 404,
  "detail": "User not found",
  "instance": "/api/v1/users/123"
}
```

## Validation

Using Zod with `express-zod-safe` middleware:

```typescript
// validation.ts
export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
});

// routes
router.post('/', validate({ body: createUserSchema }), controller.create);
```

### Benefits

- Runtime type checking
- Auto-generated OpenAPI schemas
- TypeScript type inference

## Directory Structure

```
src/
├── api/                    # Feature modules
│   └── {resource}/
│       ├── {resource}.interface.ts        # Schema, interface
│       ├── {resource}.repository.ts   # Data access
│       ├── {resource}.service.ts      # Business logic
│       ├── {resource}.controller.ts   # HTTP handling
│       ├── {resource}.validation.ts   # Zod schemas
│       ├── {resource}.doc.ts          # OpenAPI registry
│       └── index.ts                   # Routes
├── core/                   # Framework classes
│   ├── repository.core.ts             # Base repository
│   ├── response-success.core.ts       # OK, CREATED, LIST
│   ├── response-error.core.ts         # AppError, NotFoundError
│   └── base-document.core.ts          # Base interface
├── config/                 # Configuration
├── helpers/                # Utilities
├── middlewares/            # Express middlewares
├── services/               # Shared services
└── __tests__/              # Tests (mirrors src)
```

## Design Decisions

### No Base Controller/Service Classes

**Rationale:** Forces inheritance hierarchy, reduces flexibility, harder to test.

**Instead:** Standalone classes with injected dependencies.

### Repository Layer

**Rationale:** Separates query logic from business logic. Makes testing easier, allows query optimization without changing services.

## Architectural Decision Records

Key decisions are documented in `docs/adr/`:

| ADR                                             | Decision                        |
| ----------------------------------------------- | ------------------------------- |
| [001](adr/001-argon2-password-hashing.md)       | Argon2 for password hashing     |
| [002](adr/002-tsyringe-dependency-injection.md) | Manual DI with composition root |
| [003](adr/003-pino-logging.md)                  | Pino for logging                |
| [004](adr/004-rfc9457-error-format.md)          | RFC 9457 error format           |
| [005](adr/005-opentelemetry-observability.md)   | OpenTelemetry for observability |
| [006](adr/006-drizzle-orm.md)                   | Drizzle ORM for PostgreSQL      |
