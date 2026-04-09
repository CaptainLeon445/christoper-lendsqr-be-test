import { Router } from "express";
import { container } from "../containers";
import { TYPES } from "../types/symbols";
import { UserController } from "../controllers/UserController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();
const userController = container.get<UserController>(TYPES.UserController);

router.use(authMiddleware);

router.get(
  "/profile",
  (req, res, next) => userController.getProfile(req, res, next)
);

export { router as userRoutes };
