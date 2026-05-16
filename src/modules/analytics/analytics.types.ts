export interface TrackEventInput {
  eventType: "PRODUCT_VIEW" | "BLOG_VIEW" | "PRODUCT_LIKE" | "BLOG_LIKE" | "COMMENT_CREATED" | "AI_USED";
  entityId?: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsQueryParams {
  eventType?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AnalyticsStats {
  totalEvents: number;
  uniqueUsers: number;
  eventsByType: {
    PRODUCT_VIEW: number;
    BLOG_VIEW: number;
    PRODUCT_LIKE: number;
    BLOG_LIKE: number;
    COMMENT_CREATED: number;
    AI_USED: number;
  };
  topProducts?: Array<{
    productId: string;
    views: number;
  }>;
  topBlogs?: Array<{
    blogId: string;
    views: number;
  }>;
  dailyActivity: Array<{
    date: string;
    count: number;
  }>;
}