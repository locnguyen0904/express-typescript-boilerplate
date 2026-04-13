import { z } from 'zod';

import { registry } from '@/config/openapi.config';

const healthSchema = z.object({
  status: z.enum(['ok', 'error']),
  uptime: z.number(),
  timestamp: z.number(),
  checks: z.object({
    database: z.enum(['up', 'down']),
  }),
});

registry.registerPath({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'Health check',
  responses: {
    200: {
      description: 'Service is healthy',
      content: {
        'application/json': {
          schema: healthSchema,
        },
      },
    },
    503: {
      description: 'Service is unhealthy',
      content: {
        'application/json': {
          schema: healthSchema,
        },
      },
    },
  },
});
