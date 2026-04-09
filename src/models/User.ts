import { Model, DataTypes, Sequelize } from "sequelize";
import { IUserAttributes } from "../types/interfaces";

export class User extends Model<IUserAttributes> implements IUserAttributes {
  public id!: string;
  public email!: string;
  public firstName!: string;
  public lastName!: string;
  public password!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): typeof User {
    User.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
          validate: { isEmail: true },
        },
        firstName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: "first_name",
        },
        lastName: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: "last_name",
        },
        password: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: "users",
        timestamps: true,
        underscored: true,
      }
    );
    return User;
  }

  static associate(models: { Wallet: typeof Model }): void {
    User.hasOne(models.Wallet, { foreignKey: "userId", as: "wallet" });
  }
}
