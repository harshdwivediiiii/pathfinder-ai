export function createPaginatedResponse(data, total, page = 1, pageSize = 50) {
  return {
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
