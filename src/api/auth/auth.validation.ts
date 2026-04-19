import { z } from 'zod';

import { registry } from '@/config/openapi.config';

export const loginSchema = registry.register(
  'Login',
  z.object({
    email: z.email().openapi({ example: 'admin@example.com' }),
    password: z.string().openapi({ example: 'password123' }),
  })
);

export const forgotPasswordSchema = registry.register(
  'ForgotPassword',
  z.object({
    email: z.email().openapi({ example: 'user@example.com' }),
  })
);

export const resetPasswordSchema = registry.register(
  'ResetPassword',
  z.object({
    token: z.string().openapi({ example: 'abc123token' }),
    password: z.string().min(8).openapi({ example: 'newPassword123' }),
  })
);
