/**
 * Service Registration
 * Registers all services and repositories in the DI container
 * Follows SOLID principles and dependency injection
 */
import { DIContainer, SERVICE_TOKENS } from '../di/Container.ts';

// Import repositories
import { UserRepository } from '../repositories/UserRepository.ts';
import { BookingRepository } from '../repositories/BookingRepository.ts';
import { HostRepository } from '../repositories/HostRepository.ts';
import { PaymentRepository } from '../repositories/PaymentRepository.ts';
import { SessionRepository } from '../repositories/SessionRepository.ts';

// Import services
import { AuthService } from '../services/AuthService.ts';
import { BookingService } from '../services/BookingService.ts';
import { HostService } from '../services/HostService.ts';
import { PaymentService } from '../services/PaymentService.ts';
import { SessionService } from '../services/SessionService.ts';

// Import validators
import { UserValidator, LoginValidator } from '../validators/UserValidator.ts';
import { BookingValidator, TimeSlotValidator } from '../validators/BookingValidator.ts';
import { HostValidator as HostValidatorClass, LocationValidator } from '../validators/HostValidator.ts';
import { PaymentValidator, PaymentRequestValidator, RefundRequestValidator } from '../validators/PaymentValidator.ts';
import { SessionValidator as SessionValidatorClass, SessionValidationRequestValidator, SessionDeactivationRequestValidator } from '../validators/SessionValidator.ts';

/**
 * Register all services in the DI container
 */
export function registerServices(container: DIContainer): void {
  // Register repositories as singletons
  container.registerSingleton(
    { token: SERVICE_TOKENS.USER_REPOSITORY },
    () => new UserRepository()
  );
  
  container.registerSingleton(
    { token: SERVICE_TOKENS.BOOKING_REPOSITORY },
    () => new BookingRepository()
  );
  
  container.registerSingleton(
    { token: SERVICE_TOKENS.HOST_REPOSITORY },
    () => new HostRepository()
  );
  
  container.registerSingleton(
    { token: SERVICE_TOKENS.PAYMENT_REPOSITORY },
    () => new PaymentRepository()
  );
  
  container.registerSingleton(
    { token: SERVICE_TOKENS.SESSION_REPOSITORY },
    () => new SessionRepository()
  );

  // Register validators as singletons
  container.registerSingleton(
    { token: SERVICE_TOKENS.USER_VALIDATOR },
    () => new UserValidator()
  );
  
  container.registerSingleton(
    { token: SERVICE_TOKENS.BOOKING_VALIDATOR },
    () => new BookingValidator()
  );
  
  container.registerSingleton(
    { token: SERVICE_TOKENS.HOST_VALIDATOR },
    () => new HostValidatorClass()
  );
  
  container.registerSingleton(
    { token: SERVICE_TOKENS.PAYMENT_VALIDATOR },
    () => new PaymentValidator()
  );
  
  container.registerSingleton(
    { token: SERVICE_TOKENS.SESSION_VALIDATOR },
    () => new SessionValidatorClass()
  );

  // Register services as singletons with their dependencies
  container.registerSingleton(
    { token: SERVICE_TOKENS.AUTH_SERVICE },
    () => new AuthService(
      container.resolve({ token: SERVICE_TOKENS.USER_REPOSITORY }),
      container.resolve({ token: SERVICE_TOKENS.SESSION_REPOSITORY })
    )
  );
  
  container.registerSingleton(
    { token: SERVICE_TOKENS.BOOKING_SERVICE },
    () => new BookingService(
      container.resolve({ token: SERVICE_TOKENS.BOOKING_REPOSITORY }),
      container.resolve({ token: SERVICE_TOKENS.HOST_REPOSITORY }),
      container.resolve({ token: SERVICE_TOKENS.USER_REPOSITORY })
    )
  );
  
  container.registerSingleton(
    { token: SERVICE_TOKENS.HOST_SERVICE },
    () => new HostService(
      container.resolve({ token: SERVICE_TOKENS.HOST_REPOSITORY }),
      container.resolve({ token: SERVICE_TOKENS.BOOKING_REPOSITORY })
    )
  );
  
  container.registerSingleton(
    { token: SERVICE_TOKENS.PAYMENT_SERVICE },
    () => new PaymentService(
      container.resolve({ token: SERVICE_TOKENS.PAYMENT_REPOSITORY }),
      container.resolve({ token: SERVICE_TOKENS.USER_REPOSITORY }),
      container.resolve({ token: SERVICE_TOKENS.BOOKING_REPOSITORY })
    )
  );
  
  container.registerSingleton(
    { token: SERVICE_TOKENS.SESSION_SERVICE },
    () => new SessionService(
      container.resolve({ token: SERVICE_TOKENS.SESSION_REPOSITORY }),
      container.resolve({ token: SERVICE_TOKENS.USER_REPOSITORY })
    )
  );
}

/**
 * Create and configure a new DI container with all services registered
 */
export function createContainer(): DIContainer {
  const container = new DIContainer();
  registerServices(container);
  return container;
}