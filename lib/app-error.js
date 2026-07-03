export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = true; // Indicates it's an expected, safe error
  }
}
