import { z } from "zod";
import { registry } from "../openapi/registry";

const postSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .openapi({ example: "My First Post", description: "Title of the blog post" }),
  author_name: z
    .string()
    .min(1, "Author name is required")
    .openapi({ example: "John Doe", description: "Name of the post author" }),
  content: z
    .string()
    .min(1, "Content is required")
    .openapi({
      example: "Learning Express.js with TypeScript and Zod-to-OpenAPI",
      description: "Main content of the post",
    }),
  // Form data sends booleans as strings ("true" / "false"), while JSON sends actual booleans
  published: z
    .union([z.boolean(), z.enum(["true", "false"]).transform((val) => val === "true")])
    .optional()
    .default(false)
    .openapi({ example: false, description: "Whether the post is published" }),
});

const updateSchema = postSchema.partial();

export const PostModelSchema = registry.register("Post", postSchema);
export const UpdatePostModelSchema = registry.register("UpdatePost", updateSchema);

export type CreatePostInput = z.infer<typeof postSchema>;
export type UpdatePostInput = z.infer<typeof updateSchema>;

export { postSchema, updateSchema };
