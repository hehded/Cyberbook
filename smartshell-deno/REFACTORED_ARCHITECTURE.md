# Refactored Architecture Documentation

## Overview

This document describes the refactored architecture of the SmartShell application, which has been restructured to follow SOLID principles, implement design patterns, and improve maintainability and testability.

## Architecture Goals

1. **Separation of Concerns**: Clear boundaries between different layers of the application
2. **Dependency Injection**: Loose coupling between components through DI container
3. **Testability**: Easy to unit test individual components
4. **Maintainability**: Code is organized and easy to understand
5. **Scalability**: Architecture supports future growth and feature additions

## Backend Architecture

### Layer Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│                 (Controllers & Routes)               │
├─────────────────────────────────────────────────────────────────┤
│                    Business Layer                       │
│                   (Services)                         │
├─────────────────────────────────────────────────────────────────┤
│                    Data Layer                          │
│                (Repositories)                        │
├─────────────────────────────────────────────────────────────────┤
│                 Domain Layer                          │
│          (Entities & Interfaces)                    │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. Dependency Injection Container

Located in `src/backend/di/Container.ts`, the DI container manages all service dependencies and their lifecycles.

```typescript
// Service registration
container.registerSingleton(
  { token: SERVICE_TOKENS.HOST_SERVICE },
  () => new HostService(hostRepository, bookingRepository)
);

// Service resolution
const hostService = container.resolve({ token: SERVICE_TOKENS.HOST_SERVICE });
```

#### 2. Controllers

Controllers handle HTTP requests and coordinate between the client and services. They are located in `src/backend/controllers/`:

- `AuthController`: Handles authentication
- `BookingController`: Manages bookings
- `HostController`: Manages hosts
- `PaymentController`: Handles payments
- `SessionController`: Manages user sessions

#### 3. Services

Services contain business logic and orchestrate operations between repositories. They are located in `src/backend/services/`:

- `AuthService`: Authentication logic
- `BookingService`: Booking management
- `HostService`: Host management
- `PaymentService`: Payment processing
- `SessionService`: Session management

#### 4. Repositories

Repositories handle data access and persistence. They implement the `IRepository` interface and are located in `src/backend/repositories/`:

- `UserRepository`: User data access
- `BookingRepository`: Booking data access
- `HostRepository`: Host data access
- `PaymentRepository`: Payment data access
- `SessionRepository`: Session data access

#### 5. Domain Entities

Domain entities represent core business objects and are located in `src/backend/domain/entities/`:

- `User`: User entity
- `Booking`: Booking entity
- `Host`: Host entity
- `Payment`: Payment entity
- `Session`: Session entity

#### 6. Infrastructure

Infrastructure components provide technical capabilities and are located in `src/backend/infrastructure/`:

- `SmartShellAdapter`: Adapter to external SmartShell API
- `TokenManager`: JWT token management
- `SecurityProvider`: Security utilities

#### 7. Middleware

Middleware handles cross-cutting concerns and is located in `src/backend/middleware/`:

- `AuthMiddleware`: Authentication and authorization
- `CORSMiddleware`: Cross-Origin Resource Sharing
- `ErrorHandlingMiddleware`: Centralized error handling
- `LoggingMiddleware`: Request/response logging
- `RateLimitMiddleware`: API rate limiting

### Request Flow

1. Request arrives at the server
2. Middleware chain processes the request (CORS → Rate Limit → Logging → Error Handling → Auth)
3. Router matches request to appropriate controller method
4. Controller validates request and calls service
5. Service executes business logic using repositories
6. Repository interacts with data storage
7. Response flows back through the same chain

## Frontend Architecture

### Component-Based Structure

The frontend follows a component-based architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Components                            │
│  (UI Building Blocks with State & Events)          │
├─────────────────────────────────────────────────────────────────┤
│                     State                              │
│           (Centralized State Store)                   │
├─────────────────────────────────────────────────────────────────┤
│                    Services                            │
│          (API Communication)                        │
├─────────────────────────────────────────────────────────────────┤
│                    Events                              │
│           (Event Bus for Decoupling)                │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. BaseComponent

All UI components extend `BaseComponent` which provides:
- Lifecycle hooks (init, destroy, etc.)
- State management integration
- Event bus integration
- DOM manipulation helpers
- Template rendering

#### 2. State Management

Centralized state is managed by `StateStore`:
- Single source of truth
- Immutable state updates
- State slice subscriptions
- Selector functions

