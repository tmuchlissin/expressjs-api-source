import { Request, Response } from "express";

// Handle request to root
const handleRoot = (_req: Request, res: Response): void => {
  res.json({
    success: true,
    message: "Welcome to the Learn Express.js (TypeScript) API",
    data: null,
  });
};

const healthCheck = (_req: Request, res: Response): void => {
  res.json({
    success: true,
    message: "Health Check is OK! ✅",
    data: null,
  });
};

export { handleRoot, healthCheck };
