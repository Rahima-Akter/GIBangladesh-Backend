import { prisma } from "../../lib/prisma";
import { auth } from "../../lib/auth";
import { createToken } from "../../utils/jwt";
import { AppError } from "../../middlewares/globalErrorHandler";
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from "../../utils/cloudinary";
import paginationHelper from "../../helpers/pagination.helper";
import { buildUserSearch } from "../../helpers/search.helper";
import { buildUserFilter } from "../../helpers/filter.helper";
import httpStatus from "http-status";
import { Role } from "../../../generated/prisma/enums";
import type {
  RegisterInput,
  LoginInput,
  AuthResponse,
  UpdateProfileData,
  UserQueryParams,
} from "./auth.types";

// Register a new user
const register = async (data: RegisterInput): Promise<AuthResponse> => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError(
      "A user with this email already exists",
      httpStatus.CONFLICT
    );
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
      },
    });

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError(
        "User registration failed",
        httpStatus.INTERNAL_SERVER_ERROR
      );
    }

    const token = createToken({
      id: user.id,
      email: user.email,
      role: "USER",
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: "USER",
        image: user.image,
      },
      token,
    };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error.message || "Registration failed",
      httpStatus.BAD_REQUEST
    );
  }
};

// Login user
const login = async (data: LoginInput): Promise<AuthResponse> => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new AppError("Invalid email or password", httpStatus.UNAUTHORIZED);
  }

  if (user.isDeleted) {
    throw new AppError(
      "This account has been deactivated. Please contact support.",
      httpStatus.FORBIDDEN
    );
  }

  try {
    await auth.api.signInEmail({
      body: {
        email: data.email,
        password: data.password,
      },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!updatedUser) {
      throw new AppError("Login failed", httpStatus.INTERNAL_SERVER_ERROR);
    }

    // Need to check role from somewhere - for now default to USER
    // You'll need to add a role field or table to manage roles
    const role = "USER";

    const token = createToken({
      id: updatedUser.id,
      email: updatedUser.email,
      role: role,
    });

    return {
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: role,
        image: updatedUser.image,
      },
      token,
    };
  } catch (error: any) {
    throw new AppError("Invalid email or password", httpStatus.UNAUTHORIZED);
  }
};

// Get current user profile
const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      address: true,
      image: true,
      emailVerified: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return user;
};

// Update own profile (with image handling)
const updateProfile = async (
  userId: string,
  data: UpdateProfileData,
  imageFile?: Express.Multer.File
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  let imageUrl: string | undefined;
  let oldPublicId: string | null = null;

  try {
    if (imageFile) {
      const uploadResult = await uploadToCloudinary(
        imageFile.path,
        "gi-bangladesh/users"
      );
      imageUrl = uploadResult.secure_url;

      if (user.image) {
        oldPublicId = getPublicIdFromUrl(user.image);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name !== undefined ? data.name : user.name,
        bio: data.bio !== undefined ? data.bio : user.bio,
        address: data.address !== undefined ? data.address : user.address,
        ...(imageUrl && { image: imageUrl }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        address: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (oldPublicId) {
      await deleteFromCloudinary(oldPublicId);
    }

    return updatedUser;
  } catch (error) {
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
      "Failed to update profile",
      httpStatus.INTERNAL_SERVER_ERROR
    );
  }
};

// Logout
const logout = async () => {
  return { message: "Logged out successfully" };
};

// Soft delete own account (USER can only delete own account)
const deleteOwnAccount = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isDeleted: true,
    },
  });

  return { message: "Account deleted successfully" };
};

// ADMIN & SUPER_ADMIN: Get all users with search, filter, pagination
const getAllUsers = async (params: UserQueryParams) => {
  const pagination = paginationHelper({
    page: params.page,
    limit: params.limit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  const where: any = {};

  // Add search conditions (name, email)
  const searchConditions = buildUserSearch(params.search);
  if (Object.keys(searchConditions).length > 0) {
    Object.assign(where, searchConditions);
  }

  // Add filter conditions (role, status)
  const filterConditions = buildUserFilter({
    role: params.role,
    status: params.status,
  });
  if (Object.keys(filterConditions).length > 0) {
    Object.assign(where, filterConditions);
  }

  const total = await prisma.user.count({ where });

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      address: true,
      emailVerified: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          products: true,
          blogs: true,
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
    users,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
};

// ADMIN & SUPER_ADMIN: Get single user by ID
const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      address: true,
      emailVerified: true,
      isDeleted: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          products: true,
          blogs: true,
          comments: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  return user;
};

// ADMIN & SUPER_ADMIN: Update any user
const updateUserByAdmin = async (
  userId: string,
  data: { name?: string; role?: string; bio?: string | null; address?: string | null }
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name !== undefined ? data.name : user.name,
      bio: data.bio !== undefined ? data.bio : user.bio,
      address: data.address !== undefined ? data.address : user.address,
    },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      address: true,
      image: true,
      isDeleted: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

// ADMIN & SUPER_ADMIN: Soft delete any user
const softDeleteUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  if (user.isDeleted) {
    throw new AppError("User is already deleted", httpStatus.BAD_REQUEST);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isDeleted: true,
    },
  });

  return { message: "User soft deleted successfully" };
};

// ADMIN & SUPER_ADMIN: Revive soft deleted user
const reviveUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  if (!user.isDeleted) {
    throw new AppError("User is already active", httpStatus.BAD_REQUEST);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isDeleted: false,
    },
  });

  return { message: "User revived successfully" };
};

// ADMIN & SUPER_ADMIN: Hard delete user (permanent)
const hardDeleteUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  // Delete user's image from Cloudinary
  if (user.image) {
    const publicId = getPublicIdFromUrl(user.image);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
  }

  // Delete user (cascade will handle related records based on your schema)
  await prisma.user.delete({
    where: { id: userId },
  });

  return { message: "User permanently deleted successfully" };
};

export const authService = {
  register,
  login,
  getProfile,
  updateProfile,
  logout,
  deleteOwnAccount,
  getAllUsers,
  getUserById,
  updateUserByAdmin,
  softDeleteUser,
  reviveUser,
  hardDeleteUser,
};