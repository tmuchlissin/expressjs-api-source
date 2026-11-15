// Handles routing and maps HTTP requests to their corresponding controllers.
const express = require("express");
const {
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
} = require("../controllers/postController");
const upload = require("../middleware/upload"); // Multer memoryStorage configuration for file uploads
const authBearer = require("../middleware/authBearer");
const router = express.Router();
const postRoutes = express.Router();


// GET API Route to retrieve all posts data from database
postRoutes.get("/get-posts", (req, res, next) => {
    // #swagger.tags = ['Test API Practice (Blog Posts)']
    // #swagger.summary = 'Get all posts without filter'
    getPosts(req, res, next);
});

// GET API Route to retrieve a post by ID using path variables  
postRoutes.get("/path-variables/get-posts/:id", (req, res, next) => {
    // #swagger.tags = ['Test API Practice (Blog Posts)']
    // #swagger.summary = 'Get single post by ID'
    getPostById(req, res, next);
});

// GET API Route to retrieve posts using an optional query parameters
postRoutes.get("/query-parameters/get-posts", (req, res, next) => {
    // #swagger.tags = ['Test API Practice (Blog Posts)']
    // #swagger.summary = 'Search and filter posts by query parameters'
    /* #swagger.parameters['search'] = {
          in: 'query',
          description: 'Search keyword across title, content, or author',
          type: 'string',
          required: false
      } */
    /* #swagger.parameters['published'] = {
          in: 'query',
          description: 'Filter by published status (true/false)',
          type: 'boolean',
          required: false
      } */
    searchPosts(req, res, next);
});


// PUT API Route to replace all fields of a post using a path variables and JSON body 
postRoutes.put("/update-posts/:id", (req, res, next) => {
    // #swagger.tags = ['Test API Practice (Blog Posts)']
    // #swagger.summary = 'Update entire post by ID'
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        title: { type: "string", example: "Updated Post Title" },
                        author_name: { type: "string", example: "Jane Doe" },
                        content: { type: "string", example: "This is the updated content." },
                        published: { type: "boolean", example: true }
                    },
                    required: ["title", "author_name", "content"]
                }
            }
        }
    } */
    updatePosts(req, res, next);
});

// PATCH API Route to update selected fields of a post using a path variables and JSON body
postRoutes.patch("/patch-posts/:id", (req, res, next) => {
    // #swagger.tags = ['Test API Practice (Blog Posts)']
    // #swagger.summary = 'Partially update post by ID'
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        title: { type: "string", example: "Only Update Title" },
                        author_name: { type: "string", example: "Jane Doe" },
                        content: { type: "string", example: "Updated partial content" },
                        published: { type: "boolean", example: true }
                    }
                }
            }
        }
    } */
    patchPosts(req, res, next);
});


// DELETE API Route to remove a post using a path variables
postRoutes.delete("/delete-posts/:id", (req, res, next) => {
    // #swagger.tags = ['Test API Practice (Blog Posts)']
    // #swagger.summary = 'Delete post by ID'
    deletePosts(req, res, next);
});


// POST API Route to create a new post using JSON body
postRoutes.post("/body/raw/create-posts", (req, res, next) => {
    // #swagger.tags = ['Test API Practice (Blog Posts)']
    // #swagger.summary = 'Create a new post'
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        title: { type: "string", example: "My First Post" },
                        author_name: { type: "string", example: "John Doe" },
                        content: { type: "string", example: "Learning Express.js" },
                        published: { type: "boolean", example: false }
                    },
                    required: ["title", "author_name", "content"]
                }
            }
        }
    } */
    createPosts(req, res, next);
});

// POST API Route to create a new post using form data (supports both multipart/form-data and application/x-www-form-urlencoded)
postRoutes.post("/body/form/create-posts", upload.none(), (req, res, next) => {
    // #swagger.tags = ['Test API Practice (Blog Posts)']
    // #swagger.summary = 'Create a new post (Form Data)'
    /* #swagger.requestBody = {
        required: true,
        content: {
            "multipart/form-data": {
                schema: {
                    type: "object",
                    properties: {
                        title: { type: "string", example: "My First Post" },
                        author_name: { type: "string", example: "John Doe" },
                        content: { type: "string", example: "Learning Express.js" },
                        published: { type: "boolean", example: false }
                    },
                    required: ["title", "author_name", "content"]
                }
            },
            "application/x-www-form-urlencoded": {
                schema: {
                    type: "object",
                    properties: {
                        title: { type: "string", example: "My First Post" },
                        author_name: { type: "string", example: "John Doe" },
                        content: { type: "string", example: "Learning Express.js" },
                        published: { type: "boolean", example: false }
                    },
                    required: ["title", "author_name", "content"]
                }
            }
        }
    } */
    createPosts(req, res, next);
});

