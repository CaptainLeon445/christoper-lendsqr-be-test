import { Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "../types/symbols";
import { IWalletService, IAuthenticatedRequest } from "../types/interfaces";
import { BaseController } from "./BaseController";

@injectable()
export class WalletController extends BaseController {
  constructor(@inject(TYPES.WalletService) private readonly walletService: IWalletService) {
    super();
  }

  async getBalance(req: IAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const wallet = await this.walletService.getWalletByUserId(req.user!.userId);
      this.sendSuccess(res, wallet, "Wallet balance retrieved");
    } catch (error) {
      next(error);
    }
  }

  async fund(req: IAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount } = req.body;
      const transaction = await this.walletService.fundWallet(req.user!.userId, amount);
      this.sendCreated(res, transaction, "Wallet funded successfully");
    } catch (error) {
      next(error);
    }
  }

  async transfer(req: IAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { recipientEmail, amount, narration } = req.body;
      const transaction = await this.walletService.transferFunds(
        req.user!.userId,
        recipientEmail,
        amount,
        narration
      );
      this.sendCreated(res, transaction, "Transfer successful");
    } catch (error) {
      next(error);
    }
  }

  async withdraw(req: IAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount } = req.body;
      const transaction = await this.walletService.withdrawFunds(req.user!.userId, amount);
      this.sendCreated(res, transaction, "Withdrawal successful");
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const transactions = await this.walletService.getTransactionHistory(req.user!.userId);
      this.sendSuccess(res, transactions, "Transactions retrieved");
    } catch (error) {
      next(error);
    }
  }
}
