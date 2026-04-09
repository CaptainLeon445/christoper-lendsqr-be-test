import fs from "fs";
import path from "path";
import { Sequelize } from "sequelize";
import { config } from "./index";

export class Database {
  private static instance: Sequelize;

  static getInstance(): Sequelize {
    if (!Database.instance) {
      // Ensure the parent directory of the SQLite file exists
      const storageDir = path.dirname(path.resolve(config.db.storage));
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }

      Database.instance = new Sequelize({
        dialect: "sqlite",
        storage: config.db.storage,
        logging: config.env === "development" ? console.log : false,
        define: {
          timestamps: true,
          underscored: true,
        },
      });
    }
    return Database.instance;
  }

  static async connect(): Promise<void> {
    const sequelize = Database.getInstance();
    await sequelize.authenticate();
  }

  static async disconnect(): Promise<void> {
    const sequelize = Database.getInstance();
    await sequelize.close();
  }

  static async sync(force = false): Promise<void> {
    const sequelize = Database.getInstance();
    await sequelize.sync({ force });
  }
}
