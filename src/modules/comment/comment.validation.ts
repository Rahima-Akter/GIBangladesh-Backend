import { z } from "zod";

// Create comment validation
const createCommentBody = z.object({
  content: z
    .string()
    .min(1, "Comment content is required")
    .min(2, "Comment must be at least 2 characters")
    .max(1000, "Comment must be less than 1000 characters")
    .trim(),

  productId: z
    .string()
    .uuid("Invalid product ID")
    .optional(),

  blogId: z
    .string()
    .uuid("Invalid blog ID")
    .optional(),

  parentId: z
    .string()
    .uuid("Invalid parent comment ID")
    .optional(),
});

// Update comment validation
const updateCommentBody = z.object({
  content: z
    .string()
    .min(2, "Comment must be at least 2 characters")
    .max(1000, "Comment must be less than 1000 characters")
    .optional(),
});

// Query params validation
const commentQuery = z.object({
  productId: z.string().uuid("Invalid product ID").optional(),
  blogId: z.string().uuid("Invalid blog ID").optional(),
  parentId: z.string().uuid("Invalid parent comment ID").optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10)),
});

export const createCommentSchema = {
  body: createCommentBody,
};

export const updateCommentSchema = {
  body: updateCommentBody,
};

export const commentQuerySchema = {
  query: commentQuery,
};