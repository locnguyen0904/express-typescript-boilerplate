import { z } from 'zod';

import { idParamSchema } from '@/common';
import { listQuerySchema } from '@/common';
import {
  dataResponseSchema,
  errorResponseSchema,
  listResponseSchema,
} from '@/common';
import { registry } from '@/config/openapi.config';

import { createExampleSchema, updateExampleSchema } from './example.validation';

const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

const security = [{ [bearerAuth.name]: [] }];

// GET /
registry.registerPath({
  method: 'get',
  path: '/examples',
  tags: ['Examples'],
  summary: 'Get all examples',
  description:
    'Returns active examples. Use `includeDeleted=true` to include soft-deleted records.',
  request: {
    query: listQuerySchema,
  },
  responses: {
    200: {
      description: 'List of examples',
      content: {
        'application/json': {
          schema: listResponseSchema(createExampleSchema),
        },
      },
    },
  },
});

// GET /:id
registry.registerPath({
  method: 'get',
  path: '/examples/{id}',
  tags: ['Examples'],
  summary: 'Get an example by ID',
  request: {
    params: idParamSchema,
  },
  responses: {
    200: {
      description: 'Example details',
      content: {
        'application/json': {
          schema: dataResponseSchema(
            createExampleSchema.extend({ _id: z.string() })
          ),
        },
      },
    },
    404: {
      description: 'Example not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

// POST /
registry.registerPath({
  method: 'post',
  path: '/examples',
  tags: ['Examples'],
  summary: 'Create a new example',
  security,
  request: {
    body: {
      content: {
        'application/json': {
          schema: createExampleSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Example created successfully',
      content: {
        'application/json': {
          schema: dataResponseSchema(
            createExampleSchema.extend({ _id: z.string() })
          ),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden - Admin only',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

// PUT /:id
registry.registerPath({
  method: 'put',
  path: '/examples/{id}',
  tags: ['Examples'],
  summary: 'Update an example',
  security,
  request: {
    params: idParamSchema,
    body: {
      content: {
        'application/json': {
          schema: updateExampleSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Example updated successfully',
      content: {
        'application/json': {
          schema: dataResponseSchema(
            createExampleSchema.extend({ _id: z.string() })
          ),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden - Admin only',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: 'Example not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

// DELETE /:id
registry.registerPath({
  method: 'delete',
  path: '/examples/{id}',
  tags: ['Examples'],
  summary: 'Soft delete an example',
  description: 'Marks the example as deleted without removing it from storage.',
  security,
  request: {
    params: idParamSchema,
  },
  responses: {
    200: {
      description: 'Example deleted successfully',
      content: {
        'application/json': {
          schema: dataResponseSchema(
            createExampleSchema.extend({ _id: z.string() })
          ),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden - Admin only',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: 'Example not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
