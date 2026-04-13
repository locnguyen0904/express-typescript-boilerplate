import { z } from 'zod';

import { registry } from '@/config/openapi.config';

export const createExampleSchema = registry.register(
  'CreateExample',
  z.object({
    title: z.string().openapi({ example: 'My Example Title' }),
    content: z.string().openapi({ example: 'This is the content.' }),
  })
);

export const updateExampleSchema = registry.register(
  'UpdateExample',
  z.object({
    title: z.string().optional().openapi({ example: 'Updated Title' }),
    content: z.string().optional().openapi({ example: 'Updated content.' }),
  })
);
