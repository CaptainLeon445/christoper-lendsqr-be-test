import { Router } from "express";
import { container } from "../containers";
import { TYPES } from "../types/symbols";
import { WalletController } from "../controllers/WalletController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validateRequest } from "../middlewares/validateRequest";

const router = Router();
const walletController = container.get<WalletController>(TYPES.WalletController);

router.use(authMiddleware);

router.get(
  "/balance",
  (req, res, next) => walletController.getBalance(req, res, next)
);

router.post(
  "/fund",
  validateRequest([
    { field: "amount", required: true, type: "number", min: 0.01, message: "Amount must be greater than zero" },
  ]),
  (req, res, next) => walletController.fund(req, res, next)
);

router.post(
  "/transfer",
  validateRequest([
    { field: "recipientEmail", required: true, type: "string", message: "Recipient email is required" },
    { field: "amount", required: true, type: "number", min: 0.01, message: "Amount must be greater than zero" },
  ]),
  (req, res, next) => walletController.transfer(req, res, next)
);

router.post(
  "/withdraw",
  validateRequest([
    { field: "amount", required: true, type: "number", min: 0.01, message: "Amount must be greater than zero" },
  ]),
  (req, res, next) => walletController.withdraw(req, res, next)
);

router.get(
  "/transactions",
  (req, res, next) => walletController.getTransactions(req, res, next)
);

export { router as walletRoutes };
