import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import {
  CREATED,
  LIST,
  OK,
  SuccessResponse,
} from '@/core/response-success.core';

describe('Response Success Core', () => {
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('SuccessResponse', () => {
    it('should create an instance with default values', () => {
      const response = new SuccessResponse({});
      expect(response.message).toBe('OK');
      expect(response.status).toBe('success');
      expect(response.statusCode).toBe(StatusCodes.OK);
    });

    it('should create an instance with custom data and metadata', () => {
      const data = { id: 1, name: 'Test' };
      const response = new SuccessResponse({
        message: 'Custom Message',
        statusCode: StatusCodes.ACCEPTED,
        data,
        total: 100,
        limit: 10,
        page: 1,
        pages: 10,
      });

      expect(response.message).toBe('Custom Message');
      expect(response.statusCode).toBe(StatusCodes.ACCEPTED);
      expect(response.data).toBe(data);
      expect(response.total).toBe(100);
      expect(response.limit).toBe(10);
      expect(response.page).toBe(1);
      expect(response.pages).toBe(10);
    });

    it('should send response with correct status and body', () => {
      const data = { id: 1 };
      const response = new SuccessResponse({
        message: 'Sent',
        statusCode: StatusCodes.OK,
        data,
      });

      response.send(mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Sent',
        status: 'success',
        data,
      });
    });

    it('should not include statusCode in the response body', () => {
      const response = new SuccessResponse({ statusCode: StatusCodes.OK });
      response.send(mockResponse as Response);

      const jsonBody = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonBody.statusCode).toBeUndefined();
    });
  });

  describe('OK', () => {
    it('should have status 200', () => {
      const data = { foo: 'bar' };
      const response = new OK({ message: 'Success', data });

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(response.message).toBe('Success');
      expect(response.data).toBe(data);
    });
  });

  describe('CREATED', () => {
    it('should have status 201', () => {
      const data = { id: 'new-id' };
      const response = new CREATED({ message: 'Created', data });

      expect(response.statusCode).toBe(StatusCodes.CREATED);
      expect(response.message).toBe('Created');
      expect(response.data).toBe(data);
    });
  });

  describe('LIST', () => {
    it('should have status 200 and include list metadata', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const response = new LIST({
        data,
        total: 2,
        limit: 10,
        page: 1,
        pages: 1,
      });

      expect(response.statusCode).toBe(StatusCodes.OK);
      expect(response.data).toBe(data);
      expect(response.total).toBe(2);
      expect(response.page).toBe(1);
    });
  });
});
