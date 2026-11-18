import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import config from "../config/env";

export interface AuthInfo {
  scheme: string;
  authenticated: boolean;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthInfo;
    }
  }
}

/**
 * Middleware to validate a static Bearer token from the Authorization header
 * against config.bearerToken.
 */
const authBearer = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Unauthorized: Missing or invalid Authorization header (expected Bearer <token>)",
      data: null,
    });
    return;
  }

  const token = authHeader.slice(7).trim();
  const expectedToken = config.bearerToken;

  if (!expectedToken) {
    res.status(500).json({
      success: false,
      message: "Server configuration error: BEARER_TOKEN is not set",
      data: null,
    });
    return;
  }

  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(expectedToken);

  if (
    tokenBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(tokenBuf, expectedBuf)
  ) {
    res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid Bearer token",
      data: null,
    });
    return;
  }

  req.auth = {
    scheme: "Bearer",
    authenticated: true,
  };

  next();
};

export default authBearer;

