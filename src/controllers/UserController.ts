import { Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "../types/symbols";
import { IUserService, IAuthenticatedRequest } from "../types/interfaces";
import { BaseController } from "./BaseController";
import { NotFoundError } from "../utils/errors";

@injectable()
export class UserController extends BaseController {
  constructor(@inject(TYPES.UserService) private readonly userService: IUserService) {
    super();
  }

  async getProfile(req: IAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.userService.getUserById(req.user!.userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }
      const { password: _, ...profile } = user;
      this.sendSuccess(res, profile, "Profile retrieved");
    } catch (error) {
      next(error);
    }
  }
}
