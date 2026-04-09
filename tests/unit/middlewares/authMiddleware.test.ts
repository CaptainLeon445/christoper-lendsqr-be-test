import { Response, NextFunction } from "express";
import { authMiddleware } from "../../../src/middlewares/authMiddleware";
import { IAuthenticatedRequest } from "../../../src/types/interfaces";
import { UnauthorizedError } from "../../../src/utils/errors";

jest.mock("../../../src/containers", () => ({
  container: {
    get: jest.fn().mockReturnValue({
      verifyToken: jest.fn().mockReturnValue({ userId: "user-1", email: "john@example.com" }),
    }),
  },
}));

describe("authMiddleware", () => {
  let mockReq: Partial<IAuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {};
    mockNext = jest.fn();
  });

  it("should set user on request when valid token provided", () => {
    mockReq.headers = { authorization: "Bearer valid-token" };

    authMiddleware(mockReq as IAuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockReq.user).toEqual({ userId: "user-1", email: "john@example.com" });
    expect(mockNext).toHaveBeenCalled();
  });

  it("should throw UnauthorizedError when no authorization header", () => {
    mockReq.headers = {};

    expect(() =>
      authMiddleware(mockReq as IAuthenticatedRequest, mockRes as Response, mockNext)
    ).toThrow(UnauthorizedError);
  });

  it("should throw UnauthorizedError when header does not start with Bearer", () => {
    mockReq.headers = { authorization: "Basic some-token" };

    expect(() =>
      authMiddleware(mockReq as IAuthenticatedRequest, mockRes as Response, mockNext)
    ).toThrow(UnauthorizedError);
  });
});
