import { count, desc, eq } from 'drizzle-orm';
import { injectable } from 'inversify';

import { type PaginatedResult, withPagination } from '@/core';
import { users } from '@/db/schema';
import { db } from '@/services/database.service';

import type { IUser, NewUser } from './user.interface';

@injectable()
export class UserRepository {
  async create(data: NewUser): Promise<IUser> {
    const [result] = await db.insert(users).values(data).returning();
    return result;
  }

  async findById(id: string): Promise<IUser | null> {
    const [result] = await db.select().from(users).where(eq(users.id, id));
    return result ?? null;
  }

  async findAll(page = 1, pageSize = 25): Promise<PaginatedResult<IUser>> {
    const [countResult] = await db.select({ count: count() }).from(users);
    const total = Number(countResult.count);

    const query = db.select().from(users);
    const data = await withPagination(
      query.$dynamic(),
      desc(users.createdAt),
      page,
      pageSize
    );

    return { data, total };
  }

  async updateById(id: string, data: Partial<NewUser>): Promise<IUser | null> {
    const [result] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result ?? null;
  }

  async deleteById(id: string): Promise<IUser | null> {
    const [result] = await db.delete(users).where(eq(users.id, id)).returning();
    return result ?? null;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const [result] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return result ?? null;
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    const [result] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return result ?? null;
  }

  async isEmailTaken(email: string, excludeUserId?: string): Promise<boolean> {
    const [result] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));

    if (!result) return false;
    return excludeUserId ? result.id !== excludeUserId : true;
  }
}
