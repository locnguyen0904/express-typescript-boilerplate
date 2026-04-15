import { and, asc, count, desc, eq, SQL } from 'drizzle-orm';

import { db } from '@/services/database.service';

import { BaseDocument } from './base-document.core';

export interface PaginatedResult<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  page: number;
  nextPage: number | null;
  prevPage: number | null;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
}

export abstract class Repository<T extends BaseDocument> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(protected readonly table: any) {}

  async create(data: Partial<T>): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any = await db
      .insert(this.table)
      .values(data as Record<string, unknown>)
      .returning();
    return results[0] as T;
  }

  async createMany(data: Partial<T>[]): Promise<T[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any = await db
      .insert(this.table)
      .values(data as Record<string, unknown>[])
      .returning();
    return results as T[];
  }

  async findById(id: string): Promise<T | null> {
    const [result] = await db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id));
    return (result as T) ?? null;
  }

  async findOne(filter: Record<string, unknown>): Promise<T | null> {
    const conditions = this.buildConditions(filter);
    const query = db.select().from(this.table);
    const [result] = conditions ? await query.where(conditions) : await query;
    return (result as T) ?? null;
  }

  async find(filter: Record<string, unknown> = {}): Promise<T[]> {
    const conditions = this.buildConditions(filter);
    const query = db.select().from(this.table);
    return conditions
      ? ((await query.where(conditions)) as T[])
      : ((await query) as T[]);
  }

  async findAll(options: PaginationOptions = {}): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 25, sort = '-createdAt' } = options;

    const offset = (page - 1) * limit;

    const [countResult] = await db.select({ count: count() }).from(this.table);

    const totalDocs = Number(countResult.count);
    const totalPages = Math.ceil(totalDocs / limit);

    const orderBy = this.parseSort(sort);
    const results = await db
      .select()
      .from(this.table)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    return {
      docs: results as T[],
      totalDocs,
      limit,
      page,
      totalPages,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages,
    };
  }

  async count(filter: Record<string, unknown> = {}): Promise<number> {
    const conditions = this.buildConditions(filter);
    const query = db.select({ count: count() }).from(this.table);
    const [result] = conditions ? await query.where(conditions) : await query;
    return Number(result.count);
  }

  async exists(filter: Record<string, unknown>): Promise<boolean> {
    return (await this.count(filter)) > 0;
  }

  async updateById(id: string, data: Partial<T>): Promise<T | null> {
    const updateData = { ...data, updatedAt: new Date() } as Record<
      string,
      unknown
    >;
    const [result] = await db
      .update(this.table)
      .set(updateData)
      .where(eq(this.table.id, id))
      .returning();
    return (result as T) ?? null;
  }

  async updateOne(
    filter: Record<string, unknown>,
    data: Partial<T>
  ): Promise<T | null> {
    const conditions = this.buildConditions(filter);
    if (!conditions) return null;
    const updateData = { ...data, updatedAt: new Date() } as Record<
      string,
      unknown
    >;
    const [result] = await db
      .update(this.table)
      .set(updateData)
      .where(conditions)
      .returning();
    return (result as T) ?? null;
  }

  async updateMany(
    filter: Record<string, unknown>,
    data: Partial<T>
  ): Promise<number> {
    const conditions = this.buildConditions(filter);
    if (!conditions) return 0;
    const updateData = { ...data, updatedAt: new Date() } as Record<
      string,
      unknown
    >;
    const results = await db
      .update(this.table)
      .set(updateData)
      .where(conditions)
      .returning();
    return results.length;
  }

  async deleteById(id: string): Promise<T | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any = await db
      .delete(this.table)
      .where(eq(this.table.id, id))
      .returning();
    return (results[0] as T) ?? null;
  }

  async deleteOne(filter: Record<string, unknown>): Promise<T | null> {
    const conditions = this.buildConditions(filter);
    if (!conditions) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any = await db
      .delete(this.table)
      .where(conditions)
      .returning();
    return (results[0] as T) ?? null;
  }

  async deleteMany(filter: Record<string, unknown>): Promise<number> {
    const conditions = this.buildConditions(filter);
    if (!conditions) return 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any = await db
      .delete(this.table)
      .where(conditions)
      .returning();
    return results.length;
  }

  protected buildConditions(filter: Record<string, unknown>): SQL | undefined {
    const conditions: SQL[] = [];

    for (const [key, value] of Object.entries(filter)) {
      const column = this.table[key];
      if (column && typeof column === 'object' && 'name' in column) {
        conditions.push(eq(column, value));
      }
    }

    if (conditions.length === 0) return undefined;
    if (conditions.length === 1) return conditions[0];
    return and(...conditions);
  }

  protected parseSort(sort: string): SQL[] {
    const sortFields = sort.split(',').map((s) => s.trim());
    const orderBy: SQL[] = [];

    for (const field of sortFields) {
      const isDescField = field.startsWith('-');
      const fieldName = isDescField ? field.slice(1) : field;
      const column = this.table[fieldName];

      if (column && typeof column === 'object' && 'name' in column) {
        orderBy.push(isDescField ? desc(column) : asc(column));
      }
    }

    return orderBy.length > 0 ? orderBy : [desc(this.table.createdAt)];
  }
}
