interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

const paginationHelper = (params: PaginationParams): PaginationResult => {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const sortBy = params.sortBy || "createdAt";
  const sortOrder = params.sortOrder || "desc";

  const skip = (page - 1) * limit;

  return {
    skip,
    take: limit,
    page,
    limit,
    sortBy,
    sortOrder,
  };
};

export default paginationHelper;