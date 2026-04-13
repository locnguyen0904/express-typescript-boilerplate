import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

interface SuccessResponseOptions<T> {
  message?: string;
  statusCode?: number;
  data?: T;
  total?: number;
  limit?: number;
  page?: number;
  pages?: number;
}

export class SuccessResponse<T> {
  message: string;
  status: string;
  statusCode: number;
  data?: T;
  total?: number;
  limit?: number;
  page?: number;
  pages?: number;

  constructor({
    message,
    statusCode = StatusCodes.OK,
    data,
    total,
    limit,
    page,
    pages,
  }: SuccessResponseOptions<T>) {
    this.message = message || 'OK';
    this.status = 'success';
    this.statusCode = statusCode;
    this.data = data;
    this.total = total;
    this.limit = limit;
    this.page = page;
    this.pages = pages;
  }

  send(res: Response) {
    const { statusCode, ...rest } = this;
    return res.status(statusCode).json(rest);
  }
}

export class OK<T> extends SuccessResponse<T> {
  constructor({ message, data }: { message?: string; data?: T }) {
    super({ message, data, statusCode: StatusCodes.OK });
  }
}

export class CREATED<T> extends SuccessResponse<T> {
  constructor({ message, data }: { message?: string; data?: T }) {
    super({ message, statusCode: StatusCodes.CREATED, data });
  }
}

export class LIST<T> extends SuccessResponse<T> {
  constructor(options: SuccessResponseOptions<T>) {
    super({ ...options, statusCode: StatusCodes.OK });
  }
}
