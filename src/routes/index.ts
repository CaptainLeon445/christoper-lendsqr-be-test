import { Router } from "express";
import { authRoutes } from "./authRoutes";
import { walletRoutes } from "./walletRoutes";
import { userRoutes } from "./userRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/wallet", walletRoutes);
router.use("/users", userRoutes);

export { router as apiRoutes };
