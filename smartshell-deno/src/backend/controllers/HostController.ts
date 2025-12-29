/**
 * Host Controller
 * Handles host management endpoints
 * Follows SOLID principles and dependency injection
 */
import { BaseController } from './BaseController.ts';
import { ResponseFactory } from '../factories/ResponseFactory.ts';
import { DIContainer, SERVICE_TOKENS } from '../di/Container.ts';
import { HostService } from '../services/HostService.ts';
import { AuthService } from '../services/AuthService.ts';

// Use global types for Request and Response
type Request = globalThis.Request;
type Response = globalThis.Response;

export class HostController extends BaseController {
  private hostService: HostService;
  private authService: AuthService;

  constructor(container: DIContainer) {
    super();
    this.hostService = container.resolve({ token: SERVICE_TOKENS.HOST_SERVICE } as any);
    this.authService = container.resolve({ token: SERVICE_TOKENS.AUTH_SERVICE } as any);
  }

  /**
   * Get all hosts
   * GET /api/hosts
   */
  async getAllHosts(req: Request): Promise<Response> {
    return this.handleRequest(async () => {
      try {
        const hosts = await this.hostService.getAllHosts();
        return ResponseFactory.success(hosts);
      } catch (error) {
        console.error("Get hosts error:", error);
        return ResponseFactory.error("Failed to fetch hosts", 500);
      }
    });
  }

  /**
   * Get hosts by location
   * GET /api/hosts/nearby?x=lat&y=lng&radius=meters
   */
  async getHostsByLocation(req: Request): Promise<Response> {
    return this.handleRequest(async () => {
      const queryParams = this.getQueryParams(req);
      
      const x = parseFloat(queryParams.x);
      const y = parseFloat(queryParams.y);
      const radius = parseFloat(queryParams.radius);

      if (isNaN(x) || isNaN(y) || isNaN(radius)) {
        return ResponseFactory.validation(["Invalid coordinates or radius"]);
      }

      if (radius < 0 || radius > 10000) {
        return ResponseFactory.validation(["Radius must be between 0 and 10000 meters"]);
      }

      try {
        const hosts = await this.hostService.getHostsByLocation(x, y, radius);
        return ResponseFactory.success(hosts);
      } catch (error) {
        console.error("Get hosts by location error:", error);
        return ResponseFactory.error("Failed to fetch hosts by location", 500);
      }
    });
  }

  /**
   * Get host status
   * GET /api/hosts/:id/status
   */
  async getHostStatus(req: Request): Promise<Response> {
    return this.handleRequest(async () => {
      const pathParams = this.getPathParams(req, "/api/hosts/:id/status");
      const hostId = parseInt(pathParams.id);

      if (!hostId || isNaN(hostId)) {
        return ResponseFactory.validation(["Invalid host ID"]);
      }

      try {
        const status = await this.hostService.getHostStatus(hostId);
        return ResponseFactory.success(status);
      } catch (error) {
        console.error("Get host status error:", error);
        return ResponseFactory.error("Failed to fetch host status", 500);
      }
    });
  }

  /**
   * Get shortcuts (games/applications)
   * GET /api/shortcuts
   */
  async getShortcuts(req: Request): Promise<Response> {
    return this.handleRequest(async () => {
      try {
        // This is a workaround since the original API has this endpoint
        // In a real implementation, this would be part of a separate service
        // For now, return empty array as placeholder
        return ResponseFactory.success([]);
      } catch (error) {
        console.error("Get shortcuts error:", error);
        return ResponseFactory.error("Failed to fetch shortcuts", 500);
      }
    });
  }

  /**
   * Get leaderboard
   * GET /api/leaderboard
   */
  async getLeaderboard(req: Request): Promise<Response> {
    return this.handleRequest(async () => {
      try {
        // This is a workaround since the original API has this endpoint
        // In a real implementation, this would be part of a separate service
        // For now, return empty object as placeholder
        return ResponseFactory.success({
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          leaders: []
        });
      } catch (error) {
        console.error("Get leaderboard error:", error);
        return ResponseFactory.error("Failed to fetch leaderboard", 500);
      }
    });
  }

  /**
   * Get achievements
   * GET /api/achievements
   */
  async getAchievements(req: Request): Promise<Response> {
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
        // This is a workaround since the original API has this endpoint
        // In a real implementation, this would be part of a separate service
        // For now, return empty array as placeholder
        return ResponseFactory.success([]);
      } catch (error) {
        console.error("Get achievements error:", error);
        return ResponseFactory.error("Failed to fetch achievements", 500);
      }
    });
  }
}