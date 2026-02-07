/**
 * Authentication Middleware
 * Follows Middleware Pattern and SOLID principles
 * Handles authentication and authorization for protected routes
 */
import { IAuthService } from '../domain/interfaces/IService.ts';
import { ResponseFactory } from '../factories/ResponseFactory.ts';

// Use global types for Request and Response
type Request = globalThis.Request;
type Response = globalThis.Response;

export interface AuthenticatedRequest extends Request {
  user?: any;
  sessionId?: string;
}

export function createAuthMiddleware(authService: IAuthService) {
  return async (req: Request, next: () => Promise<Response>): Promise<Response> => {
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    // Skip auth for public endpoints
    const publicPaths = [
      '/',
      '/index.html',
      '/favicon.ico',
      '/api/login',
      '/api/validate-session',
      '/api/shortcuts',
      '/api/leaderboard',
      '/api/achievements',
      '/api/hosts',       // Public host list
      '/api/bookings',    // Public booking schedule
      '/api/debug/fs'     // Debug endpoint
    ];
    
    // Public prefixes (allow sub-paths like /api/hosts/nearby)
    const publicPrefixes = [
      '/api/hosts',
      '/api/bookings'
    ];
    
    // Skip auth for static assets (css, js, images, etc.)
    const isStaticAsset = pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i);
    
    // Skip auth for OPTIONS requests
    const isOptionsRequest = req.method === 'OPTIONS';
    
    if (publicPaths.includes(pathname) || isStaticAsset || isOptionsRequest) {
      console.log(`[AuthMiddleware] Skipping auth for public path: ${pathname}`);
      return await next();
    }

    const authHeader = req.headers.get("Authorization");
    console.log(`[AuthMiddleware] Request to ${pathname} - Auth header: ${authHeader ? 'Present' : 'Missing'}`);
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log(`[AuthMiddleware] Rejecting request - ${!authHeader ? 'No auth header' : 'Invalid format (missing Bearer prefix)'}`);
      return ResponseFactory.unauthorized("Missing or invalid authorization header");
    }

    const sessionId = authHeader.slice(7);
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    try {
      const user = await authService.validateSession(sessionId, clientIP, userAgent);
      if (!user) {
        return ResponseFactory.unauthorized("Invalid or expired session");
      }

      // Add user and sessionId to request for downstream handlers
      (req as AuthenticatedRequest).user = user;
      (req as AuthenticatedRequest).sessionId = sessionId;

      return await next();
    } catch (error) {
      console.error("Authentication error:", error);
      return ResponseFactory.unauthorized("Authentication failed");
    }
  };
}

/**
 * Role-based authorization middleware factory
 */
export function createRoleMiddleware(requiredRoles: string[]) {
  return async (req: AuthenticatedRequest, next: () => Promise<Response>): Promise<Response> => {
    const user = req.user;
    
    if (!user) {
      return ResponseFactory.unauthorized("User not authenticated");
    }

    // Check if user has required roles
    const userRoles = (user as any).roles || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return ResponseFactory.forbidden("Insufficient permissions");
    }

    return await next();
  };
}

/**
 * Optional authentication middleware (doesn't fail if no auth)
 */
export function createOptionalAuthMiddleware(authService: IAuthService) {
  return async (req: Request, next: () => Promise<Response>): Promise<Response> => {
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No auth header, continue without user
      return await next();
    }

    const sessionId = authHeader.slice(7);
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    try {
      const user = await authService.validateSession(sessionId, clientIP, userAgent);
      if (user) {
        // Add user and sessionId to request for downstream handlers
        (req as AuthenticatedRequest).user = user;
        (req as AuthenticatedRequest).sessionId = sessionId;
      }
    } catch (error) {
      // Log error but don't fail the request for optional auth
      console.error("Optional authentication error:", error);
    }

    return await next();
  };
}
