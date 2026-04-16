import { z } from 'zod';

import { registry } from '@/config/openapi.config';

export const listQuerySchema = registry.register(
  'ListQuery',
  z.object({
    page: z.string().optional().openapi({ example: '1' }),
    limit: z.string().optional().openapi({ example: '25' }),
  })
);
