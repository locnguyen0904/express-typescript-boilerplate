import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

import { BadRequestError, NotFoundError } from '@/core';
import {
  errorHandle,
  logErrors,
  notFoundHandle,
} from '@/helpers/handle-errors.helper';
import logger from '@/services/logger.service';

const mockLogger = logger as jest.Mocked<typeof logger>;

describe('Handle Errors Helper', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      requestId: 'test-request-id',
      method: 'GET',
      originalUrl: '/test',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      type: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('errorHandle', () => {
    it('handles AppError with RFC 9457 format', () => {
      const error = new BadRequestError('Bad request message');

      errorHandle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.type).toHaveBeenCalledWith(
        'application/problem+json'
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'about:blank',
          title: 'Bad Request',
          status: 400,
          detail: 'Bad request message',
          instance: '/test',
          code: 'BAD_REQUEST',
        })
      );
    });

    it('includes stack trace in development mode', () => {
      process.env.NODE_ENV = 'development';
      const error = new BadRequestError('Test error');
      error.stack = 'Error stack trace';

      errorHandle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ stack: 'Error stack trace' })
      );
    });

    it('excludes stack trace in production mode', () => {
      process.env.NODE_ENV = 'production';
      const error = new BadRequestError('Test error');
      error.stack = 'Error stack trace';

      errorHandle(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const jsonCall = (mockResponse.json as jest.Mock).mock
        .calls[0][0] as Record<string, unknown>;
      expect(jsonCall.stack).toBeUndefined();
    });

    it('handles ZodError with RFC 9457 format', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          path: ['email'],
          message: 'Expected string, received number',
        } as never,
      ]);

      errorHandle(
        zodError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Bad Request',
          code: 'VALIDATION_ERROR',
          errors: expect.arrayContaining([
            expect.objectContaining({
              message: 'email: Expected string, received number',
              code: 'invalid_type',
            }),
          ]),
        })
      );
    });

    it('handles MongoDB duplicate key error', () => {
      const duplicateError = {
        code: 11000,
        keyValue: { email: 'test@example.com' },
      };

      errorHandle(
        duplicateError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Conflict',
          detail: 'Duplicate value for email',
          code: 'DUPLICATE_KEY',
        })
      );
    });

    it('handles Mongoose CastError', () => {
      const castError = new mongoose.Error.CastError(
        'ObjectId',
        'invalid-id',
        '_id'
      );

      errorHandle(
        castError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: 'Invalid ObjectId format',
          code: 'INVALID_OBJECT_ID',
        })
      );
    });

    it('handles unknown errors as InternalServerError (dev)', () => {
      process.env.NODE_ENV = 'development';
      const unknownError = new Error('Something went wrong');

      errorHandle(
        unknownError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Internal Server Error',
          detail: 'Something went wrong',
          code: 'INTERNAL_SERVER_ERROR',
        })
      );
    });

    it('hides error details in production', () => {
      process.env.NODE_ENV = 'production';
      const unknownError = new Error('Sensitive error message');

      errorHandle(
        unknownError,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: 'Internal Server Error',
        })
      );
    });
  });

  describe('logErrors', () => {
    it('logs error context and passes through', () => {
      const error = new Error('Test error');

      logErrors(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: error,
          requestId: 'test-request-id',
          method: 'GET',
          url: '/test',
        }),
        'Request failed'
      );
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('notFoundHandle', () => {
    it('creates NotFoundError and passes to next', () => {
      notFoundHandle(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });
});
