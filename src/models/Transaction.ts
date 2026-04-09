import { Model, DataTypes, Sequelize } from "sequelize";
import { ITransactionAttributes } from "../types/interfaces";
import { TransactionType, TransactionStatus } from "../types/enums";

export class Transaction extends Model<ITransactionAttributes> implements ITransactionAttributes {
  public id!: string;
  public walletId!: string;
  public type!: TransactionType;
  public amount!: number;
  public status!: TransactionStatus;
  public reference!: string;
  public narration!: string;
  public counterpartyWalletId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): typeof Transaction {
    Transaction.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        walletId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: "wallet_id",
          references: {
            model: "wallets",
            key: "id",
          },
        },
        type: {
          type: DataTypes.STRING(20),
          allowNull: false,
          validate: { isIn: [Object.values(TransactionType)] },
        },
        amount: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          validate: { min: 0.01 },
        },
        status: {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: TransactionStatus.PENDING,
          validate: { isIn: [Object.values(TransactionStatus)] },
        },
        reference: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
        },
        narration: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        counterpartyWalletId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: "counterparty_wallet_id",
          references: {
            model: "wallets",
            key: "id",
          },
        },
      },
      {
        sequelize,
        tableName: "transactions",
        timestamps: true,
        underscored: true,
      }
    );
    return Transaction;
  }

  static associate(models: { Wallet: typeof Model }): void {
    Transaction.belongsTo(models.Wallet, { foreignKey: "walletId", as: "wallet" });
    Transaction.belongsTo(models.Wallet, { foreignKey: "counterpartyWalletId", as: "counterpartyWallet" });
  }
}
