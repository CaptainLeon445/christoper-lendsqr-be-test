import { Response, NextFunction } from "express";
import { IAuthenticatedRequest, IAuthService } from "../types/interfaces";
import { TYPES } from "../types/symbols";
import { container } from "../containers";
import { UnauthorizedError } from "../utils/errors";

export function authMiddleware(
  req: IAuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid authorization header");
  }

  const token = authHeader.split(" ")[1];
  const authService = container.get<IAuthService>(TYPES.AuthService);
  req.user = authService.verifyToken(token);
  next();
}
