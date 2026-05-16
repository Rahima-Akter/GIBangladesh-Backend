import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { auth, optionalAuth, restrictTo } from "../../middlewares/auth.middleware";
import {
  trackEventSchema,
  analyticsQuerySchema,
} from "./analytics.validation";
import { analyticsController } from "./analytics.controller";

const router = Router();

// Public route (no auth required for tracking)
router.post(
  "/track",
  optionalAuth,
  validateRequest(trackEventSchema),
  analyticsController.trackEvent
);

// Protected routes - User
router.get(
  "/my-activity",
  auth,
  validateRequest(analyticsQuerySchema),
  analyticsController.getMyActivity
);

// Admin only routes
router.get(
  "/admin/all",
  auth,
  restrictTo("ADMIN", "SUPER_ADMIN"),
  validateRequest(analyticsQuerySchema),
  analyticsController.getAnalytics
);

router.get(
  "/admin/stats",
  auth,
  restrictTo("ADMIN", "SUPER_ADMIN"),
  analyticsController.getAnalyticsStats
);

router.get(
  "/admin/dashboard",
  auth,
  restrictTo("ADMIN", "SUPER_ADMIN"),
  analyticsController.getDashboardStats
);

export const analyticsRoutes = router;