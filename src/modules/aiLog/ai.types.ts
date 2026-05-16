export interface GenerateContentInput {
  prompt: string;
}

export interface RewriteTextInput {
  text: string;
  tone?: "professional" | "casual" | "friendly" | "formal";
}

export interface GenerateHashtagsInput {
  topic: string;
  count?: number;
}

export interface ChatInput {
  message: string;
}

export interface AIResponse {
  success: boolean;
  data: {
    result: string;
    tokensUsed?: number;
  };
}

export interface UsageStats {
  totalCalls: number;
  totalTokens: number;
  byFeature: {
    CONTENT_GENERATOR: { calls: number; tokens: number };
    TEXT_REWRITER: { calls: number; tokens: number };
    HASHTAG_GENERATOR: { calls: number; tokens: number };
    CHAT_ASSISTANT: { calls: number; tokens: number };
  };
  todayCalls: number;
  remainingToday: number;
}