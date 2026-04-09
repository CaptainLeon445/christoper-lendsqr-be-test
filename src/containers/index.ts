import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "../types/symbols";
import {
  IUserRepository,
  IWalletRepository,
  ITransactionRepository,
  IUserService,
  IWalletService,
  IAuthService,
  IKarmaService,
} from "../types/interfaces";
import { UserRepository } from "../repositories/UserRepository";
import { WalletRepository } from "../repositories/WalletRepository";
import { TransactionRepository } from "../repositories/TransactionRepository";
import { UserService } from "../services/UserService";
import { WalletService } from "../services/WalletService";
import { AuthService } from "../services/AuthService";
import { KarmaService } from "../services/KarmaService";
import { AuthController } from "../controllers/AuthController";
import { WalletController } from "../controllers/WalletController";
import { UserController } from "../controllers/UserController";

const container = new Container();

container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository).inSingletonScope();
container.bind<IWalletRepository>(TYPES.WalletRepository).to(WalletRepository).inSingletonScope();
container.bind<ITransactionRepository>(TYPES.TransactionRepository).to(TransactionRepository).inSingletonScope();

container.bind<IUserService>(TYPES.UserService).to(UserService).inSingletonScope();
container.bind<IWalletService>(TYPES.WalletService).to(WalletService).inSingletonScope();
container.bind<IAuthService>(TYPES.AuthService).to(AuthService).inSingletonScope();
container.bind<IKarmaService>(TYPES.KarmaService).to(KarmaService).inSingletonScope();

container.bind<AuthController>(TYPES.AuthController).to(AuthController).inSingletonScope();
container.bind<WalletController>(TYPES.WalletController).to(WalletController).inSingletonScope();
container.bind<UserController>(TYPES.UserController).to(UserController).inSingletonScope();

export { container };
