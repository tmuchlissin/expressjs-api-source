// Handles routing and maps HTTP requests to their corresponding controllers.
import express from "express";
import {
  getPosts,
  searchPosts,
  getPostById,
  createPosts,
  updatePosts,
  patchPosts,
  deletePosts,
  headPosts,
  optionsPosts,
  downloadPostFile,
  verifyBearer,
} from "../controllers/postController";
import upload from "../middleware/upload";
import authBearer from "../middleware/authBearer";
import validateRequest from "../middleware/validateRequest";
import { postSchema, updateSchema } from "../schemas/postSchema";

const router = express.Router();
const postRoutes = express.Router();

// GET all posts
postRoutes.get("/get-posts", getPosts);

// GET single post by ID using path variable (:id)
postRoutes.get("/path-variables/get-posts/:id", getPostById);

// GET posts filtered by query parameters (?search=...&published=true|false)
postRoutes.get("/query-parameters/get-posts", searchPosts);

// PUT replace an entire post by ID
postRoutes.put("/update-posts/:id", validateRequest(postSchema), updatePosts);

// PATCH partially update selected fields of a post by ID
postRoutes.patch("/patch-posts/:id", validateRequest(updateSchema), patchPosts);

// DELETE a post by ID
postRoutes.delete("/delete-posts/:id", deletePosts);

// POST create a new post using JSON body
postRoutes.post("/body/raw/create-posts", validateRequest(postSchema), createPosts);

// POST create a new post using form data (multipart/form-data or application/x-www-form-urlencoded)
postRoutes.post(
  "/body/form/create-posts",
  upload.none(),
  validateRequest(postSchema),
  createPosts
);

// POST create a new post using application/x-www-form-urlencoded
postRoutes.post(
  "/body/urlencoded/create-posts",
  validateRequest(postSchema),
  createPosts
);

// POST create a new post with multipart file upload (up to 500KB saved in PostgreSQL)
postRoutes.post(
  "/body/multipart/create-posts",
  upload.single("file"),
  validateRequest(postSchema),
  createPosts
);

// GET download or view file binary stored in PostgreSQL
postRoutes.get("/get-posts/:id/file", downloadPostFile);

// HEAD check headers & total posts count without body
postRoutes.head("/head-posts", headPosts);

// OPTIONS check allowed HTTP methods
postRoutes.options("/options-posts", optionsPosts);

// GET verify Bearer token authentication
postRoutes.get("/auth/bearer", authBearer, verifyBearer);

// POST create a new post protected by Bearer token
postRoutes.post(
  "/auth/bearer/create-posts",
  authBearer,
  validateRequest(postSchema),
  createPosts
);

// Apply the '/test' prefix inside this route module (combined with '/api' in app.ts -> '/api/test/...')
router.use("/test", postRoutes);

export default router;
