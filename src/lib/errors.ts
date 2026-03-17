export class OperationalError extends Error {
  public readonly isOperational = true;
  public readonly statusCode: number;
  public readonly code: string;

  constructor(
    message: string,
    statusCode: number = 400,
    code: string = "OPERATIONAL_ERROR",
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthenticationError extends OperationalError {
  constructor(
    message: string = "Authentication required",
    code: string = "AUTHENTICATION_REQUIRED",
  ) {
    super(message, 401, code);
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor(message: string = "Invalid credentials") {
    super(message, "INVALID_CREDENTIALS");
  }
}

export class ValidationError extends OperationalError {
  public readonly field?: string;
  public readonly details?: Record<string, string>;

  constructor(
    message: string,
    options: {
      field?: string;
      details?: Record<string, string>;
      code?: string;
    } = {},
  ) {
    super(message, 400, options.code ?? "VALIDATION_ERROR");
    this.field = options.field;
    this.details = options.details;
  }
}

export class ResourceNotFoundError extends OperationalError {
  public readonly resource: string;
  public readonly resourceId?: string;

  constructor(resource: string, resourceId?: string) {
    const message = resourceId
      ? `${resource} not found: ${resourceId}`
      : `${resource} not found`;
    super(message, 404, "RESOURCE_NOT_FOUND");
    this.resource = resource;
    this.resourceId = resourceId;
  }
}

export class ResourceConflictError extends OperationalError {
  public readonly resource: string;

  constructor(
    message: string,
    resource: string,
    code: string = "RESOURCE_CONFLICT",
  ) {
    super(message, 409, code);
    this.resource = resource;
  }
}

export class DuplicateResourceError extends ResourceConflictError {
  constructor(resource: string, message?: string) {
    super(
      message ?? `${resource} already exists`,
      resource,
      "DUPLICATE_RESOURCE",
    );
  }
}

export class BusinessRuleError extends OperationalError {
  constructor(
    message: string,
    code: string = "BUSINESS_RULE_VIOLATION",
    statusCode: number = 400,
  ) {
    super(message, statusCode, code);
  }
}

export class UserAlreadyExistsError extends DuplicateResourceError {
  constructor() {
    super("User", "A user with this email already exists");
  }
}

export class InvalidTokenError extends OperationalError {
  public readonly tokenType: string;

  constructor(tokenType: string = "token") {
    super(`Invalid ${tokenType}`, 400, "INVALID_TOKEN");
    this.tokenType = tokenType;
  }
}

export class TokenExpiredError extends OperationalError {
  public readonly tokenType: string;

  constructor(tokenType: string = "token") {
    super(`${tokenType} has expired`, 410, "TOKEN_EXPIRED");
    this.tokenType = tokenType;
  }
}

export class RateLimitError extends OperationalError {
  public readonly retryAfter?: number;

  constructor(message: string = "Too many requests", retryAfter?: number) {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
    this.retryAfter = retryAfter;
  }
}

export function isOperationalError(
  error: unknown,
): error is OperationalError {
  return (
    error instanceof Error &&
    "isOperational" in error &&
    (error as OperationalError).isOperational === true
  );
}

export function formatErrorResponse(error: unknown): {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
} {
  if (isOperationalError(error)) {
    const response: {
      message: string;
      code: string;
      details?: Record<string, unknown>;
    } = {
      message: error.message,
      code: error.code,
    };

    if (error instanceof ValidationError && error.details) {
      response.details = error.details;
    }

    return response;
  }

  return {
    message: "An unexpected error occurred",
    code: "INTERNAL_ERROR",
  };
}

export function getErrorStatusCode(error: unknown): number {
  if (isOperationalError(error)) {
    return error.statusCode;
  }
  return 500;
}
