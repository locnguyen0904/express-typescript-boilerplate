import { eq } from 'drizzle-orm';

import { Repository } from '@/core';
import { users } from '@/db/schema';
import { db } from '@/services/database.service';

import { IUser } from './user.interface';

export class UserRepository extends Repository<IUser> {
  constructor() {
    super(users);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const [result] = await db
      .select()
      .from(this.table)
      .where(eq(users.email, email));
    return (result as IUser) ?? null;
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    const [result] = await db
      .select()
      .from(this.table)
      .where(eq(users.email, email));
    return (result as IUser) ?? null;
  }

  async isEmailTaken(email: string, excludeUserId?: string): Promise<boolean> {
    if (excludeUserId) {
      const [result] = await db
        .select({ id: users.id })
        .from(this.table)
        .where(eq(users.email, email));
      return !!result && result.id !== excludeUserId;
    }

    return this.exists({ email });
  }
}
