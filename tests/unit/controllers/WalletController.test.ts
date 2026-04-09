import { Response, NextFunction } from "express";
import { WalletController } from "../../../src/controllers/WalletController";
import { IWalletService, IAuthenticatedRequest } from "../../../src/types/interfaces";
import { TransactionType, TransactionStatus } from "../../../src/types/enums";

describe("WalletController", () => {
  let controller: WalletController;
  let mockWalletService: jest.Mocked<IWalletService>;
  let mockReq: Partial<IAuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockWalletService = {
      createWallet: jest.fn(),
      getWalletByUserId: jest.fn(),
      fundWallet: jest.fn(),
      transferFunds: jest.fn(),
      withdrawFunds: jest.fn(),
      getTransactionHistory: jest.fn(),
    };

    controller = new WalletController(mockWalletService);

    mockReq = {
      user: { userId: "user-1", email: "john@example.com" },
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe("getBalance", () => {
    it("should return wallet balance", async () => {
      mockWalletService.getWalletByUserId.mockResolvedValue({
        id: "wallet-1",
        userId: "user-1",
        balance: 1000,
      });

      await controller.getBalance(
        mockReq as IAuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe("fund", () => {
    it("should fund wallet and return 201", async () => {
      mockReq.body = { amount: 500 };
      mockWalletService.fundWallet.mockResolvedValue({
        id: "txn-1",
        walletId: "wallet-1",
        type: TransactionType.FUNDING,
        amount: 500,
        status: TransactionStatus.COMPLETED,
        reference: "TXN-123",
        narration: "Account funding",
      });

      await controller.fund(
        mockReq as IAuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should call next with error on failure", async () => {
      mockReq.body = { amount: 500 };
      const error = new Error("Fund failed");
      mockWalletService.fundWallet.mockRejectedValue(error);

      await controller.fund(
        mockReq as IAuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("transfer", () => {
    it("should transfer funds and return 201", async () => {
      mockReq.body = { recipientEmail: "jane@example.com", amount: 200 };
      mockWalletService.transferFunds.mockResolvedValue({
        id: "txn-1",
        walletId: "wallet-1",
        type: TransactionType.TRANSFER,
        amount: 200,
        status: TransactionStatus.COMPLETED,
        reference: "TXN-456",
        narration: "Fund transfer",
        counterpartyWalletId: "wallet-2",
      });

      await controller.transfer(
        mockReq as IAuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe("withdraw", () => {
    it("should withdraw funds and return 201", async () => {
      mockReq.body = { amount: 300 };
      mockWalletService.withdrawFunds.mockResolvedValue({
        id: "txn-1",
        walletId: "wallet-1",
        type: TransactionType.WITHDRAWAL,
        amount: 300,
        status: TransactionStatus.COMPLETED,
        reference: "TXN-789",
        narration: "Account withdrawal",
      });

      await controller.withdraw(
        mockReq as IAuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe("getTransactions", () => {
    it("should return transaction history", async () => {
      mockWalletService.getTransactionHistory.mockResolvedValue([]);

      await controller.getTransactions(
        mockReq as IAuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
