import { NextFunction, Request, Response as ExpressResponse } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

import { AppError, InternalServerError, NotFoundError } from '@/core';
import { logger } from '@/services';

interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code?: string;
  errors?: { message: string; code: string }[];
  stack?: string;
}

function sendProblem(res: ExpressResponse, problem: ProblemDetail): void {
  res.status(problem.status).type('application/problem+json').json(problem);
}

export const errorHandle = (
  error: unknown,
  req: Request,
  res: ExpressResponse,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const includeStack = process.env.NODE_ENV !== 'production';
  const instance = req.originalUrl;

  if (error instanceof AppError) {
    sendProblem(res, {
      type: error.type,
      title: error.title,
      status: error.status,
      detail: error.message,
      instance,
      code: typeof error.code === 'string' ? error.code : undefined,
      ...(includeStack && error.stack ? { stack: error.stack } : {}),
    });
    return;
  }

  if (error instanceof ZodError) {
    const errors = error.issues.map((issue) => ({
      message: `${issue.path.join('.')}: ${issue.message}`,
      code: issue.code,
    }));
    sendProblem(res, {
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      detail: 'Invalid request data. Please review the request and try again.',
      instance,
      code: 'VALIDATION_ERROR',
      errors,
    });
    return;
  }

  if (isDuplicateKeyError(error)) {
    const keyValue = error.keyValue ?? {};
    const fields = Object.keys(keyValue);
    sendProblem(res, {
      type: 'about:blank',
      title: 'Conflict',
      status: 409,
      detail:
        fields.length > 0
          ? `Duplicate value for ${fields.join(', ')}`
          : 'Duplicate key error',
      instance,
      code: 'DUPLICATE_KEY',
    });
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    sendProblem(res, {
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      detail: 'Invalid ObjectId format',
      instance,
      code: 'INVALID_OBJECT_ID',
    });
    return;
  }

  const err = error as Error;
  const internalError =
    process.env.NODE_ENV !== 'production'
      ? new InternalServerError(err.message)
      : new InternalServerError();
  internalError.stack = err.stack;
  sendProblem(res, {
    type: internalError.type,
    title: internalError.title,
    status: internalError.status,
    detail: internalError.message,
    instance,
    code:
      typeof internalError.code === 'string' ? internalError.code : undefined,
    ...(includeStack && internalError.stack
      ? { stack: internalError.stack }
      : {}),
  });
};

const isDuplicateKeyError = (
  error: unknown
): error is { code: number; keyValue?: Record<string, unknown> } => {
  if (!error || typeof error !== 'object') return false;
  return 'code' in error && (error as { code?: number }).code === 11000;
};

export const logErrors = (
  err: Error,
  req: Request,
  _res: ExpressResponse,
  next: NextFunction
): void => {
  logger.error(
    {
      err,
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
    },
    'Request failed'
  );
  next(err);
};

export const notFoundHandle = (
  _req: Request,
  _res: ExpressResponse,
  next: NextFunction
): void => {
  const error = new NotFoundError();
  next(error);
};
