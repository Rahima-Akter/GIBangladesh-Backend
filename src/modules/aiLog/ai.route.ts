import { Router } from "express";
import { aiController } from "./ai.controller";
import validateRequest from "../../middlewares/validateRequest";
import { auth } from "../../middlewares/auth.middleware";
import {
  generateContentSchema,
  rewriteTextSchema,
  generateHashtagsSchema,
  chatSchema,
  usageStatsSchema,
} from "./ai.validation";
import { apiLimiter } from "../../config/rateLimiter";

const router = Router();

// All AI routes require authentication
router.use(auth);

// Apply rate limiting to AI routes
router.use(apiLimiter);

// AI endpoints
router.post(
  "/generate-content",
  validateRequest(generateContentSchema),
  aiController.generateContent
);

router.post(
  "/rewrite-text",
  validateRequest(rewriteTextSchema),
  aiController.rewriteText
);

router.post(
  "/generate-hashtags",
  validateRequest(generateHashtagsSchema),
  aiController.generateHashtags
);

router.post(
  "/chat",
  validateRequest(chatSchema),
  aiController.chat
);

router.get(
  "/usage",
  validateRequest(usageStatsSchema),
  aiController.getUsageStats
);

export const aiRoutes = router;