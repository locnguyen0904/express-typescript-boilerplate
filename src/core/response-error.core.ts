import { StatusCodes } from 'http-status-codes';

export class AppError extends Error {
  status: number;
  code: string | number | Array<unknown>;
  type: string;
  title: string;
  stack?: string;

  constructor(
    message: string,
    status: number,
    code: string | number | Array<unknown> = 'APP_ERROR',
    type = 'about:blank',
    title = 'Application Error'
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.type = type;
    this.title = title;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found', code = 'NOT_FOUND') {
    super(message, StatusCodes.NOT_FOUND, code, 'about:blank', 'Not Found');
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', code = 'BAD_REQUEST') {
    super(message, StatusCodes.BAD_REQUEST, code, 'about:blank', 'Bad Request');
  }
}

export class InternalServerError extends AppError {
  constructor(
    message = 'Internal Server Error',
    code = 'INTERNAL_SERVER_ERROR'
  ) {
    super(
      message,
      StatusCodes.INTERNAL_SERVER_ERROR,
      code,
      'about:blank',
      'Internal Server Error'
    );
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(message, StatusCodes.FORBIDDEN, code, 'about:blank', 'Forbidden');
  }
}

export class UnAuthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(
      message,
      StatusCodes.UNAUTHORIZED,
      code,
      'about:blank',
      'Unauthorized'
    );
  }
}
