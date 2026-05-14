export interface CreateBlogInput {
  title: string;
  content: string;
  coverImage?: string;
  tags: string[];
  category: string;
}

export interface UpdateBlogInput {
  title?: string;
  content?: string;
  coverImage?: string;
  tags?: string[];
  category?: string;
}

export interface BlogQueryParams {
  search?: string;
  category?: string;
  status?: string;
  tags?: string;
  authorId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface AdminUpdateBlogInput {
  status?: "PUBLISHED" | "DRAFT";
}