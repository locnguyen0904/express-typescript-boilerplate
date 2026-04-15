import request from 'supertest';

import { IUser } from '@/api/users/user.interface';
import app from '@/app';
import { users } from '@/db/schema';
import { connectDB, db, disconnectDB } from '@/services/database.service';

export const TEST_ADMIN = {
  fullName: 'Admin User',
  email: 'admin@test.com',
  password: 'Admin@123456',
  role: 'admin' as const,
} as const;

export const TEST_USER = {
  fullName: 'Regular User',
  email: 'user@test.com',
  password: 'User@123456',
  role: 'user' as const,
} as const;

export async function connectTestDB(): Promise<void> {
  await connectDB();
}

export async function disconnectTestDB(): Promise<void> {
  await disconnectDB();
}

export async function clearDatabase(): Promise<void> {
  await db.delete(users);
}

export async function seedAdmin(): Promise<IUser> {
  const result = await db
    .insert(users)
    .values({
      fullName: TEST_ADMIN.fullName,
      email: TEST_ADMIN.email,
      password: TEST_ADMIN.password,
      role: TEST_ADMIN.role,
    })
    .returning();
  return result[0] as IUser;
}

export async function seedUser(): Promise<IUser> {
  const result = await db
    .insert(users)
    .values({
      fullName: TEST_USER.fullName,
      email: TEST_USER.email,
      password: TEST_USER.password,
      role: TEST_USER.role,
    })
    .returning();
  return result[0] as IUser;
}

interface LoginResponse {
  data: {
    user: IUser;
    token: string;
  };
}

export async function loginAs(
  email: string,
  password: string
): Promise<{ token: string; user: IUser }> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);

  const body = res.body as LoginResponse;
  return {
    token: body.data.token,
    user: body.data.user,
  };
}

export async function loginAsAdmin(): Promise<{ token: string; user: IUser }> {
  return loginAs(TEST_ADMIN.email, TEST_ADMIN.password);
}

export async function loginAsUser(): Promise<{ token: string; user: IUser }> {
  return loginAs(TEST_USER.email, TEST_USER.password);
}

export function authRequest(token: string) {
  return {
    get: (url: string) =>
      request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) =>
      request(app).post(url).set('Authorization', `Bearer ${token}`),
    put: (url: string) =>
      request(app).put(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) =>
      request(app).delete(url).set('Authorization', `Bearer ${token}`),
  };
}
