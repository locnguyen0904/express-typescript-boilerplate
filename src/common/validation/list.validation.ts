import { z } from 'zod';

import { registry } from '@/config/openapi.config';

export const listQuerySchema = registry.register(
  'ListQuery',
  z.object({
    includeDeleted: z.string().optional(),
  })
);
