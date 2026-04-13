import { z } from 'zod';

import { registry } from '@/config/openapi.config';

export const loginSchema = registry.register(
  'Login',
  z.object({
    email: z.email().openapi({ example: 'admin@example.com' }),
    password: z.string().openapi({ example: 'password123' }),
  })
);
