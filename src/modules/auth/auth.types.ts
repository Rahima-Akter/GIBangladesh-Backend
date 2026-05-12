import { Role } from "../../../generated/prisma/enums";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
  };
  token: string;
}

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export interface UpdateProfileData {
  name?: string;
  bio?: string | null;
  address?: string | null;
}

export interface UserQueryParams {
  search?: string;
  role?: string;
  status?: string; // "ACTIVE" | "DELETED" | "SUSPENDED" | "ALL"
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}