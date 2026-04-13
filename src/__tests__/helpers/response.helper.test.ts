import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import ResponseHelper from '@/helpers/response.helper';

describe('ResponseHelper', () => {
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('success', () => {
    it('should send success response with default status 200', () => {
      const data = { user: 'test' };
      ResponseHelper.success(mockResponse as Response, data);

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(data);
    });

    it('should send success response with custom status code', () => {
      const data = { id: 1 };
      ResponseHelper.success(
        mockResponse as Response,
        data,
        StatusCodes.CREATED
      );

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith(data);
    });
  });

  describe('error', () => {
    it('should send error response with default status 500', () => {
      const error = 'Something went wrong';
      ResponseHelper.error(mockResponse as Response, error);

      expect(mockResponse.status).toHaveBeenCalledWith(
        StatusCodes.INTERNAL_SERVER_ERROR
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: error,
      });
    });

    it('should send error response with custom status code', () => {
      const error = { message: 'Unauthorized' };
      ResponseHelper.error(
        mockResponse as Response,
        error,
        StatusCodes.UNAUTHORIZED
      );

      expect(mockResponse.status).toHaveBeenCalledWith(
        StatusCodes.UNAUTHORIZED
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: error,
      });
    });
  });
});
