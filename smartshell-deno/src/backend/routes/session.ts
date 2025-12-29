/**
 * Session Routes
 * Maps session endpoints to controller methods
 */
import { SessionController } from '../controllers/SessionController.ts';

// Use global types for Request and Response
type Request = globalThis.Request;
type Response = globalThis.Response;

export interface Route {
  method: string;
  path: string;
  handler: (req: Request) => Promise<Response>;
}

export default function sessionRoutes(controller: SessionController): Route[] {
  return [
    {
      method: 'POST',
      path: '/api/sessions',
      handler: controller.createSession.bind(controller)
    },
    {
      method: 'GET',
      path: '/api/sessions/:id',
      handler: controller.getSessionById.bind(controller)
    },
    {
      method: 'GET',
      path: '/api/sessions/:id/validate',
      handler: controller.validateSession.bind(controller)
    },
    {
      method: 'DELETE',
      path: '/api/sessions/:id',
      handler: controller.deactivateSession.bind(controller)
    },
    {
      method: 'GET',
      path: '/api/my-sessions',
      handler: controller.getUserSessions.bind(controller)
    },
    {
      method: 'GET',
      path: '/api/sessions/active',
      handler: controller.getActiveSessions.bind(controller)
    },
    {
      method: 'POST',
      path: '/api/sessions/cleanup',
      handler: controller.cleanupExpiredSessions.bind(controller)
    },
    {
      method: 'PUT',
      path: '/api/sessions/:id',
      handler: controller.updateSession.bind(controller)
    }
  ];
}