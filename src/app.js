// Express application setup (middlewares, Swagger UI, routes, and global error handler).
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const morgan = require("morgan");

const swaggerDocument = require("./docs/swagger-output.json");
const postRoutes = require("./routes/postRoutes");
const rootRoutes = require("./routes/rootRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Disable ETag header to prevent 304 (Not Modified) responses in browsers/Swagger,
// ensuring every request returns a fresh 200 OK status during development.
app.disable("etag");

// Create a custom token for UTC+7 time
morgan.token("date-utc7", () => {
  return new Date().toLocaleString("sv-SE", {
    timeZone: "Asia/Jakarta", // UTC+7
  });
});

// HTTP request logger middleware (placed before body parser to log all requests, including malformed JSON)
app.use(
  morgan("[:date-utc7 WIB] :method :url :status :response-time ms - :res[content-length]")
);

// Middleware to parse JSON request bodies
app.use(express.json());

// Middleware to parse URL-encoded form data (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// Interactive Swagger UI documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customSiteTitle: "Learn Express JS (CommonJS) API Docs - Swagger UI",
  })
);
// Raw OpenAPI JSON specification (useful for Postman / Insomnia / frontend generators)
app.get("/api-docs.json", (req, res) => {
  /* #swagger.ignore = true */
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerDocument);
});

// Mount root routes (e.g. /, /health-check)
app.use("/", rootRoutes);
// Mount modular routes with the '/api' prefix (e.g. /api/test/get-posts)
app.use("/api", postRoutes);

// Global error-handling middleware (handles Multer file size limit & unexpected errors)
app.use(errorHandler);

module.exports = app;

