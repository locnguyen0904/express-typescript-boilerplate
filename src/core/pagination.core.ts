import { SQL } from 'drizzle-orm';
import type { PgSelect } from 'drizzle-orm/pg-core';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export function withPagination<T extends PgSelect>(
  qb: T,
  orderByColumn: SQL | SQL.Aliased,
  page = 1,
  pageSize = 25
) {
  return qb
    .orderBy(orderByColumn)
    .limit(pageSize)
    .offset((page - 1) * pageSize);
}
