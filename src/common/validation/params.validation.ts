import { z } from 'zod';

import { registry } from '@/config/openapi.config';

export const idParamSchema = registry.register(
  'IdParam',
  z.object({
    id: z.string().openapi({ example: '60d0fe4f5311236168a109ca' }),
  })
);
