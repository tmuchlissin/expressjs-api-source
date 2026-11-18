# Express.js REST API Starter (TypeScript + In-Memory Zod OpenAPI)

Notes and a practical guide for learning REST API built with Express.js (TypeScript), Prisma ORM 7, PostgreSQL, Zod validation, Morgan logger, and **in-memory auto-generated Swagger documentation using `@asteasolutions/zod-to-openapi`**.

---

## ⚡ Quick Start (Running Existing Project)

If you have cloned this repository, get it running locally in 4 simple steps:

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Setup environment variables:**
   ```bash
   cp .env.example .env
   # Update DATABASE_URL and BEARER_TOKEN in .env if needed
   ```
3. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   ```
4. **Start the development server:**
   ```bash
   npm run dev
   ```
   - API Server: [http://localhost:3007](http://localhost:3007)
   - Interactive Swagger Docs: [http://localhost:3007/api-docs](http://localhost:3007/api-docs)
   - OpenAPI JSON Spec: [http://localhost:3007/api-docs.json](http://localhost:3007/api-docs.json)

5. **Build and Run for Production:**
   ```bash
   npm run build
   npm start
   ```

---

## 🛠️ Step-by-Step Setup Guide (Building From Scratch)

Follow this guide if you are rebuilding the project or learning how all the TypeScript pieces fit together from zero.

### 1. Project Initialization & TypeScript Configuration

1. **Initialize Node.js Project**
   ```bash
   npm init -y
   ```

2. **Install Runtime Dependencies**
   ```bash
   npm install express dotenv zod morgan multer @asteasolutions/zod-to-openapi swagger-ui-express
   ```

3. **Install TypeScript & Type Definitions (`devDependencies`)**
   ```bash
   npm install -D typescript tsx @types/node @types/express @types/morgan @types/multer @types/swagger-ui-express
   ```
   - `typescript`: The official compiler (`tsc`).
   - `tsx`: Modern, blazingly fast TypeScript executor and file watcher for development.
   - `@types/*`: Type definitions providing full autocomplete and compile-time verification for third-party libraries.

4. **Configure `tsconfig.json`**
   Create `tsconfig.json` in the root:
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "commonjs",
       "rootDir": "./src",
       "outDir": "./dist",
       "strict": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true
     },
     "include": [
       "src/**/*"
     ]
   }
   ```
   > 💡 **Why this configuration?**
   > - `"rootDir": "./src"` & `"outDir": "./dist"`: Isolates `.ts` files inside `src/` and compiles pure `.js` output to `dist/`.
   > - Clean imports without fake `.js` extensions (unlike ESM).
   > - `"noUnusedLocals"` & `"noUnusedParameters"`: Automatically prevents dead or unused code.

5. **Configure Scripts in `package.json`**
   Add your build and runner scripts into `package.json`:
   ```json
   "main": "dist/server.js",
   "scripts": {
     "dev": "tsx watch src/server.ts",
     "build": "tsc",
     "start": "node dist/server.js",
     "secret:generate": "tsx src/scripts/seed/secret-key.ts"
   }
   ```
   - `"dev"`: Runs the TypeScript server directly using `tsx` with instant hot-reloading.
   - `"build"`: Compiles TypeScript (`src/*.ts`) into production-ready JavaScript (`dist/*.js`).
   - `"start"`: Runs the compiled production code using standard Node.js without compiler overhead.
   - `"secret:generate"`: Generates a cryptographically secure 256-bit secret token for `.env`.

---

### 2. Prisma ORM 7 Setup (PostgreSQL)

1. **Install Prisma 7 Packages**
   ```bash
   npm install prisma@^7.10.1 @prisma/client@^7.10.1 @prisma/adapter-pg pg
   npm install -D @types/pg
   ```
   > 💡 Pinning `^7.10.1` avoids pulling experimental release candidates.

2. **Initialize Prisma Configuration**
   ```bash
   npx prisma init --datasource-provider postgresql
   ```

3. **Configure Environment Variables in `.env`**
   ```env
   NODE_ENV=development
   PORT=3007
   DATABASE_URL="postgresql://user:password@localhost:5432/dev_playground?schema=express_ts"
   BEARER_TOKEN="your-secret-bearer-token"
   ```
   > 💡 **Schema Isolation:** Multiple projects can share a single PostgreSQL database (`dev_playground`) while staying 100% isolated through database schemas (`?schema=express_ts`).

4. **Configure `prisma.config.ts`**
   ```typescript
   import "dotenv/config";
   import { defineConfig } from "prisma/config";

   export default defineConfig({
     schema: "prisma/schema.prisma",
     migrations: {
       path: "prisma/migrations",
     },
     datasource: {
       url: process.env["DATABASE_URL"],
     },
   });
   ```

5. **Define Models in `prisma/schema.prisma`**
   ```prisma
   generator client {
     provider = "prisma-client-js"
   }

   datasource db {
     provider = "postgresql"
   }

   model Post {
     id          Int      @id @default(autoincrement())
     title       String   @db.VarChar(255)
     author_name String   @db.VarChar(255)
     content     String   @db.Text
     file_data   Bytes?
     file_name   String?  @db.VarChar(255)
     file_mime   String?  @db.VarChar(100)
     published   Boolean  @default(false)
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt

     @@map("posts")
   }
   ```

6. **Run Database Migrations & Generate Client**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

7. **Configure PostgreSQL Driver Adapter (`src/config/database.ts`)**
   ```typescript
   import config from "./env";
   import { PrismaClient } from "@prisma/client";
   import { PrismaPg } from "@prisma/adapter-pg";

   const url = new URL(config.databaseUrl);
   const schema = url.searchParams.get("schema") || "public";

   const adapter = new PrismaPg(
     { connectionString: config.databaseUrl },
     { schema }
   );

   const prisma = new PrismaClient({ adapter });
   export default prisma;
   ```

---

## 3. Application Architecture Flow

```text
Client ──> routes ──> validateRequest ──> controllers ──> services ──> repositories ──> database (Prisma)
             │              │                  │             │              │
             │              │                  │             │              └── Direct Prisma queries (postRepo.ts)
             │              │                  │             └── Pure business logic & data transformations
             │              │                  └── HTTP responses & status codes (postController.ts)
             │              └── Early 400 rejection gatekeeper (validateRequest.ts)
             └── URL endpoint mapping (postRoutes.ts)
```

### Folder Responsibilities

```
src/
├── config/                     # 📁 Pure App Configuration
│   ├── env.ts                  # Centralized, Zod-validated environment variables
│   └── database.ts             # PrismaClient singleton with PostgreSQL adapter
│
├── openapi/                    # 📁 Dedicated OpenAPI / Swagger Module (In-Memory)
│   ├── registry.ts             # OpenAPIRegistry instance & Bearer security scheme
│   ├── routes.ts               # Strongly typed OpenAPI path registrations
│   └── swagger.ts              # In-memory OpenAPI generator & Swagger UI router
│
├── middleware/                 # 📁 HTTP Request Middlewares
│   ├── validateRequest.ts      # Generic Zod validation gatekeeper (rejects 400 early)
│   ├── authBearer.ts           # Timing-safe Bearer token guard + Express Request type augmentation
│   ├── upload.ts               # Multer memory storage (500KB strict binary limit)
│   └── errorHandler.ts         # Global Express error handling middleware
│
├── schemas/                    # 📁 Single Source of Truth
│   └── postSchema.ts           # Zod schema + OpenAPI metadata + inferred TypeScript types
│
├── repositories/               # 📁 Data Access Layer
│   └── postRepo.ts             # Direct Prisma queries (Post where, findMany, etc.)
│
├── services/                   # 📁 Business Logic Layer
│   └── postService.ts          # Pure business logic (Buffer -> Uint8Array -> Postgres)
│
├── controllers/                # 📁 HTTP Controller Layer
│   ├── rootController.ts       # Root (/) and health check (/health-check)
│   └── postController.ts       # REST CRUD handlers (pure orchestration, no validation boilerplate)
│
├── routes/                     # 📁 Express Routing Layer
│   ├── rootRoutes.ts           # Pure Express root routes
│   └── postRoutes.ts           # Pure Express blog post routes with validateRequest (/api/test/*)
│
├── scripts/                    # 📁 Utilities & Seed Scripts
│   └── seed/
│       └── secret-key.ts       # Secure 256-bit token generator
│
├── app.ts                      # Express application configuration & plugin mounting
└── server.ts                   # Process bootstrap entry point
```

| Folder / File | Role | Talks To |
| :--- | :--- | :--- |
| `src/server.ts` | Process entry point (boots `app.listen`) | `config/env.ts`, `src/app.ts` |
| `src/app.ts` | Wires Express, Swagger router, routes & error handling | `openapi/`, `routes/`, `middleware/` |
| `src/config/` | Validates `.env` and exports Prisma singleton | `.env`, PostgreSQL |
| `src/openapi/` | Registry, routes spec, and Swagger UI router (In-Memory) | `schemas/`, `app.ts` |
| `src/middleware/` | Validation (`validateRequest`), Auth (`authBearer`), Uploads (`upload`) | `schemas/`, `config/env.ts` |
| `src/schemas/` | Single Source of Truth: Zod schemas + OpenAPI metadata | `openapi/`, `middleware/`, `services/` |
| `src/routes/` | Maps URLs to middleware and controllers | `middleware/`, `controllers/` |
| `src/controllers/` | Reads `req`, calls service, sends JSON response | `services/` |
| `src/services/` | Business rules & data conversions (`Buffer` -> `Uint8Array`) | `repositories/` |
| `src/repositories/` | Direct Prisma queries (`prisma.post.*`) | `config/database.ts` |

---

## 4. Key Advanced Features & Best Practices

### A. In-Memory OpenAPI (`@asteasolutions/zod-to-openapi`)
Unlike legacy `swagger-autogen` which writes a 30KB `swagger-output.json` file to your hard drive on every restart:
- **100% In-Memory:** The OpenAPI 3.0 specification is generated dynamically in computer RAM.
- **Zero Disk I/O:** Runs seamlessly in read-only containers (Docker, Kubernetes, AWS Lambda).
- **Single Source of Truth:** Your Zod schema (`postSchema.ts`) defines runtime validation, TypeScript compile-time types (`z.infer`), and Swagger documentation simultaneously.
- **Instant Hot-Reload:** Changing a field in Zod immediately updates Swagger UI without needing any pre-build commands.

### B. Validation Gatekeeper Middleware (`validateRequest.ts`)
Controllers should never receive malformed data. The generic `validateRequest` middleware parses incoming request bodies before the controller runs:
```typescript
postRoutes.post("/body/raw/create-posts", validateRequest(postSchema), createPosts);
```
- Rejects invalid requests with structured `400 Bad Request` messages automatically.
- Sanitizes and coerces fields, assigning the clean output back to `req.body`.
- Eliminates repetitive `if (!parse.success)` checks from controllers.

### C. Strict Binary File Uploads to PostgreSQL (`Uint8Array`)
- Configured with `multer.memoryStorage()` and a strict **500 KB** limit.
- TypeScript strictly enforces Prisma 7's binary requirement: Node's `file.buffer` is cleanly converted to `new Uint8Array(file.buffer)` before insertion into PostgreSQL `BYTEA`.
- Raw binary bytes are omitted from list and detail responses (`omit: { file_data: true }`) for performance, and served via dedicated streaming endpoint `GET /api/test/get-posts/:id/file`.

### D. Express Global Type Augmentation (`authBearer.ts`)
TypeScript prevents assigning arbitrary properties to `req`. We safely extend Express's global Request interface:
```typescript
declare global {
  namespace Express {
    interface Request {
      auth?: { scheme: string; authenticated: boolean };
    }
  }
}
```
Uses `crypto.timingSafeEqual` to prevent timing-attack vulnerabilities when validating Bearer tokens.

---

## 5. API Endpoints

### Root & Health Check (`Root`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Root welcome message |
| `GET` | `/health-check` | Server health check (`OK ✅`) |

### Test API Practice (Blog Posts)
| Method | Endpoint | Parameter / Body Type | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/test/get-posts` | None | Retrieve all posts ordered by newest first |
| `GET` | `/api/test/query-parameters/get-posts` | **Query Params** (`?search=...&published=...`) | Search by keyword across title/content/author & filter status |
| `GET` | `/api/test/path-variables/get-posts/:id` | **Path Variable** (`:id`) | Retrieve a single post by ID |
| `GET` | `/api/test/get-posts/:id/file` | **Path Variable** (`:id`) | Download or view binary file stored in PostgreSQL |
| `POST` | `/api/test/body/raw/create-posts` | **JSON Body** (`postSchema`) | Create a new post with validation |
| `POST` | `/api/test/body/form/create-posts` | **Form Data** (`multipart/form-data`) | Create a new post using form data |
| `POST` | `/api/test/body/urlencoded/create-posts` | **URL-Encoded** (`x-www-form-urlencoded`) | Create a new post using URL-encoded form data |
| `POST` | `/api/test/body/multipart/create-posts` | **Multipart + File** (Max 500KB) | Create post with attachment saved as binary in PostgreSQL |
| `PUT` | `/api/test/update-posts/:id` | **Path Variable** & **JSON Body** | Replace an entire post by ID |
| `PATCH` | `/api/test/patch-posts/:id` | **Path Variable** & **JSON Body** | Partially update selected fields of a post by ID |
| `DELETE` | `/api/test/delete-posts/:id` | **Path Variable** (`:id`) | Delete a post by ID |
| `HEAD` | `/api/test/head-posts` | None | Check metadata & total posts count (`X-Total-Posts`, no body) |
| `OPTIONS` | `/api/test/options-posts` | None | Check allowed HTTP methods (`Allow` header) |
| `GET` | `/api/test/auth/bearer` | **Bearer Token** (`Authorization` header) | Verify Bearer token authentication |
| `POST` | `/api/test/auth/bearer/create-posts` | **Bearer Token** & **JSON Body** | Create a protected post |

---

## 6. 🔄 Progression Comparison: CJS vs ESM vs TypeScript

| Feature | CommonJS (`learn-cjs-expressjs`) | ES Modules (`learn-esm-expressjs`) | TypeScript (`learn-ts-expressjs`) |
| :--- | :--- | :--- | :--- |
| **Imports** | `const express = require('express')` | `import express from 'express'` | `import express, { Request, Response } from 'express'` |
| **Local File Imports** | `require('./app')` | `import app from './app.js'` *(mandatory `.js`)* | `import app from './app'` *(clean, no extension)* |
| **Type Safety** | None (Dynamic JS) | None (Dynamic JS) | Full compile-time static type checking |
| **Validation Gatekeeper** | Manual inside Controller | Manual inside Controller | **`validateRequest` Middleware** (Early 400 rejection) |
| **OpenAPI Docs** | `swagger-autogen` + comment blocks | `swagger-autogen` + comment blocks | `@asteasolutions/zod-to-openapi` (In-Memory) |
| **Disk Storage** | Writes `swagger-output.json` | Writes `swagger-output.json` | **Zero files on disk** (Generated dynamically in RAM) |
| **Dev Runner** | `nodemon src/server.js` | `nodemon src/server.js` | `tsx watch src/server.ts` |
| **Build Step** | None needed | None needed | `npm run build` (`tsc` -> `dist/`) |
| **Default Port** | `3005` | `3006` | `3007` |

---

## 📌 Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `tsx watch src/server.ts` | Runs development server with instant hot-reload |
| `npm run build` | `tsc` | Compiles TypeScript source to `./dist` for production |
| `npm start` | `node dist/server.js` | Runs compiled production server with zero compiler overhead |
| `npm run secret:generate` | `tsx src/scripts/seed/secret-key.ts` | Generates 256-bit cryptographically secure token for `.env` |
