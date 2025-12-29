/**
 * Authentication Routes
 * Maps authentication endpoints to controller methods
 */
import { AuthController } from '../controllers/AuthController.ts';

// Use global types for Request and Response
type Request = globalThis.Request;
type Response = globalThis.Response;

export interface Route {
  method: string;
  path: string;
  handler: (req: Request) => Promise<Response>;
}

export default function authRoutes(controller: AuthController): Route[] {
  return [
    {
      method: 'POST',
      path: '/api/login',
      handler: controller.login.bind(controller)
    },
    {
      method: 'POST',
      path: '/api/logout',
      handler: controller.logout.bind(controller)
    },
    {
      method: 'GET',
      path: '/api/validate-session',
      handler: controller.validateSession.bind(controller)
    }
  ];
}