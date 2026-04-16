import { z } from 'zod';

import { registry } from '@/config/openapi.config';

export const idParamSchema = registry.register(
  'IdParam',
  z.object({
    id: z
      .string()
      .uuid()
      .openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
  })
);
