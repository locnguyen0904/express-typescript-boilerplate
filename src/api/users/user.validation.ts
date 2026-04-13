import { z } from 'zod';

import { userRoles } from '@/api/users/user.model';
import { registry } from '@/config/openapi.config';

export const createUserSchema = registry.register(
  'CreateUser',
  z.object({
    fullName: z.string().min(1).openapi({ example: 'John Doe' }),
    email: z.email().openapi({ example: 'john@example.com' }),
    password: z.string().min(6).openapi({ example: 'password123' }),
    role: z.enum(userRoles).optional().openapi({ example: 'user' }),
  })
);

export const updateUserSchema = registry.register(
  'UpdateUser',
  z.object({
    fullName: z.string().min(1).optional().openapi({ example: 'John Doe' }),
    email: z.email().optional().openapi({ example: 'john@example.com' }),
    password: z
      .string()
      .min(6)
      .optional()
      .openapi({ example: 'newpassword123' }),
    role: z.enum(userRoles).optional().openapi({ example: 'user' }),
  })
);
