import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { productService } from "./product.service";

// Create product (ADMIN, SUPER_ADMIN)
const createProduct = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const imageFile = req.file;
  const result = await productService.createProduct(
    userId,
    req.body,
    imageFile,
  );

  sendResponse(res, httpStatus.CREATED, "Product created successfully", result);
});

// Get all products (PUBLIC)
const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const result = await productService.getAllProducts(req.query);

  sendResponse(
    res,
    httpStatus.OK,
    "Products fetched successfully",
    result.products,
    result.meta,
  );
});

// Get single product (PUBLIC)
const getProductById = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const result = await productService.getProductById(productId as string);

  sendResponse(res, httpStatus.OK, "Product fetched successfully", result);
});

// Update product (ADMIN, SUPER_ADMIN)
const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const imageFile = req.file;
  const result = await productService.updateProduct(
    productId as string,
    req.body,
    imageFile,
  );

  sendResponse(res, httpStatus.OK, "Product updated successfully", result);
});

// Delete product (ADMIN, SUPER_ADMIN)
const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const result = await productService.deleteProduct(productId as string);

  sendResponse(res, httpStatus.OK, "Product deleted successfully", result);
});

// Get categories (PUBLIC)
const getProductCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await productService.getProductCategories();

  sendResponse(res, httpStatus.OK, "Categories fetched successfully", result);
});

// Like product
const likeProduct = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const userId = req.user!.id;
  const result = await productService.likeProduct(productId as string, userId);
  sendResponse(res, httpStatus.OK, result.message, {
    likesCount: result.likesCount,
    dislikesCount: result.dislikesCount,
    hasLiked: result.hasLiked,
  });
});

// Dislike product
const disLikeProduct = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const userId = req.user!.id;
  const result = await productService.disLikeProduct(productId as string, userId);
  sendResponse(res, httpStatus.OK, result.message, {
    likesCount: result.likesCount,
    dislikesCount: result.dislikesCount,
    hasDisliked: result.hasDisliked,
  });
});

// Flag product
const flagProduct = catchAsync(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const userId = req.user!.id;
  const result = await productService.flagProduct(productId as string, userId);
  sendResponse(res, httpStatus.OK, result.message, {
    flagsCount: result.flagsCount,
    hasFlagged: result.hasFlagged,
  });
});

export const productController = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductCategories,
  likeProduct,
  disLikeProduct,
  flagProduct,
};
