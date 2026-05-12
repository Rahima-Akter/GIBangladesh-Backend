import { z } from "zod";

// Body validation schemas
const createProductBody = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters")
    .trim(),

  description: z
    .string()
    .min(1, "Description is required")
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),

  origin: z
    .string()
    .min(1, "Origin is required")
    .min(2, "Origin must be at least 2 characters")
    .max(100, "Origin must be less than 100 characters"),

  culturalSignificancehistory: z
    .string()
    .min(1, "Cultural significance is required")
    .min(10, "Cultural significance must be at least 10 characters"),

  detaildDescription: z
    .string()
    .min(1, "Detailed description is required")
    .min(20, "Detailed description must be at least 20 characters"),

  category: z
    .string()
    .min(1, "Category is required")
    .min(2, "Category must be at least 2 characters"),

  giRegistrationNumber: z
    .string()
    .min(1, "GI registration number is required")
    .min(3, "GI registration number must be at least 3 characters"),

  registeredYear: z
    .number()
    .int("Year must be a whole number")
    .min(1900, "Year must be 1900 or later")
    .max(new Date().getFullYear(), "Year cannot be in the future"),

  craftingSteps: z
    .array(z.string())
    .min(1, "At least one crafting step is required"),

  tags: z
    .array(z.string())
    .min(1, "At least one tag is required"),
});

const updateProductBody = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be less than 200 characters")
    .optional(),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters")
    .optional(),

  origin: z
    .string()
    .min(2, "Origin must be at least 2 characters")
    .max(100, "Origin must be less than 100 characters")
    .optional(),

  culturalSignificancehistory: z
    .string()
    .min(10, "Cultural significance must be at least 10 characters")
    .optional(),

  detaildDescription: z
    .string()
    .min(20, "Detailed description must be at least 20 characters")
    .optional(),

  category: z
    .string()
    .min(2, "Category must be at least 2 characters")
    .optional(),

  giRegistrationNumber: z
    .string()
    .min(3, "GI registration number must be at least 3 characters")
    .optional(),

  registeredYear: z
    .number()
    .int("Year must be a whole number")
    .min(1900, "Year must be 1900 or later")
    .max(new Date().getFullYear(), "Year cannot be in the future")
    .optional(),

  isVerified: z.boolean().optional(),

  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),

  craftingSteps: z.array(z.string()).min(1).optional(),

  tags: z.array(z.string()).min(1).optional(),
});

const productQuery = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  origin: z.string().optional(),
  registeredYear: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : undefined)),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  sortBy: z
    .enum(["title", "createdAt", "views", "likes", "registeredYear"])
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

// Export schemas for middleware
export const createProductSchema = {
  body: createProductBody,
};

export const updateProductSchema = {
  body: updateProductBody,
};

export const productQuerySchema = {
  query: productQuery,
};

// Types
export type CreateProductInput = z.infer<typeof createProductBody>;
export type UpdateProductInput = z.infer<typeof updateProductBody>;
export type ProductQueryParams = z.infer<typeof productQuery>;