#### 3. Event Bus

The `EventBus` enables component communication:
- Decoupled communication
- Type-safe events
- Subscription management

#### 4. API Service

The `ApiService` handles all backend communication:
- Centralized API calls
- Request/response interceptors
- Error handling

### Component Examples

- `LoginComponent`: User authentication
- `BookingComponent`: Booking management
- `HostComponent`: Host display and management
- `PaymentComponent`: Payment processing
- `MapComponent`: Geographic visualization

## Design Patterns Implemented

### 1. Repository Pattern

Data access is abstracted through repositories:
- Clean separation between business logic and data access
- Easy to swap data sources
- Testable with mock implementations

### 2. Dependency Injection

Dependencies are injected rather than hard-coded:
- Loose coupling between components
- Easy to test with mocks
- Centralized dependency management

### 3. Factory Pattern

Factories create objects with proper initialization:
- `ResponseFactory`: Creates standardized API responses
- `ComponentFactory`: Creates components with configuration

### 4. Observer Pattern

Components observe state and event changes:
- React to state changes automatically
- Decoupled communication
- Event-driven updates

### 5. Strategy Pattern

Different algorithms can be swapped at runtime:
- Authentication strategies
- Payment processing strategies
- Validation strategies

### 6. Adapter Pattern

External systems are adapted to our interface:
- `SmartShellAdapter`: Adapts external API
- `StorageAdapter`: Adapts different storage mechanisms

## SOLID Principles Implementation

### 1. Single Responsibility Principle (SRP)

Each class has one reason to change:
- Controllers only handle HTTP requests
- Services only contain business logic
- Repositories only handle data access
- Components only manage UI

### 2. Open/Closed Principle (OCP)

Classes are open for extension but closed for modification:
- New controllers can be added without changing existing ones
- New services can implement interfaces
- New repositories can extend base classes
- Middleware can be added to the chain

### 3. Liskov Substitution Principle (LSP)

Subclasses can replace their base classes:
- Mock repositories can replace real ones in tests
- Different authentication strategies can be swapped
- Various payment methods can be used interchangeably

### 4. Interface Segregation Principle (ISP)

Interfaces are focused and cohesive:
- `IRepository<T>`: Generic repository operations
- `IAuthService`: Authentication-specific operations
- `IBookingService`: Booking-specific operations
- Component interfaces are specific to their needs

### 5. Dependency Inversion Principle (DIP)

High-level modules depend on abstractions:
- Controllers depend on service interfaces
- Services depend on repository interfaces
- Dependencies are injected through constructors
- Configuration through DI container

## Testing Strategy

### 1. Unit Tests

Each component is tested in isolation:
- Service tests with mock repositories
- Controller tests with mock services
- Component tests with mock DOM
- Repository tests with in-memory data

### 2. Integration Tests

Multiple components are tested together:
- API endpoint tests
- Database integration tests
- External service integration tests

### 3. End-to-End Tests

Complete user flows are tested:
- Login flow
- Booking flow
- Payment flow

## Benefits of Refactored Architecture

### 1. Maintainability

- Clear separation of concerns
- Consistent code organization
- Well-defined interfaces
- Comprehensive documentation

### 2. Testability

- Dependency injection enables mocking
- Isolated component testing
- Clear test structure
- High test coverage

### 3. Scalability

- Easy to add new features
- Pluggable architecture
- Horizontal scaling possible
- Microservice-ready structure

### 4. Performance

- Efficient data access patterns
- Optimized rendering
- Minimal re-renders
- Lazy loading where appropriate

### 5. Security

- Centralized security logic
- Consistent validation
- Proper error handling
- Secure defaults

## Migration Path

### 1. Incremental Migration

The refactored architecture supports incremental migration:
- Old and new code can coexist
- Feature flags enable gradual rollout
- API compatibility is maintained
- Database schema can evolve

### 2. Backward Compatibility

Existing clients continue to work:
- API versioning strategy
- Response format consistency
- Deprecated feature handling
- Clear migration documentation

## Conclusion

The refactored SmartShell architecture provides a solid foundation for future development while addressing the code smells and design issues in the original implementation. By following SOLID principles and implementing proven design patterns, the codebase is now more maintainable, testable, and scalable.

The clear separation of concerns, dependency injection, and comprehensive testing strategy ensure that new features can be added with confidence and existing features can be modified without introducing unintended side effects.