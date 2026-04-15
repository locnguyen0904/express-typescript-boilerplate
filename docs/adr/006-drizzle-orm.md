# ADR 006: Drizzle ORM for PostgreSQL

## Status
Accepted

## Context
We need a reliable, type-safe, and performant way to interact with our PostgreSQL database. The application requires strong TypeScript support, easy migration management, and high performance.

## Decision
We will use **Drizzle ORM** as our primary Object-Relational Mapper.

## Rationale
- **Type Safety:** Drizzle is "TypeScript-first" and provides excellent type inference without needing a separate code generation step for types (unlike Prisma).
- **Performance:** Drizzle is extremely lightweight with zero dependencies and a "no-magic" philosophy, resulting in performance close to raw SQL.
- **Developer Experience:** The SQL-like syntax is familiar to developers who know SQL, and the `drizzle-kit` provides a powerful CLI for migrations and database introspection.
- **Flexibility:** Drizzle allows us to use both a standard ORM-style API and a Relational Query API, giving us the best of both worlds depending on the complexity of the query.
- **Relational Query API:** Simplifies fetching complex nested relations while maintaining perfect type safety.

## Consequences
- All database schemas must be defined using Drizzle's `pgTable` and exported from the `db/schema/` directory.
- Migrations will be managed via `drizzle-kit generate` and applied using `drizzle-kit push` (for dev) or a migration runner (for prod).
- Repositories will use the Drizzle `db` instance to perform operations.
