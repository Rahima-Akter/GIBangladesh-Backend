export interface CreateCommentInput {
  content: string;
  productId?: string;
  blogId?: string;
  parentId?: string;
}

export interface UpdateCommentInput {
  content?: string;
}

export interface CommentQueryParams {
  productId?: string;
  blogId?: string;
  parentId?: string;
  hasFlags?: boolean;  // Filter by flagged comments (flagCount > 0)
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CommentWithCounts {
  id: string;
  content: string;
  userId: string;
  productId?: string | null;
  blogId?: string | null;
  parentId?: string | null;
  likesCount: number;
  dislikesCount: number;
  flagsCount: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    image?: string | null;
  };
  replies?: CommentWithCounts[];
}