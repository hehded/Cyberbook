# Frontend Architecture Documentation

## Overview

This document describes the refactored frontend architecture for the Cyberbook PC Gaming Club application. The architecture follows SOLID principles and implements modern design patterns for maintainability and scalability.

## Architecture Goals

1. **Separation of Concerns**: Clear separation between HTML, CSS, and JavaScript
2. **Modularity**: Break down monolithic code into focused, reusable modules
3. **Observer Pattern**: Implement event-driven communication between components
4. **State Management**: Centralized state with reactive updates
5. **Error Handling**: Proper error handling throughout the application
6. **Type Safety**: Use TypeScript for better development experience

## Directory Structure

```
src/frontend/
├── README.md                 # Architecture documentation
├── ARCHITECTURE.md          # This file
├── events/                  # Event bus implementation
│   └── EventBus.ts         # Observer pattern for component communication
├── services/                 # API service layer
│   └── ApiService.ts         # HTTP client with error handling
├── state/                    # State management
│   └── StateStore.ts        # Centralized state with observers
├── components/                # UI components
│   └── BaseComponent.ts     # Base class with lifecycle hooks
├── modules/                   # JavaScript modules
│   ├── App.ts              # Main application orchestrator
│   ├── MapComponent.ts      # Interactive map component
│   └── index.ts            # Entry point
├── templates/                  # HTML templates
│   ├── main.html            # Main layout template
│   └── modals.html          # Modal templates
├── styles/                     # CSS stylesheets
│   └── main.css             # Application styles
├── index-refactored.html       # Refactored entry point
├── package.json               # Package configuration
├── build.ts                  # Build script
└── start-server.ts           # Development server
```

## Core Components

### 1. Event Bus (Observer Pattern)

The `EventBus` implements the Observer pattern for decoupled communication:

```typescript
// Subscribe to events
const unsubscribe = eventBus.subscribe(EVENTS.HOSTS_LOADED, (hosts) => {
  // Handle hosts loaded
});

// Publish events
eventBus.publish(EVENTS.USER_LOGIN, userData);
```

**Benefits**:
- Loose coupling between components
- Easy to add new event types
- Centralized event management
- Type-safe event handling

### 2. State Management

The `StateStore` provides centralized state management with reactive updates:

```typescript
// Get state
const state = stateStore.getState();

// Update state
stateStore.setState({ hosts: newHosts });

// Subscribe to state changes
const unsubscribe = stateStore.subscribeToSlice('hosts', (hosts) => {
  // React to hosts changes
});
```

**Benefits**:
- Single source of truth
- Predictable state updates
- Automatic UI updates through subscriptions
- Type-safe state access
- Computed selectors for derived state

### 3. API Service Layer

The `ApiService` provides a clean interface for backend communication:

```typescript
// Type-safe API calls
const hosts = await hostApi.getHosts();
const bookings = await bookingApi.getBookings();

// Automatic error handling
try {
  const result = await api.post('/api/bookings', data);
} catch (error) {
  // Error automatically published to event bus
}
```

**Benefits**:
- Centralized API configuration
- Automatic authentication handling
- Consistent error handling
- Request/response interceptors
- Type-safe API interfaces

### 4. Component Architecture

The `BaseComponent` class provides a foundation for all UI components:

```typescript
class MyComponent extends BaseComponent {
  protected override onInit() {
    // Component initialization
  }
  
  protected override bindEvents() {
    // DOM event binding
  }
  
  protected override subscribeToState() {
    // State subscriptions
  }
}
```

**Benefits**:
- Consistent lifecycle hooks
- Automatic cleanup on destruction
- Built-in state management
- Event bus integration
- DOM helpers

## Data Flow

1. **User Interaction** → Component → Event Bus → State Store
2. **API Response** → API Service → Event Bus → State Store → Components
3. **State Changes** → State Store → Event Bus → Components

## Key Patterns

### 1. Observer Pattern

Used throughout the architecture for:
- Event bus communication
- State change notifications
- Component lifecycle hooks

### 2. Singleton Pattern

Used for:
- Event bus instance
- State store instance
- API service instances

### 3. Factory Pattern

Used for:
- Component creation
- API service instantiation

### 4. Repository Pattern

Used for:
- State persistence
- Configuration management

## SOLID Principles Implementation

### Single Responsibility Principle

- Each class has one responsibility:
  - `EventBus`: Event management only
  - `StateStore`: State management only
  - `ApiService`: API communication only
  - `BaseComponent`: Component lifecycle only

### Open/Closed Principle

- Components are open for extension:
  - New components can inherit from `BaseComponent`
  - Event types can be extended
  - API services can be added

### Liskov Substitution Principle

- Components can be replaced with subclasses:
  - `BaseComponent` provides stable interface
  - Components depend on abstractions, not concrete implementations

### Interface Segregation Principle

- Focused interfaces:
  - `IEventBus` with only needed methods
  - `IStateStore` with essential operations
  - Separate service interfaces for different API endpoints

### Dependency Inversion Principle

- Dependencies are injected:
  - Components receive state store and event bus
  - API services use configuration
  - Easy to mock for testing

## Error Handling Strategy

1. **Centralized Error Handling**: All errors go through event bus
2. **User-Friendly Messages**: Error messages are user-friendly
3. **Recovery Mechanisms**: Automatic retry and fallback options
4. **Logging**: Comprehensive error logging for debugging

## Development Workflow

### Building

```bash
# Install dependencies
deno install

# Build frontend
cd frontend
deno run build

# Start development server
deno run dev
```

### Testing

```bash
# Run with hot reload
deno run serve
```

## Migration Strategy

### From Monolithic to Modular

1. **Phase 1**: Extract styles into separate CSS files
2. **Phase 2**: Split HTML into templates
3. **Phase 3**: Create component base classes
4. **Phase 4**: Implement event bus and state management
5. **Phase 5**: Refactor API calls into services

### Backward Compatibility

The refactored frontend maintains:
- Same external API contracts
- Identical user interface
- Same visual design
- Same functionality

## Performance Optimizations

1. **Lazy Loading**: Components load data only when needed
2. **Event Batching**: State updates are batched
3. **Memory Management**: Automatic cleanup on component destruction
4. **Bundle Optimization**: Tree-shaking and code splitting

## Future Enhancements

1. **Component Library**: Reusable UI components
2. **Routing**: Client-side routing for SPA functionality
3. **Offline Support**: Service worker for offline functionality
4. **Testing**: Unit and integration test framework
5. **Internationalization**: Multi-language support

## Conclusion

This refactored architecture provides a solid foundation for the Cyberbook application that is:
- Maintainable and extensible
- Type-safe and error-resistant
- Performant and scalable
- Easy to test and debug

The modular structure allows developers to work on features independently while maintaining consistency across the application.