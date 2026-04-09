import { Router, Request, Response, NextFunction } from "express";
import { container } from "../containers";
import { TYPES } from "../types/symbols";
import { AuthController } from "../controllers/AuthController";
import { validateRequest } from "../middlewares/validateRequest";

const router = Router();
const authController = container.get<AuthController>(TYPES.AuthController);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post(
  "/register",
  validateRequest([
    { field: "email", required: true, type: "string", pattern: EMAIL_REGEX, message: "Valid email is required" },
    { field: "firstName", required: true, type: "string", minLength: 2 },
    { field: "lastName", required: true, type: "string", minLength: 2 },
    { field: "password", required: true, type: "string", minLength: 6 },
  ]),
  (req:Request, res:Response, next:NextFunction) => authController.register(req, res, next)
);

router.post(
  "/login",
  validateRequest([
    { field: "email", required: true, type: "string" },
    { field: "password", required: true, type: "string" },
  ]),
  (req, res, next) => authController.login(req, res, next)
);

export { router as authRoutes };
