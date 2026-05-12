// Helper to build search conditions for different models

interface SearchCondition {
  contains: string;
  mode: "insensitive";
}

const buildSearchCondition = (searchTerm: string): SearchCondition => {
  return {
    contains: searchTerm,
    mode: "insensitive",
  };
};

// User search - searches by name and email
const buildUserSearch = (search?: string) => {
  if (!search) return {};

  return {
    OR: [
      { name: buildSearchCondition(search) },
      { email: buildSearchCondition(search) },
    ],
  };
};

// Product search - searches by title and origin
const buildProductSearch = (search?: string) => {
  if (!search) return {};

  return {
    OR: [
      { title: buildSearchCondition(search) },
      { origin: buildSearchCondition(search) },
    ],
  };
};

export { buildSearchCondition, buildUserSearch, buildProductSearch };