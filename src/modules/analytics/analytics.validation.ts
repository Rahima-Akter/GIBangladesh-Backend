import { z } from "zod";

// Track event validation
const trackEventBody = z.object({
  eventType: z.enum([
    "PRODUCT_VIEW",
    "BLOG_VIEW",
    "PRODUCT_LIKE",
    "BLOG_LIKE",
    "COMMENT_CREATED",
    "AI_USED"
  ], {
    message: "Invalid event type",  // Changed from required_error
  }),
  
  entityId: z
    .string()
    .uuid("Invalid entity ID")
    .optional(),
  
  metadata: z
    .record(z.string(), z.any())
    .optional(),
});

// Query params validation
const analyticsQuery = z.object({
  eventType: z.enum([
    "PRODUCT_VIEW",
    "BLOG_VIEW",
    "PRODUCT_LIKE",
    "BLOG_LIKE",
    "COMMENT_CREATED",
    "AI_USED"
  ]).optional(),
  
  userId: z.string().uuid("Invalid user ID").optional(),
  
  startDate: z
    .string()
    .optional()
    .transform((val) => val ? new Date(val) : undefined),
  
  endDate: z
    .string()
    .optional()
    .transform((val) => val ? new Date(val) : undefined),
  
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 50)),
});

// Add manual required check since enum doesn't have required_error
export const trackEventSchema = {
  body: trackEventBody.refine(
    (data) => data.eventType !== undefined,
    {
      message: "Event type is required",
      path: ["eventType"],
    }
  ),
};

export const analyticsQuerySchema = {
  query: analyticsQuery,
};