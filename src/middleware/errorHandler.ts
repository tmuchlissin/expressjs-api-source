import { Request, Response, NextFunction } from "express";

/**
 * Global Express error-handling middleware.
 * Must be registered after all routes so forwarded errors (e.g. from Multer) are caught here.
 */
const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({
      success: false,
      message: "File size cannot exceed 500KB",
      data: null,
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
    data: null,
  });
};

export default errorHandler;
