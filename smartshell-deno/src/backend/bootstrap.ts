/**
 * Backend Bootstrap
 * Sets up dependency injection container and middleware pipeline
 * Follows SOLID principles
 */
import { DIContainer, SERVICE_TOKENS } from './di/Container.ts';
import { SmartShellAdapter } from './infrastructure/SmartShellAdapter.ts';
import { TokenManager } from './infrastructure/TokenManager.ts';
import { SecurityProvider } from './infrastructure/SecurityProvider.ts';
import { simpleCORSMiddleware } from './middleware/CORSMiddleware.ts';
import { defaultErrorHandlingMiddleware } from './middleware/ErrorHandlingMiddleware.ts';
import { simpleLoggingMiddleware } from './middleware/LoggingMiddleware.ts';
import { moderateRateLimit } from './middleware/RateLimitMiddleware.ts';

// Import service registration
import { createContainer } from './bootstrap/ServiceRegistration.ts';

// Import middleware factories
import { createAuthMiddleware } from './middleware/AuthMiddleware.ts';

/**
 * Bootstrap the dependency injection container
 */
export function bootstrapContainer(): DIContainer {
  // Create container with all services registered
  const container = createContainer();

  // Add infrastructure components that aren't in service registration
  container.registerSingleton(
    { token: SERVICE_TOKENS.SMARTSHELL_ADAPTER },
    () => new SmartShellAdapter()
  );

  container.registerSingleton(
    { token: SERVICE_TOKENS.TOKEN_MANAGER },
    () => new TokenManager()
  );

  container.registerSingleton(
    { token: SERVICE_TOKENS.SECURITY_UTILS },
    () => new SecurityProvider()
  );

  container.registerSingleton(
    { token: SERVICE_TOKENS.RESPONSE_FACTORY },
    () => ({ // Simple factory object
      success: (data: any, message?: string) => ({ success: true, data, message }),
      error: (error: string, status: number) => ({ success: false, error, status }),
      validation: (errors: string[]) => ({ success: false, error: "Validation failed", message: errors.join(", ") })
    })
  );

  return container;
}

/**
 * Setup middleware pipeline
 */
export function setupMiddleware(container: DIContainer) {
  const middleware = [];

  // CORS middleware (first)
  middleware.push(simpleCORSMiddleware);

  // Rate limiting middleware
  middleware.push(moderateRateLimit);

  // Logging middleware
  middleware.push(simpleLoggingMiddleware);

  // Error handling middleware (should be one of the last)
  middleware.push(defaultErrorHandlingMiddleware);

  // Auth middleware (after error handling for auth errors)
  middleware.push(createAuthMiddleware(
    container.resolve({ token: SERVICE_TOKENS.AUTH_SERVICE })
  ));

  return middleware;
}

/**
 * Get middleware chain as a single function
 */
export function createMiddlewareChain(middleware: Array<(req: Request, next: () => Promise<Response>) => Promise<Response>>) {
  return async (req: Request, finalHandler: () => Promise<Response>): Promise<Response> => {
    let index = 0;
    
    const next = async (): Promise<Response> => {
      if (index >= middleware.length) {
        return finalHandler();
      }
      
      const currentMiddleware = middleware[index++];
      return currentMiddleware(req, next);
    };
    
    return next();
  };
}

/**
 * Initialize application
 */
export function initializeApp() {
  const container = bootstrapContainer();
  const middleware = setupMiddleware(container);
  
  return {
    container,
    middleware: createMiddlewareChain(middleware)
  };
}