// Server entry point: loads validated config and starts the HTTP server.
import config from "./config/env";
import app from "./app";

app.listen(config.port, () => {
  console.log(`🚀 Server is running at http://localhost:${config.port}`);
  console.log(`📚 Swagger UI available at http://localhost:${config.port}/api-docs`);
  console.log(`📄 OpenAPI JSON spec available at http://localhost:${config.port}/api-docs.json`);
});

