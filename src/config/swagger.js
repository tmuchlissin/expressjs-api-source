import fs from "fs";
import path from "path";
import swaggerAutogenInit from "swagger-autogen";

const swaggerAutogen = swaggerAutogenInit({ openapi: "3.0.0" });

const doc = {
    info: {
        title: "Learn Express.js (ESM) API",
        version: "1.0.0",
        description: "API Documentation auto-generated with swagger-autogen (ES Modules)",
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

const currentDir = import.meta.dirname || path.dirname(new URL(import.meta.url).pathname);
const outputFile = path.join(currentDir, "../docs/swagger-output.json");
fs.mkdirSync(path.dirname(outputFile), { recursive: true });

const routes = [path.join(currentDir, "../app.js")];

// Run this script to regenerate src/docs/swagger-output.json
swaggerAutogen(outputFile, routes, doc);

