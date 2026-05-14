import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { blogService } from "./blog.service";

// Create blog
const createBlog = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const imageFile = req.file;
  const result = await blogService.createBlog(userId, req.body, imageFile);

  sendResponse(res, httpStatus.CREATED, "Blog created successfully", result);
});

// Get all blogs (public)
const getAllBlogs = catchAsync(async (req: Request, res: Response) => {
  const result = await blogService.getAllBlogs(req.query);

  sendResponse(
    res,
    httpStatus.OK,
    "Blogs fetched successfully",
    result.blogs,
    result.meta,
  );
});

// Get single blog
const getBlogById = catchAsync(async (req: Request, res: Response) => {
  const { blogId } = req.params;
  const result = await blogService.getBlogById(blogId as string);

  sendResponse(res, httpStatus.OK, "Blog fetched successfully", result);
});

// Get my blogs
const getMyBlogs = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await blogService.getMyBlogs(userId, req.query);

  sendResponse(
    res,
    httpStatus.OK,
    "My blogs fetched successfully",
    result.blogs,
    result.meta,
  );
});

// Update own blog
const updateBlog = catchAsync(async (req: Request, res: Response) => {
  const { blogId } = req.params;
  const userId = req.user!.id;
  const imageFile = req.file;
  const result = await blogService.updateBlog(
    blogId as string,
    userId,
    req.body,
    imageFile,
  );

  sendResponse(res, httpStatus.OK, "Blog updated successfully", result);
});

// Delete own blog
const deleteBlog = catchAsync(async (req: Request, res: Response) => {
  const { blogId } = req.params;
  const userId = req.user!.id;
  const result = await blogService.deleteBlog(blogId as string, userId);

  sendResponse(res, httpStatus.OK, "Blog deleted successfully", result);
});

// Like blog
const likeBlog = catchAsync(async (req: Request, res: Response) => {
  const { blogId } = req.params;
  const userId = req.user!.id;
  const result = await blogService.likeBlog(blogId as string, userId);
  sendResponse(res, httpStatus.OK, result.message, {
    likesCount: result.likesCount,
    dislikesCount: result.dislikesCount,
    hasLiked: result.hasLiked,
  });
});

// Dislike blog
const disLikeBlog = catchAsync(async (req: Request, res: Response) => {
  const { blogId } = req.params;
  const userId = req.user!.id;
  const result = await blogService.disLikeBlog(blogId as string, userId);
  sendResponse(res, httpStatus.OK, result.message, {
    likesCount: result.likesCount,
    dislikesCount: result.dislikesCount,
    hasDisliked: result.hasDisliked,
  });
});

// Flag blog
const flagBlog = catchAsync(async (req: Request, res: Response) => {
  const { blogId } = req.params;
  const userId = req.user!.id;
  const result = await blogService.flagBlog(blogId as string, userId);
  sendResponse(res, httpStatus.OK, result.message, {
    flagsCount: result.flagsCount,
    hasFlagged: result.hasFlagged,
  });
});

// Get categories
const getBlogCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await blogService.getBlogCategories();

  sendResponse(res, httpStatus.OK, "Categories fetched successfully", result);
});

// ADMIN: Get all blogs
const adminGetAllBlogs = catchAsync(async (req: Request, res: Response) => {
  const result = await blogService.adminGetAllBlogs(req.query);

  sendResponse(
    res,
    httpStatus.OK,
    "All blogs fetched successfully",
    result.blogs,
    result.meta,
  );
});

// ADMIN: Update blog status
const adminUpdateBlogStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { blogId } = req.params;
    const result = await blogService.adminUpdateBlogStatus(
      blogId as string,
      req.body,
      req.user,
    );

    sendResponse(
      res,
      httpStatus.OK,
      "Blog status updated successfully",
      result,
    );
  },
);

// ADMIN: Delete any blog
const adminDeleteBlog = catchAsync(async (req: Request, res: Response) => {
  const { blogId } = req.params;
  const result = await blogService.adminDeleteBlog(blogId as string);

  sendResponse(res, httpStatus.OK, "Blog deleted by admin", result);
});

export const blogController = {
  createBlog,
  getAllBlogs,
  getBlogById,
  getMyBlogs,
  updateBlog,
  deleteBlog,
  likeBlog,
  disLikeBlog,
  flagBlog,
  getBlogCategories,
  adminGetAllBlogs,
  adminUpdateBlogStatus,
  adminDeleteBlog,
};
