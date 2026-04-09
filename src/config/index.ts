import dotenv from "dotenv";

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),
  db: {
    storage: process.env.DB_STORAGE || (process.env.NODE_ENV === "production" ? "/tmp/demo_credit.sqlite" : "./data/demo_credit.sqlite"),
  },
  jwt: {
    secret: process.env.JWT_SECRET || "default-secret-change-me",
    expiry: process.env.JWT_EXPIRY || "24h",
  },
  adjutor: {
    baseUrl: process.env.ADJUTOR_BASE_URL || "https://adjutor.lendsqr.com/v2",
    apiKey: process.env.ADJUTOR_API_KEY || "",
  },
  logLevel: process.env.LOG_LEVEL || "info",
};
