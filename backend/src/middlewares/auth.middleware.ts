import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { config } from '@/config';
import { tokenBlacklistService } from '@/container';
import { ForbiddenError, UnAuthorizedError } from '@/core';

interface TokenPayload {
  sub: string;
  role: string;
  type: string;
  jti?: string;
}

export const isAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnAuthorizedError('Please authenticate'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, config.jwt.secret) as TokenPayload;

    // Check if token has been revoked
    if (payload.jti) {
      if (await tokenBlacklistService.isRevoked(payload.jti)) {
        return next(new UnAuthorizedError('Token has been revoked'));
      }
    }

    req.user = payload;
    next();
  } catch {
    next(new UnAuthorizedError('Please authenticate'));
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnAuthorizedError('Please authenticate'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError('You do not have permission to access this resource')
      );
    }

    next();
  };
};
