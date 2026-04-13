import { Repository } from '@/core';

import User, { IUser } from './user.model';

export class UserRepository extends Repository<IUser> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email });
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    const result = await this.model.findOne({ email }).select('+password');
    return result ? (result.toObject() as IUser) : null;
  }

  async isEmailTaken(email: string, excludeUserId?: string): Promise<boolean> {
    const filter: Record<string, unknown> = { email };
    if (excludeUserId) {
      filter._id = { $ne: excludeUserId };
    }
    return this.exists(filter);
  }
}
