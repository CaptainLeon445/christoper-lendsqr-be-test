import { Request, Response } from "express";
import { validateRequest } from "../../../src/middlewares/validateRequest";
import { BadRequestError } from "../../../src/utils/errors";

describe("validateRequest", () => {
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRes = {};
    mockNext = jest.fn();
  });

  it("should call next when all validations pass", () => {
    const middleware = validateRequest([
      { field: "email", required: true, type: "string" },
      { field: "amount", required: true, type: "number", min: 0.01 },
    ]);

    const req = { body: { email: "test@test.com", amount: 100 } } as Request;

    middleware(req, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it("should throw BadRequestError when required field is missing", () => {
    const middleware = validateRequest([
      { field: "email", required: true },
    ]);

    const req = { body: {} } as Request;

    expect(() => middleware(req, mockRes as Response, mockNext)).toThrow(BadRequestError);
  });

  it("should throw BadRequestError when type is wrong", () => {
    const middleware = validateRequest([
      { field: "amount", required: true, type: "number" },
    ]);

    const req = { body: { amount: "not-a-number" } } as Request;

    expect(() => middleware(req, mockRes as Response, mockNext)).toThrow(BadRequestError);
  });

  it("should throw BadRequestError when value is below minimum", () => {
    const middleware = validateRequest([
      { field: "amount", required: true, type: "number", min: 0.01 },
    ]);

    const req = { body: { amount: 0 } } as Request;

    expect(() => middleware(req, mockRes as Response, mockNext)).toThrow(BadRequestError);
  });

  it("should throw BadRequestError when string is too short", () => {
    const middleware = validateRequest([
      { field: "name", required: true, type: "string", minLength: 3 },
    ]);

    const req = { body: { name: "ab" } } as Request;

    expect(() => middleware(req, mockRes as Response, mockNext)).toThrow(BadRequestError);
  });

  it("should throw BadRequestError when pattern does not match", () => {
    const middleware = validateRequest([
      { field: "email", required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    ]);

    const req = { body: { email: "not-an-email" } } as Request;

    expect(() => middleware(req, mockRes as Response, mockNext)).toThrow(BadRequestError);
  });

  it("should skip validation for optional fields not present", () => {
    const middleware = validateRequest([
      { field: "narration", type: "string" },
    ]);

    const req = { body: {} } as Request;

    middleware(req, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});
