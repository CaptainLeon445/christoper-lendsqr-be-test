import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { HttpStatusCode, IApiResponse } from "../types";
import { logger } from "../utils/logger";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn(`Operational error: ${err.message}`);
    const response: IApiResponse = {
      success: false,
      message: err.message,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  const response: IApiResponse = {
    success: false,
    message: "Internal server error",
  };
  res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(response);
}
