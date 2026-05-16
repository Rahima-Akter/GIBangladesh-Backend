import { prisma } from "../../lib/prisma";
import { AppError } from "../../middlewares/globalErrorHandler";
import httpStatus from "http-status";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  GenerateContentInput,
  RewriteTextInput,
  GenerateHashtagsInput,
  ChatInput,
  UsageStats,
} from "./ai.types";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Helper to check rate limits (50 calls per day per user)
const checkRateLimit = async (userId: string): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayCalls = await prisma.aiLog.count({
    where: {
      userId: userId,
      createdAt: {
        gte: today,
      },
    },
  });

  if (todayCalls >= 50) {
    throw new AppError(
      "Daily limit of 50 AI calls reached. Please try again tomorrow.",
      httpStatus.TOO_MANY_REQUESTS,
    );
  }
};

// Helper to save AI log
const saveAiLog = async (
  userId: string,
  featureType: string,
  prompt: string,
  response: string,
  tokensUsed?: number,
  isSuccess: boolean = true,
  errorMessage?: string,
) => {
  await prisma.aiLog.create({
    data: {
      userId,
      featureType: featureType as any,
      prompt,
      response,
      tokensUsed,
      isSuccess,
      errorMessage,
    },
  });
};

// Helper to count tokens (approximate for Gemini)
const countTokens = (text: string): number => {
  // Gemini doesn't provide exact token counts in free tier
  // Approximate: ~4 characters per token
  return Math.ceil(text.length / 4);
};

// Generate content
const generateContent = async (userId: string, data: GenerateContentInput) => {
  await checkRateLimit(userId);

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp", // Using latest free model
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });

    const prompt = `You are a helpful assistant that generates high-quality content about Bangladeshi GI (Geographical Indication) products, culture, and heritage.\n\nUser request: ${data.prompt}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const tokensUsed = countTokens(prompt + response);

    await saveAiLog(
      userId,
      "CONTENT_GENERATOR",
      data.prompt,
      response,
      tokensUsed,
      true,
    );

    return {
      result: response,
      tokensUsed,
    };
  } catch (error: any) {
    await saveAiLog(
      userId,
      "CONTENT_GENERATOR",
      data.prompt,
      "",
      undefined,
      false,
      error.message,
    );
    throw new AppError(
      "Failed to generate content. Please try again.",
      httpStatus.INTERNAL_SERVER_ERROR,
    );
  }
};

// Rewrite text
const rewriteText = async (userId: string, data: RewriteTextInput) => {
  await checkRateLimit(userId);

  const toneGuide = {
    professional: "Make it professional, formal, and business-appropriate.",
    casual: "Make it casual, conversational, and friendly.",
    friendly: "Make it warm, approachable, and kind.",
    formal: "Make it very formal, respectful, and proper.",
  };

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    const prompt = `You are a text rewriting assistant. Rewrite the following text to be ${data.tone} in tone. ${toneGuide[data.tone || "professional"]} Keep the original meaning but improve the wording.

Original text: "${data.text}"

Rewritten text:`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const tokensUsed = countTokens(prompt + response);

    await saveAiLog(
      userId,
      "TEXT_REWRITER",
      `Rewrite text (${data.tone} tone): ${data.text.substring(0, 100)}...`,
      response,
      tokensUsed,
      true,
    );

    return {
      result: response,
      tokensUsed,
    };
  } catch (error: any) {
    await saveAiLog(
      userId,
      "TEXT_REWRITER",
      `Rewrite text: ${data.text.substring(0, 100)}...`,
      "",
      undefined,
      false,
      error.message,
    );
    throw new AppError(
      "Failed to rewrite text. Please try again.",
      httpStatus.INTERNAL_SERVER_ERROR,
    );
  }
};

// Generate hashtags
const generateHashtags = async (
  userId: string,
  data: GenerateHashtagsInput,
) => {
  await checkRateLimit(userId);

  const count = data.count || 10;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 200,
      },
    });

    const prompt = `You are a hashtag generator for Bangladeshi GI products, culture, and content. Generate exactly ${count} relevant hashtags for the given topic. Return only the hashtags as a comma-separated list without any additional text. Make hashtags trend-friendly and relevant.

Topic: ${data.topic}

Hashtags:`;

    const result = await model.generateContent(prompt);
    let response = result.response.text();
    const tokensUsed = countTokens(prompt + response);

    // Clean up response - split by commas and format
    let hashtags = response.split(",").map((tag) => tag.trim());
    hashtags = hashtags.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));

    const formattedResponse = hashtags.join(", ");

    await saveAiLog(
      userId,
      "HASHTAG_GENERATOR",
      `Generate ${count} hashtags for: ${data.topic}`,
      formattedResponse,
      tokensUsed,
      true,
    );

    return {
      result: formattedResponse,
      hashtags,
      tokensUsed,
    };
  } catch (error: any) {
    await saveAiLog(
      userId,
      "HASHTAG_GENERATOR",
      `Generate hashtags for: ${data.topic}`,
      "",
      undefined,
      false,
      error.message,
    );
    throw new AppError(
      "Failed to generate hashtags. Please try again.",
      httpStatus.INTERNAL_SERVER_ERROR,
    );
  }
};

// Chat assistant
const chat = async (userId: string, data: ChatInput) => {
  await checkRateLimit(userId);

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });

    const prompt = `You are a helpful AI assistant for a Bangladeshi GI (Geographical Indication) products platform. 
You help users with information about:
- GI products of Bangladesh (Jamdani, Hilsa, Khajur, etc.)
- Product details, origins, cultural significance
- Blog writing assistance
- Content creation for products
- General questions about Bangladeshi culture and heritage

Be friendly, informative, and culturally knowledgeable.

User message: ${data.message}

Your response:`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const tokensUsed = countTokens(prompt + response);

    await saveAiLog(
      userId,
      "CHAT_ASSISTANT",
      data.message,
      response,
      tokensUsed,
      true,
    );

    return {
      result: response,
      tokensUsed,
    };
  } catch (error: any) {
    await saveAiLog(
      userId,
      "CHAT_ASSISTANT",
      data.message,
      "",
      undefined,
      false,
      error.message,
    );
    throw new AppError(
      "Failed to get response from AI assistant. Please try again.",
      httpStatus.INTERNAL_SERVER_ERROR,
    );
  }
};

// Get usage statistics
const getUsageStats = async (
  userId: string,
  days: number = 7,
): Promise<UsageStats> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allLogs = await prisma.aiLog.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
      },
    },
  });

  const todayLogs = await prisma.aiLog.findMany({
    where: {
      userId,
      createdAt: {
        gte: today,
      },
    },
  });

  const totalCalls = allLogs.length;
  const totalTokens = allLogs.reduce(
    (sum, log) => sum + (log.tokensUsed || 0),
    0,
  );
  const todayCalls = todayLogs.length;

  // Calculate by feature
  const byFeature = {
    CONTENT_GENERATOR: { calls: 0, tokens: 0 },
    TEXT_REWRITER: { calls: 0, tokens: 0 },
    HASHTAG_GENERATOR: { calls: 0, tokens: 0 },
    CHAT_ASSISTANT: { calls: 0, tokens: 0 },
  };

  allLogs.forEach((log) => {
    const feature = log.featureType;
    byFeature[feature].calls++;
    byFeature[feature].tokens += log.tokensUsed || 0;
  });

  return {
    totalCalls,
    totalTokens,
    byFeature,
    todayCalls,
    remainingToday: Math.max(0, 50 - todayCalls),
  };
};

export const aiService = {
  generateContent,
  rewriteText,
  generateHashtags,
  chat,
  getUsageStats,
};
