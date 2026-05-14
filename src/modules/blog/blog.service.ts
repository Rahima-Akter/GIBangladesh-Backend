import { prisma } from "../../lib/prisma";
import { AppError } from "../../middlewares/globalErrorHandler";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
} from "../../utils/cloudinary";
import paginationHelper from "../../helpers/pagination.helper";
import httpStatus from "http-status";
import type {
  CreateBlogInput,
  UpdateBlogInput,
  AdminUpdateBlogInput,
  BlogQueryParams,
} from "./blog.types";
import { Role } from "../../../generated/prisma/enums";

// Create a new blog (Any authenticated user)
const createBlog = async (
  userId: string,
  data: CreateBlogInput,
  imageFile?: Express.Multer.File,
) => {
  let imageUrl: string | undefined;

  try {
    // Upload cover image to Cloudinary if provided
    if (imageFile) {
      const uploadResult = await uploadToCloudinary(
        imageFile.path,
        "gi-bangladesh/blogs",
      );
      imageUrl = uploadResult.secure_url;
    }

    // Create blog
    const blog = await prisma.blog.create({
      data: {
        title: data.title,
        content: data.content,
        coverImage: imageUrl || null,
        tags: data.tags,
        category: data.category,
        createdById: userId,
        status: "PUBLISHED", // Default status
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

    return blog;
  } catch (error) {
    // If blog creation fails after image upload, delete the uploaded image
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
      "Failed to create blog",
      httpStatus.INTERNAL_SERVER_ERROR,
    );
  }
};

// Get all blogs (PUBLIC - with search, filter, pagination)
const getAllBlogs = async (params: BlogQueryParams) => {
  const pagination = paginationHelper({
    page: params.page,
    limit: params.limit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  // Build where conditions
  const where: any = {};

  // Default: show only published blogs for public
  if (params.status) {
    where.status = params.status;
  } else {
    where.status = "PUBLISHED";
  }

  // Search by title and content
  if (params.search) {
    where.OR = [
      {
        title: {
          contains: params.search,
          mode: "insensitive",
        },
      },
      {
        content: {
          contains: params.search,
          mode: "insensitive",
        },
      },
    ];
  }

  // Filter by category
  if (params.category) {
    where.category = params.category;
  }

  // Filter by tags
  if (params.tags) {
    const tagArray = params.tags.split(",").map((tag) => tag.trim());
    where.tags = {
      hasSome: tagArray,
    };
  }

  // Filter by author
  if (params.authorId) {
    where.createdById = params.authorId;
  }

  // Get total count
  const total = await prisma.blog.count({ where });

  // Get blogs
  const blogs = await prisma.blog.findMany({
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
    blogs,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

// Get single blog by ID (PUBLIC)
const getBlogById = async (blogId: string) => {
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
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

  if (!blog) {
    throw new AppError("Blog not found", httpStatus.NOT_FOUND);
  }

  // Get counts
  const likesCount = await prisma.blogLike.count({
    where: { blogId: blog.id },
  });

  const dislikesCount = await prisma.blogDislike.count({
    where: { blogId: blog.id },
  });

  const flagsCount = await prisma.blogFlag.count({
    where: { blogId: blog.id },
  });

  // Increment view count
  await prisma.blog.update({
    where: { id: blogId },
    data: { views: { increment: 1 } },
  });

  // Return blog with counts
  return {
    ...blog,
    likesCount,
    dislikesCount,
    flagsCount,
  };
};

// Get current user's blogs (Authenticated user)
const getMyBlogs = async (userId: string, params: BlogQueryParams) => {
  const pagination = paginationHelper({
    page: params.page,
    limit: params.limit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  const where: any = {
    createdById: userId,
  };

  // Filter by status
  if (params.status) {
    where.status = params.status;
  }

  // Search
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { content: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const total = await prisma.blog.count({ where });

  const blogs = await prisma.blog.findMany({
    where,
    include: {
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
    blogs,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

// Update own blog (Blog owner only)
const updateBlog = async (
  blogId: string,
  userId: string,
  data: UpdateBlogInput,
  imageFile?: Express.Multer.File,
) => {
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
  });

  if (!blog) {
    throw new AppError("Blog not found", httpStatus.NOT_FOUND);
  }

  // Check if user owns this blog
  if (blog.createdById !== userId) {
    throw new AppError(
      "You are not authorized to update this blog",
      httpStatus.FORBIDDEN,
    );
  }

  let imageUrl: string | undefined;
  let oldPublicId: string | null = null;

  try {
    // If there's a new image
    if (imageFile) {
      const uploadResult = await uploadToCloudinary(
        imageFile.path,
        "gi-bangladesh/blogs",
      );
      imageUrl = uploadResult.secure_url;

      if (blog.coverImage) {
        oldPublicId = getPublicIdFromUrl(blog.coverImage);
      }
    }

    // Update blog
    const updatedBlog = await prisma.blog.update({
      where: { id: blogId },
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

    // Delete old image
    if (oldPublicId) {
      await deleteFromCloudinary(oldPublicId);
    }

    return updatedBlog;
  } catch (error) {
    // If update fails after uploading new image, clean up
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
      "Failed to update blog",
      httpStatus.INTERNAL_SERVER_ERROR,
    );
  }
};

// Delete own blog (Blog owner only)
const deleteBlog = async (blogId: string, userId: string) => {
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
  });

  if (!blog) {
    throw new AppError("Blog not found", httpStatus.NOT_FOUND);
  }

  // Check if user owns this blog
  if (blog.createdById !== userId) {
    throw new AppError(
      "You are not authorized to delete this blog",
      httpStatus.FORBIDDEN,
    );
  }

  // Delete cover image from Cloudinary
  if (blog.coverImage) {
    const publicId = getPublicIdFromUrl(blog.coverImage);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
  }

  // Delete all comments first
  await prisma.comment.deleteMany({
    where: { blogId },
  });

  // Delete the blog
  await prisma.blog.delete({
    where: { id: blogId },
  });

  return { message: "Blog deleted successfully" };
};

// Like a blog
const likeBlog = async (blogId: string, userId: string) => {
  // Check if blog exists
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
  });

  if (!blog) {
    throw new AppError("Blog not found", httpStatus.NOT_FOUND);
  }

  // Check if user already liked this blog
  const existingLike = await prisma.blogLike.findUnique({
    where: {
      userId_blogId: {
        userId: userId,
        blogId: blogId,
      },
    },
  });

  let message = "";
  let hasLiked = false;

  if (existingLike) {
    // User already liked - remove the like
    await prisma.blogLike.delete({
      where: {
        userId_blogId: {
          userId: userId,
          blogId: blogId,
        },
      },
    });
    message = "Blog unliked successfully";
    hasLiked = false;
  } else {
    // Remove dislike if exists (can't have both)
    await prisma.blogDislike.deleteMany({
      where: {
        userId: userId,
        blogId: blogId,
      },
    });

    // Add new like
    await prisma.blogLike.create({
      data: {
        userId: userId,
        blogId: blogId,
      },
    });
    message = "Blog liked successfully";
    hasLiked = true;
  }

  // Get updated counts
  const likesCount = await prisma.blogLike.count({
    where: { blogId: blogId },
  });

  const dislikesCount = await prisma.blogDislike.count({
    where: { blogId: blogId },
  });

  return {
    message,
    likesCount,
    dislikesCount,
    hasLiked,
  };
};

// Dislike a blog
const disLikeBlog = async (blogId: string, userId: string) => {
  // Check if blog exists
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
  });

  if (!blog) {
    throw new AppError("Blog not found", httpStatus.NOT_FOUND);
  }

  // Check if user already disliked this blog
  const existingDislike = await prisma.blogDislike.findUnique({
    where: {
      userId_blogId: {
        userId: userId,
        blogId: blogId,
      },
    },
  });

  let message = "";
  let hasDisliked = false;

  if (existingDislike) {
    // User already disliked - remove the dislike
    await prisma.blogDislike.delete({
      where: {
        userId_blogId: {
          userId: userId,
          blogId: blogId,
        },
      },
    });
    message = "Blog undisliked successfully";
    hasDisliked = false;
  } else {
    // Remove like if exists (can't have both)
    await prisma.blogLike.deleteMany({
      where: {
        userId: userId,
        blogId: blogId,
      },
    });

    // Add new dislike
    await prisma.blogDislike.create({
      data: {
        userId: userId,
        blogId: blogId,
      },
    });
    message = "Blog disliked successfully";
    hasDisliked = true;
  }

  // Get updated counts
  const likesCount = await prisma.blogLike.count({
    where: { blogId: blogId },
  });

  const dislikesCount = await prisma.blogDislike.count({
    where: { blogId: blogId },
  });

  return {
    message,
    likesCount,
    dislikesCount,
    hasDisliked,
  };
};

// Flag a blog
const flagBlog = async (blogId: string, userId: string) => {
  // Check if blog exists
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
  });

  if (!blog) {
    throw new AppError("Blog not found", httpStatus.NOT_FOUND);
  }

  // Check if user already flagged this blog
  const existingFlag = await prisma.blogFlag.findUnique({
    where: {
      userId_blogId: {
        userId: userId,
        blogId: blogId,
      },
    },
  });

  let message = "";
  let hasFlagged = false;

  if (existingFlag) {
    // User already flagged - remove the flag
    await prisma.blogFlag.delete({
      where: {
        userId_blogId: {
          userId: userId,
          blogId: blogId,
        },
      },
    });
    message = "Blog unflagged successfully";
    hasFlagged = false;
  } else {
    // Add new flag
    await prisma.blogFlag.create({
      data: {
        userId: userId,
        blogId: blogId,
      },
    });
    message = "Blog flagged successfully";
    hasFlagged = true;
  }

  // Get updated flag count
  const flagsCount = await prisma.blogFlag.count({
    where: { blogId: blogId },
  });

  return {
    message,
    flagsCount,
    hasFlagged,
  };
};

// ADMIN: Get all blogs (including drafts)
const adminGetAllBlogs = async (params: BlogQueryParams) => {
  const pagination = paginationHelper({
    page: params.page,
    limit: params.limit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  const where: any = {};

  // Admin can see all statuses
  if (params.status) {
    where.status = params.status;
  }

  // Search
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { content: { contains: params.search, mode: "insensitive" } },
    ];
  }

  // Filter by category
  if (params.category) {
    where.category = params.category;
  }

  // Filter by author
  if (params.authorId) {
    where.createdById = params.authorId;
  }

  const total = await prisma.blog.count({ where });

  const blogs = await prisma.blog.findMany({
    where,
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
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
    blogs,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

// ADMIN: Update blog status only
const adminUpdateBlogStatus = async (
  blogId: string,
  data: AdminUpdateBlogInput,
  user: any,
) => {
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
  });

  if (!blog) {
    throw new AppError("Blog not found", httpStatus.NOT_FOUND);
  }

  // permission check
  const isAdmin = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;

  const isOwner = blog.createdById === user.id;

  if (!isAdmin && !isOwner) {
    throw new AppError(
      "You are not authorized to update this blog status",
      httpStatus.FORBIDDEN,
    );
  }

  const updatedBlog = await prisma.blog.update({
    where: { id: blogId },
    data: {
      status: data.status,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
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

  return updatedBlog;
};

// ADMIN: Delete any blog
const adminDeleteBlog = async (blogId: string) => {
  const blog = await prisma.blog.findUnique({
    where: { id: blogId },
  });

  if (!blog) {
    throw new AppError("Blog not found", httpStatus.NOT_FOUND);
  }

  // Delete cover image from Cloudinary
  if (blog.coverImage) {
    const publicId = getPublicIdFromUrl(blog.coverImage);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
  }

  // Delete all comments
  await prisma.comment.deleteMany({
    where: { blogId },
  });

  // Delete the blog
  await prisma.blog.delete({
    where: { id: blogId },
  });

  return { message: "Blog deleted successfully by admin" };
};

// Get blog categories
const getBlogCategories = async () => {
  const categories = await prisma.blog.findMany({
    where: {
      status: "PUBLISHED",
    },
    select: {
      category: true,
    },
    distinct: ["category"],
    orderBy: {
      category: "asc",
    },
  });

  return categories.map((b) => b.category);
};

export const blogService = {
  createBlog,
  getAllBlogs,
  getBlogById,
  getMyBlogs,
  updateBlog,
  deleteBlog,
  adminGetAllBlogs,
  adminUpdateBlogStatus,
  adminDeleteBlog,
  likeBlog,
  disLikeBlog,
  flagBlog,
  getBlogCategories,
};
