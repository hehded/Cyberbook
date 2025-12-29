/**
 * Base Controller Class
 * Follows Template Method Pattern and SOLID principles
 * Provides common functionality for all controllers
 */
import { ResponseFactory } from '../factories/ResponseFactory.ts';

// Use global types for Request and Response
type Request = globalThis.Request;
type Response = globalThis.Response;

export abstract class BaseController {
  /**
   * Handle HTTP request with error handling
   */
  protected async handleRequest(
    handler: () => Promise<Response>
  ): Promise<Response> {
    try {
      return await handler();
    } catch (error) {
      console.error('Controller error:', error);
      return this.handleError(error);
    }
  }

  /**
   * Handle errors and return appropriate response
   */
  protected handleError(error: unknown): Response {
    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'ValidationError') {
        return ResponseFactory.validation([error.message]);
      }
      
      if (error.name === 'AuthenticationError') {
        return ResponseFactory.error(error.message, 401);
      }
      
      if (error.name === 'AuthorizationError') {
        return ResponseFactory.error(error.message, 403);
      }
      
      if (error.name === 'NotFoundError') {
        return ResponseFactory.error(error.message, 404);
      }
      
      // Generic error
      return ResponseFactory.error(error.message, 500);
    }
    
    // Unknown error
    return ResponseFactory.error('Internal server error', 500);
  }

  /**
   * Get request body as JSON
   */
  protected async getRequestBody<T>(req: Request): Promise<T> {
    try {
      return await req.json() as T;
    } catch (error) {
      throw new Error('Invalid JSON in request body');
    }
  }

  /**
   * Get query parameters from URL
   */
  protected getQueryParams(req: Request): Record<string, string> {
    const url = new URL(req.url);
    const params: Record<string, string> = {};
    
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  }

  /**
   * Get path parameters from URL
   */
  protected getPathParams(req: Request, pattern: string): Record<string, string> {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const patternParts = pattern.split('/').filter(Boolean);
    
    const params: Record<string, string> = {};
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      if (patternPart.startsWith(':')) {
        const paramName = patternPart.substring(1);
        params[paramName] = pathParts[i] || '';
      }
    }
    
    return params;
  }

  /**
   * Get client IP from request
   */
  protected getClientIP(req: Request): string {
    return req.headers.get('x-forwarded-for') || 
           req.headers.get('x-real-ip') || 
           'unknown';
  }

  /**
   * Get user agent from request
   */
  protected getUserAgent(req: Request): string {
    return req.headers.get('user-agent') || 'unknown';
  }

  /**
   * Get authorization header from request
   */
  protected getAuthorizationHeader(req: Request): string | null {
    return req.headers.get('authorization');
  }

  /**
   * Extract session ID from authorization header
   */
  protected extractSessionId(req: Request): string | null {
    const authHeader = this.getAuthorizationHeader(req);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.slice(7);
  }
}