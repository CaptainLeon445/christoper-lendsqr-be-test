import { Model, ModelStatic } from "sequelize";
import { IRepository } from "../types/interfaces";

export abstract class BaseRepository<T extends object> implements IRepository<T> {
  constructor(protected readonly model: ModelStatic<Model<T>>) {}

  async findById(id: string): Promise<T | null> {
    const record = await this.model.findByPk(id);
    return record ? (record.get({ plain: true }) as T) : null;
  }

  async findAll(): Promise<T[]> {
    const records = await this.model.findAll();
    return records.map((r) => r.get({ plain: true }) as T);
  }

  async create(data: Partial<T>): Promise<T> {
    const record = await this.model.create(data as any);
    return record.get({ plain: true }) as T;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const [affectedCount] = await this.model.update(data as any, { where: { id } as any });
    if (affectedCount === 0) return null;
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const affectedCount = await this.model.destroy({ where: { id } as any });
    return affectedCount > 0;
  }
}
