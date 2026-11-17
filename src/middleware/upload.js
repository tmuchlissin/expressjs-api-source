import multer from "multer";

// Store uploaded files temporarily in RAM (req.file.buffer) so they can be saved to PostgreSQL
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024, // Strict 500 KB limit per file
  },
});

export default upload;

