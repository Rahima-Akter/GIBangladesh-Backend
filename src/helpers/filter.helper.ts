// Helper to build filter conditions

// Product filters
interface ProductFilterParams {
  category?: string;
  origin?: string;
  registeredYear?: number;
  status?: string;
}

const buildProductFilter = (filters: ProductFilterParams) => {
  const where: any = {};

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.origin) {
    where.origin = {
      contains: filters.origin,
      mode: "insensitive",
    };
  }

  if (filters.registeredYear) {
    where.registeredYear = filters.registeredYear;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  return where;
};

// User filters
interface UserFilterParams {
  role?: string;
  status?: string; // "ACTIVE" | "DELETED" | "SUSPENDED" | "ALL"
}

const buildUserFilter = (filters: UserFilterParams) => {
  const where: any = {};

  // Filter by role
  if (filters.role) {
    where.role = filters.role;
  }

  // Filter by status
  if (filters.status) {
    switch (filters.status) {
      case "DELETED":
        where.isDeleted = true;
        break;
      case "SUSPENDED":
        where.isDeleted = true; // We'll need to add isSuspended field if needed
        break;
      case "ACTIVE":
        where.isDeleted = false;
        break;
      case "ALL":
        // Don't add any isDeleted filter
        break;
      default:
        // Default to show only active users
        where.isDeleted = false;
    }
  } else {
    // If no status specified, show only active users
    where.isDeleted = false;
  }

  return where;
};

export { buildProductFilter, buildUserFilter };