// POST API Route to create post using form data application/x-www-form-urlencoded 
postRoutes.post("/body/urlencoded/create-posts", (req, res, next) => {
    // #swagger.tags = ['Test API Practice (Blog Posts)']
    // #swagger.summary = 'Create a new post (Urlencoded)'
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/x-www-form-urlencoded": {
                schema: {
                    type: "object",
                    properties: {
                        title: { type: "string", example: "My First Post" },
                        author_name: { type: "string", example: "John Doe" },
                        content: { type: "string", example: "Learning Express.js" },
                        published: { type: "boolean", example: false }
                    },
                    required: ["title", "author_name", "content"]
                }
            }
        }
    } */
    createPosts(req, res, next);
});

// POST API Route to create post using form data multipart/form-data (supports file upload up to 500KB stored in PostgreSQL)
postRoutes.post("/body/multipart/create-posts", upload.single("file"), (req, res, next) => {
    // #swagger.tags = ['Test API Practice (Blog Posts)']
    // #swagger.summary = 'Create a new post (Multipart + DB Binary, Max 500KB)'
    /* #swagger.requestBody = {
        required: true,
        content: {
            "multipart/form-data": {
                schema: {
                    type: "object",
                    properties: {
                        title: { type: "string", example: "My First Post" },
                        author_name: { type: "string", example: "John Doe" },
                        content: { type: "string", example: "Learning Express.js" },
                        published: { type: "boolean", example: false },
                        file: { type: "string", format: "binary", description: "Optional attachment file (max 500KB)" }
                    },
                    required: ["title", "author_name", "content"]
                }
            }
        }
    } */
    createPosts(req, res, next);
});

// GET API Route to download/view the file stored in PostgreSQL by post ID
postRoutes.get("/get-posts/:id/file", (req, res, next) => {
    // #swagger.tags = ['Test API Practice (Blog Posts)']
    // #swagger.summary = 'Download or view post file stored in PostgreSQL'
    downloadPostFile(req, res, next);
});


// HEAD API Route to check headers/metadata (total posts count) without returning a body
postRoutes.head("/head-posts", (req, res, next) => {
    // #swagger.tags = ['Test API Practice (Blog Posts)']
    // #swagger.summary = 'HEAD: Check posts headers & total count (no body)'
    headPosts(req, res, next);
});

// OPTIONS API Route to check allowed HTTP methods
postRoutes.options("/options-posts", (req, res, next) => {
    // #swagger.tags = ['Test API Practice (Blog Posts)']
    // #swagger.summary = 'OPTIONS: Check allowed HTTP methods'
    optionsPosts(req, res, next);
});

// GET API Route to verify Bearer token authentication
postRoutes.get("/auth/bearer", authBearer, (req, res, next) => {
    // #swagger.tags = ['Test API Practice (Blog Posts)']
    // #swagger.summary = 'Authenticate With Bearer Token'
    // #swagger.security = [{ "bearerAuth": [] }]
    verifyBearer(req, res, next);
});

// POST API Route to create a new post protected by Bearer token
postRoutes.post("/auth/bearer/create-posts", authBearer, (req, res, next) => {
    // #swagger.tags = ['Test API Practice (Blog Posts)']
    // #swagger.summary = 'Create a new post with Bearer Token'
    // #swagger.security = [{ "bearerAuth": [] }]
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        title: { type: "string", example: "Protected Post" },
                        author_name: { type: "string", example: "John Doe" },
                        content: { type: "string", example: "Created using Bearer Token" },
                        published: { type: "boolean", example: false }
                    },
                    required: ["title", "author_name", "content"]
                }
            }
        }
    } */
    createPosts(req, res, next);
});

// Apply the '/test' prefix inside this route module (combined with '/api' in index.js -> '/api/posts')
router.use("/test", postRoutes);

module.exports = router;

