// Repository layer: encapsulates all direct Prisma database queries for Post.
import prisma from "../config/database.js";

const findAll = () => {
  return prisma.post.findMany({
    omit: { file_data: true },
    orderBy: { createdAt: "desc" },
  });
};

const search = (where) => {
  return prisma.post.findMany({
    where,
    omit: { file_data: true },
    orderBy: { createdAt: "desc" },
  });
};

const findById = (id) => {
  return prisma.post.findUnique({
    where: { id },
    omit: { file_data: true },
  });
};

const findFileById = (id) => {
  return prisma.post.findUnique({
    where: { id },
    select: {
      file_data: true,
      file_name: true,
      file_mime: true,
    },
  });
};

const create = (data) => {
  return prisma.post.create({
    data,
    omit: { file_data: true },
  });
};

const updateById = (id, data) => {
  return prisma.post.update({
    where: { id },
    data,
    omit: { file_data: true },
  });
};

const deleteById = (id) => {
  return prisma.post.delete({
    where: { id },
    omit: { file_data: true },
  });
};

const countAll = () => {
  return prisma.post.count();
};

export {
  findAll,
  search,
  findById,
  findFileById,
  create,
  updateById,
  deleteById,
  countAll,
};

