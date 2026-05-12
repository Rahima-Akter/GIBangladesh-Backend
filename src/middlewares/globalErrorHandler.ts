import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import logger from "../lib/logger";

// Custom error class for operational errors
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Set default values
  let statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal Server Error";

  // Handle Prisma known errors
  if (err.code === "P2002") {
    // Unique constraint violation
    statusCode = httpStatus.CONFLICT;
    const field = err.meta?.target?.[0] || "field";
    message = `This ${field} is already taken. Please use a different one.`;
  }

  if (err.code === "P2025") {
    // Record not found
    statusCode = httpStatus.NOT_FOUND;
    message = "The requested record was not found.";
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Invalid token. Please log in again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Your token has expired. Please log in again.";
  }

  // Handle Zod validation errors (if not caught by validateRequest)
  if (err.name === "ZodError") {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Validation failed";
  }

  // Log the error
  if (statusCode >= 500) {
    // Server errors - log full details
    logger.error({
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
    });
  } else {
    // Client errors - log simpler message
    logger.warn({
      message: err.message,
      url: req.originalUrl,
      method: req.method,
      statusCode,
    });
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    // Only show error details in development
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      error: err,
    }),
  });
};

export default globalErrorHandler;