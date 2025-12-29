/**
 * Host Routes
 * Maps host endpoints to controller methods
 */
import { HostController } from '../controllers/HostController.ts';

// Use global types for Request and Response
type Request = globalThis.Request;
type Response = globalThis.Response;

export interface Route {
  method: string;
  path: string;
  handler: (req: Request) => Promise<Response>;
}

export default function hostRoutes(controller: HostController): Route[] {
  return [
    {
      method: 'GET',
      path: '/api/hosts',
      handler: controller.getAllHosts.bind(controller)
    },
    {
      method: 'GET',
      path: '/api/hosts/nearby',
      handler: controller.getHostsByLocation.bind(controller)
    },
    {
      method: 'GET',
      path: '/api/hosts/:id/status',
      handler: controller.getHostStatus.bind(controller)
    },
    {
      method: 'GET',
      path: '/api/shortcuts',
      handler: controller.getShortcuts.bind(controller)
    },
    {
      method: 'GET',
      path: '/api/leaderboard',
      handler: controller.getLeaderboard.bind(controller)
    },
    {
      method: 'GET',
      path: '/api/achievements',
      handler: controller.getAchievements.bind(controller)
    }
  ];
}