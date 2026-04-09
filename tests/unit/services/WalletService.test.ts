import { WalletService } from "../../../src/services/WalletService";
import {
  IWalletRepository,
  ITransactionRepository,
  IUserRepository,
  IWalletAttributes,
  ITransactionAttributes,
  IUserAttributes,
} from "../../../src/types/interfaces";
import { TransactionType, TransactionStatus } from "../../../src/types/enums";
import {
  NotFoundError,
  BadRequestError,
  InsufficientFundsError,
} from "../../../src/utils/errors";

jest.mock("../../../src/config/database", () => ({
  Database: {
    getInstance: () => ({
      transaction: (fn: (t: unknown) => Promise<unknown>) => fn({}),
    }),
  },
}));

describe("WalletService", () => {
  let walletService: WalletService;
  let mockWalletRepo: jest.Mocked<IWalletRepository>;
  let mockTxnRepo: jest.Mocked<ITransactionRepository & { createWithTransaction: jest.Mock }>;
  let mockUserRepo: jest.Mocked<IUserRepository>;

  const mockWallet: IWalletAttributes = {
    id: "wallet-1",
    userId: "user-1",
    balance: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransaction: ITransactionAttributes = {
    id: "txn-1",
    walletId: "wallet-1",
    type: TransactionType.FUNDING,
    amount: 500,
    status: TransactionStatus.COMPLETED,
    reference: "TXN-123",
    narration: "Account funding",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRecipient: IUserAttributes = {
    id: "user-2",
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Doe",
    password: "hashed",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRecipientWallet: IWalletAttributes = {
    id: "wallet-2",
    userId: "user-2",
    balance: 500,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockWalletRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByUserId: jest.fn(),
      creditBalance: jest.fn(),
      debitBalance: jest.fn(),
    };

    mockTxnRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByWalletId: jest.fn(),
      findByReference: jest.fn(),
      createWithTransaction: jest.fn(),
    };

    mockUserRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByEmail: jest.fn(),
    };

    walletService = new WalletService(mockWalletRepo, mockTxnRepo, mockUserRepo);
  });

  describe("createWallet", () => {
    it("should create a new wallet for user", async () => {
      mockWalletRepo.findByUserId.mockResolvedValue(null);
      mockWalletRepo.create.mockResolvedValue(mockWallet);

      const result = await walletService.createWallet("user-1");

      expect(result).toEqual(mockWallet);
      expect(mockWalletRepo.create).toHaveBeenCalled();
    });

    it("should return existing wallet if already created", async () => {
      mockWalletRepo.findByUserId.mockResolvedValue(mockWallet);

      const result = await walletService.createWallet("user-1");

      expect(result).toEqual(mockWallet);
      expect(mockWalletRepo.create).not.toHaveBeenCalled();
    });
  });

  describe("fundWallet", () => {
    it("should fund wallet successfully", async () => {
      mockWalletRepo.findByUserId.mockResolvedValue(mockWallet);
      mockWalletRepo.creditBalance.mockResolvedValue({ ...mockWallet, balance: 1500 });
      mockTxnRepo.createWithTransaction.mockResolvedValue(mockTransaction);

      const result = await walletService.fundWallet("user-1", 500);

      expect(result).toEqual(mockTransaction);
      expect(mockWalletRepo.creditBalance).toHaveBeenCalledWith("wallet-1", 500, {});
    });

    it("should throw NotFoundError when wallet not found", async () => {
      mockWalletRepo.findByUserId.mockResolvedValue(null);

      await expect(walletService.fundWallet("user-1", 500)).rejects.toThrow(NotFoundError);
    });

    it("should throw BadRequestError for zero amount", async () => {
      await expect(walletService.fundWallet("user-1", 0)).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError for negative amount", async () => {
      await expect(walletService.fundWallet("user-1", -100)).rejects.toThrow(BadRequestError);
    });
  });

  describe("transferFunds", () => {
    it("should transfer funds successfully", async () => {
      mockWalletRepo.findByUserId
        .mockResolvedValueOnce(mockWallet)
        .mockResolvedValueOnce(mockRecipientWallet);
      mockUserRepo.findByEmail.mockResolvedValue(mockRecipient);
      mockWalletRepo.debitBalance.mockResolvedValue({ ...mockWallet, balance: 500 });
      mockWalletRepo.creditBalance.mockResolvedValue({ ...mockRecipientWallet, balance: 1000 });
      mockTxnRepo.createWithTransaction.mockResolvedValue({
        ...mockTransaction,
        type: TransactionType.TRANSFER,
      });

      const result = await walletService.transferFunds("user-1", "jane@example.com", 500);

      expect(result.type).toBe(TransactionType.TRANSFER);
      expect(mockWalletRepo.debitBalance).toHaveBeenCalled();
      expect(mockWalletRepo.creditBalance).toHaveBeenCalled();
    });

    it("should throw InsufficientFundsError when balance too low", async () => {
      mockWalletRepo.findByUserId.mockResolvedValue({ ...mockWallet, balance: 100 });

      await expect(
        walletService.transferFunds("user-1", "jane@example.com", 500)
      ).rejects.toThrow(InsufficientFundsError);
    });

    it("should throw NotFoundError when recipient not found", async () => {
      mockWalletRepo.findByUserId.mockResolvedValue(mockWallet);
      mockUserRepo.findByEmail.mockResolvedValue(null);

      await expect(
        walletService.transferFunds("user-1", "nobody@example.com", 100)
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw BadRequestError when transferring to self", async () => {
      mockWalletRepo.findByUserId.mockResolvedValue(mockWallet);
      mockUserRepo.findByEmail.mockResolvedValue({
        ...mockRecipient,
        id: "user-1",
        email: "self@example.com",
      });

      await expect(
        walletService.transferFunds("user-1", "self@example.com", 100)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError for zero amount", async () => {
      await expect(
        walletService.transferFunds("user-1", "jane@example.com", 0)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("withdrawFunds", () => {
    it("should withdraw funds successfully", async () => {
      mockWalletRepo.findByUserId.mockResolvedValue(mockWallet);
      mockWalletRepo.debitBalance.mockResolvedValue({ ...mockWallet, balance: 500 });
      mockTxnRepo.createWithTransaction.mockResolvedValue({
        ...mockTransaction,
        type: TransactionType.WITHDRAWAL,
      });

      const result = await walletService.withdrawFunds("user-1", 500);

      expect(result.type).toBe(TransactionType.WITHDRAWAL);
      expect(mockWalletRepo.debitBalance).toHaveBeenCalledWith("wallet-1", 500, {});
    });

    it("should throw InsufficientFundsError when balance too low", async () => {
      mockWalletRepo.findByUserId.mockResolvedValue({ ...mockWallet, balance: 100 });

      await expect(walletService.withdrawFunds("user-1", 500)).rejects.toThrow(
        InsufficientFundsError
      );
    });

    it("should throw NotFoundError when wallet not found", async () => {
      mockWalletRepo.findByUserId.mockResolvedValue(null);

      await expect(walletService.withdrawFunds("user-1", 100)).rejects.toThrow(NotFoundError);
    });

    it("should throw BadRequestError for negative amount", async () => {
      await expect(walletService.withdrawFunds("user-1", -50)).rejects.toThrow(BadRequestError);
    });
  });

  describe("getTransactionHistory", () => {
    it("should return transaction history for user", async () => {
      mockWalletRepo.findByUserId.mockResolvedValue(mockWallet);
      mockTxnRepo.findByWalletId.mockResolvedValue([mockTransaction]);

      const result = await walletService.getTransactionHistory("user-1");

      expect(result).toHaveLength(1);
      expect(mockTxnRepo.findByWalletId).toHaveBeenCalledWith("wallet-1");
    });

    it("should throw NotFoundError when wallet not found", async () => {
      mockWalletRepo.findByUserId.mockResolvedValue(null);

      await expect(walletService.getTransactionHistory("user-1")).rejects.toThrow(NotFoundError);
    });
  });
});
