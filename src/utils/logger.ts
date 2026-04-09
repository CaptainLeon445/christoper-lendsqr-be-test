import winston from "winston";
import { config } from "../config";

const piiPatterns: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: "[EMAIL_REDACTED]" },
  { pattern: /\b\d{10,11}\b/g, replacement: "[PHONE_REDACTED]" },
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[SSN_REDACTED]" },
  { pattern: /\b(?:\d[ -]*?){13,19}\b/g, replacement: "[CARD_REDACTED]" },
  { pattern: /"password"\s*:\s*"[^"]*"/gi, replacement: '"password":"[REDACTED]"' },
  { pattern: /"token"\s*:\s*"[^"]*"/gi, replacement: '"token":"[REDACTED]"' },
  { pattern: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, replacement: "Bearer [REDACTED]" },
];

const sanitizePii = winston.format((info) => {
  let message = typeof info.message === "string" ? info.message : JSON.stringify(info.message);
  for (const { pattern, replacement } of piiPatterns) {
    message = message.replace(pattern, replacement);
  }
  info.message = message;
  return info;
});

export const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    sanitizePii(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "demo-credit-wallet" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service }) => {
          return `[${timestamp}] ${level} [${service}]: ${message}`;
        })
      ),
    }),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});
