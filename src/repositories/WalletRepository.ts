import { injectable } from "inversify";
import { Sequelize, Transaction as SequelizeTransaction } from "sequelize";
import { IWalletAttributes, IWalletRepository } from "../types/interfaces";
import { Wallet } from "../models/Wallet";
import { BaseRepository } from "./BaseRepository";

@injectable()
export class WalletRepository extends BaseRepository<IWalletAttributes> implements IWalletRepository {
  constructor() {
    super(Wallet as any);
  }

  async findByUserId(userId: string): Promise<IWalletAttributes | null> {
    const record = await Wallet.findOne({ where: { userId } });
    return record ? (record.get({ plain: true }) as IWalletAttributes) : null;
  }

  async creditBalance(
    walletId: string,
    amount: number,
    transaction: unknown
  ): Promise<IWalletAttributes> {
    const t = transaction as SequelizeTransaction;
    await Wallet.update(
      { balance: Sequelize.literal(`balance + ${amount}`) } as any,
      { where: { id: walletId }, transaction: t }
    );
    const wallet = await Wallet.findByPk(walletId, { transaction: t });
    return wallet!.get({ plain: true }) as IWalletAttributes;
  }

  async debitBalance(
    walletId: string,
    amount: number,
    transaction: unknown
  ): Promise<IWalletAttributes> {
    const t = transaction as SequelizeTransaction;
    const [affectedCount] = await Wallet.update(
      { balance: Sequelize.literal(`balance - ${amount}`) } as any,
      {
        where: Sequelize.and(
          { id: walletId },
          Sequelize.where(Sequelize.col("balance"), ">=", amount)
        ),
        transaction: t,
      }
    );
    if (affectedCount === 0) {
      throw new Error("Insufficient funds or wallet not found");
    }
    const wallet = await Wallet.findByPk(walletId, { transaction: t });
    return wallet!.get({ plain: true }) as IWalletAttributes;
  }
}
