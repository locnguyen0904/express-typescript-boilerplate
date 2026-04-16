import { count, desc, eq } from 'drizzle-orm';
import { injectable } from 'inversify';

import { type PaginatedResult, withPagination } from '@/core';
import { examples } from '@/db/schema';
import { db } from '@/services/database.service';

import type { IExample, NewExample } from './example.interface';

@injectable()
export class ExampleRepository {
  async create(data: NewExample): Promise<IExample> {
    const [result] = await db.insert(examples).values(data).returning();
    return result;
  }

  async findById(id: string): Promise<IExample | null> {
    const [result] = await db
      .select()
      .from(examples)
      .where(eq(examples.id, id));
    return result ?? null;
  }

  async findAll(page = 1, pageSize = 25): Promise<PaginatedResult<IExample>> {
    const [countResult] = await db.select({ count: count() }).from(examples);
    const total = Number(countResult.count);

    const query = db.select().from(examples);
    const data = await withPagination(
      query.$dynamic(),
      desc(examples.createdAt),
      page,
      pageSize
    );

    return { data, total };
  }

  async updateById(
    id: string,
    data: Partial<NewExample>
  ): Promise<IExample | null> {
    const [result] = await db
      .update(examples)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(examples.id, id))
      .returning();
    return result ?? null;
  }

  async deleteById(id: string): Promise<IExample | null> {
    const [result] = await db
      .delete(examples)
      .where(eq(examples.id, id))
      .returning();
    return result ?? null;
  }
}
