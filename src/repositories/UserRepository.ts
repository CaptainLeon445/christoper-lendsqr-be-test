import { injectable } from "inversify";
import { IUserAttributes, IUserRepository } from "../types/interfaces";
import { User } from "../models/User";
import { BaseRepository } from "./BaseRepository";

@injectable()
export class UserRepository extends BaseRepository<IUserAttributes> implements IUserRepository {
  constructor() {
    super(User as any);
  }

  async findByEmail(email: string): Promise<IUserAttributes | null> {
    const record = await User.findOne({ where: { email } });
    return record ? (record.get({ plain: true }) as IUserAttributes) : null;
  }
}
