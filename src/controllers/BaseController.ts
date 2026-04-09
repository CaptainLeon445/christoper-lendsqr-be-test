import { Response } from "express";
import { HttpStatusCode, IApiResponse } from "../types";

export abstract class BaseController {
  protected sendSuccess<T>(
    res: Response,
    data: T,
    message = "Success",
    statusCode = HttpStatusCode.OK
  ): Response {
    const response: IApiResponse<T> = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(response);
  }

  protected sendCreated<T>(res: Response, data: T, message = "Created"): Response {
    return this.sendSuccess(res, data, message, HttpStatusCode.CREATED);
  }

  protected sendError(
    res: Response,
    message: string,
    statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR
  ): Response {
    const response: IApiResponse = {
      success: false,
      message,
    };
    return res.status(statusCode).json(response);
  }
}
