/**
 * Authentication Controller
 * Handles login/logout endpoints
 * Follows SOLID principles and dependency injection
 */
import { BaseController } from './BaseController.ts';
import { ResponseFactory } from '../factories/ResponseFactory.ts';
import { DIContainer, SERVICE_TOKENS } from '../di/Container.ts';
import { AuthService } from '../services/AuthService.ts';
import { SessionService } from '../services/SessionService.ts';

// Use global types for Request and Response
type Request = globalThis.Request;
type Response = globalThis.Response;

export class AuthController extends BaseController {
  private authService: AuthService;
  private sessionService: SessionService;

  constructor(container: DIContainer) {
    super();
    this.authService = container.resolve({ token: SERVICE_TOKENS.AUTH_SERVICE } as any);
    this.sessionService = container.resolve({ token: SERVICE_TOKENS.SESSION_SERVICE } as any);
  }

  /**
   * Handle user login
   * POST /api/login
   */
  async login(req: Request): Promise<Response> {
    return this.handleRequest(async () => {
      const clientIP = this.getClientIP(req);
      const userAgent = this.getUserAgent(req);
      
      const { login, password } = await this.getRequestBody<{ login: string; password: string }>(req);
      
      if (!login || !password) {
        return ResponseFactory.error("Login and password required", 400);
      }

      try {
        const authResult = await this.authService.authenticate({
          login,
          password,
          ip: clientIP,
          userAgent: userAgent
        });
        
        if (!authResult.success) {
          return ResponseFactory.error(authResult.error || "Authentication failed", 401);
        }

        return ResponseFactory.success({
          success: true,
          sessionId: authResult.sessionId,
          user: authResult.user
        });
      } catch (error) {
        console.error("Login error:", error);
        return ResponseFactory.error("Authentication server error", 500);
      }
    });
  }

  /**
   * Handle user logout
   * POST /api/logout
   */
  async logout(req: Request): Promise<Response> {
    return this.handleRequest(async () => {
      const sessionId = this.extractSessionId(req);
      
      if (!sessionId) {
        return ResponseFactory.unauthorized("No session provided");
      }

      try {
        await this.authService.logout(sessionId);
        return ResponseFactory.success({ success: true, message: "Logged out successfully" });
      } catch (error) {
        console.error("Logout error:", error);
        return ResponseFactory.error("Logout failed", 500);
      }
    });
  }

  /**
   * Validate session
   * GET /api/validate-session
   */
  async validateSession(req: Request): Promise<Response> {
    return this.handleRequest(async () => {
      const sessionId = this.extractSessionId(req);
      
      if (!sessionId) {
        return ResponseFactory.unauthorized("No session provided");
      }

      try {
        const sessionData = await this.sessionService.validateSession(sessionId);
        
        if (!sessionData.valid) {
          return ResponseFactory.unauthorized("Invalid or expired session");
        }

        return ResponseFactory.success({
          valid: true,
          user: sessionData.session?.user
        });
      } catch (error) {
        console.error("Session validation error:", error);
        return ResponseFactory.error("Session validation failed", 500);
      }
    });
  }
}