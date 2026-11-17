import { z } from "zod";

const postSchema = z.object({
  title: z.string(),
  author_name: z.string(),
  content: z.string(),
  // Form data sends booleans as strings ("true" / "false"), while JSON sends actual booleans
  published: z
    .union([z.boolean(), z.enum(["true", "false"]).transform((val) => val === "true")])
    .optional()
    .default(false),
});

const updateSchema = postSchema.partial();

export { postSchema, updateSchema };

