import { Response } from 'express';

export const randomInt = (low: number, high: number): number => {
  return Math.floor(Math.random() * (high - low) + low);
};

export const randomVerifiedCode = (): number => {
  return randomInt(100000, 999999);
};

export const toNumber = (string: string): number | string | null => {
  if (string === null || string === undefined) return null;
  const num = Number(string);
  return isNaN(num) ? null : num;
};

export const asyncForEach = async <T>(
  array: T[],
  callback: (item: T, index: number, array: T[]) => Promise<void>
): Promise<void> => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

/**
 * Sets refresh token cookie with secure options
 * @param res - Express Response object
 * @param token - Refresh token string
 */
export const setRefreshTokenCookie = (res: Response, token: string): void => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none' as const,
  };
  res.cookie('refreshToken', token, cookieOptions);
};
