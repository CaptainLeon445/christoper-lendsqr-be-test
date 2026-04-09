import { Request, Response, NextFunction } from "express";
import { errorHandler } from "../../../src/middlewares/errorHandler";
import { AppError, NotFoundError, BadRequestError } from "../../../src/utils/errors";

jest.mock("../../../src/utils/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("errorHandler", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it("should handle AppError with correct status code", () => {
    const error = new NotFoundError("User not found");

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "User not found",
    });
  });

  it("should handle BadRequestError", () => {
    const error = new BadRequestError("Invalid input");

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it("should handle unknown errors with 500 status", () => {
    const error = new Error("Something went wrong");

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal server error",
    });
  });
});
