# Learn Express.js Basics

Notes and a practical guide for learning Express.js fundamentals with Prisma ORM (v7), PostgreSQL, Zod, Morgan, and Swagger (Swagger-Autogen).

---

## 1. Express.js & Dependencies Setup

1. **Initialize Node.js Project**
   ```bash
   npm init -y
   ```
2. **Install Express & Core Dependencies**
   ```bash
   npm install express dotenv zod morgan multer swagger-ui-express swagger-autogen
   ```
3. **Install Nodemon (Development Tool)**
   ```bash
   npm install -D nodemon
   ```
4. **Add Scripts in `package.json`**
   ```json
   "main": "src/server.js",
   "scripts": {
     "start": "node src/server.js",
     "dev": "nodemon --ignore src/docs/swagger-output.json --exec \"node src/config/swagger.js && node src/server.js\"",
     "swagger": "node src/config/swagger.js"
   }
   ```

---

## 2. Prisma ORM 7 Setup (PostgreSQL)

1. **Install Prisma CLI, Client & Driver Adapter**
   ```bash
   npm install prisma@^7.10.1 @prisma/client@^7.10.1 @prisma/adapter-pg pg
   ```
   > 💡 Pinning `^7.10.1` avoids accidentally pulling an unstable release candidate (e.g. `8.0.0-rc`) when running `npx prisma`.
2. **Initialize Prisma**
   ```bash
   npx prisma init --datasource-provider postgresql
   ```
   > 💡 `prisma init` generates `prisma.config.ts` by default (even in JS projects). You can keep `.ts` (Prisma CLI runs it directly) or rename/convert it to `prisma.config.js` for pure CommonJS. `prisma/migrations/` appears later when you run your first `npx prisma migrate dev`.
3. **Configure Environment Variables in `.env`**
   ```env
   NODE_ENV=development
   PORT=3005
   DATABASE_URL="postgresql://user:password@localhost:5432/db_name"
   BEARER_TOKEN="your-secret-token"
   ```
4. **Configure `prisma.config.js` (Prisma 7 Standard)**
   Migration URLs are configured through `prisma.config.js`:
   ```javascript
   require("dotenv").config();
   const { defineConfig } = require("prisma/config");

   module.exports = defineConfig({
     schema: "prisma/schema.prisma",
     migrations: {
       path: "prisma/migrations",
     },
     datasource: {
       url: process.env.DATABASE_URL,
     },
   });
   ```
5. **Define Models in `prisma/schema.prisma`**
   Create your database models (e.g., `Post`).
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
8. **Start the Development Server** *(after creating your `src/` files)*
   ```bash
   npm run dev
   ```

### Prisma Migration Cheat Sheet (Columns & Tables)

Whenever you change `prisma/schema.prisma`, run `npx prisma migrate dev --name <migration_name>` to apply changes to PostgreSQL:

| Operation | What to do in `schema.prisma` | Migration Command |
| :--- | :--- | :--- |
| **Add a Column** | Add the field (use `?` or `@default(...)` if table already has data):<br>`file String? @db.VarChar(255)` | `npx prisma migrate dev --name add_file_to_posts` |
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

## 4. Middleware & Additional Dependencies

### A. Zod (Schema & Input Validation)
Used to validate incoming request bodies before processing data in the database (similar to Pydantic in Python/FastAPI):
```bash
npm install zod
```
- Full schema for creating/replacing data: `postSchema`
- Partial schema for `PATCH` requests: `updateSchema = postSchema.partial()`

### B. Morgan (UTC+7 HTTP Request Logger)
Logs every incoming HTTP request to the terminal with a WIB (UTC+7) timestamp:
```bash
npm install morgan
```

