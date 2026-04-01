import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { config } from '@/config';
import * as container from '@/container';
import { ForbiddenError, UnAuthorizedError } from '@/core';
import { authorize, isAuth } from '@/middlewares';

jest.mock('@/container', () => ({
  tokenBlacklistService: {
    revoke: jest.fn(),
    isRevoked: jest.fn(),
  },
}));

jest.mock('jsonwebtoken');

const mockBlacklist = jest.mocked(container).tokenBlacklistService;

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBlacklist.isRevoked.mockResolvedValue(false);

    mockRequest = { headers: {} };
    mockResponse = {};
    mockNext = jest.fn();
  });

  describe('isAuth', () => {
    it('rejects missing authorization header', async () => {
      await isAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnAuthorizedError));
    });

    it('rejects non-Bearer authorization', async () => {
      mockRequest.headers = { authorization: 'Basic token123' };

      await isAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnAuthorizedError));
    });

    it('sets req.user on valid token', async () => {
      const payload = { sub: 'user-1', role: 'user', type: 'access' };
      mockRequest.headers = { authorization: 'Bearer valid-token' };
      (jwt.verify as jest.Mock).mockReturnValue(payload);

      await isAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', config.jwt.secret);
      expect(mockRequest.user).toEqual(payload);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('rejects expired token', async () => {
      mockRequest.headers = { authorization: 'Bearer expired' };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('jwt expired', new Date());
      });

      await isAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnAuthorizedError));
    });

    it('rejects revoked token (via jti)', async () => {
      const payload = {
        sub: 'u1',
        role: 'user',
        type: 'access',
        jti: 'revoked-jti',
      };
      mockRequest.headers = { authorization: 'Bearer revoked' };
      (jwt.verify as jest.Mock).mockReturnValue(payload);
      mockBlacklist.isRevoked.mockResolvedValue(true);

      await isAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockBlacklist.isRevoked).toHaveBeenCalledWith('revoked-jti');
      expect(mockNext).toHaveBeenCalledWith(expect.any(UnAuthorizedError));
    });

    it('allows valid token with non-revoked jti', async () => {
      const payload = {
        sub: 'u1',
        role: 'user',
        type: 'access',
        jti: 'valid-jti',
      };
      mockRequest.headers = { authorization: 'Bearer valid' };
      (jwt.verify as jest.Mock).mockReturnValue(payload);

      await isAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockBlacklist.isRevoked).toHaveBeenCalledWith('valid-jti');
      expect(mockRequest.user).toEqual(payload);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('authorize', () => {
    it('returns a middleware function', () => {
      const middleware = authorize('admin');
      expect(typeof middleware).toBe('function');
    });

    it('rejects unauthenticated request', () => {
      const middleware = authorize('admin');

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnAuthorizedError));
    });

    it('rejects unauthorized role', () => {
      const middleware = authorize('admin');
      mockRequest.user = { sub: 'u1', role: 'user', type: 'access' };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('allows matching role', () => {
      const middleware = authorize('admin', 'user');
      mockRequest.user = { sub: 'u1', role: 'user', type: 'access' };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
