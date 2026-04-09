import { app } from "./app";
import { config } from "./config";
import { Database } from "./config/database";
import { initializeModels } from "./models";
import { logger } from "./utils/logger";

async function bootstrap(): Promise<void> {
  const sequelize = Database.getInstance();
  initializeModels(sequelize);

  await Database.connect();
  logger.info("Database connection established");

  await Database.sync();
  logger.info("Database synchronized");

  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} in ${config.env} mode`);
  });
}

bootstrap().catch((error) => {
  logger.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});
