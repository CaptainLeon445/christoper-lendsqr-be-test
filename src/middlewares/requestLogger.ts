import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

const PII_BODY_FIELDS = ["password", "token", "authorization", "email"];

function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  if (!body || typeof body !== "object") return body;

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (PII_BODY_FIELDS.includes(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeBody(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, originalUrl } = req;

  const sanitizedBody = sanitizeBody(req.body);

  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    logger.info(
      JSON.stringify({
        type: "HTTP_REQUEST",
        method,
        path: originalUrl,
        statusCode,
        duration: `${duration}ms`,
        body: Object.keys(sanitizedBody).length > 0 ? sanitizedBody : undefined,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
      })
    );
  });

  next();
}
