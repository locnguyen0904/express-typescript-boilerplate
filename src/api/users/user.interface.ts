import { userRoleEnum, users } from '@/db/schema';

export type IUser = typeof users.$inferSelect;
export type UserRole = (typeof userRoleEnum.enumValues)[number];

export const USER_ROLES = userRoleEnum.enumValues as readonly UserRole[];
