import { prisma } from "../../lib/prisma";
import { AppError } from "../../middlewares/globalErrorHandler";
import httpStatus from "http-status";
import type { TrackEventInput, AnalyticsQueryParams, AnalyticsStats } from "./analytics.types";

// Track an event
const trackEvent = async (userId: string | undefined, data: TrackEventInput) => {
  // Create analytics record
  const analytics = await prisma.analytics.create({
    data: {
      userId: userId,
      eventType: data.eventType,
      entityId: data.entityId,
      metadata: data.metadata || {},
    },
  });

  return analytics;
};

// Get analytics with filters (Admin only)
const getAnalytics = async (query: AnalyticsQueryParams, userRole: string) => {
  // Check if user is admin or super admin
  if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
    throw new AppError(
      "Only admins can view analytics",
      httpStatus.FORBIDDEN
    );
  }

  const {
    eventType,
    userId,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = query;

  // Build where conditions
  const where: any = {};

  if (eventType) {
    where.eventType = eventType;
  }

  if (userId) {
    where.userId = userId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Get total count
  const total = await prisma.analytics.count({ where });

  // Get analytics records
  const analytics = await prisma.analytics.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: limit,
  });

  return {
    analytics,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get analytics statistics (Admin only)
const getAnalyticsStats = async (days: number = 7, userRole: string): Promise<AnalyticsStats> => {
  // Check if user is admin or super admin
  if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
    throw new AppError(
      "Only admins can view analytics stats",
      httpStatus.FORBIDDEN
    );
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Get all events in date range
  const events = await prisma.analytics.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
  });

  // Get unique users
  const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean)).size;

  // Count events by type
  const eventsByType = {
    PRODUCT_VIEW: 0,
    BLOG_VIEW: 0,
    PRODUCT_LIKE: 0,
    BLOG_LIKE: 0,
    COMMENT_CREATED: 0,
    AI_USED: 0,
  };

  events.forEach(event => {
    eventsByType[event.eventType]++;
  });

  // Get top viewed products
  const productViews = events
    .filter(e => e.eventType === "PRODUCT_VIEW" && e.entityId)
    .reduce((acc, e) => {
      const id = e.entityId!;
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topProducts = Object.entries(productViews)
    .map(([productId, views]) => ({ productId, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Get top viewed blogs
  const blogViews = events
    .filter(e => e.eventType === "BLOG_VIEW" && e.entityId)
    .reduce((acc, e) => {
      const id = e.entityId!;
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topBlogs = Object.entries(blogViews)
    .map(([blogId, views]) => ({ blogId, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Get daily activity
  const dailyMap = new Map<string, number>();
  
  events.forEach(event => {
    const date = event.createdAt.toISOString().split('T')[0];
    dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
  });

  const dailyActivity = Array.from(dailyMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalEvents: events.length,
    uniqueUsers,
    eventsByType,
    topProducts,
    topBlogs,
    dailyActivity,
  };
};

// Get user's own activity
const getMyActivity = async (userId: string, query: AnalyticsQueryParams) => {
  const {
    eventType,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = query;

  // Build where conditions
  const where: any = {
    userId: userId,
  };

  if (eventType) {
    where.eventType = eventType;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Get total count
  const total = await prisma.analytics.count({ where });

  // Get user's activity
  const activity = await prisma.analytics.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: limit,
  });

  return {
    activity,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get dashboard stats (for admin dashboard)
const getDashboardStats = async (userRole: string) => {
  // Check if user is admin or super admin
  if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
    throw new AppError(
      "Only admins can view dashboard stats",
      httpStatus.FORBIDDEN
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  lastWeek.setHours(0, 0, 0, 0);

  // Get counts
  const [
    totalProducts,
    totalBlogs,
    totalUsers,
    totalComments,
    todayEvents,
    lastWeekEvents,
  ] = await Promise.all([
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.blog.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count({ where: { isDeleted: false } }),
    prisma.comment.count(),
    prisma.analytics.count({ where: { createdAt: { gte: today } } }),
    prisma.analytics.count({ where: { createdAt: { gte: lastWeek } } }),
  ]);

  // Get engagement rate (likes + comments) / total views
  const totalViews = await prisma.analytics.count({
    where: {
      eventType: { in: ["PRODUCT_VIEW", "BLOG_VIEW"] },
    },
  });

  const totalEngagements = await prisma.analytics.count({
    where: {
      eventType: { in: ["PRODUCT_LIKE", "BLOG_LIKE", "COMMENT_CREATED"] },
    },
  });

  const engagementRate = totalViews > 0 
    ? ((totalEngagements / totalViews) * 100).toFixed(2)
    : "0";

  return {
    overview: {
      totalProducts,
      totalBlogs,
      totalUsers,
      totalComments,
    },
    analytics: {
      totalEvents: lastWeekEvents,
      todayEvents,
      engagementRate: `${engagementRate}%`,
    },
  };
};

export const analyticsService = {
  trackEvent,
  getAnalytics,
  getAnalyticsStats,
  getMyActivity,
  getDashboardStats,
};