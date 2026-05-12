import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import httpStatus from "http-status";

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

const validateRequest = (schemas: ValidationSchemas) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (schemas.body) {
        const parsedBody = await schemas.body.parseAsync(req.body);
        req.body = parsedBody;
      }

      // Validate query parameters
      if (schemas.query) {
        const parsedQuery = await schemas.query.parseAsync(req.query);
        // We need to cast because Express query types are strict
        (req as any).query = parsedQuery;
      }

      // Validate route parameters
      if (schemas.params) {
        const parsedParams = await schemas.params.parseAsync(req.params) as any;
        req.params = parsedParams;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: "Validation failed",
          errors: errorMessages,
        });
        return;
      }

      next(error);
    }
  };
};

export default validateRequest;