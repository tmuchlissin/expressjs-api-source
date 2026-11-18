// Express application setup (middlewares, routes, and global error handler).
import express, { Application } from "express";
import morgan from "morgan";

import { openAPIRouter } from "./openapi/swagger";
import postRoutes from "./routes/postRoutes";
import rootRoutes from "./routes/rootRoutes";
import errorHandler from "./middleware/errorHandler";

const app: Application = express();

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

// Mount OpenAPI documentation & Swagger UI (/api-docs, /api-docs.json)
app.use(openAPIRouter);

// Mount root routes (e.g. /, /health-check)
app.use("/", rootRoutes);

// Mount modular routes with the '/api' prefix (e.g. /api/test/get-posts)
app.use("/api", postRoutes);

// Global error-handling middleware
app.use(errorHandler);

export default app;
