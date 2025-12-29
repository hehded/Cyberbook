/**
 * Router
 * Combines all routes and provides routing functionality
 * Follows SOLID principles and dependency injection
 */
import { DIContainer, SERVICE_TOKENS } from '../di/Container.ts';
import { AuthController } from '../controllers/AuthController.ts';
import { BookingController } from '../controllers/BookingController.ts';
import { HostController } from '../controllers/HostController.ts';
import { PaymentController } from '../controllers/PaymentController.ts';
import { SessionController } from '../controllers/SessionController.ts';
import { StaticController } from '../controllers/StaticController.ts';
import { ResponseFactory } from '../factories/ResponseFactory.ts';

import authRoutes from './auth.ts';
import bookingRoutes from './booking.ts';
import hostRoutes from './host.ts';
import paymentRoutes from './payment.ts';
import sessionRoutes from './session.ts';

// Use global types for Request and Response
type Request = globalThis.Request;
type Response = globalThis.Response;

export interface Route {
  method: string;
  path: string;
  handler: (req: Request) => Promise<Response>;
}

export class Router {
  private routes: Route[] = [];

  constructor(private container: DIContainer) {
    this.initializeRoutes();
  }

  /**
   * Initialize all routes with their controllers
   */
  private initializeRoutes(): void {
    // Create controller instances
    const authController = new AuthController(this.container);
    const bookingController = new BookingController(this.container);
    const hostController = new HostController(this.container);
    const paymentController = new PaymentController(this.container);
    const sessionController = new SessionController(this.container);

    // Register all routes
    this.routes = [
      ...authRoutes(authController),
      ...bookingRoutes(bookingController),
      ...hostRoutes(hostController),
      ...paymentRoutes(paymentController),
      ...sessionRoutes(sessionController)
    ];
  }

  /**
   * Handle incoming request
   */
  async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const method = req.method;

    // Handle OPTIONS requests for CORS
    if (method === "OPTIONS") {
      return ResponseFactory.options();
    }

    // Find matching route
    const route = this.findRoute(method, pathname);
    
    if (route) {
      try {
        return await route.handler(req);
      } catch (error) {
        console.error('Router error:', error);
        return ResponseFactory.serverError("Internal server error");
      }
    }

    // Fallback to static file handling
    if (method === "GET") {
      const staticController = new StaticController();
      return staticController.serveStatic(req);
    }

    return ResponseFactory.notFound("Endpoint not found");
  }

  /**
   * Find route that matches method and path
   */
  private findRoute(method: string, pathname: string): Route | null {
    // Exact match first
    const exactMatch = this.routes.find(route => 
      route.method === method && route.path === pathname
    );
    
    if (exactMatch) {
      return exactMatch;
    }

    // Parameterized routes
    return this.routes.find(route => {
      if (route.method !== method) {
        return false;
      }

      // Convert route path to regex for parameter matching
      const routeRegex = this.pathToRegex(route.path);
      return routeRegex.test(pathname);
    }) || null;
  }

  /**
   * Convert route path with parameters to regex
   */
  private pathToRegex(path: string): RegExp {
    // Replace :param with regex capture groups
    const regexPath = path
      .replace(/\//g, '\\/')
      .replace(/:([a-zA-Z]+)/g, '([^/]+)');
    
    return new RegExp(`^${regexPath}$`);
  }

  /**
   * Get all registered routes
   */
  getRoutes(): Route[] {
    return [...this.routes];
  }
}