const fs = require("fs");
const path = require("path");
const swaggerAutogen = require("swagger-autogen")({ openapi: "3.0.0" });

const doc = {
  info: {
    title: "Learn Express.js API",
    version: "1.0.0",
    description: "API Documentation auto-generated with swagger-autogen",
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
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
      },
    },
  },
};

const outputFile = path.join(__dirname, "../docs/swagger-output.json");
fs.mkdirSync(path.dirname(outputFile), { recursive: true });

const routes = [path.join(__dirname, "../app.js")];

// Run this script to regenerate src/docs/swagger-output.json
swaggerAutogen(outputFile, routes, doc);

