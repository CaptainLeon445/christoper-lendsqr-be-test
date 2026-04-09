import { injectable, inject } from "inversify";
import { TYPES } from "../types/symbols";
import {
  IWalletAttributes,
  ITransactionAttributes,
  IWalletRepository,
  ITransactionRepository,
  IUserRepository,
  IWalletService,
} from "../types/interfaces";
import { TransactionType, TransactionStatus } from "../types/enums";
import { Database } from "../config/database";
import {
  NotFoundError,
  BadRequestError,
  InsufficientFundsError,
} from "../utils/errors";
import { generateId, generateReference } from "../utils/helpers";
import { TransactionRepository } from "../repositories/TransactionRepository";

@injectable()
export class WalletService implements IWalletService {
  constructor(
    @inject(TYPES.WalletRepository) private readonly walletRepository: IWalletRepository,
    @inject(TYPES.TransactionRepository) private readonly transactionRepository: ITransactionRepository,
    @inject(TYPES.UserRepository) private readonly userRepository: IUserRepository
  ) {}

  async createWallet(userId: string): Promise<IWalletAttributes> {
    const existing = await this.walletRepository.findByUserId(userId);
    if (existing) {
      return existing;
    }

    return this.walletRepository.create({
      id: generateId(),
      userId,
      balance: 0,
    });
  }

  async getWalletByUserId(userId: string): Promise<IWalletAttributes | null> {
    return this.walletRepository.findByUserId(userId);
  }

  async fundWallet(userId: string, amount: number): Promise<ITransactionAttributes> {
    this.validateAmount(amount);

    const wallet = await this.getWalletOrFail(userId);
    const sequelize = Database.getInstance();

    return sequelize.transaction(async (t) => {
      await this.walletRepository.creditBalance(wallet.id, amount, t);

      const txnRepo = this.transactionRepository as TransactionRepository;
      return txnRepo.createWithTransaction(
        {
          id: generateId(),
          walletId: wallet.id,
          type: TransactionType.FUNDING,
          amount,
          status: TransactionStatus.COMPLETED,
          reference: generateReference(),
          narration: "Account funding",
        },
        t
      );
    });
  }

  async transferFunds(
    senderUserId: string,
    recipientEmail: string,
    amount: number,
    narration = "Fund transfer"
  ): Promise<ITransactionAttributes> {
    this.validateAmount(amount);

    const senderWallet = await this.getWalletOrFail(senderUserId);
    if (Number(senderWallet.balance) < amount) {
      throw new InsufficientFundsError();
    }

    const recipient = await this.userRepository.findByEmail(recipientEmail);
    if (!recipient) {
      throw new NotFoundError("Recipient not found");
    }

    if (recipient.id === senderUserId) {
      throw new BadRequestError("Cannot transfer funds to yourself");
    }

    const recipientWallet = await this.walletRepository.findByUserId(recipient.id);
    if (!recipientWallet) {
      throw new NotFoundError("Recipient wallet not found");
    }

    const sequelize = Database.getInstance();
    const reference = generateReference();

    return sequelize.transaction(async (t) => {
      await this.walletRepository.debitBalance(senderWallet.id, amount, t);
      await this.walletRepository.creditBalance(recipientWallet.id, amount, t);

      const txnRepo = this.transactionRepository as TransactionRepository;

      const senderTxn = await txnRepo.createWithTransaction(
        {
          id: generateId(),
          walletId: senderWallet.id,
          type: TransactionType.TRANSFER,
          amount,
          status: TransactionStatus.COMPLETED,
          reference,
          narration,
          counterpartyWalletId: recipientWallet.id,
        },
        t
      );

      await txnRepo.createWithTransaction(
        {
          id: generateId(),
          walletId: recipientWallet.id,
          type: TransactionType.TRANSFER,
          amount,
          status: TransactionStatus.COMPLETED,
          reference: `${reference}-RECV`,
          narration: `Received: ${narration}`,
          counterpartyWalletId: senderWallet.id,
        },
        t
      );

      return senderTxn;
    });
  }

  async withdrawFunds(userId: string, amount: number): Promise<ITransactionAttributes> {
    this.validateAmount(amount);

    const wallet = await this.getWalletOrFail(userId);
    if (Number(wallet.balance) < amount) {
      throw new InsufficientFundsError();
    }

    const sequelize = Database.getInstance();

    return sequelize.transaction(async (t) => {
      await this.walletRepository.debitBalance(wallet.id, amount, t);

      const txnRepo = this.transactionRepository as TransactionRepository;
      return txnRepo.createWithTransaction(
        {
          id: generateId(),
          walletId: wallet.id,
          type: TransactionType.WITHDRAWAL,
          amount,
          status: TransactionStatus.COMPLETED,
          reference: generateReference(),
          narration: "Account withdrawal",
        },
        t
      );
    });
  }

  async getTransactionHistory(userId: string): Promise<ITransactionAttributes[]> {
    const wallet = await this.getWalletOrFail(userId);
    return this.transactionRepository.findByWalletId(wallet.id);
  }

  private async getWalletOrFail(userId: string): Promise<IWalletAttributes> {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundError("Wallet not found");
    }
    return wallet;
  }

  private validateAmount(amount: number): void {
    if (!amount || amount <= 0) {
      throw new BadRequestError("Amount must be greater than zero");
    }
  }
}
