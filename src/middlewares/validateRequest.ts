import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../utils/errors";

type ValidationRule = {
  field: string;
  required?: boolean;
  type?: string;
  minLength?: number;
  min?: number;
  pattern?: RegExp;
  message?: string;
};

export function validateRequest(rules: ValidationRule[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    for (const rule of rules) {
      const value = req.body[rule.field];

      if (rule.required && (value === undefined || value === null || value === "")) {
        throw new BadRequestError(rule.message || `${rule.field} is required`);
      }

      if (value === undefined || value === null) continue;

      if (rule.type && typeof value !== rule.type) {
        throw new BadRequestError(rule.message || `${rule.field} must be of type ${rule.type}`);
      }

      if (rule.minLength && typeof value === "string" && value.length < rule.minLength) {
        throw new BadRequestError(
          rule.message || `${rule.field} must be at least ${rule.minLength} characters`
        );
      }

      if (rule.min !== undefined && typeof value === "number" && value < rule.min) {
        throw new BadRequestError(
          rule.message || `${rule.field} must be at least ${rule.min}`
        );
      }

      if (rule.pattern && typeof value === "string" && !rule.pattern.test(value)) {
        throw new BadRequestError(rule.message || `${rule.field} has invalid format`);
      }
    }

    next();
  };
}
