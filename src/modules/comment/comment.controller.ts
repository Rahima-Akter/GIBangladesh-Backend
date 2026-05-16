import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { commentService } from "./comment.service";

// Get all comments (Admin only)
const getAllComments = catchAsync(async (req: Request, res: Response) => {
  const userRole = req.user!.role;
  const query = {
    productId: req.query.productId as string,
    blogId: req.query.blogId as string,
    parentId: req.query.parentId as string,
    hasFlags: req.query.hasFlags === "true",
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as "asc" | "desc",
  };
  
  const result = await commentService.getAllComments(query, userRole);
  sendResponse(res, httpStatus.OK, "All comments fetched successfully", result.comments, result.meta);
});

// Get specific comment (Owner or Admin)
const getCommentById = catchAsync(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const comment = await commentService.getCommentById(commentId as string, userId, userRole);
  sendResponse(res, httpStatus.OK, "Comment fetched successfully", comment);
});

// Create comment
const createComment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const comment = await commentService.createComment(userId, req.body);
  sendResponse(res, httpStatus.CREATED, "Comment created successfully", comment);
});

// Get comments (Public)
const getComments = catchAsync(async (req: Request, res: Response) => {
  const query = {
    productId: req.query.productId as string,
    blogId: req.query.blogId as string,
    parentId: req.query.parentId as string,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  };
  const result = await commentService.getComments(query);
  sendResponse(res, httpStatus.OK, "Comments fetched successfully", result.comments, result.meta);
});

// Update comment
const updateComment = catchAsync(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!.id;
  const comment = await commentService.updateComment(commentId as string, userId, req.body);
  sendResponse(res, httpStatus.OK, "Comment updated successfully", comment);
});

// Delete comment (Owner or Admin)
const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const result = await commentService.deleteComment(commentId as string, userId, userRole);
  sendResponse(res, httpStatus.OK, "Comment deleted successfully", result);
});

// Like comment
const likeComment = catchAsync(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!.id;
  const result = await commentService.likeComment(commentId as string, userId);
  sendResponse(res, httpStatus.OK, result.message, {
    likesCount: result.likesCount,
    dislikesCount: result.dislikesCount,
    hasLiked: result.hasLiked,
  });
});

// Dislike comment
const disLikeComment = catchAsync(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!.id;
  const result = await commentService.disLikeComment(commentId as string, userId);
  sendResponse(res, httpStatus.OK, result.message, {
    likesCount: result.likesCount,
    dislikesCount: result.dislikesCount,
    hasDisliked: result.hasDisliked,
  });
});

// Flag comment
const flagComment = catchAsync(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user!.id;
  const result = await commentService.flagComment(commentId as string, userId);
  sendResponse(res, httpStatus.OK, result.message, {
    flagsCount: result.flagsCount,
    hasFlagged: result.hasFlagged,
  });
});

export const commentController = {
  getAllComments,    // Admin only
  getCommentById,    // Owner or Admin
  createComment,
  getComments,       // Public
  updateComment,
  deleteComment,     // Owner or Admin
  likeComment,
  disLikeComment,
  flagComment,
};