export function createAiValidationError() {
  return {
    success: false,
    errors: {
      _form: ["AI returned an invalid response format. Please try again."],
    },
  };
}