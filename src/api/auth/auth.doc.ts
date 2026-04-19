import { z } from 'zod';

import {
  baseSuccessSchema,
  dataResponseSchema,
  errorResponseSchema,
} from '@/common';
import { registry } from '@/config/openapi.config';

import { loginSchema } from './auth.validation';

const tokenResponseSchema = z.object({
  token: z
    .string()
    .openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
});

const userResponseSchema = z.object({
  id: z.uuid().openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
  fullName: z.string().openapi({ example: 'John Doe' }),
  email: z.email().openapi({ example: 'john@example.com' }),
  role: z.enum(['admin', 'user']).openapi({ example: 'user' }),
});

// POST /auth/login
registry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: ['Auth'],
  summary: 'Login with email and password',
  description:
    'Returns access token and sets refresh token in httpOnly cookie.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: loginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      content: {
        'application/json': {
          schema: dataResponseSchema(
            z.object({
              user: userResponseSchema,
              token: z.string().openapi({
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              }),
            })
          ).extend({
            message: z.string().openapi({ example: 'Login successfully' }),
          }),
        },
      },
    },
    401: {
      description: 'Incorrect email or password',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

// POST /auth/refresh-token
registry.registerPath({
  method: 'post',
  path: '/auth/refresh-token',
  tags: ['Auth'],
  summary: 'Refresh access token',
  description:
    'Reads refresh token from httpOnly cookie and returns new access token.',
  responses: {
    200: {
      description: 'Token refreshed successfully',
      content: {
        'application/json': {
          schema: dataResponseSchema(tokenResponseSchema).extend({
            message: z.string().openapi({ example: 'Token refreshed' }),
          }),
        },
      },
    },
    401: {
      description: 'No refresh token provided or invalid token',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

// POST /auth/logout
registry.registerPath({
  method: 'post',
  path: '/auth/logout',
  tags: ['Auth'],
  summary: 'Logout user',
  description: 'Clears the refresh token cookie.',
  responses: {
    200: {
      description: 'Logout successful',
      content: {
        'application/json': {
          schema: baseSuccessSchema.extend({
            message: z.string().openapi({ example: 'Logout successfully' }),
          }),
        },
      },
    },
  },
});

// POST /auth/forgot-password
registry.registerPath({
  method: 'post',
  path: '/auth/forgot-password',
  tags: ['Auth'],
  summary: 'Request password reset link',
  description:
    'Sends an email with a password reset link if the email is registered.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: forgotPasswordSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Reset instructions sent',
      content: {
        'application/json': {
          schema: baseSuccessSchema.extend({
            message: z.string().openapi({
              example:
                'If that email is registered, you will receive a password reset link shortly.',
            }),
          }),
        },
      },
    },
    400: {
      description: 'Invalid email format',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

// POST /auth/reset-password
registry.registerPath({
  method: 'post',
  path: '/auth/reset-password',
  tags: ['Auth'],
  summary: 'Reset password using token',
  description:
    'Resets the password for the user matching the provided valid token.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: resetPasswordSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password reset successful',
      content: {
        'application/json': {
          schema: baseSuccessSchema.extend({
            message: z
              .string()
              .openapi({ example: 'Password reset successfully' }),
          }),
        },
      },
    },
    400: {
      description: 'Invalid or expired token, or invalid password format',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
