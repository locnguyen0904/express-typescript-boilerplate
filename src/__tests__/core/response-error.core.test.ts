import { StatusCodes } from 'http-status-codes';

import {
  AppError,
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnAuthorizedError,
} from '@/core/response-error.core';

describe('Response Error Core', () => {
  describe('AppError', () => {
    it('should create an instance of AppError with correct properties', () => {
      const message = 'Test Error';
      const status = StatusCodes.BAD_GATEWAY;
      const code = 'TEST_ERROR_CODE';
      const type = 'https://example.com/probs/test-error';
      const title = 'Test Error Title';

      const error = new AppError(message, status, code, type, title);

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(message);
      expect(error.status).toBe(status);
      expect(error.code).toBe(code);
      expect(error.type).toBe(type);
      expect(error.title).toBe(title);
      expect(error.name).toBe('AppError');
      expect(error.stack).toBeDefined();
    });

    it('should use default values for code, type and title', () => {
      const error = new AppError('Default Error', 500);

      expect(error.code).toBe('APP_ERROR');
      expect(error.type).toBe('about:blank');
      expect(error.title).toBe('Application Error');
    });
  });

  describe('NotFoundError', () => {
    it('should have status 404 and default message', () => {
      const error = new NotFoundError();
      expect(error.status).toBe(StatusCodes.NOT_FOUND);
      expect(error.message).toBe('Not Found');
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should allow custom message and code', () => {
      const error = new NotFoundError('User not found', 'USER_NOT_FOUND');
      expect(error.message).toBe('User not found');
      expect(error.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('BadRequestError', () => {
    it('should have status 400 and default message', () => {
      const error = new BadRequestError();
      expect(error.status).toBe(StatusCodes.BAD_REQUEST);
      expect(error.message).toBe('Bad Request');
      expect(error.code).toBe('BAD_REQUEST');
    });
  });

  describe('InternalServerError', () => {
    it('should have status 500 and default message', () => {
      const error = new InternalServerError();
      expect(error.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(error.message).toBe('Internal Server Error');
      expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('ForbiddenError', () => {
    it('should have status 403 and default message', () => {
      const error = new ForbiddenError();
      expect(error.status).toBe(StatusCodes.FORBIDDEN);
      expect(error.message).toBe('Forbidden');
      expect(error.code).toBe('FORBIDDEN');
    });
  });

  describe('UnAuthorizedError', () => {
    it('should have status 401 and default message', () => {
      const error = new UnAuthorizedError();
      expect(error.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(error.message).toBe('Unauthorized');
      expect(error.code).toBe('UNAUTHORIZED');
    });
  });
});
