import { z } from 'zod';

import { registry } from '@/config/openapi.config';

export const baseSuccessSchema = z.object({
  status: z.string().openapi({ example: 'success' }),
  message: z.string().openapi({ example: 'OK' }),
});

export const dataResponseSchema = <T extends z.ZodTypeAny>(schema: T) =>
  baseSuccessSchema.extend({
    data: schema.optional(),
  });

export const listResponseSchema = <T extends z.ZodTypeAny>(schema: T) =>
  baseSuccessSchema.extend({
    data: z.array(schema),
    total: z.number(),
    page: z.number(),
    pages: z.number(),
    limit: z.number(),
  });

export const errorResponseSchema = registry.register(
  'ProblemDetail',
  z.object({
    type: z.string().openapi({ example: 'about:blank' }),
    title: z.string().openapi({ example: 'Not Found' }),
    status: z.number().openapi({ example: 404 }),
    detail: z
      .string()
      .openapi({ example: 'The requested resource was not found.' }),
    instance: z.string().openapi({ example: '/api/v1/examples/123' }),
    code: z.string().optional().openapi({ example: 'NOT_FOUND' }),
    errors: z
      .array(
        z.object({
          message: z.string(),
          code: z.string(),
        })
      )
      .optional(),
  })
);
