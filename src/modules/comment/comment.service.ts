import { prisma } from "../../lib/prisma";
import { AppError } from "../../middlewares/globalErrorHandler";
import httpStatus from "http-status";
import type { CreateCommentInput, UpdateCommentInput, CommentQueryParams } from "./comment.types";
import paginationHelper from "../../helpers/pagination.helper";

// Get all comments (Admin only)
const getAllComments = async (query: CommentQueryParams, userRole: string) => {
  // Check if user is admin or super admin
  if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
    throw new AppError(
      "Only admins can view all comments",
      httpStatus.FORBIDDEN
    );
  }

  const {
    productId,
    blogId,
    parentId,
    hasFlags,
    sortBy = "createdAt",
    sortOrder = "desc",
    page = 1,
    limit = 10,
  } = query;

  // Build where conditions
  const where: any = {};

  if (productId) {
    where.productId = productId;
  }

  if (blogId) {
    where.blogId = blogId;
  }

  if (parentId !== undefined) {
    where.parentId = parentId;
  }

  // Filter by flagged comments (flagCount > 0)
  if (hasFlags) {
    where.flags = {
      some: {}, // Has at least one flag
    };
  }

  // Get pagination
  const { skip, take, page: currentPage, limit: currentLimit } = paginationHelper({
    page,
    limit,
    sortBy,
    sortOrder,
  });

  // Get total count
  const total = await prisma.comment.count({ where });

  // Get comments with counts
  const comments = await prisma.comment.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
        },
      },
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    skip,
    take,
  });

  // Add counts to each comment
  const commentsWithCounts = await Promise.all(
    comments.map(async (comment) => {
      const [likesCount, dislikesCount, flagsCount] = await Promise.all([
        prisma.commentLike.count({ where: { commentId: comment.id } }),
        prisma.commentDislike.count({ where: { commentId: comment.id } }),
        prisma.commentFlag.count({ where: { commentId: comment.id } }),
      ]);

      return {
        ...comment,
        likesCount,
        dislikesCount,
        flagsCount,
      };
    })
  );

  return {
    comments: commentsWithCounts,
    meta: {
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages: Math.ceil(total / currentLimit),
    },
  };
};

// Get a specific comment (with role-based access)
const getCommentById = async (commentId: string, userId: string, userRole: string) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
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
  });

  if (!comment) {
    throw new AppError("Comment not found", httpStatus.NOT_FOUND);
  }

  // Check authorization - only owner, admin, or super admin can view
  const isOwner = comment.userId === userId;
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  if (!isOwner && !isAdmin) {
    throw new AppError(
      "You are not authorized to view this comment",
      httpStatus.FORBIDDEN
    );
  }

  // Get counts for main comment
  const [likesCount, dislikesCount, flagsCount] = await Promise.all([
    prisma.commentLike.count({ where: { commentId: comment.id } }),
    prisma.commentDislike.count({ where: { commentId: comment.id } }),
    prisma.commentFlag.count({ where: { commentId: comment.id } }),
  ]);

  // Get counts for replies
  const repliesWithCounts = await Promise.all(
    comment.replies.map(async (reply) => {
      const [replyLikes, replyDislikes, replyFlags] = await Promise.all([
        prisma.commentLike.count({ where: { commentId: reply.id } }),
        prisma.commentDislike.count({ where: { commentId: reply.id } }),
        prisma.commentFlag.count({ where: { commentId: reply.id } }),
      ]);

      return {
        ...reply,
        likesCount: replyLikes,
        dislikesCount: replyDislikes,
        flagsCount: replyFlags,
      };
    })
  );

  return {
    ...comment,
    replies: repliesWithCounts,
    likesCount,
    dislikesCount,
    flagsCount,
  };
};

