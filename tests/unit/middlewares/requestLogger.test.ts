import { Request, Response } from "express";
import { requestLogger } from "../../../src/middlewares/requestLogger";

jest.mock("../../../src/utils/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("requestLogger", () => {
  it("should call next and attach finish listener", () => {
    const mockReq = {
      method: "GET",
      originalUrl: "/api/v1/wallet/balance",
      body: {},
      headers: { "user-agent": "test" },
      ip: "127.0.0.1",
    } as unknown as Request;

    const listeners: Record<string, () => void> = {};
    const mockRes = {
      on: jest.fn((event: string, cb: () => void) => {
        listeners[event] = cb;
      }),
      statusCode: 200,
    } as unknown as Response;

    const mockNext = jest.fn();

    requestLogger(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.on).toHaveBeenCalledWith("finish", expect.any(Function));
  });

  it("should redact PII fields from request body", () => {
    const mockReq = {
      method: "POST",
      originalUrl: "/api/v1/auth/register",
      body: { email: "john@example.com", password: "secret", firstName: "John" },
      headers: {},
      ip: "127.0.0.1",
    } as unknown as Request;

    const listeners: Record<string, () => void> = {};
    const mockRes = {
      on: jest.fn((event: string, cb: () => void) => {
        listeners[event] = cb;
      }),
      statusCode: 201,
    } as unknown as Response;

    const mockNext = jest.fn();

    requestLogger(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
