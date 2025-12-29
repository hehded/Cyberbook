/**
 * Error Handling Middleware
 * Follows Middleware Pattern and SOLID principles
 * Provides centralized error handling for all requests
 */
import { ResponseFactory } from '../factories/ResponseFactory.ts';

// Use global types for Request and Response
type Request = globalThis.Request;
type Response = globalThis.Response;

export interface ErrorHandlingOptions {
  logErrors?: boolean;
  showStackTrace?: boolean;
  customErrorHandlers?: Map<string, (error: Error) => Response>;
}

export function createErrorHandlingMiddleware(options: ErrorHandlingOptions = {}) {
  const {
    logErrors = true,
    showStackTrace = false,
    customErrorHandlers = new Map()
  } = options;

  return async (req: Request, next: () => Promise<Response>): Promise<Response> => {
    try {
      return await next();
    } catch (error) {
      // Log the error
      if (logErrors) {
        console.error('Request error:', {
          url: req.url,
          method: req.method,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: showStackTrace ? error.stack : undefined
          } : error
        });
      }

      // Handle specific error types
      if (error instanceof Error) {
        // Check for custom error handlers
        const customHandler = customErrorHandlers.get(error.name);
        if (customHandler) {
          return customHandler(error);
        }

        // Handle built-in error types
        switch (error.name) {
          case 'ValidationError':
            return ResponseFactory.validation([error.message]);
            
          case 'AuthenticationError':
            return ResponseFactory.unauthorized(error.message);
            
          case 'AuthorizationError':
            return ResponseFactory.forbidden(error.message);
            
          case 'NotFoundError':
            return ResponseFactory.notFound(error.message);
            
          case 'ConflictError':
            return ResponseFactory.error(error.message, 409);
            
          case 'RateLimitError':
            return ResponseFactory.error(error.message, 429);
            
          case 'TimeoutError':
            return ResponseFactory.error('Request timeout', 408);
            
          default:
            return ResponseFactory.serverError(
              showStackTrace ? error.message : 'Internal server error'
            );
        }
      }

      // Handle non-Error objects
      return ResponseFactory.serverError('Internal server error');
    }
  };
}

/**
 * Custom error classes for better error handling
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Default error handling middleware with logging
 */
export const defaultErrorHandlingMiddleware = createErrorHandlingMiddleware({
  logErrors: true,
  showStackTrace: Deno.env.get('NODE_ENV') !== 'production'
});

/**
 * Production error handling middleware (no stack traces)
 */
export const productionErrorHandlingMiddleware = createErrorHandlingMiddleware({
  logErrors: true,
  showStackTrace: false
});

/**
 * Development error handling middleware (with stack traces)
 */
export const developmentErrorHandlingMiddleware = createErrorHandlingMiddleware({
  logErrors: true,
  showStackTrace: true
});