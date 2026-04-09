import { Sequelize } from "sequelize";
import { User } from "./User";
import { Wallet } from "./Wallet";
import { Transaction } from "./Transaction";

export function initializeModels(sequelize: Sequelize): void {
  User.initModel(sequelize);
  Wallet.initModel(sequelize);
  Transaction.initModel(sequelize);

  User.associate({ Wallet: Wallet as any });
  Wallet.associate({ User: User as any, Transaction: Transaction as any });
  Transaction.associate({ Wallet: Wallet as any });
}

export { User, Wallet, Transaction };
