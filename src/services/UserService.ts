import { injectable, inject } from "inversify";
import { TYPES } from "../types/symbols";
import { IUserAttributes, IUserRepository, IUserService, ICreateUserDto } from "../types/interfaces";
import { ConflictError, NotFoundError } from "../utils/errors";
import { generateId, hashPassword } from "../utils/helpers";

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.UserRepository) private readonly userRepository: IUserRepository
  ) {}

  async createUser(dto: ICreateUserDto): Promise<IUserAttributes> {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    return this.userRepository.create({
      id: generateId(),
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: hashPassword(dto.password),
    });
  }

  async getUserById(id: string): Promise<IUserAttributes | null> {
    return this.userRepository.findById(id);
  }

  async getUserByEmail(email: string): Promise<IUserAttributes | null> {
    return this.userRepository.findByEmail(email);
  }
}
