import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import { verifyToken } from "../utils/jwt";
import catchAsync from "../utils/catchAsync";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

// Middleware to check if user is authenticated
export const auth = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Or check for token in cookies
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "You are not logged in. Please log in to access this resource.",
      });
      return;
    }

    try {
      // Verify the token
      const decoded = verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "Invalid or expired token. Please log in again.",
      });
      return;
    }
  }
);

// Middleware to restrict access based on roles
export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "You are not logged in.",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
      return;
    }

    next();
  };
};

// Optional auth - attach user if token exists, but don't block if not
export const optionalAuth = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        req.user = decoded;
      } catch (error) {
        // Token is invalid, but that's okay for optional auth
        // Just don't attach user
      }
    }

    next();
  }
);