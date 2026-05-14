import { Router } from "express";
import { blogController } from "./blog.controller";
import validateRequest from "../../middlewares/validateRequest";
import { auth, optionalAuth, restrictTo } from "../../middlewares/auth.middleware";
import { uploadSingle } from "../../middlewares/upload.middleware";
import { Role } from "../../../generated/prisma/enums";
import {
  createBlogSchema,
  updateBlogSchema,
  adminUpdateBlogSchema,
  blogQuerySchema,
} from "./blog.validation";

const router = Router();

// ==================== PUBLIC ROUTES ====================
router.get(
  "/",
  optionalAuth,
  validateRequest(blogQuerySchema),
  blogController.getAllBlogs
);

router.get("/categories", blogController.getBlogCategories);

router.get("/:blogId", optionalAuth, blogController.getBlogById);

// ==================== AUTHENTICATED USER ROUTES ====================

// Get my blogs
router.get(
  "/my/blogs",
  auth,
  validateRequest(blogQuerySchema),
  blogController.getMyBlogs
);

// Create blog
router.post(
  "/",
  auth,
  uploadSingle,
  validateRequest(createBlogSchema),
  blogController.createBlog
);

// Update own blog
router.patch(
  "/:blogId",
  auth,
  uploadSingle,
  validateRequest(updateBlogSchema),
  blogController.updateBlog
);

// Delete own blog
router.delete("/:blogId", auth, blogController.deleteBlog);

// Like blog
router.post("/:blogId/like", auth, blogController.likeBlog);
// disLike blog
router.post("/:blogId/dislike", auth, blogController.disLikeBlog);
// flag blog
router.post("/:blogId/flag", auth, blogController.flagBlog);

// ==================== ADMIN & SUPER_ADMIN ROUTES ====================

// Admin: Get all blogs (including drafts)
router.get(
  "/admin/all",
  auth,
  restrictTo(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(blogQuerySchema),
  blogController.adminGetAllBlogs
);

// Admin: Update blog status
router.patch(
  "/admin/:blogId/status",
  auth,
  restrictTo(Role.ADMIN, Role.SUPER_ADMIN, Role.USER),
  validateRequest(adminUpdateBlogSchema),
  blogController.adminUpdateBlogStatus
);

// Admin: Delete any blog
router.delete(
  "/admin/:blogId",
  auth,
  restrictTo(Role.ADMIN, Role.SUPER_ADMIN),
  blogController.adminDeleteBlog
);

export const blogRoutes = router;