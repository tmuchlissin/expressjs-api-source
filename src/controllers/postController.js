// Controller layer: handles HTTP requests, input validation (Zod), and responses.
import * as postService from "../services/postService.js";
import { postSchema, updateSchema } from "../schemas/postSchema.js";

const parsePostId = (rawId, res) => {
  const postId = Number.parseInt(rawId, 10);
  if (Number.isNaN(postId)) {
    res.status(400).json({
      success: false,
      message: "Invalid post ID",
      data: null,
    });
    return null;
  }
  return postId;
};

// GET all posts ordered by newest first (omits raw binary file_data from JSON)
const getPosts = async (req, res) => {
  try {
    const posts = await postService.getAllPosts();

    return res.json({
      success: true,
      message: "Get data posts success",
      data: posts,
    });
  } catch (error) {
    console.error("Error retrieving posts:", error);

    return res.status(500).json({
      success: false,
      message: "Get data posts failed",
      data: null,
    });
  }
};

// GET posts filtered by query params (?search=...&published=true|false)
const searchPosts = async (req, res) => {
  try {
    const posts = await postService.searchPosts(req.query);

    return res.json({
      success: true,
      message: "Search data posts success",
      data: posts,
    });
  } catch (error) {
    console.error("Error searching posts:", error);

    return res.status(500).json({
      success: false,
      message: "Search data posts failed",
      data: null,
    });
  }
};

// GET single post by numeric path param (:id)
const getPostById = async (req, res) => {
  try {
    const postId = parsePostId(req.params.id, res);
    if (postId === null) return;

    const post = await postService.getPostById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
        data: null,
      });
    }

    return res.json({
      success: true,
      message: "Get post detail success",
      data: post,
    });
  } catch (error) {
    console.error("Error retrieving post by ID:", error);

    return res.status(500).json({
      success: false,
      message: "Get post detail failed",
      data: null,
    });
  }
};

// POST create a new post (validates body with Zod; saves optional uploaded file buffer to PostgreSQL)
const createPosts = async (req, res) => {
  try {
    const parse = postSchema.safeParse(req.body);

    if (!parse.success) {
      const errorMessages = parse.error.issues.map((err) => `${err.path[0]} -> ${err.message}`);

      return res.status(400).json({
        success: false,
        message: errorMessages,
        data: null,
      });
    }

    const post = await postService.createPost(parse.data, req.file);

    return res.json({
      success: true,
      message: "Create data posts success",
      data: post,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Create data posts failed",
      data: null,
    });
  }
};

// PUT replace an entire post by ID (requires all fields in postSchema)
const updatePosts = async (req, res) => {
  try {
    const postId = parsePostId(req.params.id, res);
    if (postId === null) return;

    const parse = postSchema.safeParse(req.body);

    if (!parse.success) {
      const errorMessages = parse.error.issues.map((err) => `${err.path[0]} -> ${err.message}`);

      return res.status(400).json({
        success: false,
        message: errorMessages,
        data: null,
      });
    }

    const post = await postService.updatePost(postId, parse.data);

    return res.json({
      success: true,
      message: "Update (put) data posts success",
      data: post,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Update (put) data posts failed",
      data: null,
    });
  }
};

// PATCH partially update a post by ID (all fields optional via updateSchema)
const patchPosts = async (req, res) => {
  try {
    const postId = parsePostId(req.params.id, res);
    if (postId === null) return;

    const parse = updateSchema.safeParse(req.body);

    if (!parse.success) {
      const errorMessages = parse.error.issues.map((err) => `${err.path[0]} -> ${err.message}`);

      return res.status(400).json({
        success: false,
        message: errorMessages,
        data: null,
      });
    }

    const post = await postService.updatePost(postId, parse.data);

    return res.json({
      success: true,
      message: "Update (patch) data posts success",
      data: post,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Update (patch) data posts failed",
      data: null,
    });
  }
};

// DELETE a post by ID
const deletePosts = async (req, res) => {
  try {
    const postId = parsePostId(req.params.id, res);
    if (postId === null) return;

    const post = await postService.deletePost(postId);

    return res.json({
      success: true,
      message: "Delete data posts success",
      data: post,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Delete data posts failed",
      data: null,
    });
  }
};

// HEAD: Returns only headers & status code (no body) — useful to check resource metadata/count
const headPosts = async (req, res) => {
  try {
    const totalPosts = await postService.getTotalPostsCount();
    res.set("X-Total-Posts", String(totalPosts));
    return res.status(200).end();
  } catch (error) {
    console.error("Error in HEAD posts:", error);
    return res.status(500).end();
  }
};

// OPTIONS: Returns allowed HTTP methods for this resource in the Allow header
const optionsPosts = (req, res) => {
  res.set("Allow", "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS");
  return res.status(204).end();
};

// GET file binary stored in PostgreSQL by post ID
const downloadPostFile = async (req, res) => {
  try {
    const postId = parsePostId(req.params.id, res);
    if (postId === null) return;

    const post = await postService.getPostFile(postId);

    if (!post || !post.file_data) {
      return res.status(404).json({
        success: false,
        message: "File not found for this post",
        data: null,
      });
    }

    res.setHeader("Content-Type", post.file_mime || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${post.file_name || "file"}"`);
    return res.send(Buffer.from(post.file_data));
  } catch (error) {
    console.error("Error downloading post file:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve file",
      data: null,
    });
  }
};

// GET /api/test/auth/bearer - Verify Bearer token authentication
const verifyBearer = (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Bearer token is valid",
    data: req.auth,
  });
};

export {
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
};

