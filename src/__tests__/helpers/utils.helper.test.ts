import { Response } from 'express';

import {
  asyncForEach,
  randomInt,
  randomVerifiedCode,
  setRefreshTokenCookie,
  toNumber,
} from '@/helpers/utils.helper';

describe('Utils Helper', () => {
  describe('randomInt', () => {
    it('should return a number between low and high (inclusive of low, exclusive of high)', () => {
      for (let i = 0; i < 100; i++) {
        const val = randomInt(1, 5);
        expect(val).toBeGreaterThanOrEqual(1);
        expect(val).toBeLessThan(5);
        expect(Number.isInteger(val)).toBe(true);
      }
    });
  });

  describe('randomVerifiedCode', () => {
    it('should return a 6-digit number', () => {
      for (let i = 0; i < 100; i++) {
        const code = randomVerifiedCode();
        expect(code).toBeGreaterThanOrEqual(100000);
        expect(code).toBeLessThanOrEqual(999999);
      }
    });
  });

  describe('toNumber', () => {
    it('should convert strings to numbers', () => {
      expect(toNumber('123')).toBe(123);
      expect(toNumber('0')).toBe(0);
      expect(toNumber('-10')).toBe(-10);
      expect(toNumber('10.5')).toBe(10.5);
    });

    it('should return null for null or undefined', () => {
      expect(toNumber(null as unknown as string)).toBeNull();
      expect(toNumber(undefined as unknown as string)).toBeNull();
    });

    it('should return null for non-numeric strings', () => {
      expect(toNumber('abc')).toBeNull();
      expect(toNumber('123abc')).toBeNull();
    });
  });

  describe('asyncForEach', () => {
    it('should execute callbacks in sequence', async () => {
      const results: number[] = [];
      const array = [1, 2, 3];

      await asyncForEach(array, async (item) => {
        // Simulate async delay
        await new Promise((resolve) => setTimeout(resolve, 10));
        results.push(item * 2);
      });

      expect(results).toEqual([2, 4, 6]);
    });
  });

  describe('setRefreshTokenCookie', () => {
    let mockResponse: Partial<Response>;

    beforeEach(() => {
      mockResponse = {
        cookie: jest.fn(),
      };
    });

    it('should call res.cookie with correct options', () => {
      const token = 'sample-refresh-token';
      setRefreshTokenCookie(mockResponse as Response, token);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        token,
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'none',
        })
      );
    });

    it('should set secure flag based on NODE_ENV', () => {
      const originalEnv = process.env.NODE_ENV;

      // Test production
      process.env.NODE_ENV = 'production';
      setRefreshTokenCookie(mockResponse as Response, 'token');
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'token',
        expect.objectContaining({ secure: true })
      );

      // Test development
      process.env.NODE_ENV = 'development';
      setRefreshTokenCookie(mockResponse as Response, 'token');
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'token',
        expect.objectContaining({ secure: false })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });
});
