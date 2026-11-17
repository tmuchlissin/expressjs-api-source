# Express.js REST API Starter (ES Modules + Prisma 7)

Notes and a practical guide for learning REST API built with Express.js (ES Modules), Prisma ORM 7, PostgreSQL, Zod validation, Morgan logger, and auto-generated Swagger documentation using **modern ECMAScript Modules (`import` / `export`)**.

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
   - API Server: [http://localhost:3006](http://localhost:3006)
   - Interactive Swagger Docs: [http://localhost:3006/api-docs](http://localhost:3006/api-docs)
   - OpenAPI JSON Spec: [http://localhost:3006/api-docs.json](http://localhost:3006/api-docs.json)

---

## 🛠️ Step-by-Step Setup Guide (Building From Scratch)

Follow this guide if you are rebuilding the project or learning how all the pieces fit together from zero.

### 1. Express.js & Dependencies Setup

1. **Initialize Node.js Project**
   ```bash
   npm init -y
   ```
2. **Enable ES Modules in `package.json`**
   Add `"type": "module"` to your `package.json` so Node treats `.js` files as ES Modules:
   ```json
   "type": "module"
   ```
3. **Install Core Dependencies**
   ```bash
   npm install express dotenv zod morgan multer swagger-ui-express swagger-autogen
   ```
   - `express`: Core web application framework
   - `dotenv`: Loads `.env` file variables into `process.env`
   - `zod`: Request body and environment variable schema validation
   - `morgan`: HTTP request logger
   - `multer`: Middleware for handling `multipart/form-data` and file uploads
   - `swagger-ui-express` & `swagger-autogen`: Interactive API documentation generated automatically from routes
4. **Install Nodemon (Development Tool)**
   ```bash
   npm install -D nodemon
   ```
5. **Configure Scripts in `package.json`**
   ```json
   "main": "src/server.js",
   "scripts": {
     "start": "node src/server.js",
     "dev": "nodemon --ignore src/docs/swagger-output.json --exec \"node src/config/swagger.js && node src/server.js\"",
     "swagger": "node src/config/swagger.js"
   }
   ```

---

### 2. Prisma ORM 7 Setup (PostgreSQL)

1. **Install Prisma CLI, Client & PostgreSQL Adapter**
   ```bash
   npm install prisma@^7.10.1 @prisma/client@^7.10.1 @prisma/adapter-pg pg
   ```
   > 💡 Pinning `^7.10.1` avoids accidentally pulling an unstable release candidate (e.g. `8.0.0-rc`) when running `npx prisma`.
2. **Initialize Prisma Configuration**
   ```bash
   npx prisma init --datasource-provider postgresql
   ```
   > 💡 `prisma init` generates `prisma7.config.ts` by default. In an ESM project, you can keep `.ts` (Prisma CLI runs it directly) or use `prisma.config.js` with `import` / `export default`. `prisma/migrations/` appears later when you run your first `npx prisma migrate dev`.
3. **Configure Environment Variables in `.env`**
   ```env
   NODE_ENV=development
   PORT=3006
   DATABASE_URL="postgresql://user:password@localhost:5432/dev_playground?schema=express_esm"
   BEARER_TOKEN="your-secret-token"
   ```
   > 💡 **PostgreSQL Schema Isolation:** Instead of creating a brand-new database for every test project, you can use a single database (e.g. `dev_playground`) and isolate projects using schemas via `?schema=<schema_name>` (e.g. `express_cjs`, `express_esm`, `express_ts`, `fastapi_api`). Prisma will automatically create the schema if it does not exist during migrations.
4. **Configure `prisma.config.js` (Prisma 7 Standard with ESM)**
   ```javascript
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
   Create your database models (e.g., `Post` with binary file storage):
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
6. **Run Database Migration (Create Tables)**
   ```bash
   npx prisma migrate dev --name init
   ```
   > 💡 **PostgreSQL 15+ Permission Fix:** If you get `ERROR: permission denied for schema public`, grant ownership and schema privileges as `postgres`:
   > ```bash
   > sudo -u postgres psql -d <db_name> -c "ALTER DATABASE <db_name> OWNER TO <db_user>; GRANT ALL ON SCHEMA public TO <db_user>; ALTER USER <db_user> CREATEDB;"
   > ```
7. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```
   **When to run `npx prisma generate`:**
   - **After editing `prisma/schema.prisma`** (adding, renaming, or removing models/fields; note `npx prisma migrate dev` runs `generate` automatically, while `db push` or manual schema edits may need it explicitly).
   - **After `npm install` or `npm ci`** (installing packages can reset `node_modules/@prisma/client` back to the ungenerated default unless `"postinstall": "prisma generate"` is in `package.json`).
   - **After cloning the repo or switching Git branches** where `prisma/schema.prisma` changed.
   - > 💡 Always **restart your server** (`npm run dev`) after running `npx prisma generate` so Node reloads the updated `@prisma/client`.
8. **Configure Prisma Client with Driver Adapter (`src/config/database.js`)**
   In Prisma 7, the PostgreSQL driver adapter (`@prisma/adapter-pg`) is used to manage database connections.
   ```javascript
   // src/config/database.js
   import config from "./env.js";
   import { PrismaClient } from "@prisma/client";
   import { PrismaPg } from "@prisma/adapter-pg";

   // Extract schema from DATABASE_URL (default to "public" if omitted)
   const url = new URL(config.databaseUrl);
   const schema = url.searchParams.get("schema") || "public";

   const adapter = new PrismaPg(
     {
       connectionString: config.databaseUrl,
     },
     { schema } // 👈 Required: informs driver adapter which schema to query
   );

   const prisma = new PrismaClient({ adapter });

   export default prisma;
   ```
   > ⚠️ **Important (`@prisma/adapter-pg` Schema Warning):** Unlike standard Prisma, `@prisma/adapter-pg` does not automatically infer the `?schema=...` parameter from the URL string. You **must** pass `{ schema }` in the second argument of `new PrismaPg(...)`, otherwise Prisma defaults queries to `public.<table_name>` and fails with `P2021: TableDoesNotExist`.

#### Prisma Migration Cheat Sheet (Columns & Tables)

Whenever you change `prisma/schema.prisma`, run `npx prisma migrate dev --name <migration_name>` to apply changes to PostgreSQL:

| Operation | What to do in `schema.prisma` | Migration Command |
| :--- | :--- | :--- |
| **Add a Column** | Add the field (use `?` or `@default(...)` if table already has data):<br>`file_name String? @db.VarChar(255)` | `npx prisma migrate dev --name add_file_to_posts` |
| **Rename a Column** *(Safe, preserves data)* | Use `--create-only`, then edit the generated SQL to `ALTER TABLE "posts" RENAME COLUMN "old" TO "new";` | `npx prisma migrate dev --create-only --name rename_col`<br>then `npx prisma migrate dev` |
| **Rename a Column** *(JS/Prisma only, DB unchanged)* | Keep the DB column name with `@map`:<br>`authorName String @map("author_name")` | No migration needed—just run `npx prisma generate` |
| **Drop a Column** | Delete the field from the `model` | `npx prisma migrate dev --name drop_file_from_posts` |
| **Create a New Table** | Add a new `model User { ... @@map("users") }` block | `npx prisma migrate dev --name create_users_table` |
| **Rename a Table** *(Safe, preserves data)* | Use `--create-only`, then edit SQL to `ALTER TABLE "old" RENAME TO "new";` (or use `@@map("new_name")` if only renaming in Prisma) | `npx prisma migrate dev --create-only --name rename_table`<br>then `npx prisma migrate dev` |
| **Drop a Table** | Delete the entire `model` block from `schema.prisma` | `npx prisma migrate dev --name drop_users_table` |

> ⚠️ **Important:** If you rename a column or table directly without `--create-only`, Prisma sees it as "drop old + create new" and **will delete existing data** in that column/table! Using `--create-only` lets you change the SQL to `RENAME` safely.
>
> **Useful Utility Commands:**
> - Check migration status: `npx prisma migrate status`
> - Reset database & re-run all migrations (dev only!): `npx prisma migrate reset`

---

## 3. Application Architecture Flow

```text
Client ──> routes ──> middleware ──> controllers ──> services ──> repositories ──> database (Prisma)
             │            │               │             │              │
             │            │               │             │              └── Direct Prisma queries (postRepo.js)
             │            │               │             └── Business logic & filters (postService.js)
             │            │               └── Validation (Zod) & HTTP responses (postController.js)
             │            └── Auth (authBearer), file upload (Multer) & error handling
             └── URL endpoint mapping & HTTP methods
```

- **Entry Points (`src/app.js` & `src/server.js`)**: `app.js` configures Express (middlewares, Swagger UI, routes, error handler) and exports `app`; `server.js` loads `config/env.js` and starts `app.listen()`.
- **Config (`src/config/`)**: Centralized environment variables (`env.js`), Prisma PostgreSQL connection (`database.js`), and Swagger config (`swagger.js`).
- **Docs (`src/docs/`)**: Auto-generated OpenAPI specification (`swagger-output.json`).
- **Routes (`src/routes/`)**: Maps URL endpoints (e.g., `/api/test/get-posts`, `/api/test/body/raw/create-posts`) to middleware and controllers.
- **Middleware (`src/middleware/`)**: Request/error interceptors such as Bearer token verification (`authBearer.js`), Multer file uploads (`upload.js`), and global error handling (`errorHandler.js`).
- **Controllers (`src/controllers/`)**: Handles `req` (request) and `res` (response), HTTP status codes (`200`, `204`, `400`, `401`, `404`, `500`), and Zod validation.
- **Services (`src/services/`)**: Business logic layer (`postService.js`) that builds query filters, prepares upload payloads, and coordinates repository calls without touching `req`/`res`.
- **Repositories (`src/repositories/`)**: Data access layer (`postRepo.js`) that encapsulates all direct `prisma.post` database queries.
- **Schemas (`src/schemas/`)**: Zod validation schemas (`postSchema.js`).
- **Scripts (`src/scripts/`)**: Utility scripts such as the Bearer secret key generator (`src/scripts/seed/secret-key.js`).

### What Each Folder Owns (One-Sentence Summary)

| Folder / File | Role | Talks To |
| :--- | :--- | :--- |
| `src/server.js` | Boots the HTTP server | `config/env.js`, `app.js` |
| `src/app.js` | Wires Express, Swagger, routes & `errorHandler` | `routes/`, `middleware/`, `docs/` |
| `src/config/` | Validates `.env` (`env.js`), connects Prisma (`database.js`), configures Swagger (`swagger.js`) | `.env`, PostgreSQL, `docs/` |
| `src/docs/` | Generated OpenAPI JSON (`swagger-output.json`) | `app.js` |
| `src/routes/` | Maps URLs & attaches route middleware | `middleware/`, `controllers/` |
| `src/middleware/` | Auth (`authBearer.js`), file uploads (`upload.js`), errors (`errorHandler.js`) | `config/env.js` |
| `src/schemas/` | Zod validation rules (`postSchema.js`) | `controllers/` |
| `src/controllers/` | Parses `req`, validates with Zod, sends `res` | `schemas/`, `services/` |
| `src/services/` | Business logic (filters, file prep), no `req`/`res` | `repositories/` |
| `src/repositories/` | Pure Prisma database queries (`postRepo.js`) | `config/database.js` |
| `src/scripts/` | Standalone CLI utilities (`secret-key.js`) | Run manually via `node` |

> 💡 **Why separate `controllers/` -> `services/` -> `repositories/`?**
> - **Controllers** only handle HTTP (`req`/`res`, Zod validation, status codes).
> - **Services** hold pure business rules (no `req`/`res`, easy to reuse in cron/scripts and unit-test).
> - **Repositories** isolate Prisma queries (`prisma.post.*`), so DB details stay in one place and services can be tested without a live DB.
> - **Golden Rule:** Dependencies flow **downward only** (`routes -> controllers -> services -> repositories -> database`).

---

## 4. Key Packages & Middleware Overview

### A. Zod (Schema & Input Validation)
Used in `src/schemas/postSchema.js` and `src/config/env.js` to validate incoming request bodies and environment variables (similar to Pydantic in Python/FastAPI):
- Full schema for creating/replacing data: `postSchema`
- Partial schema for `PATCH` requests: `updateSchema = postSchema.partial()`
- Fails fast on startup if environment variables in `.env` are missing or invalid.

### B. Morgan (UTC+7 HTTP Request Logger)
Configured in `src/app.js` to log every incoming HTTP request to the terminal with a WIB (UTC+7) timestamp:
- Placed before body parsers to ensure even malformed requests are logged.

### C. Swagger UI & Swagger-Autogen (API Documentation)
Configured via `src/config/swagger.js` to automatically generate OpenAPI documentation into `src/docs/swagger-output.json` without writing lengthy YAML manually:
- Interactive Docs UI: [http://localhost:3006/api-docs](http://localhost:3006/api-docs)
- Raw OpenAPI JSON Spec: [http://localhost:3006/api-docs.json](http://localhost:3006/api-docs.json)

**Swagger `servers` & Production Security:**
- **`url: "/"` (Current Server):** Works automatically whenever Swagger UI and the API live on the same Express server (Local, Staging, etc.).
- **Multiple `servers` (Local / Staging / Production):** Useful when exporting `swagger-output.json` to Postman or when `/api-docs` is disabled in Production for security (`if (process.env.NODE_ENV !== "production")`), letting your local Swagger UI target Production directly.
- **CORS Note:** Calling a remote server from `http://localhost:3006/api-docs` is a cross-origin browser request, so the target server must allow that origin in its CORS config (desktop tools like Postman/curl are not affected by browser CORS).

### D. Multer, Form Data & File Upload (`multipart/form-data` & `x-www-form-urlencoded`)
Express's built-in `express.json()` only parses JSON bodies. Multer handles multi-part form data and file uploads:
- **`express.urlencoded({ extended: true })`**: Built-in Express middleware in `src/app.js` for `application/x-www-form-urlencoded`.
- **`multer` (`upload.none()`)**: Used on text-only form-data routes (`/api/test/body/form/create-posts`) to parse `multipart/form-data` fields into `req.body`.
- **`multer` (`upload.single("file")`)**: Configured in `src/middleware/upload.js` with `multer.memoryStorage()` and a strict **500 KB** limit (`500 * 1024`). Uploaded bytes (`file_data`), `file_name`, and `file_mime` are stored in PostgreSQL (`Bytes?`), omitted from JSON list/detail responses via `omit: { file_data: true }`, and served via `GET /api/test/get-posts/:id/file`. Exceeding 500 KB is caught by `src/middleware/errorHandler.js` (`400`).
- **Boolean Handling in Zod:** Form data sends all values as strings (e.g., `"false"`). `src/schemas/postSchema.js` converts `"true"`/`"false"` strings to real booleans before saving to Prisma.

### E. Bearer Token Authentication & Secret Key Generator
Protected routes use `src/middleware/authBearer.js` to verify `Authorization: Bearer <token>` against `config.bearerToken` (from `.env` via `src/config/env.js`) using `crypto.timingSafeEqual`.
- **Generate a strong secret key:**
  ```bash
  node src/scripts/seed/secret-key.js
  ```
  *(Optional: pass a custom byte length, e.g. `node src/scripts/seed/secret-key.js 64`; defaults to `32` bytes / 256-bit.)*
- Copy the generated `BEARER_TOKEN=...` output into your `.env` file and restart the server.
- In Swagger UI (`/api-docs`), click **Authorize**, paste the token value (without typing `Bearer `), and test the locked endpoints.

---

## 5. API Endpoints

### Root & Health Check (`Root`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Root welcome endpoint |
| `GET` | `/health-check` | Server health check (`OK ✅`) |

### Test API Practice (Blog Posts)
| Method | Endpoint | Parameter Type | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/test/get-posts` | - | Retrieve all posts |
| `GET` | `/api/test/query-parameters/get-posts` | **Query Parameter** (`?search=...&published=...`) | Search by keyword (title/content/author) & filter by status |
| `GET` | `/api/test/path-variables/get-posts/:id` | **Path Variable** (`:id`) | Retrieve a single post by ID |
| `GET` | `/api/test/get-posts/:id/file` | **Path Variable** (`:id`) | Download or view post file stored in PostgreSQL |
| `POST` | `/api/test/body/raw/create-posts` | **Request Body** (`application/json`) | Create a new post with Zod validation |
| `POST` | `/api/test/body/form/create-posts` | **Form Data** (`multipart/form-data` / `x-www-form-urlencoded`) | Create a new post using form data |
| `POST` | `/api/test/body/urlencoded/create-posts` | **Form Data** (`x-www-form-urlencoded`) | Create a new post using URL-encoded form data |
| `POST` | `/api/test/body/multipart/create-posts` | **Multipart + File** (`multipart/form-data`) | Create a new post with file upload (max 500KB in PostgreSQL) |
| `PUT` | `/api/test/update-posts/:id` | **Path Variable** & **Request Body** | Replace an entire post by ID |
| `PATCH` | `/api/test/patch-posts/:id` | **Path Variable** & **Request Body** | Partially update a post by ID |
| `DELETE` | `/api/test/delete-posts/:id` | **Path Variable** (`:id`) | Delete a post by ID |
| `HEAD` | `/api/test/head-posts` | - | Check posts headers & total count (`X-Total-Posts`, no body) |
| `OPTIONS` | `/api/test/options-posts` | - | Check allowed HTTP methods (`Allow` header) |
| `GET` | `/api/test/auth/bearer` | **Bearer Token** (`Authorization` header) | Verify Bearer token authentication |
| `POST` | `/api/test/auth/bearer/create-posts` | **Bearer Token** & **Request Body** (`application/json`) | Create a new post (protected by Bearer token) |

---

## 6. Understanding ES Modules (`ESM`) vs CommonJS (`CJS`)

This project uses **ECMAScript Modules (ESM)**. Here are the core differences to keep in mind when writing code:

### Key Rules of ESM in Node.js

1. **`"type": "module"` in `package.json`**  
   Tells Node.js to interpret all `.js` files as ES Modules.
2. **Mandatory File Extensions in Relative Imports**  
   In CommonJS, you could write `require("./app")`. In ESM, you **must include the extension**:
   ```javascript
   import app from "./app.js";
   import config from "./config/env.js";
   ```
3. **No `__dirname` or `__filename`**  
   ESM does not have global `__dirname`. Instead, use `import.meta.dirname` (Node.js 20.11+) or:
   ```javascript
   import path from "path";
   const currentDir = import.meta.dirname || path.dirname(new URL(import.meta.url).pathname);
   ```
4. **Syntax Comparison**

| Purpose | CommonJS (`CJS`) | ES Modules (`ESM`) |
| :--- | :--- | :--- |
| **Installed Package** | `const express = require("express");` | `import express from "express";` |
| **Default Export** | `module.exports = app;` | `export default app;` |
| **Default Import** | `const app = require("./app");` | `import app from "./app.js";` |
| **Named Exports** | `module.exports = { getPosts, createPosts };` | `export { getPosts, createPosts };` |
| **Named Imports** | `const { getPosts } = require("./postController");` | `import { getPosts } from "./postController.js";` |
| **Import Entire Module** | `const postService = require("./postService");` | `import * as postService from "./postService.js";` |
| **JSON Files** | `const data = require("./data.json");` | `JSON.parse(fs.readFileSync("./data.json", "utf-8"))` or `import data from "./data.json" with { type: "json" };` |

### Tradeoffs at a Glance

| Style | Pros | Cons |
| :--- | :--- | :--- |
| **ES Modules (`ESM`) — *This Project*** | Official modern JS standard, native in Node, top-level `await`, matches frontend/React ecosystem | Stricter `.js` extensions required in relative imports |
| **CommonJS (`CJS`)** | Zero config in older Node versions, relaxed file extensions | Legacy module system; cannot use top-level `await`; some modern packages are ESM-only |
| **TypeScript (`TS`)** | Type safety at compile time, best autocomplete with Prisma & Zod, enterprise standard | Requires build/compile step (`tsc`, `tsx`, or `ts-node`) and `tsconfig.json` |

