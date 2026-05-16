import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { analyticsService } from "./analytics.service";

// Track an event (public - can be called without auth)
const trackEvent = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id; // Optional - can be anonymous
  const result = await analyticsService.trackEvent(userId, req.body);
  
  sendResponse(res, httpStatus.CREATED, "Event tracked successfully", result);
});

// Get analytics with filters (Admin only)
const getAnalytics = catchAsync(async (req: Request, res: Response) => {
  const userRole = req.user!.role;
  const query = {
    eventType: req.query.eventType as string,
    userId: req.query.userId as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  };
  
  const result = await analyticsService.getAnalytics(query, userRole);
  sendResponse(res, httpStatus.OK, "Analytics fetched successfully", result.analytics, result.meta);
});

// Get analytics statistics (Admin only)
const getAnalyticsStats = catchAsync(async (req: Request, res: Response) => {
  const userRole = req.user!.role;
  const days = req.query.days ? Number(req.query.days) : 7;
  const result = await analyticsService.getAnalyticsStats(days, userRole);
  
  sendResponse(res, httpStatus.OK, "Analytics stats fetched successfully", result);
});

// Get my own activity
const getMyActivity = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const query = {
    eventType: req.query.eventType as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  };
  
  const result = await analyticsService.getMyActivity(userId, query);
  sendResponse(res, httpStatus.OK, "My activity fetched successfully", result.activity, result.meta);
});

// Get dashboard stats (Admin only)
const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const userRole = req.user!.role;
  const result = await analyticsService.getDashboardStats(userRole);
  
  sendResponse(res, httpStatus.OK, "Dashboard stats fetched successfully", result);
});

export const analyticsController = {
  trackEvent,
  getAnalytics,
  getAnalyticsStats,
  getMyActivity,
  getDashboardStats,
};