// Create a new comment (any authenticated user)
const createComment = async (userId: string, data: CreateCommentInput) => {
  // Validate that comment belongs to either a product OR a blog, not both
  if (!data.productId && !data.blogId) {
    throw new AppError(
      "Comment must be associated with either a product or a blog",
      httpStatus.BAD_REQUEST
    );
  }

  if (data.productId && data.blogId) {
    throw new AppError(
      "Comment cannot be associated with both a product and a blog",
      httpStatus.BAD_REQUEST
    );
  }

  // If it's a reply, check if parent comment exists
  if (data.parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: data.parentId },
    });

    if (!parentComment) {
      throw new AppError("Parent comment not found", httpStatus.NOT_FOUND);
    }
  }

  // Create the comment
  const comment = await prisma.comment.create({
    data: {
      content: data.content,
      userId: userId,
      productId: data.productId,
      blogId: data.blogId,
      parentId: data.parentId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  return comment;
};

// Get comments for a product or blog (public)
const getComments = async (query: CommentQueryParams) => {
  const { productId, blogId, parentId = null, page = 1, limit = 10 } = query;

  // Build where conditions
  const where: any = {
    parentId: parentId,
  };

  if (productId) {
    where.productId = productId;
  }

  if (blogId) {
    where.blogId = blogId;
  }

  // Get pagination
  const { skip, take, page: currentPage, limit: currentLimit } = paginationHelper({
    page,
    limit,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Get total count
  const total = await prisma.comment.count({ where });

  // Get comments
  const comments = await prisma.comment.findMany({
    where,
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
      createdAt: "desc",
    },
    skip,
    take,
  });

  // Add counts to each comment
  const commentsWithCounts = await Promise.all(
    comments.map(async (comment) => {
      const [likesCount, dislikesCount, flagsCount] = await Promise.all([
        prisma.commentLike.count({ where: { commentId: comment.id } }),
        prisma.commentDislike.count({ where: { commentId: comment.id } }),
        prisma.commentFlag.count({ where: { commentId: comment.id } }),
      ]);

      // Get replies count
      const repliesCount = await prisma.comment.count({
        where: { parentId: comment.id },
      });

      return {
        ...comment,
        likesCount,
        dislikesCount,
        flagsCount,
        repliesCount,
      };
    })
  );

  return {
    comments: commentsWithCounts,
    meta: {
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages: Math.ceil(total / currentLimit),
    },
  };
};

// Update a comment (only owner)
const updateComment = async (commentId: string, userId: string, data: UpdateCommentInput) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new AppError("Comment not found", httpStatus.NOT_FOUND);
  }

  if (comment.userId !== userId) {
    throw new AppError("You are not authorized to update this comment", httpStatus.FORBIDDEN);
  }

  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: {
      content: data.content,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  return updatedComment;
};

// Delete a comment (owner, admin, or super admin)
const deleteComment = async (commentId: string, userId: string, userRole: string) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new AppError("Comment not found", httpStatus.NOT_FOUND);
  }

  // Check authorization
  const isOwner = comment.userId === userId;
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  if (!isOwner && !isAdmin) {
    throw new AppError(
      "You are not authorized to delete this comment",
      httpStatus.FORBIDDEN
    );
  }

  // Soft delete - update content
  await prisma.comment.update({
    where: { id: commentId },
    data: {
      content: "[This comment has been deleted]",
    },
  });

  // Also soft delete all replies
  await prisma.comment.updateMany({
    where: { parentId: commentId },
    data: {
      content: "[This comment has been deleted]",
    },
  });

  return { message: "Comment deleted successfully" };
};

// Like a comment (toggle)
const likeComment = async (commentId: string, userId: string) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new AppError("Comment not found", httpStatus.NOT_FOUND);
  }

  const existingLike = await prisma.commentLike.findUnique({
    where: {
      userId_commentId: {
        userId: userId,
        commentId: commentId,
      },
    },
  });

  let message = "";
  let hasLiked = false;

  if (existingLike) {
    await prisma.commentLike.delete({
      where: {
        userId_commentId: {
          userId: userId,
          commentId: commentId,
        },
      },
    });
    message = "Comment unliked successfully";
    hasLiked = false;
  } else {
    await prisma.commentDislike.deleteMany({
      where: {
        userId: userId,
        commentId: commentId,
      },
    });

    await prisma.commentLike.create({
      data: {
        userId: userId,
        commentId: commentId,
      },
    });
    message = "Comment liked successfully";
    hasLiked = true;
  }

  const [likesCount, dislikesCount] = await Promise.all([
    prisma.commentLike.count({ where: { commentId: commentId } }),
    prisma.commentDislike.count({ where: { commentId: commentId } }),
  ]);

  return {
    message,
    likesCount,
    dislikesCount,
    hasLiked,
  };
};

// Dislike a comment (toggle)
const disLikeComment = async (commentId: string, userId: string) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new AppError("Comment not found", httpStatus.NOT_FOUND);
  }

  const existingDislike = await prisma.commentDislike.findUnique({
    where: {
      userId_commentId: {
        userId: userId,
        commentId: commentId,
      },
    },
  });

  let message = "";
  let hasDisliked = false;

  if (existingDislike) {
    await prisma.commentDislike.delete({
      where: {
        userId_commentId: {
          userId: userId,
          commentId: commentId,
        },
      },
    });
    message = "Comment undisliked successfully";
    hasDisliked = false;
  } else {
    await prisma.commentLike.deleteMany({
      where: {
        userId: userId,
        commentId: commentId,
      },
    });

    await prisma.commentDislike.create({
      data: {
        userId: userId,
        commentId: commentId,
      },
    });
    message = "Comment disliked successfully";
    hasDisliked = true;
  }

  const [likesCount, dislikesCount] = await Promise.all([
    prisma.commentLike.count({ where: { commentId: commentId } }),
    prisma.commentDislike.count({ where: { commentId: commentId } }),
  ]);

  return {
    message,
    likesCount,
    dislikesCount,
    hasDisliked,
  };
};

// Flag a comment (toggle)
const flagComment = async (commentId: string, userId: string) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new AppError("Comment not found", httpStatus.NOT_FOUND);
  }

  const existingFlag = await prisma.commentFlag.findUnique({
    where: {
      userId_commentId: {
        userId: userId,
        commentId: commentId,
      },
    },
  });

  let message = "";
  let hasFlagged = false;

  if (existingFlag) {
    await prisma.commentFlag.delete({
      where: {
        userId_commentId: {
          userId: userId,
          commentId: commentId,
        },
      },
    });
    message = "Comment unflagged successfully";
    hasFlagged = false;
  } else {
    await prisma.commentFlag.create({
      data: {
        userId: userId,
        commentId: commentId,
      },
    });
    message = "Comment flagged successfully";
    hasFlagged = true;
  }

  const flagsCount = await prisma.commentFlag.count({
    where: { commentId: commentId },
  });

  return {
    message,
    flagsCount,
    hasFlagged,
  };
};

export const commentService = {
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