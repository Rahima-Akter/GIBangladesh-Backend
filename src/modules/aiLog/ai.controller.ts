import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { aiService } from "./ai.service";

// Generate content
const generateContent = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await aiService.generateContent(userId, req.body);
  
  sendResponse(res, httpStatus.OK, "Content generated successfully", {
    generated: result.result,
    tokensUsed: result.tokensUsed,
  });
});

// Rewrite text
const rewriteText = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await aiService.rewriteText(userId, req.body);
  
  sendResponse(res, httpStatus.OK, "Text rewritten successfully", {
    rewritten: result.result,
    tokensUsed: result.tokensUsed,
  });
});

// Generate hashtags
const generateHashtags = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await aiService.generateHashtags(userId, req.body);
  
  sendResponse(res, httpStatus.OK, "Hashtags generated successfully", {
    hashtags: result.hashtags,
    formatted: result.result,
    tokensUsed: result.tokensUsed,
  });
});

// Chat assistant
const chat = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await aiService.chat(userId, req.body);
  
  sendResponse(res, httpStatus.OK, "AI response received", {
    response: result.result,
    tokensUsed: result.tokensUsed,
  });
});

// Get usage stats
const getUsageStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const days = req.query.days ? Number(req.query.days) : 7;
  const stats = await aiService.getUsageStats(userId, days);
  
  sendResponse(res, httpStatus.OK, "Usage statistics fetched successfully", stats);
});

export const aiController = {
  generateContent,
  rewriteText,
  generateHashtags,
  chat,
  getUsageStats,
};