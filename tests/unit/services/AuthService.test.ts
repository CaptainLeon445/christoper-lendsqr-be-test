import jwt from "jsonwebtoken";
import { AuthService } from "../../../src/services/AuthService";
import {
  IUserService,
  IWalletService,
  IKarmaService,
  IUserAttributes,
  IWalletAttributes,
} from "../../../src/types/interfaces";
import { UnauthorizedError, ForbiddenError } from "../../../src/utils/errors";
import * as helpers from "../../../src/utils/helpers";

jest.mock("jsonwebtoken");

describe("AuthService", () => {
  let authService: AuthService;
  let mockUserService: jest.Mocked<IUserService>;
  let mockWalletService: jest.Mocked<IWalletService>;
  let mockKarmaService: jest.Mocked<IKarmaService>;

  const mockUser: IUserAttributes = {
    id: "user-1",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    password: "salt:hashedpassword",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWallet: IWalletAttributes = {
    id: "wallet-1",
    userId: "user-1",
    balance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockUserService = {
      createUser: jest.fn(),
      getUserById: jest.fn(),
      getUserByEmail: jest.fn(),
    };

    mockWalletService = {
      createWallet: jest.fn(),
      getWalletByUserId: jest.fn(),
      fundWallet: jest.fn(),
      transferFunds: jest.fn(),
      withdrawFunds: jest.fn(),
      getTransactionHistory: jest.fn(),
    };

    mockKarmaService = {
      checkBlacklist: jest.fn(),
    };

    authService = new AuthService(mockUserService, mockWalletService, mockKarmaService);
  });

  describe("register", () => {
    const dto = {
      email: "john@example.com",
      firstName: "John",
      lastName: "Doe",
      password: "password123",
    };

    it("should register user successfully when not blacklisted", async () => {
      mockKarmaService.checkBlacklist.mockResolvedValue(false);
      mockUserService.createUser.mockResolvedValue(mockUser);
      mockWalletService.createWallet.mockResolvedValue(mockWallet);
      (jwt.sign as jest.Mock).mockReturnValue("mock-token");

      const result = await authService.register(dto);

      expect(result.token).toBe("mock-token");
      expect(result.user).not.toHaveProperty("password");
      expect(mockKarmaService.checkBlacklist).toHaveBeenCalledWith(dto.email);
      expect(mockWalletService.createWallet).toHaveBeenCalledWith("user-1");
    });

    it("should throw ForbiddenError when user is blacklisted", async () => {
      mockKarmaService.checkBlacklist.mockResolvedValue(true);

      await expect(authService.register(dto)).rejects.toThrow(ForbiddenError);
      expect(mockUserService.createUser).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      mockUserService.getUserByEmail.mockResolvedValue(mockUser);
      jest.spyOn(helpers, "verifyPassword").mockReturnValue(true);
      (jwt.sign as jest.Mock).mockReturnValue("mock-token");

      const result = await authService.login("john@example.com", "password123");

      expect(result.token).toBe("mock-token");
      expect(result.user).not.toHaveProperty("password");
    });

    it("should throw UnauthorizedError when user not found", async () => {
      mockUserService.getUserByEmail.mockResolvedValue(null);

      await expect(authService.login("unknown@example.com", "pass")).rejects.toThrow(
        UnauthorizedError
      );
    });

    it("should throw UnauthorizedError when password is invalid", async () => {
      mockUserService.getUserByEmail.mockResolvedValue(mockUser);
      jest.spyOn(helpers, "verifyPassword").mockReturnValue(false);

      await expect(authService.login("john@example.com", "wrong")).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  describe("verifyToken", () => {
    it("should return payload for valid token", () => {
      const payload = { userId: "user-1", email: "john@example.com" };
      (jwt.verify as jest.Mock).mockReturnValue(payload);

      const result = authService.verifyToken("valid-token");

      expect(result).toEqual(payload);
    });

    it("should throw UnauthorizedError for invalid token", () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("invalid");
      });

      expect(() => authService.verifyToken("bad-token")).toThrow(UnauthorizedError);
    });
  });
});
