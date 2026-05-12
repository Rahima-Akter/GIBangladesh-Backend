import { z } from "zod";

// Register validation - just the body schema, not wrapped
const registerBody = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .trim(),

  email: z
    .string()
    .min(1, "Email is required")
    .email("Please provide a valid email")
    .trim()
    .toLowerCase(),

  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters")
    .max(50, "Password must be less than 50 characters"),
});

// Login validation - just the body schema
const loginBody = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please provide a valid email")
    .trim()
    .toLowerCase(),

  password: z.string().min(1, "Password is required"),
});

// Update profile validation - just the body schema
const updateProfileBody = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .optional(),

  bio: z
    .string()
    .max(500, "Bio must be less than 500 characters")
    .optional()
    .nullable(),

  address: z
    .string()
    .max(300, "Address must be less than 300 characters")
    .optional()
    .nullable(),
});

// Update user by admin - body schema
const updateUserBody = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .optional(),

  bio: z
    .string()
    .max(500, "Bio must be less than 500 characters")
    .optional()
    .nullable(),

  address: z
    .string()
    .max(300, "Address must be less than 300 characters")
    .optional()
    .nullable(),
});

// User query params validation
const userQuery = z.object({
  search: z.string().optional(),
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "DELETED", "ALL"]).optional(),
  sortBy: z.enum(["name", "email", "createdAt", "updatedAt"]).optional(),
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

// Export schemas in the format validateRequest expects
export const registerSchema = {
  body: registerBody,
};

export const loginSchema = {
  body: loginBody,
};

export const updateProfileSchema = {
  body: updateProfileBody,
};

export const updateUserSchema = {
  body: updateUserBody,
};

export const userQuerySchema = {
  query: userQuery,
};

// Types
export type RegisterInput = z.infer<typeof registerBody>;
export type LoginInput = z.infer<typeof loginBody>;
export type UpdateProfileInput = z.infer<typeof updateProfileBody>;
export type UpdateUserInput = z.infer<typeof updateUserBody>;
export type UserQueryParams = z.infer<typeof userQuery>;