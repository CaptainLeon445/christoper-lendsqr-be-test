import { Model, DataTypes, Sequelize } from "sequelize";
import { IWalletAttributes } from "../types/interfaces";

export class Wallet extends Model<IWalletAttributes> implements IWalletAttributes {
  public id!: string;
  public userId!: string;
  public balance!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): typeof Wallet {
    Wallet.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          field: "user_id",
          references: {
            model: "users",
            key: "id",
          },
        },
        balance: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.0,
          validate: { min: 0 },
        },
      },
      {
        sequelize,
        tableName: "wallets",
        timestamps: true,
        underscored: true,
      }
    );
    return Wallet;
  }

  static associate(models: { User: typeof Model; Transaction: typeof Model }): void {
    Wallet.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    Wallet.hasMany(models.Transaction, { foreignKey: "walletId", as: "transactions" });
  }
}
