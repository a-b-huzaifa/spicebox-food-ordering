// An error that carries an HTTP status. Anything thrown as an AppError is
// an "expected" failure (bad input, not found...) and is returned to the
// client as-is; anything else becomes a generic 500.
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(400, message, 'BAD_REQUEST', details);
  }
  static unauthorized(message = 'Not authenticated'): AppError {
    return new AppError(401, message, 'UNAUTHORIZED');
  }
  static forbidden(message = 'You do not have permission to do that'): AppError {
    return new AppError(403, message, 'FORBIDDEN');
  }
  static notFound(message = 'Resource not found'): AppError {
    return new AppError(404, message, 'NOT_FOUND');
  }
  static conflict(message: string): AppError {
    return new AppError(409, message, 'CONFLICT');
  }
}
