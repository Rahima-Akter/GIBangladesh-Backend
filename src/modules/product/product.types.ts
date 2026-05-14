export interface CreateProductInput {
  title: string;
  description: string;
  origin: string;
  coverImage: string;  
  culturalSignificancehistory: string;
  detaildDescription: string;
  category: string;
  giRegistrationNumber: string;
  registeredYear: number;
  craftingSteps: string[];
  tags: string[];
}

export interface UpdateProductInput {
  title?: string;
  description?: string;
  coverImage?: string;
  origin?: string;
  culturalSignificancehistory?: string;
  detaildDescription?: string;
  category?: string;
  giRegistrationNumber?: string;
  registeredYear?: number;
  isVerified?: boolean;
  status?: "ACTIVE" | "INACTIVE";
  craftingSteps?: string[];
  tags?: string[];
}

export interface ProductQueryParams {
  search?: string;
  category?: string;
  origin?: string;
  registeredYear?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ProductWithCounts {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  origin: string;
  culturalSignificancehistory: string;
  detaildDescription: string;
  category: string;
  giRegistrationNumber: string;
  registeredYear: number;
  isVerified: boolean;
  status: string;
  craftingSteps: string[];
  tags: string[];
  views: number;
  likesCount: number;
  dislikesCount: number;
  flagsCount: number;
  createdBy: {
    id: string;
    name: string;
    image?: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}