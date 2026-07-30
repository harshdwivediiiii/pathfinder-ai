export const CREATED_AT_DESC = {
  createdAt: "desc",
};

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

export function applyPagination(page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const take = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const skip = (Math.max(1, page) - 1) * take;
  return { take, skip };
}