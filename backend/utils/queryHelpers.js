// Helpers for turning raw query-string input into safe database queries.
// (Search text is matched literally by the { $contains: text } filter, see db/model.js.)

// First value of a query parameter as a trimmed string ("?search=a&search=b" arrives as an array).
export const queryString = (value) => {
  if (value === undefined || value === null) return '';
  return String(Array.isArray(value) ? value[0] : value).trim();
};

// Page number >= 1 and page size between 1 and maxLimit; anything invalid falls back to the defaults.
export const parsePagination = (page, limit, { defaultLimit = 12, maxLimit = 100 } = {}) => {
  const pageNum = Math.floor(Number(queryString(page)));
  const limitNum = Math.floor(Number(queryString(limit)));
  const safePage = Number.isFinite(pageNum) && pageNum >= 1 ? pageNum : 1;
  const safeLimit = Number.isFinite(limitNum) && limitNum >= 1 ? Math.min(limitNum, maxLimit) : defaultLimit;
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
};
