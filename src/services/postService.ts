// Service layer: handles business logic and coordinates repository calls (no req/res).
import * as postRepo from "../repositories/postRepo";
import { CreatePostInput, UpdatePostInput } from "../schemas/postSchema";
import { Prisma } from "@prisma/client";

interface SearchParams {
  search?: string;
  published?: string;
}

const getAllPosts = () => {
  return postRepo.findAll();
};

const searchPosts = ({ search, published }: SearchParams) => {
  const where: Prisma.PostWhereInput = {};

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

const getPostById = (id: number) => {
  return postRepo.findById(id);
};

const createPost = (data: CreatePostInput, file?: Express.Multer.File) => {
  return postRepo.create({
    author_name: data.author_name,
    content: data.content,
    title: data.title,
    published: data.published,
    file_data: file ? new Uint8Array(file.buffer) : null,
    file_name: file ? file.originalname : null,
    file_mime: file ? file.mimetype : null,
  });
};

const updatePost = (id: number, data: UpdatePostInput) => {
  return postRepo.updateById(id, data);
};

const deletePost = (id: number) => {
  return postRepo.deleteById(id);
};

const getTotalPostsCount = () => {
  return postRepo.countAll();
};

const getPostFile = (id: number) => {
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
