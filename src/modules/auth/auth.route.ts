import { Router } from "express";
import validateRequest from "../../middlewares/validateRequest";
import { authController } from "./auth.controller";
import { authLimiter } from "../../config/rateLimiter";
import { auth, restrictTo } from "../../middlewares/auth.middleware";
import { uploadSingle } from "../../middlewares/upload.middleware";
import { Role } from "../../../generated/prisma/enums";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  updateUserSchema,
  userQuerySchema,
} from "./auth.validation";

const router = Router();

// ==================== PUBLIC ROUTES ====================
router.post(
  "/register",
  authLimiter,
  validateRequest(registerSchema),
  authController.register,
);

router.post(
  "/login",
  authLimiter,
  validateRequest(loginSchema),
  authController.login,
);

// ==================== PROTECTED ROUTES (Any authenticated user) ====================
// Own profile management
router.get("/profile", auth, authController.getProfile);

router.patch(
  "/profile",
  auth,
  uploadSingle,
  validateRequest(updateProfileSchema),
  authController.updateProfile,
);

router.post("/logout", auth, authController.logout);

router.delete("/account", auth, authController.deleteOwnAccount);

// ==================== ADMIN & SUPER_ADMIN ROUTES ====================
// User management
router.get(
  "/users",
  auth,
  restrictTo(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(userQuerySchema),
  authController.getAllUsers,
);

router.get(
  "/users/:userId",
  auth,
  restrictTo(Role.ADMIN, Role.SUPER_ADMIN),
  authController.getUserById,
);

router.patch(
  "/users/:userId",
  auth,
  restrictTo(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(updateUserSchema),
  authController.updateUserByAdmin,
);

// Soft delete user
router.delete(
  "/users/:userId/soft",
  auth,
  restrictTo(Role.ADMIN, Role.SUPER_ADMIN),
  authController.softDeleteUser,
);

// Revive soft deleted user
router.patch(
  "/users/:userId/revive",
  auth,
  restrictTo(Role.ADMIN, Role.SUPER_ADMIN),
  authController.reviveUser,
);

// Hard delete user (permanent)
router.delete(
  "/users/:userId/delete",
  auth,
  restrictTo(Role.SUPER_ADMIN, Role.ADMIN, Role.USER),
  authController.hardDeleteUser,
);

// Admin check route
router.get(
  "/admin-check",
  auth,
  restrictTo(Role.ADMIN, Role.SUPER_ADMIN),
  (req, res) => {
    res.json({
      success: true,
      message: "You have admin access",
    });
  },
);

export const authRoutes = router;
