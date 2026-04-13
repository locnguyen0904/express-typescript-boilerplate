import { NextFunction, Request, Response } from 'express';

import { requestIdMiddleware } from '@/middlewares/request-id.middleware';

describe('Request ID Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      setHeader: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('should generate a new request ID if none exists in headers', () => {
    requestIdMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockRequest.requestId).toBeDefined();
    expect(typeof mockRequest.requestId).toBe('string');
    // UUID v4 format check
    expect(mockRequest.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Request-Id',
      mockRequest.requestId
    );
    expect(mockNext).toHaveBeenCalled();
  });

  it('should use existing request ID from headers', () => {
    const existingId = 'existing-uuid-123';
    mockRequest.headers = { 'x-request-id': existingId };

    requestIdMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockRequest.requestId).toBe(existingId);
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Request-Id',
      existingId
    );
    expect(mockNext).toHaveBeenCalled();
  });
});
