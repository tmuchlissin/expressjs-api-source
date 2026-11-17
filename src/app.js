// Express application setup (middlewares, Swagger UI, routes, and global error handler).
import express from "express";
import swaggerUi from "swagger-ui-express";
import morgan from "morgan";
import fs from "fs";
import path from "path";

import postRoutes from "./routes/postRoutes.js";
import rootRoutes from "./routes/rootRoutes.js";
import errorHandler from "./middleware/errorHandler.js";

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

// HTTP request logger middleware
app.use(
  morgan("[:date-utc7 WIB] :method :url :status :response-time ms - :res[content-length]")
);

// Middleware to parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load OpenAPI JSON specification safely in ESM
const currentDir = import.meta.dirname || path.dirname(new URL(import.meta.url).pathname);
const swaggerPath = path.join(currentDir, "./docs/swagger-output.json");

let swaggerDocument = {};
if (fs.existsSync(swaggerPath)) {
  swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf-8"));
}

// Interactive Swagger UI documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customSiteTitle: "Learn Express JS (ESM) API Docs - Swagger UI",
  })
);

// Raw OpenAPI JSON specification
app.get("/api-docs.json", (req, res) => {
  /* #swagger.ignore = true */
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerDocument);
});

// Mount root routes (e.g. /, /health-check)
app.use("/", rootRoutes);

// Mount modular routes with the '/api' prefix (e.g. /api/test/get-posts)
app.use("/api", postRoutes);

// Global error-handling middleware
app.use(errorHandler);

export default app;

