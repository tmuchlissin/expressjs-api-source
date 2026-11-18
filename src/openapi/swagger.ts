import express, { Router, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry";
// Import routes to ensure all OpenAPI paths are registered into the registry
import "./routes";

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Learn Express.js (TypeScript + Zod OpenAPI) API",
      version: "1.0.0",
      description:
        "API Documentation dynamically generated in-memory directly from Zod Schemas using @asteasolutions/zod-to-openapi",
    },
    servers: [
      {
        url: "/",
        description: "Current Server",
      },
    ],
    tags: [
      {
        name: "Root",
        description: "Root and health check endpoints",
      },
      {
        name: "Test API Practice (Blog Posts)",
        description: "Endpoints for learning REST API practice (Blog Posts)",
      },
    ],
  });
}

// In-memory compiled specification object
export const openApiDocument = generateOpenApiDocument();

// Express router for OpenAPI documentation & Swagger UI
export const openAPIRouter: Router = express.Router();

// Mount interactive Swagger UI
openAPIRouter.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: "Learn Express JS (TypeScript) API Docs - Swagger UI",
  })
);

// Serve raw OpenAPI JSON specification
openAPIRouter.get("/api-docs.json", (_req: Request, res: Response) => {
  res.json(openApiDocument);
});

