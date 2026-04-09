import { Request } from "express";
import { TransactionType, TransactionStatus } from "./enums";

export interface IUserAttributes {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWalletAttributes {
  id: string;
  userId: string;
  balance: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITransactionAttributes {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  reference: string;
  narration: string;
  counterpartyWalletId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface IFundAccountDto {
  amount: number;
}

export interface ITransferDto {
  recipientEmail: string;
  amount: number;
  narration?: string;
}

export interface IWithdrawDto {
  amount: number;
}

export interface IAuthPayload {
  userId: string;
  email: string;
}

export interface IAuthenticatedRequest extends Request {
  user?: IAuthPayload;
}

export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface IKarmaCheckResponse {
  status: string;
  message: string;
  data: {
    karma_identity: string;
    amount_in_contention: string;
    reason: string;
    default_date: string;
    karma_type: string;
    karma_identity_type: string;
  } | null;
}

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

export interface IUserRepository extends IRepository<IUserAttributes> {
  findByEmail(email: string): Promise<IUserAttributes | null>;
}

export interface IWalletRepository extends IRepository<IWalletAttributes> {
  findByUserId(userId: string): Promise<IWalletAttributes | null>;
  creditBalance(walletId: string, amount: number, transaction: unknown): Promise<IWalletAttributes>;
  debitBalance(walletId: string, amount: number, transaction: unknown): Promise<IWalletAttributes>;
}

export interface ITransactionRepository extends IRepository<ITransactionAttributes> {
  findByWalletId(walletId: string): Promise<ITransactionAttributes[]>;
  findByReference(reference: string): Promise<ITransactionAttributes | null>;
}

export interface IUserService {
  createUser(dto: ICreateUserDto): Promise<IUserAttributes>;
  getUserById(id: string): Promise<IUserAttributes | null>;
  getUserByEmail(email: string): Promise<IUserAttributes | null>;
}

export interface IWalletService {
  createWallet(userId: string): Promise<IWalletAttributes>;
  getWalletByUserId(userId: string): Promise<IWalletAttributes | null>;
  fundWallet(userId: string, amount: number): Promise<ITransactionAttributes>;
  transferFunds(senderUserId: string, recipientEmail: string, amount: number, narration?: string): Promise<ITransactionAttributes>;
  withdrawFunds(userId: string, amount: number): Promise<ITransactionAttributes>;
  getTransactionHistory(userId: string): Promise<ITransactionAttributes[]>;
}

export interface IAuthService {
  register(dto: ICreateUserDto): Promise<{ user: Omit<IUserAttributes, "password">; token: string }>;
  login(email: string, password: string): Promise<{ user: Omit<IUserAttributes, "password">; token: string }>;
  verifyToken(token: string): IAuthPayload;
}

export interface IKarmaService {
  checkBlacklist(identity: string): Promise<boolean>;
}
