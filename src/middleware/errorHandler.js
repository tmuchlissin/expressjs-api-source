/**
 * Global Express error-handling middleware.
 * Must be registered after all routes so forwarded errors (e.g. from Multer) are caught here.
 */
const errorHandler = (err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File size cannot exceed 500KB",
      data: null,
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
    data: null,
  });
};

module.exports = errorHandler;

