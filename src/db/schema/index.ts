import { relations } from 'drizzle-orm';

import { examples } from './examples';
import { users } from './users';

export const usersRelations = relations(users, () => ({}));
export const examplesRelations = relations(examples, () => ({}));

export { examples } from './examples';
export { userRoleEnum, users } from './users';
