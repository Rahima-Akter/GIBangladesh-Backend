import { Router } from "express";
import { commentController } from "./comment.controller";
import validateRequest from "../../middlewares/validateRequest";
import { auth, restrictTo } from "../../middlewares/auth.middleware";
import {
  createCommentSchema,
  updateCommentSchema,
  commentQuerySchema,
} from "./comment.validation";

const router = Router();

// Public routes (anyone can view comments)
router.get(
  "/",
  validateRequest(commentQuerySchema),
  commentController.getComments
);

// Admin only routes
router.get(
  "/admin/all",
  auth,
  restrictTo("ADMIN", "SUPER_ADMIN"),
  commentController.getAllComments
);

// Protected routes with role-based access
router.get(
  "/:commentId",
  auth,
  commentController.getCommentById  // Owner or Admin can access
);

// Protected routes (only logged in users)
router.post(
  "/",
  auth,
  validateRequest(createCommentSchema),
  commentController.createComment
);

router.patch(
  "/:commentId",
  auth,
  validateRequest(updateCommentSchema),
  commentController.updateComment
);

router.delete(
  "/:commentId",
  auth,
  commentController.deleteComment  // Owner or Admin can delete
);

// Interaction routes (toggle)
router.post("/:commentId/like", auth, commentController.likeComment);
router.post("/:commentId/dislike", auth, commentController.disLikeComment);
router.post("/:commentId/flag", auth, commentController.flagComment);

export const commentRoutes = router;