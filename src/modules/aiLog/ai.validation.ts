import { z } from "zod";

// Generate content validation
const generateContentBody = z.object({
  prompt: z
    .string()
    .min(1, "Prompt is required")
    .min(3, "Prompt must be at least 3 characters")
    .max(2000, "Prompt must be less than 2000 characters")
    .trim(),
});

// Rewrite text validation
const rewriteTextBody = z.object({
  text: z
    .string()
    .min(1, "Text is required")
    .min(3, "Text must be at least 3 characters")
    .max(5000, "Text must be less than 5000 characters")
    .trim(),
  
  tone: z
    .enum(["professional", "casual", "friendly", "formal"])
    .optional()
    .default("professional"),
});

// Generate hashtags validation
const generateHashtagsBody = z.object({
  topic: z
    .string()
    .min(1, "Topic is required")
    .min(2, "Topic must be at least 2 characters")
    .max(100, "Topic must be less than 100 characters")
    .trim(),
  
  count: z
    .number()
    .int("Count must be a whole number")
    .min(1, "Count must be at least 1")
    .max(20, "Count must be at most 20")
    .optional()
    .default(10),
});

// Chat validation
const chatBody = z.object({
  message: z
    .string()
    .min(1, "Message is required")
    .min(1, "Message must be at least 1 character")
    .max(2000, "Message must be less than 2000 characters")
    .trim(),
});

// Query validation for usage stats
const usageQuery = z.object({
  days: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 7)),
});

export const generateContentSchema = {
  body: generateContentBody,
};

export const rewriteTextSchema = {
  body: rewriteTextBody,
};

export const generateHashtagsSchema = {
  body: generateHashtagsBody,
};

export const chatSchema = {
  body: chatBody,
};

export const usageStatsSchema = {
  query: usageQuery,
};