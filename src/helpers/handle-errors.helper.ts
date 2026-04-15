import { NextFunction, Request, Response as ExpressResponse } from 'express';
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
    const detail = extractDuplicateDetail(error);
    sendProblem(res, {
      type: 'about:blank',
      title: 'Conflict',
      status: 409,
      detail: detail || 'Duplicate key error',
      instance,
      code: 'DUPLICATE_KEY',
    });
    return;
  }

  if (isInvalidInputError(error)) {
    sendProblem(res, {
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      detail: 'Invalid input format',
      instance,
      code: 'INVALID_INPUT',
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
): error is {
  code: string;
  detail?: string;
  table?: string;
  constraint?: string;
} => {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string };
  return 'code' in err && (err.code === '23505' || err.code === '23503');
};

const extractDuplicateDetail = (error: {
  code: string;
  detail?: string;
  constraint?: string;
}): string | null => {
  if (error.detail) return error.detail;
  if (error.constraint)
    return `Duplicate value for constraint: ${error.constraint}`;
  return null;
};

const isInvalidInputError = (error: unknown): error is { code: string } => {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string };
  return 'code' in err && err.code === '22P02';
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
