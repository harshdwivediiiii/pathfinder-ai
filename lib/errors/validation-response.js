export function createValidationResponse(message) {
  return {
    success: false,
    errors: {
      _form: [message],
    },
  };
}