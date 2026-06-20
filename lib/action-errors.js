export function createErrorResponse(message) {
  return {
    success: false,
    errors: {
      _form: [message],
    },
  };
}