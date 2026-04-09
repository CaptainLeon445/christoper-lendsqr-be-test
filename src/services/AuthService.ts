import { injectable, inject } from "inversify";
import jwt from "jsonwebtoken";
import { TYPES } from "../types/symbols";
import {
  IAuthService,
  IAuthPayload,
  ICreateUserDto,
  IUserAttributes,
  IUserService,
  IWalletService,
  IKarmaService,
} from "../types/interfaces";
import { config } from "../config";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import { verifyPassword } from "../utils/helpers";

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(TYPES.UserService) private readonly userService: IUserService,
    @inject(TYPES.WalletService) private readonly walletService: IWalletService,
    @inject(TYPES.KarmaService) private readonly karmaService: IKarmaService
  ) {}

  async register(
    dto: ICreateUserDto
  ): Promise<{ user: Omit<IUserAttributes, "password">; token: string }> {
    const isBlacklisted = await this.karmaService.checkBlacklist(dto.email);
    if (isBlacklisted) {
      throw new ForbiddenError(
        "Unable to create account. User is on the Lendsqr Adjutor Karma blacklist"
      );
    }

    const user = await this.userService.createUser(dto);
    await this.walletService.createWallet(user.id);

    const token = this.generateToken({ userId: user.id, email: user.email });
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ user: Omit<IUserAttributes, "password">; token: string }> {
    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isValid = verifyPassword(password, user.password);
    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = this.generateToken({ userId: user.id, email: user.email });
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  verifyToken(token: string): IAuthPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as IAuthPayload;
    } catch {
      throw new UnauthorizedError("Invalid or expired token");
    }
  }

  private generateToken(payload: IAuthPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiry,
    } as jwt.SignOptions);
  }
}
