// Service layer: handles business logic and coordinates repository calls (no req/res).
import * as postRepo from "../repositories/postRepo.js";

const getAllPosts = () => {
  return postRepo.findAll();
};

const searchPosts = ({ search, published }) => {
  const where = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
      { author_name: { contains: search, mode: "insensitive" } },
    ];
  }

  if (published !== undefined) {
    where.published = published === "true";
  }

  return postRepo.search(where);
};

const getPostById = (id) => {
  return postRepo.findById(id);
};

const createPost = (data, file) => {
  return postRepo.create({
    author_name: data.author_name,
    content: data.content,
    title: data.title,
    published: data.published,
    file_data: file ? file.buffer : null,
    file_name: file ? file.originalname : null,
    file_mime: file ? file.mimetype : null,
  });
};

const updatePost = (id, data) => {
  return postRepo.updateById(id, data);
};

const deletePost = (id) => {
  return postRepo.deleteById(id);
};

const getTotalPostsCount = () => {
  return postRepo.countAll();
};

const getPostFile = (id) => {
  return postRepo.findFileById(id);
};

export {
  getAllPosts,
  searchPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getTotalPostsCount,
  getPostFile,
};