### C. Swagger UI & Swagger-Autogen (API Documentation)
Automatically generates interactive API documentation without manually writing lengthy YAML comments:
```bash
npm install swagger-ui-express swagger-autogen
```
- Interactive Docs UI: [http://localhost:3005/api-docs](http://localhost:3005/api-docs)
- Raw OpenAPI JSON Spec: [http://localhost:3005/api-docs.json](http://localhost:3005/api-docs.json)

**Swagger `servers` & Production Security:**
- **`url: "/"` (Current Server):** Works automatically whenever Swagger UI and the API live on the same Express server (Local, Staging, etc.).
- **Multiple `servers` (Local / Staging / Production):** Useful when exporting `swagger-output.json` to Postman or when `/api-docs` is disabled in Production for security (`if (process.env.NODE_ENV !== "production")`), letting your local Swagger UI target Production directly.
- **CORS Note:** Calling a remote server from `http://localhost:3005/api-docs` is a cross-origin browser request, so the target server must allow that origin in its CORS config (desktop tools like Postman/curl are not affected by browser CORS).

> **Alternative Approaches (For Knowledge Reference):**
>
> - **`swagger-jsdoc` (JSDoc / YAML Comments):** The traditional Express standard where you write OpenAPI YAML inside `/** @openapi ... */` comments above each route (or in separate `src/docs/*.yaml` files). It gives 100% manual control over every schema and response, though it is more verbose.
>   ```bash
>   npm install swagger-ui-express swagger-jsdoc
>   ```
> - **`zod-to-openapi` (`@asteasolutions/zod-to-openapi`):** Generates OpenAPI schemas directly from Zod schemas so validation and docs share a single source of truth (similar to FastAPI + Pydantic, best paired with TypeScript or modern frameworks like Hono/Fastify).
> - **Postman / Apidog Collections:** Many Express teams skip in-code Swagger entirely and share exported Postman/Apidog collections instead.

### D. Multer, Form Data & File Upload (`multipart/form-data` & `x-www-form-urlencoded`)
Express's built-in `express.json()` only parses JSON bodies. To support HTML forms, `multipart/form-data`, and file uploads:
```bash
npm install multer
```
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

## 6. Module & Language Styles (CommonJS vs ESM vs TypeScript)

In Node.js/Express projects, there are 3 main module/language styles you will see:

1. **CommonJS (`CJS`) — *Used in this project***
   - Node's classic default (`.js` files when `"type": "module"` is **not** in `package.json`).
   - Imports with `require(...)` and exports with `module.exports = ...`.
   - Example (`prisma.config.js`):
     ```js
     const { defineConfig } = require("prisma/config");
     module.exports = defineConfig({ ... });
     ```

2. **ES Modules (`ESM`) — *Modern JavaScript standard***
   - Enabled by adding `"type": "module"` in `package.json` (or using `.mjs` files).
   - Imports with `import ... from "..."` and exports with `export default ...` / `export const ...`:
     ```js
     import { defineConfig } from "prisma/config";
     export default defineConfig({ ... });
     ```

3. **TypeScript (`TS`) — *Typed JavaScript (Industry Standard)***
   - Uses `.ts` files (like `prisma.config.ts` that `npx prisma init` generates by default) and `import` / `export` syntax.
   - Adds static type checking (`string`, `number`, `interface`) and must be compiled or run with a TS runner (`tsc`, `tsx`, or `ts-node`).

> 💡 **Rule of thumb:** Stick to one style per project (`CJS` is consistent across all files in `src/`).

### Tradeoffs at a Glance

| Style | Pros | Cons |
| :--- | :--- | :--- |
| **CommonJS (`CJS`)** | Zero config, runs directly in Node, simple to learn | No static type checking; some newer npm packages are ESM-only |
| **ES Modules (`ESM`)** | Official modern JS standard, native in Node, top-level `await` | No static type checking; stricter `.js` extensions in relative imports |
| **TypeScript (`TS`)** | Catches bugs before running, best autocomplete (Prisma/Zod), industry standard | Extra setup (`tsconfig.json`) and compile/build step |

---

## 7. Export & Import Guide (Python Comparison)

### A. `module.exports` & `require()` vs Python
In Node.js (CommonJS), everything inside a `.js` file is **private** unless exported with `module.exports`:

| Purpose | Python | Node.js (CommonJS) |
| :--- | :--- | :--- |
| **Installed package** | `import express` | `const express = require("express");` |
| **Single/default export** | `from config import database` | `module.exports = prisma;`<br>`const prisma = require("../config/database");` |
| **Named exports (pick with `{ }`)** | `from schemas.postSchema import postSchema, updateSchema` | `module.exports = { postSchema, updateSchema };`<br>`const { postSchema, updateSchema } = require("../schemas/postSchema");` |
| **Single named item from a library object** | `from zod import z` | `const { z } = require("zod");` |

- **`require(...)`** is the actual import call; **`const`** simply stores the returned value in a constant variable.
- Use **`{ ... }`** when picking named properties out of an exported object (even if you only pick 1, like `{ z }`). Omit `{ ... }` when the file exports a single item directly (`module.exports = prisma`).
- Paths starting with `./` or `../` load your local files; names without them (like `"express"`, `"zod"`, `"crypto"`) load `node_modules/` or built-in Node modules.

