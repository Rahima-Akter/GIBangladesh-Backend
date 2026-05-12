import { prisma } from "../../lib/prisma";
import { AppError } from "../../middlewares/globalErrorHandler";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
} from "../../utils/cloudinary";
import paginationHelper from "../../helpers/pagination.helper";
import { buildProductSearch } from "../../helpers/search.helper";
import { buildProductFilter } from "../../helpers/filter.helper";
import httpStatus from "http-status";
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryParams,
} from "./product.types";

// Create a new product (ADMIN, SUPER_ADMIN only)
const createProduct = async (
  userId: string,
  data: CreateProductInput,
  imageFile?: Express.Multer.File,
) => {
  let imageUrl: string | undefined;

  try {
    // Upload cover image to Cloudinary
    if (imageFile) {
      const uploadResult = await uploadToCloudinary(
        imageFile.path,
        "gi-bangladesh/products",
      );
      imageUrl = uploadResult.secure_url;
    } else {
      throw new AppError("Cover image is required", httpStatus.BAD_REQUEST);
    }

    // Create product with image
    const product = await prisma.product.create({
      data: {
        ...data,
        coverImage: imageUrl,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    return product;
  } catch (error) {
    // If product creation fails after image upload, delete the uploaded image
    if (imageUrl) {
      const publicId = getPublicIdFromUrl(imageUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      "Failed to create product",
      httpStatus.INTERNAL_SERVER_ERROR,
    );
  }
};

// Get all products with search, filter, pagination (PUBLIC)
const getAllProducts = async (params: ProductQueryParams) => {
  const {
    search,
    category,
    origin,
    registeredYear,
    status = "ACTIVE",
  } = params;

  // Build pagination
  const pagination = paginationHelper({
    page: params.page,
    limit: params.limit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  // Build where conditions
  const where: any = {
    status: status, // Default to ACTIVE for public
  };

  // Add search conditions
  const searchConditions = buildProductSearch(search);
  if (Object.keys(searchConditions).length > 0) {
    Object.assign(where, searchConditions);
  }

  // Add filter conditions
  const filterConditions = buildProductFilter({
    category,
    origin,
    registeredYear,
    status,
  });
  if (Object.keys(filterConditions).length > 0) {
    Object.assign(where, filterConditions);
  }

  // Get total count
  const total = await prisma.product.count({ where });

  // Get products
  const products = await prisma.product.findMany({
    where,
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
    orderBy: {
      [pagination.sortBy]: pagination.sortOrder,
    },
    skip: pagination.skip,
    take: pagination.take,
  });

  return {
    products,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

// Get single product by ID (PUBLIC)
const getProductById = async (productId: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
          address: true,
        },
      },
      comments: {
        where: {
          parentId: null, // Only top-level comments
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  if (!product) {
    throw new AppError("Product not found", httpStatus.NOT_FOUND);
  }

  // Increment view count
  await prisma.product.update({
    where: { id: productId },
    data: {
      views: {
        increment: 1,
      },
    },
  });

  return product;
};

// Update product (ADMIN, SUPER_ADMIN only)
const updateProduct = async (
  productId: string,
  data: UpdateProductInput,
  imageFile?: Express.Multer.File,
) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError("Product not found", httpStatus.NOT_FOUND);
  }

  let imageUrl: string | undefined;
  let oldPublicId: string | null = null;

  try {
    // If there's a new image to upload
    if (imageFile) {
      // Upload new image
      const uploadResult = await uploadToCloudinary(
        imageFile.path,
        "gi-bangladesh/products",
      );
      imageUrl = uploadResult.secure_url;

      // Get old image public ID for cleanup
      if (product.coverImage) {
        oldPublicId = getPublicIdFromUrl(product.coverImage);
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        ...data,
        ...(imageUrl && { coverImage: imageUrl }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    // Delete old image from Cloudinary after successful update
    if (oldPublicId) {
      await deleteFromCloudinary(oldPublicId);
    }

    return updatedProduct;
  } catch (error) {
    // If update fails after uploading new image, clean it up
    if (imageUrl) {
      const newPublicId = getPublicIdFromUrl(imageUrl);
      if (newPublicId) {
        await deleteFromCloudinary(newPublicId);
      }
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      "Failed to update product",
      httpStatus.INTERNAL_SERVER_ERROR,
    );
  }
};

// Delete product (ADMIN, SUPER_ADMIN only)
const deleteProduct = async (productId: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError("Product not found", httpStatus.NOT_FOUND);
  }

  // Delete cover image from Cloudinary
  if (product.coverImage) {
    const publicId = getPublicIdFromUrl(product.coverImage);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
  }

  // Delete all comments first
  await prisma.comment.deleteMany({
    where: { productId },
  });

  // Delete the product
  await prisma.product.delete({
    where: { id: productId },
  });

  return { message: "Product deleted successfully" };
};

// Get product categories (distinct)
const getProductCategories = async () => {
  const categories = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
    },
    select: {
      category: true,
    },
    distinct: ["category"],
    orderBy: {
      category: "asc",
    },
  });

  return categories.map((p) => p.category);
};

// Like a product (Any authenticated user)
const likeProduct = async (productId: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError("Product not found", httpStatus.NOT_FOUND);
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      likes: {
        increment: 1,
      },
    },
  });

  return { message: "Product liked successfully" };
};

// Dislike a product (Any authenticated user)
const dislikeProduct = async (productId: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError("Product not found", httpStatus.NOT_FOUND);
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      disLikes: {
        increment: 1,
      },
    },
  });

  return { message: "Product disliked successfully" };
};

export const productService = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductCategories,
  likeProduct,
  dislikeProduct,
};
