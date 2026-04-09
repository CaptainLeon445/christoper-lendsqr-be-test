import { Request, Response, NextFunction } from "express";
import { AuthController } from "../../../src/controllers/AuthController";
import { IAuthService } from "../../../src/types/interfaces";

describe("AuthController", () => {
  let controller: AuthController;
  let mockAuthService: jest.Mocked<IAuthService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      verifyToken: jest.fn(),
    };

    controller = new AuthController(mockAuthService);

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe("register", () => {
    it("should return 201 on successful registration", async () => {
      mockReq = {
        body: {
          email: "john@example.com",
          firstName: "John",
          lastName: "Doe",
          password: "password123",
        },
      };

      const result = {
        user: { id: "1", email: "john@example.com", firstName: "John", lastName: "Doe" },
        token: "mock-token",
      };
      mockAuthService.register.mockResolvedValue(result as any);

      await controller.register(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: result })
      );
    });

    it("should call next with error on failure", async () => {
      mockReq = { body: {} };
      const error = new Error("Registration failed");
      mockAuthService.register.mockRejectedValue(error);

      await controller.register(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("login", () => {
    it("should return 200 on successful login", async () => {
      mockReq = { body: { email: "john@example.com", password: "password123" } };

      const result = {
        user: { id: "1", email: "john@example.com", firstName: "John", lastName: "Doe" },
        token: "mock-token",
      };
      mockAuthService.login.mockResolvedValue(result as any);

      await controller.login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should call next with error on failure", async () => {
      mockReq = { body: { email: "john@example.com", password: "wrong" } };
      const error = new Error("Invalid credentials");
      mockAuthService.login.mockRejectedValue(error);

      await controller.login(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
