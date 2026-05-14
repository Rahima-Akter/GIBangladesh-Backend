import { z } from "zod";

// Create blog body
const createBlogBody = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters")
    .trim(),

  content: z
    .string()
    .min(1, "Content is required")
    .min(20, "Content must be at least 20 characters"),

  tags: z
    .array(z.string())
    .min(1, "At least one tag is required")
    .max(10, "Maximum 10 tags allowed"),

  category: z
    .string()
    .min(1, "Category is required")
    .min(2, "Category must be at least 2 characters"),
});

// Update blog body
const updateBlogBody = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters")
    .optional(),

  content: z
    .string()
    .min(20, "Content must be at least 20 characters")
    .optional(),

  tags: z
    .array(z.string())
    .min(1, "At least one tag is required")
    .max(10, "Maximum 10 tags allowed")
    .optional(),

  category: z
    .string()
    .min(2, "Category must be at least 2 characters")
    .optional(),
});

// Admin update blog status
const adminUpdateBlogBody = z.object({
  status: z.enum(["PUBLISHED", "DRAFT"]).optional(),
});

// Blog query params
const blogQuery = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["PUBLISHED", "DRAFT"]).optional(),
  tags: z.string().optional(),
  authorId: z.string().optional(),
  sortBy: z
    .enum(["title", "createdAt", "updatedAt", "views", "likes"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
});

// Export schemas
export const createBlogSchema = {
  body: createBlogBody,
};

export const updateBlogSchema = {
  body: updateBlogBody,
};

export const adminUpdateBlogSchema = {
  body: adminUpdateBlogBody,
};

export const blogQuerySchema = {
  query: blogQuery,
};

// Types
export type CreateBlogInput = z.infer<typeof createBlogBody>;
export type UpdateBlogInput = z.infer<typeof updateBlogBody>;
export type AdminUpdateBlogInput = z.infer<typeof adminUpdateBlogBody>;
export type BlogQueryParams = z.infer<typeof blogQuery>;