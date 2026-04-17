import argon2 from 'argon2';
import request from 'supertest';

import { IUser } from '@/api/users/user.interface';
import app from '@/app';
import { users } from '@/db/schema';
import { container, TOKENS } from '@/di';
import { connectDB, db, disconnectDB } from '@/services/database.service';
import RedisService from '@/services/redis.service';

const redisService = container.get<RedisService>(TOKENS.RedisService);

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
  await redisService.connect();
}

export async function disconnectTestDB(): Promise<void> {
  await redisService.disconnect();
  await disconnectDB();
}

export async function clearDatabase(): Promise<void> {
  await db.delete(users);
}

export async function seedAdmin(): Promise<IUser> {
  const hashedPassword = await argon2.hash(TEST_ADMIN.password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const result = await db
    .insert(users)
    .values({
      fullName: TEST_ADMIN.fullName,
      email: TEST_ADMIN.email,
      password: hashedPassword,
      role: TEST_ADMIN.role,
    })
    .returning();
  return result[0] as IUser;
}

export async function seedUser(): Promise<IUser> {
  const hashedPassword = await argon2.hash(TEST_USER.password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const result = await db
    .insert(users)
    .values({
      fullName: TEST_USER.fullName,
      email: TEST_USER.email,
      password: hashedPassword,
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

export async function getCsrfSession(): Promise<{
  csrfToken: string;
  cookieHeader: string;
}> {
  const res = await request(app).get('/api/v1/csrf-token').expect(200);

  const cookies = res.headers['set-cookie'];
  if (!cookies) {
    throw new Error('CSRF cookie was not set');
  }

  return {
    csrfToken: res.body.csrfToken as string,
    cookieHeader: Array.isArray(cookies) ? cookies.join('; ') : String(cookies),
  };
}

export async function loginAs(
  email: string,
  password: string
): Promise<{ token: string; user: IUser }> {
  const csrf = await getCsrfSession();

  const res = await request(app)
    .post('/api/v1/auth/login')
    .set('x-csrf-token', csrf.csrfToken)
    .set('Cookie', csrf.cookieHeader)
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
