/**
 * Session Controller
 * Handles session management endpoints
 * Follows SOLID principles and dependency injection
 */
import { BaseController } from './BaseController.ts';
import { ResponseFactory } from '../factories/ResponseFactory.ts';
import { DIContainer, SERVICE_TOKENS } from '../di/Container.ts';
import { SessionService } from '../services/SessionService.ts';
import { AuthService } from '../services/AuthService.ts';

// Use global types for Request and Response
type Request = globalThis.Request;
type Response = globalThis.Response;

export class SessionController extends BaseController {
  private sessionService: SessionService;
  private authService: AuthService;

  constructor(container: DIContainer) {
    super();
    this.sessionService = container.resolve({ token: SERVICE_TOKENS.SESSION_SERVICE } as any);
    this.authService = container.resolve({ token: SERVICE_TOKENS.AUTH_SERVICE } as any);
  }

  /**
   * Create a new session
   * POST /api/sessions
   */
  async createSession(req: Request): Promise<Response> {
    return this.handleRequest(async () => {
      const { userId, ip, userAgent } = await this.getRequestBody<{
        userId: string;
        ip?: string;
        userAgent?: string;
      }>(req);

      // Validate required fields
      if (!userId) {
        return ResponseFactory.validation(["User ID is required"]);
      }

      try {
        const session = await this.sessionService.createSession({
          userId,
          ip: ip || this.getClientIP(req),
          userAgent: userAgent || this.getUserAgent(req),
          isActive: true
        });

        return ResponseFactory.created({
          success: true,
          sessionId: session.id,
          session
        });
      } catch (error) {
        console.error("Create session error:", error);
        return ResponseFactory.error("Failed to create session", 500);
      }
    });
  }

  /**
   * Get session by ID
   * GET /api/sessions/:id
   */
  async getSessionById(req: Request): Promise<Response> {
    return this.handleRequest(async () => {
      const pathParams = this.getPathParams(req, "/api/sessions/:id");
      const sessionId = pathParams.id;

      if (!sessionId) {
        return ResponseFactory.validation(["Session ID is required"]);
      }

      try {
        const session = await this.sessionService.getSessionById(sessionId);
        
        if (!session) {
          return ResponseFactory.notFound("Session not found");
        }

        return ResponseFactory.success(session);
      } catch (error) {
        console.error("Get session error:", error);
        return ResponseFactory.error("Failed to fetch session", 500);
      }
    });
  }

  /**
   * Validate a session
   * GET /api/sessions/:id/validate
   */
  async validateSession(req: Request): Promise<Response> {
    return this.handleRequest(async () => {
      const pathParams = this.getPathParams(req, "/api/sessions/:id/validate");
      const sessionId = pathParams.id;
      const queryParams = this.getQueryParams(req);
      const ip = queryParams.ip;
      const userAgent = queryParams.userAgent;

      if (!sessionId) {
        return ResponseFactory.validation(["Session ID is required"]);
      }

      try {
        const result = await this.sessionService.validateSession(
          sessionId,
          ip || this.getClientIP(req),
          userAgent || this.getUserAgent(req)
        );

        if (!result.valid) {
          return ResponseFactory.error(result.error || "Invalid session", 401);
        }

        return ResponseFactory.success({
          valid: true,
          session: result.session
        });
      } catch (error) {
        console.error("Validate session error:", error);
        return ResponseFactory.error("Failed to validate session", 500);
      }
    });
  }

  /**
   * Deactivate a session (logout)
   * DELETE /api/sessions/:id
   */
  async deactivateSession(req: Request): Promise<Response> {
    return this.handleRequest(async () => {
      const pathParams = this.getPathParams(req, "/api/sessions/:id");
      const sessionId = pathParams.id;

      if (!sessionId) {
        return ResponseFactory.validation(["Session ID is required"]);
      }

      try {
        const success = await this.sessionService.deactivateSession(sessionId);
        
        if (!success) {
          return ResponseFactory.notFound("Session not found");
        }

        return ResponseFactory.success({
          success: true,
          message: "Session deactivated successfully"
        });
      } catch (error) {
        console.error("Deactivate session error:", error);
        return ResponseFactory.error("Failed to deactivate session", 500);
      }
    });
  }

  /**
   * Get sessions for the current user
   * GET /api/my-sessions
   */
  async getUserSessions(req: Request): Promise<Response> {
    return this.handleRequest(async () => {
      const sessionId = this.extractSessionId(req);
      
      if (!sessionId) {
        return ResponseFactory.unauthorized("No session provided");
      }

      // Validate session and get user
      const user = await this.authService.validateSession(sessionId, this.getClientIP(req), this.getUserAgent(req));
      
      if (!user) {
        return ResponseFactory.unauthorized("Invalid or expired session");
      }

      try {
        const sessions = await this.sessionService.getUserSessions(user.id);
        return ResponseFactory.success(sessions);
      } catch (error) {
        console.error("Get user sessions error:", error);
        return ResponseFactory.error("Failed to fetch user sessions", 500);
      }
    });
  }

  /**
   * Get all active sessions
   * GET /api/sessions/active
   */
  async getActiveSessions(req: Request): Promise<Response> {
    return this.handleRequest(async () => {
      try {
        const sessions = await this.sessionService.getActiveSessions();
        return ResponseFactory.success(sessions);
      } catch (error) {
        console.error("Get active sessions error:", error);
        return ResponseFactory.error("Failed to fetch active sessions", 500);
      }
    });
  }

  /**
   * Clean up expired sessions
   * POST /api/sessions/cleanup
   */
  async cleanupExpiredSessions(req: Request): Promise<Response> {
    return this.handleRequest(async () => {
      try {
        const cleanedCount = await this.sessionService.cleanupExpiredSessions();
        return ResponseFactory.success({
          success: true,
          cleanedCount,
          message: `Cleaned up ${cleanedCount} expired sessions`
        });
      } catch (error) {
        console.error("Cleanup expired sessions error:", error);
        return ResponseFactory.error("Failed to cleanup expired sessions", 500);
      }
    });
  }

  /**
   * Update session
   * PUT /api/sessions/:id
   */
  async updateSession(req: Request): Promise<Response> {
    return this.handleRequest(async () => {
      const pathParams = this.getPathParams(req, "/api/sessions/:id");
      const sessionId = pathParams.id;
      const updates = await this.getRequestBody<Partial<{
        isActive: boolean;
        expiresAt: Date;
      }>>(req);

      if (!sessionId) {
        return ResponseFactory.validation(["Session ID is required"]);
      }

      try {
        const session = await this.sessionService.updateSession(sessionId, updates);
        return ResponseFactory.success({
          success: true,
          session
        });
      } catch (error) {
        console.error("Update session error:", error);
        return ResponseFactory.error("Failed to update session", 500);
      }
    });
  }
}