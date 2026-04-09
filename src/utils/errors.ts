import { HttpStatusCode } from "../types/enums";

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: HttpStatusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, HttpStatusCode.NOT_FOUND);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(message, HttpStatusCode.BAD_REQUEST);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, HttpStatusCode.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, HttpStatusCode.FORBIDDEN);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, HttpStatusCode.CONFLICT);
  }
}

export class InsufficientFundsError extends AppError {
  constructor(message = "Insufficient funds") {
    super(message, HttpStatusCode.UNPROCESSABLE_ENTITY);
  }
}
