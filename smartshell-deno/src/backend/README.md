# Backend Architecture - Phase 1 Foundation

This directory contains the refactored backend architecture for the SmartShell Deno application.

## Directory Structure

```
src/backend/
├── bootstrap.ts                 # Application bootstrap and DI container setup
├── di/
│   └── Container.ts            # Dependency injection container
├── domain/
│   ├── entities/
│   │   ├── index.ts         # Entity exports
│   │   ├── User.ts          # User entity
│   │   ├── Host.ts          # Host entity
│   │   ├── Booking.ts       # Booking entity
│   │   ├── Payment.ts       # Payment entity
│   │   └── Session.ts       # Session entity
│   └── interfaces/
│       ├── IRepository.ts        # Generic repository interface
│       ├── IRepositoryInterfaces.ts # Specific repository interfaces
│       ├── IService.ts          # Generic service interface
│       └── IValidator.ts        # Validator interface
├── controllers/
│   └── BaseController.ts       # Base controller class
├── services/
│   └── BaseService.ts         # Base service class
├── middleware/
│   ├── AuthMiddleware.ts       # Authentication middleware
│   ├── CORSMiddleware.ts       # CORS middleware
│   ├── ErrorHandlingMiddleware.ts # Error handling middleware
│   ├── LoggingMiddleware.ts     # Logging middleware
│   └── RateLimitMiddleware.ts  # Rate limiting middleware
├── infrastructure/
│   ├── SmartShellAdapter.ts    # SmartShell SDK adapter
│   ├── TokenManager.ts         # Session management
│   └── SecurityProvider.ts    # Security utilities
└── factories/
    └── ResponseFactory.ts      # Response factory
```

## Implemented Components (Phase 1)

### 1. Dependency Injection Container (`di/Container.ts`)
- Generic DI container with type safety
- Support for transient and singleton services
- Service token constants for type-safe registration
- Follows Dependency Inversion Principle

### 2. Domain Interfaces (`domain/interfaces/`)
- `IRepository.ts`: Generic repository interface with CRUD operations
- `IRepositoryInterfaces.ts`: Specific repository interfaces for each entity
- `IService.ts`: Generic and specific service interfaces
- `IValidator.ts`: Input validation interfaces
- Follows Interface Segregation Principle

### 3. Domain Entities (`domain/entities/`)
- `User.ts`: User entity with creation/update types
- `Host.ts`: Host entity with session information
- `Booking.ts`: Booking entity with status enum
- `Payment.ts`: Payment entity with method enum
- `Session.ts`: Session entity with validation result
- Follows Domain-Driven Design principles

### 4. Base Classes
- `BaseController.ts`: Common controller functionality with error handling
- `BaseService.ts`: Common service functionality with CRUD operations
- Follows Template Method Pattern

### 5. Middleware Pipeline (`middleware/`)
- `AuthMiddleware.ts`: Authentication and authorization
- `CORSMiddleware.ts`: CORS handling with configurable options
- `ErrorHandlingMiddleware.ts`: Centralized error handling with custom error classes
- `LoggingMiddleware.ts`: Request/response logging with performance monitoring
- `RateLimitMiddleware.ts`: Rate limiting with IP-based tracking
- Follows Chain of Responsibility Pattern

### 6. Infrastructure Layer (`infrastructure/`)
- `SmartShellAdapter.ts`: Adapter for SmartShell SDK with mock data
- `TokenManager.ts`: Session management with cleanup
- `SecurityProvider.ts`: Security utilities and validation
- Follows Adapter Pattern

### 7. Response Factory (`factories/`)
- `ResponseFactory.ts`: Standardized HTTP response creation
- Follows Factory Pattern

### 8. Bootstrap (`bootstrap.ts`)
- Container setup with service registration
- Middleware pipeline configuration
- Application initialization

## SOLID Principles Implementation

### Single Responsibility Principle (SRP)
- Each class has one clear purpose
- Controllers handle HTTP concerns only
- Services contain business logic only
- Repositories handle data access only
- Middleware handles cross-cutting concerns only

### Open/Closed Principle (OCP)
- Extensible through interfaces
- New validators implement `IValidator`
- New repositories implement `IRepository`
- Middleware chain is extensible

### Liskov Substitution Principle (LSP)
- All implementations properly substitute their interfaces
- Repository implementations are interchangeable
- Service implementations follow contracts

### Interface Segregation Principle (ISP)
- Small, focused interfaces
- `IReadOnlyRepository` and `IWriteOnlyRepository` for specific needs
- Separate interfaces for different service types

### Dependency Inversion Principle (DIP)
- High-level modules depend on abstractions
- Dependency injection container manages dependencies
- No direct instantiation of concrete classes

## Design Patterns Applied

### 1. Dependency Injection
- Container-based service resolution
- Type-safe service registration
- Singleton and transient lifecycle management

### 2. Repository Pattern
- Abstraction over data access
- Consistent interface across all entities
- Easy to mock for testing

### 3. Service Layer Pattern
- Business logic encapsulation
- Transaction management
- Orchestration of repositories

### 4. Adapter Pattern
- `SmartShellAdapter` wraps external SDK
- Clean integration point
- Isolates external dependencies

### 5. Factory Pattern
- `ResponseFactory` for consistent responses
- `SecurityProvider` utility methods
- Middleware factory functions

### 6. Template Method Pattern
- `BaseController` provides common workflow
- `BaseService` provides common operations
- Hooks for customization

### 7. Chain of Responsibility
- Middleware pipeline
- Each handler can pass to next
- Centralized cross-cutting concerns

## Next Steps (Phase 2)

1. Implement concrete repository classes
2. Implement concrete service classes
3. Implement concrete controller classes
4. Create DTOs for API communication
5. Implement validators for input validation
6. Write comprehensive unit tests
7. Migrate existing API endpoints

## Benefits

1. **Maintainability**: Clear separation of concerns
2. **Testability**: Dependency injection enables easy mocking
3. **Scalability**: Modular structure supports growth
4. **Reusability**: Components can be reused across the application
5. **Security**: Centralized security handling and validation
6. **Performance**: Optimized data access and caching strategies
7. **Developer Experience**: Clear structure makes onboarding easier