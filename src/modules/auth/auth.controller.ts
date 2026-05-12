import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { authService } from "./auth.service";

// Register
const register = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);

  res.cookie("token", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, httpStatus.CREATED, "User registered successfully", {
    user: result.user,
    token: result.token,
  });
});

// Login
const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);

  res.cookie("token", result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, httpStatus.OK, "Logged in successfully", {
    user: result.user,
    token: result.token,
  });
});

// Get own profile
const getProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await authService.getProfile(userId);

  sendResponse(res, httpStatus.OK, "Profile fetched successfully", { user });
});

// Update own profile
const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const imageFile = req.file;

  const updated = await authService.updateProfile(userId, req.body, imageFile);

  sendResponse(res, httpStatus.OK, "Profile updated successfully", { user: updated });
});

// Logout
const logout = catchAsync(async (req: Request, res: Response) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    expires: new Date(0),
  });

  sendResponse(res, httpStatus.OK, "Logged out successfully");
});

// Delete own account
const deleteOwnAccount = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await authService.deleteOwnAccount(userId);

  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    expires: new Date(0),
  });

  sendResponse(res, httpStatus.OK, "Account deleted successfully");
});

// ADMIN: Get all users
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.getAllUsers(req.query);

  sendResponse(
    res,
    httpStatus.OK,
    "Users fetched successfully",
    result.users,
    result.meta
  );
});

// ADMIN: Get single user
const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = await authService.getUserById(userId as string);

  sendResponse(res, httpStatus.OK, "User fetched successfully", { user });
});

// ADMIN: Update any user
const updateUserByAdmin = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const updated = await authService.updateUserByAdmin(userId as string, req.body);

  sendResponse(res, httpStatus.OK, "User updated successfully", { user: updated });
});

// ADMIN: Soft delete user
const softDeleteUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const result = await authService.softDeleteUser(userId as string);

  sendResponse(res, httpStatus.OK, result.message);
});

// ADMIN: Revive user
const reviveUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const result = await authService.reviveUser(userId as string);

  sendResponse(res, httpStatus.OK, result.message);
});

// ADMIN: Hard delete user
const hardDeleteUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const result = await authService.hardDeleteUser(userId as string);

  sendResponse(res, httpStatus.OK, result.message);
});

export const authController = {
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