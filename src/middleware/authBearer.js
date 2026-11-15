const crypto = require("crypto");
const config = require("../config/env");

/**
 * Middleware to validate a static Bearer token from the Authorization header
 * against config.bearerToken.
 */
const authBearer = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Missing or invalid Authorization header (expected Bearer <token>)",
      data: null,
    });
  }

  const token = authHeader.slice(7).trim();
  const expectedToken = config.bearerToken;

  if (!expectedToken) {
    return res.status(500).json({
      success: false,
      message: "Server configuration error: BEARER_TOKEN is not set",
      data: null,
    });
  }

  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(expectedToken);

  if (
    tokenBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(tokenBuf, expectedBuf)
  ) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid Bearer token",
      data: null,
    });
  }

  req.auth = {
    scheme: "Bearer",
    authenticated: true,
  };

  return next();
};

module.exports = authBearer;

