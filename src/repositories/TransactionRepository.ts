import { injectable } from "inversify";
import { ITransactionAttributes, ITransactionRepository } from "../types/interfaces";
import { Transaction } from "../models/Transaction";
import { BaseRepository } from "./BaseRepository";

@injectable()
export class TransactionRepository
  extends BaseRepository<ITransactionAttributes>
  implements ITransactionRepository
{
  constructor() {
    super(Transaction as any);
  }

  async findByWalletId(walletId: string): Promise<ITransactionAttributes[]> {
    const records = await Transaction.findAll({
      where: { walletId },
      order: [["created_at", "DESC"]],
    });
    return records.map((r) => r.get({ plain: true }) as ITransactionAttributes);
  }

  async findByReference(reference: string): Promise<ITransactionAttributes | null> {
    const record = await Transaction.findOne({ where: { reference } });
    return record ? (record.get({ plain: true }) as ITransactionAttributes) : null;
  }

  async createWithTransaction(
    data: Partial<ITransactionAttributes>,
    transaction: unknown
  ): Promise<ITransactionAttributes> {
    const record = await Transaction.create(data as any, { transaction } as any);
    return record.get({ plain: true }) as ITransactionAttributes;
  }
}
