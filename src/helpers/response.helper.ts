import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

class ResponseHelper {
  static success(res: Response, data: unknown, status = StatusCodes.OK) {
    return res.status(status).json(data);
  }

  static error(
    res: Response,
    error: unknown,
    status = StatusCodes.INTERNAL_SERVER_ERROR
  ) {
    return res.status(status).json({
      success: false,
      error: error,
    });
  }
}

export default ResponseHelper;
