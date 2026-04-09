import { UserService } from "../../../src/services/UserService";
import { IUserRepository, ICreateUserDto, IUserAttributes } from "../../../src/types/interfaces";
import { ConflictError } from "../../../src/utils/errors";

describe("UserService", () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  const mockUser: IUserAttributes = {
    id: "user-1",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    password: "hashed:password",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByEmail: jest.fn(),
    };

    userService = new UserService(mockUserRepository);
  });

  describe("createUser", () => {
    const dto: ICreateUserDto = {
      email: "john@example.com",
      firstName: "John",
      lastName: "Doe",
      password: "password123",
    };

    it("should create a new user when email does not exist", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await userService.createUser(dto);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(result.email).toBe(dto.email);
    });

    it("should throw ConflictError when email already exists", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(userService.createUser(dto)).rejects.toThrow(ConflictError);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("getUserById", () => {
    it("should return user when found", async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById("user-1");

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith("user-1");
    });

    it("should return null when user not found", async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userService.getUserById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getUserByEmail", () => {
    it("should return user when found by email", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await userService.getUserByEmail("john@example.com");

      expect(result).toEqual(mockUser);
    });

    it("should return null when email not found", async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await userService.getUserByEmail("unknown@example.com");

      expect(result).toBeNull();
    });
  });
});
