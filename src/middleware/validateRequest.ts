import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

/**
 * Generic Express middleware to validate request bodies against a Zod schema.
 * Rejects invalid requests with 400 Bad Request before reaching the controller.
 * Automatically assigns the coerced and sanitized data back to req.body.
 */
export const validateRequest = (schema: z.ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map(
          (issue) => `${String(issue.path[0])} -> ${issue.message}`
        );

        res.status(400).json({
          success: false,
          message: errorMessages,
          data: null,
        });
        return;
      }

      next(error);
    }
  };
};

export default validateRequest;

