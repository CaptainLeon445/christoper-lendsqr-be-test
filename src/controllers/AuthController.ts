import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "../types/symbols";
import { IAuthService } from "../types/interfaces";
import { BaseController } from "./BaseController";

@injectable()
export class AuthController extends BaseController {
  constructor(@inject(TYPES.AuthService) private readonly authService: IAuthService) {
    super();
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, firstName, lastName, password } = req.body;
      const result = await this.authService.register({ email, firstName, lastName, password });
      this.sendCreated(res, result, "Account created successfully");
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      this.sendSuccess(res, result, "Login successful");
    } catch (error) {
      next(error);
    }
  }
}
