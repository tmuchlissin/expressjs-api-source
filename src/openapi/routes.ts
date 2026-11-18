import { z } from "zod";
import { registry, bearerAuth } from "./registry";
import { postSchema, updateSchema } from "../schemas/postSchema";

const ROOT_TAG = "Root";
const BLOG_TAG = "Test API Practice (Blog Posts)";

// -------------------------------------------------------------
// Root Routes
// -------------------------------------------------------------
registry.registerPath({
  method: "get",
  path: "/",
  tags: [ROOT_TAG],
  summary: "Welcome root endpoint",
  responses: {
    200: {
      description: "Welcome message",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/health-check",
  tags: [ROOT_TAG],
  summary: "Application health check",
  responses: {
    200: {
      description: "Health status OK",
    },
  },
});

// -------------------------------------------------------------
// Blog Posts Routes
// -------------------------------------------------------------
registry.registerPath({
  method: "get",
  path: "/api/test/get-posts",
  tags: [BLOG_TAG],
  summary: "Get all posts without filter",
  responses: {
    200: {
      description: "List of posts ordered by newest first",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/test/path-variables/get-posts/{id}",
  tags: [BLOG_TAG],
  summary: "Get single post by ID",
  request: {
    params: z.object({
      id: z.coerce.number().openapi({ example: 1, description: "Numeric post ID" }),
    }),
  },
  responses: {
    200: { description: "Post detail found" },
    404: { description: "Post not found" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/test/query-parameters/get-posts",
  tags: [BLOG_TAG],
  summary: "Search and filter posts by query parameters",
  request: {
    query: z.object({
      search: z.string().optional().openapi({ description: "Search keyword across title, content, or author" }),
      published: z.enum(["true", "false"]).optional().openapi({ description: "Filter by published status (true/false)" }),
    }),
  },
  responses: {
    200: { description: "Filtered list of posts" },
  },
});

registry.registerPath({
  method: "put",
  path: "/api/test/update-posts/{id}",
  tags: [BLOG_TAG],
  summary: "Update entire post by ID",
  request: {
    params: z.object({
      id: z.coerce.number().openapi({ example: 1 }),
    }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: postSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Post updated successfully" },
    400: { description: "Validation error" },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/test/patch-posts/{id}",
  tags: [BLOG_TAG],
  summary: "Partially update post by ID",
  request: {
    params: z.object({
      id: z.coerce.number().openapi({ example: 1 }),
    }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: updateSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Post partially updated" },
    400: { description: "Validation error" },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/test/delete-posts/{id}",
  tags: [BLOG_TAG],
  summary: "Delete post by ID",
  request: {
    params: z.object({
      id: z.coerce.number().openapi({ example: 1 }),
    }),
  },
  responses: {
    200: { description: "Post deleted successfully" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/test/body/raw/create-posts",
  tags: [BLOG_TAG],
  summary: "Create a new post",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: postSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Post created successfully" },
    400: { description: "Validation error" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/test/body/form/create-posts",
  tags: [BLOG_TAG],
  summary: "Create a new post (Form Data)",
  request: {
    body: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: postSchema,
        },
        "application/x-www-form-urlencoded": {
          schema: postSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Post created successfully" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/test/body/urlencoded/create-posts",
  tags: [BLOG_TAG],
  summary: "Create a new post (Urlencoded)",
  request: {
    body: {
      required: true,
      content: {
        "application/x-www-form-urlencoded": {
          schema: postSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Post created successfully" },
  },
});

const multipartSchema = postSchema.extend({
  file: z.string().optional().openapi({
    type: "string",
    format: "binary",
    description: "Optional attachment file (max 500KB)",
  }),
});

registry.registerPath({
  method: "post",
  path: "/api/test/body/multipart/create-posts",
  tags: [BLOG_TAG],
  summary: "Create a new post (Multipart + DB Binary, Max 500KB)",
  request: {
    body: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: multipartSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Post created with file uploaded to PostgreSQL" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/test/get-posts/{id}/file",
  tags: [BLOG_TAG],
  summary: "Download or view post file stored in PostgreSQL",
  request: {
    params: z.object({
      id: z.coerce.number().openapi({ example: 1 }),
    }),
  },
  responses: {
    200: {
      description: "File binary stream (image/png, image/jpeg, application/pdf)",
      content: {
        "application/octet-stream": {
          schema: z.string().openapi({ format: "binary" }),
        },
      },
    },
    404: { description: "File not found" },
  },
});

registry.registerPath({
  method: "head",
  path: "/api/test/head-posts",
  tags: [BLOG_TAG],
  summary: "HEAD: Check posts headers & total count (no body)",
  responses: {
    200: {
      description: "Headers returned with X-Total-Posts",
      headers: {
        "X-Total-Posts": {
          schema: { type: "string", example: "42" },
          description: "Total number of posts in database",
        },
      },
    },
  },
});

registry.registerPath({
  method: "options",
  path: "/api/test/options-posts",
  tags: [BLOG_TAG],
  summary: "OPTIONS: Check allowed HTTP methods",
  responses: {
    204: {
      description: "Allowed HTTP methods in Allow header",
      headers: {
        Allow: {
          schema: { type: "string", example: "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS" },
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/test/auth/bearer",
  tags: [BLOG_TAG],
  summary: "Authenticate With Bearer Token",
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    200: { description: "Bearer token verified" },
    401: { description: "Unauthorized" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/test/auth/bearer/create-posts",
  tags: [BLOG_TAG],
  summary: "Create a new post with Bearer Token",
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: postSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Protected post created" },
    401: { description: "Unauthorized" },
  },
});

