import mongoose from 'mongoose';
import request from 'supertest';

import User, { IUser, UserRole } from '@/api/users/user.model';
import app from '@/app';

// ──────────────────────────────────────────────
// Test Data Constants
// ──────────────────────────────────────────────
export const TEST_ADMIN = {
  fullName: 'Admin User',
  email: 'admin@test.com',
  password: 'Admin@123456',
  role: UserRole.Admin,
} as const;

export const TEST_USER = {
  fullName: 'Regular User',
  email: 'user@test.com',
  password: 'User@123456',
  role: UserRole.User,
} as const;

// ──────────────────────────────────────────────
// Database Helpers
// ──────────────────────────────────────────────
export async function connectTestDB(): Promise<void> {
  const uri = process.env.DATABASE_URL!;
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
}

export async function disconnectTestDB(): Promise<void> {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

export async function clearDatabase(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

// ──────────────────────────────────────────────
// Seed Helpers
// ──────────────────────────────────────────────
export async function seedAdmin(): Promise<IUser> {
  const user = new User({
    fullName: TEST_ADMIN.fullName,
    email: TEST_ADMIN.email,
    password: TEST_ADMIN.password,
    role: TEST_ADMIN.role,
  });
  await user.save();
  return user.toObject() as IUser;
}

export async function seedUser(): Promise<IUser> {
  const user = new User({
    fullName: TEST_USER.fullName,
    email: TEST_USER.email,
    password: TEST_USER.password,
    role: TEST_USER.role,
  });
  await user.save();
  return user.toObject() as IUser;
}

// ──────────────────────────────────────────────
// Auth Helpers
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// Request Helpers
// ──────────────────────────────────────────────
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
