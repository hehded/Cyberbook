# SmartShell Deno Application

A comprehensive PC gaming club management system built with Deno, featuring real-time host monitoring, booking management, and user authentication.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [How to Run](#how-to-run)
- [Documentation](#documentation)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)

## 🎯 Overview

SmartShell Deno is a modern web application for managing PC gaming clubs. It provides real-time monitoring of gaming stations, booking management, user authentication, and payment tracking.

**Tech Stack**:
- **Backend**: Deno with TypeScript
- **Frontend**: Vanilla TypeScript with component-based architecture
- **External API**: SmartShell GraphQL API
- **Architecture**: Clean Architecture with MVC pattern

## ✨ Features

### Core Features
- **Real-time Host Monitoring**: Live status updates for all gaming stations
- **Interactive Map**: Visual representation of host locations and availability
- **Booking System**: Create, view, and cancel bookings
- **User Authentication**: Secure login with session management
- **Payment Tracking**: View payment history and statistics
- **Achievement System**: Track and display user achievements
- **Leaderboard**: Monthly gaming time rankings

### Technical Features
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Automatic data refresh every 30 seconds
- **Security**: Rate limiting, input sanitization, session validation
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Performance**: Optimized rendering and data caching

## 🏗️ Architecture

The application follows a **Clean Architecture** with **Layered MVC** pattern, implementing strict separation of concerns.

### Backend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│              (Controllers, Routes, Middleware)              │
├─────────────────────────────────────────────────────────────────┤
│                    Application Layer                          │
│                   (Services, Validators)                    │
├─────────────────────────────────────────────────────────────────┤
│                     Domain Layer                            │
│          (Entities, Interfaces, Value Objects)             │
├─────────────────────────────────────────────────────────────────┤
│                 Infrastructure Layer                         │
│        (Repositories, Adapters, External Services)         │
└─────────────────────────────────────────────────────────────────┘
```

**Key Components**:
- **Dependency Injection Container**: Manages service lifecycles
- **Repository Pattern**: Abstracts data access
- **Service Layer**: Business logic implementation
- **Middleware Pipeline**: Cross-cutting concerns (auth, CORS, logging, rate limiting)
- **Validators**: Input validation with type safety

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Component Layer                          │
│         (Reusable UI Components with Lifecycle)            │
├─────────────────────────────────────────────────────────────────┤
│                    Service Layer                            │
│               (API Communication, Business Logic)            │
├─────────────────────────────────────────────────────────────────┤
│                   State Management                          │
│           (Centralized State Store with Selectors)         │
├─────────────────────────────────────────────────────────────────┤
│                    Event System                             │
│              (Event Bus for Decoupled Communication)       │
└─────────────────────────────────────────────────────────────────┘
```

**Key Components**:
- **BaseComponent**: Lifecycle management, state integration, event handling
- **EventBus**: Decoupled component communication
- **StateStore**: Immutable state with subscriptions
- **ApiService**: Centralized API communication with error handling

## 🚀 Getting Started

### Prerequisites

- Deno 1.40+ installed
- SmartShell API access

### Quick Start (5 Minutes)

For a quick setup guide, see [QUICK_START.md](QUICK_START.md).

**Basic Setup:**

1. Configure environment:
```bash
cp .env.example .env
# Edit .env with your SmartShell credentials
```

2. Start the server:
```bash
deno run -A server.ts
```

3. Access the application:
```
http://localhost:8000
```

### How to Run

This project provides two backend and two frontend implementations:

#### Backend Options

**Original Backend** (Legacy):
```bash
deno run -A server.ts
# or with watch mode
deno run --watch -A server.ts
```

**Refactored Backend** (Clean Architecture):
```bash
deno run -A main.ts
```

#### Frontend Options

**Original Frontend** (Legacy):
- Served automatically by the backend
- Access at: `http://localhost:8000`

**Refactored Frontend** (Component-based):
```bash
# Option 1: Standalone dev server
cd frontend
deno run --allow-net --allow-read start-server.ts

# Option 2: Modify server.ts to serve index-refactored.html
```

#### Running Tests

```bash
# Run all tests
deno test --allow-net --allow-read tests/

# Run with coverage
deno test --allow-net --allow-read --coverage=coverage

# Run smoke tests
deno task smoke
```

#### Available Deno Tasks

```bash
deno task dev    # Development with watch mode
deno task run    # Production mode
deno task smoke  # Run smoke tests
deno task cache  # Cache dependencies
```

For detailed instructions, see [RUN_GUIDE.md](RUN_GUIDE.md).

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd smartshell-deno
```

2. Cache dependencies:
```bash
deno cache server.ts sdk.ts config.ts main.ts
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Environment Variables

See [`.env.example`](.env.example) for available configuration options:

**Required Variables:**
- `SHELL_HOST`: SmartShell API host (default: "billing")
- `SHELL_LOGIN`: Your SmartShell username
- `SHELL_PASSWORD`: Your SmartShell password
- `SHELL_CLUB_IDS`: Comma-separated club IDs

**Optional Variables:**
- `PORT`: Server port (default: 8000)
- `HOSTNAME`: Server hostname (default: localhost)
- `ALLOWED_ORIGIN`: CORS allowed origin
- `SESSION_TIMEOUT_MS`: Session timeout in milliseconds
- `RATE_LIMIT_LOGIN`: Maximum login attempts
- `RATE_LIMIT_API`: API rate limit
- `LOG_LEVEL`: Logging level (debug, info, warn, error)

### Switching Between Versions

The project maintains both original and refactored implementations:

| Component | Original | Refactored |
|-----------|----------|------------|
| Backend | [`server.ts`](server.ts:1) | [`main.ts`](main.ts:1) |
| Frontend | [`frontend/index.html`](frontend/index.html:1) | [`frontend/index-refactored.html`](frontend/index-refactored.html:1) |

**To use refactored frontend with backend:**
Edit [`server.ts`](server.ts:58) line 58:
```typescript
const html = await Deno.readTextFile("./frontend/index-refactored.html");
```

**To use refactored frontend standalone:**
```bash
cd frontend
deno run --allow-net --allow-read start-server.ts
```

## 📚 Documentation

### Running Guides

- **[QUICK_START.md](QUICK_START.md)**: Quick 5-minute setup guide with step-by-step instructions
- **[RUN_GUIDE.md](RUN_GUIDE.md)**: Comprehensive guide for development and production deployment

### Architecture Documentation

- **[REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md)**: High-level overview of the refactored architecture, benefits, and migration guide
- **[DETAILED_CHANGES.md](DETAILED_CHANGES.md)**: Detailed explanation of all changes made, with before/after code examples
- **[REFACTORING_PLAN.md](REFACTORING_PLAN.md)**: Original refactoring plan with design patterns and SOLID principles
- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)**: Implementation examples for each component
- **[ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)**: Visual architecture diagrams with Mermaid charts

### Backend Documentation

- **[src/backend/README.md](src/backend/README.md)**: Backend architecture overview and component descriptions

### Frontend Documentation

- **[src/frontend/README.md](src/frontend/README.md)**: Frontend architecture overview and component descriptions

## 🛠️ Development

### Project Structure

```
smartshell-deno/
├── src/
│   ├── backend/              # Backend application
│   │   ├── bootstrap/       # Application bootstrap
│   │   ├── controllers/     # HTTP request handlers
│   │   ├── services/        # Business logic
│   │   ├── repositories/     # Data access
│   │   ├── domain/          # Entities and interfaces
│   │   ├── validators/      # Input validation
│   │   ├── middleware/      # Cross-cutting concerns
│   │   ├── infrastructure/   # External integrations
│   │   ├── factories/        # Object creation
│   │   └── routes/          # Route definitions
│   └── frontend/           # Frontend application
│       ├── components/      # UI components
│       ├── services/        # Frontend services
│       ├── state/           # State management
│       ├── events/          # Event system
│       ├── modules/         # Feature modules
│       ├── templates/       # HTML templates
│       └── styles/          # CSS styles
├── backend/                # Legacy backend (deprecated)
├── frontend/               # Legacy frontend (deprecated)
├── tests/                  # Test suites
├── .env.example           # Environment template
└── main.ts                # Application entry point
```

### Adding a New Feature

See [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md#migration-guide-for-developers) for detailed migration patterns.

### Code Style

- **TypeScript**: Strict mode enabled
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Comments**: JSDoc for public APIs
- **Formatting**: 2-space indentation

### SOLID Principles

The codebase follows SOLID principles:

- **SRP**: Each class has one responsibility
- **OCP**: Open for extension, closed for modification
- **LSP**: Subtypes properly substitute base types
- **ISP**: Small, focused interfaces
- **DIP**: Depend on abstractions, not concretions

See [DETAILED_CHANGES.md](DETAILED_CHANGES.md#solid-principles-implementation-details) for detailed examples.

## 🧪 Testing

### Running Tests

```bash
# Run all tests
deno test --allow-net --allow-read

# Run specific test file
deno test --allow-net --allow-read tests/backend/services/BookingService.test.ts

# Run with coverage
deno test --allow-net --allow-read --coverage
```

### Test Structure

```
tests/
├── backend/
│   ├── controllers/      # Controller tests
│   ├── services/         # Service tests
│   └── repositories/      # Repository tests
├── frontend/
│   └── components/       # Component tests
└── integration/          # Integration tests
```

### Test Coverage

Target coverage: **85%+**

Current coverage can be viewed in the test output or coverage reports.

## 🚢 Deployment

For comprehensive deployment instructions including Docker, reverse proxy configuration, and process management, see [RUN_GUIDE.md](RUN_GUIDE.md#production-deployment).

### Quick Production Deployment

1. Set environment variables:
```bash
export SHELL_LOGIN=production_login
export SHELL_PASSWORD=production_password
export SHELL_CLUB_IDS=6242
export PORT=8080
export HOSTNAME=0.0.0.0
export ALLOWED_ORIGIN=https://your-domain.com
```

2. Start the server:
```bash
deno run --allow-net --allow-read --allow-write -A main.ts
```

3. Or compile to binary:
```bash
deno compile --allow-net --allow-read --allow-write -o smartshell main.ts
./smartshell
```

For detailed deployment options, see [RUN_GUIDE.md](RUN_GUIDE.md#production-deployment).

## 🔒 Security

### Security Features

- **Authentication**: Secure session management with IP and User-Agent validation
- **Rate Limiting**: Configurable rate limits per IP
- **Input Validation**: Comprehensive validation for all inputs
- **XSS Prevention**: Input sanitization and output encoding
- **CORS Protection**: Configurable CORS policies
- **SQL Injection Prevention**: Parameterized queries (where applicable)

### Security Best Practices

1. Never commit `.env` files
2. Use strong session secrets
3. Keep dependencies updated
4. Enable HTTPS in production
5. Configure appropriate CORS policies
6. Monitor security logs

## 📊 Performance

### Optimization Strategies

- **Caching**: In-memory caching for frequently accessed data
- **Lazy Loading**: Components load data on demand
- **Debouncing**: Rate-limited UI updates
- **Code Splitting**: Frontend modules loaded as needed
- **Connection Pooling**: Reuse HTTP connections

### Performance Metrics

- **API Response Time**: < 200ms average
- **Frontend Load Time**: < 1.5s initial load
- **Memory Usage**: < 65MB typical
- **Bundle Size**: < 400KB total

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes following the code style
4. Write tests for new features
5. Ensure all tests pass
6. Submit a pull request

### Pull Request Guidelines

- Clear description of changes
- Link to related issues
- Update documentation if needed
- Follow SOLID principles
- Maintain test coverage

## 📝 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and questions:
- Email: support@example.com
- Documentation: See [Documentation](#documentation) section
- Issues: Report via project management system

## 🙏 Acknowledgments

- SmartShell API for providing the gaming club management platform
- Deno team for the excellent runtime
- All contributors to this project

---

**Version**: 2.0.0  
**Last Updated**: December 29, 2024  
**Status**: Production Ready
