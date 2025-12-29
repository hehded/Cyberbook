/**
 * Dependency Injection Container for managing service dependencies
 * Follows SOLID principles, particularly Dependency Inversion
 */
export interface ServiceIdentifier<T> {
  token: string;
}

export class DIContainer {
  private services = new Map<string, any>();
  private factories = new Map<string, () => any>();
  private singletons = new Map<string, any>();

  /**
   * Register a transient service (new instance each time)
   */
  register<T>(identifier: ServiceIdentifier<T>, factory: () => T): void {
    this.factories.set(identifier.token, factory);
  }

  /**
   * Register a singleton service (same instance each time)
   */
  registerSingleton<T>(identifier: ServiceIdentifier<T>, factory: () => T): void {
    this.singletons.set(identifier.token, factory);
  }

  /**
   * Resolve a service by its identifier
   */
  resolve<T>(identifier: ServiceIdentifier<T>): T {
    const token = identifier.token;
    
    // Check if already instantiated (singleton)
    if (this.services.has(token)) {
      return this.services.get(token);
    }

    // Check if singleton factory exists
    if (this.singletons.has(token)) {
      const instance = this.singletons.get(token)();
      this.services.set(token, instance);
      return instance;
    }

    // Check if regular factory exists
    if (this.factories.has(token)) {
      const factory = this.factories.get(token);
      if (factory) {
        return factory();
      }
    }

    throw new Error(`Service ${token} not registered`);
  }

  /**
   * Check if a service is registered
   */
  isRegistered<T>(identifier: ServiceIdentifier<T>): boolean {
    const token = identifier.token;
    return this.factories.has(token) || this.singletons.has(token);
  }

  /**
   * Clear all registered services
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
  }
}

// Service tokens for type-safe dependency injection
export const SERVICE_TOKENS = {
  // Repositories
  USER_REPOSITORY: 'UserRepository',
  HOST_REPOSITORY: 'HostRepository',
  BOOKING_REPOSITORY: 'BookingRepository',
  PAYMENT_REPOSITORY: 'PaymentRepository',
  SESSION_REPOSITORY: 'SessionRepository',
  
  // Services
  AUTH_SERVICE: 'AuthService',
  BOOKING_SERVICE: 'BookingService',
  HOST_SERVICE: 'HostService',
  PAYMENT_SERVICE: 'PaymentService',
  SESSION_SERVICE: 'SessionService',
  
  // Validators
  USER_VALIDATOR: 'UserValidator',
  BOOKING_VALIDATOR: 'BookingValidator',
  HOST_VALIDATOR: 'HostValidator',
  PAYMENT_VALIDATOR: 'PaymentValidator',
  SESSION_VALIDATOR: 'SessionValidator',
  
  // Infrastructure
  TOKEN_MANAGER: 'TokenManager',
  SECURITY_UTILS: 'SecurityUtils',
  SMARTSHELL_ADAPTER: 'SmartShellAdapter',
  RESPONSE_FACTORY: 'ResponseFactory',
  
  // Controllers
  AUTH_CONTROLLER: 'AuthController',
  BOOKING_CONTROLLER: 'BookingController',
  HOST_CONTROLLER: 'HostController',
  PAYMENT_CONTROLLER: 'PaymentController',
  SESSION_CONTROLLER: 'SessionController',
} as const;