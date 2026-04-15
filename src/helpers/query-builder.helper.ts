import {
  and,
  between,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  ne,
  not,
  notInArray,
  or,
  SQL,
} from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';

export default class QueryBuilder {
  private conditions: SQL[] = [];

  where<T>(column: PgColumn, value: T): this {
    this.conditions.push(eq(column, value as never));
    return this;
  }

  whereNot<T>(column: PgColumn, value: T): this {
    this.conditions.push(ne(column, value as never));
    return this;
  }

  whereIn<T>(column: PgColumn, values: T[]): this {
    this.conditions.push(inArray(column, values as never[]));
    return this;
  }

  whereNotIn<T>(column: PgColumn, values: T[]): this {
    this.conditions.push(notInArray(column, values as never[]));
    return this;
  }

  whereGreaterThan<T>(column: PgColumn, value: T): this {
    this.conditions.push(gt(column, value as never));
    return this;
  }

  whereGreaterThanOrEqual<T>(column: PgColumn, value: T): this {
    this.conditions.push(gte(column, value as never));
    return this;
  }

  whereLessThan<T>(column: PgColumn, value: T): this {
    this.conditions.push(lt(column, value as never));
    return this;
  }

  whereLessThanOrEqual<T>(column: PgColumn, value: T): this {
    this.conditions.push(lte(column, value as never));
    return this;
  }

  whereBetween<T>(column: PgColumn, min: T, max: T): this {
    this.conditions.push(between(column, min as never, max as never));
    return this;
  }

  whereNull(column: PgColumn): this {
    this.conditions.push(isNull(column));
    return this;
  }

  whereNotNull(column: PgColumn): this {
    this.conditions.push(isNotNull(column));
    return this;
  }

  whereLike(column: PgColumn, pattern: string): this {
    this.conditions.push(like(column, pattern));
    return this;
  }

  whereILike(column: PgColumn, pattern: string): this {
    this.conditions.push(ilike(column, pattern));
    return this;
  }

  search(column: PgColumn, term: string): this {
    this.conditions.push(ilike(column, `%${term}%`));
    return this;
  }

  whereNotCondition(condition: SQL): this {
    this.conditions.push(not(condition));
    return this;
  }

  orGroup(conditions: SQL[]): this {
    this.conditions.push(or(...conditions)!);
    return this;
  }

  andGroup(conditions: SQL[]): this {
    this.conditions.push(and(...conditions)!);
    return this;
  }

  raw(condition: SQL): this {
    this.conditions.push(condition);
    return this;
  }

  build(): SQL | undefined {
    if (this.conditions.length === 0) return undefined;
    if (this.conditions.length === 1) return this.conditions[0];
    return and(...this.conditions)!;
  }

  reset(): this {
    this.conditions = [];
    return this;
  }
}
