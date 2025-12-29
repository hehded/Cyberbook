# Quick Start Guide

Get the SmartShell Deno application up and running in minutes.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Deno** 1.40 or higher
  - Install: `curl -fsSL https://deno.land/install.sh | sh` (Linux/macOS)
  - Install: `iwr https://deno.land/install.ps1 -useb | iex` (PowerShell)
  - Verify: `deno --version`

- **SmartShell API Access**
  - Valid SmartShell account credentials
  - Club ID for your gaming club

- **Text Editor** (VSCode recommended with Deno extension)

## 🚀 Quick Setup (5 Minutes)

### 1. Clone or Navigate to Project

```bash
cd smartshell-deno
```

### 2. Configure Environment

Copy the example environment file and add your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your SmartShell credentials:

```env
# SmartShell API Configuration
SHELL_HOST=billing
SHELL_LOGIN=your_login_here
SHELL_PASSWORD=your_password_here
SHELL_CLUB_IDS=6242

# Server Configuration
PORT=8000
HOSTNAME=localhost

# Security Configuration
ALLOWED_ORIGIN=http://localhost:8000
SESSION_TIMEOUT_MS=86400000
```

### 3. Cache Dependencies

```bash
deno cache server.ts sdk.ts config.ts main.ts
```

### 4. Run the Server

**Development Mode (with hot reload):**
```bash
deno run --watch -A server.ts
```

**Production Mode:**
```bash
deno run -A server.ts
```

Or use the defined tasks:
```bash
deno task dev    # Development with watch
deno task run    # Production
```

### 5. Access the Application

Open your browser and navigate to:

```
http://localhost:8000
```

## 🔄 Running Different Versions

### Original Frontend (Legacy)

The original frontend is served by default when accessing the root path:

```bash
deno run -A server.ts
# Visit: http://localhost:8000
```

### Refactored Frontend (New Architecture)

To run the refactored frontend, you have two options:

**Option 1: Standalone Development Server**
```bash
cd frontend
deno run --allow-net --allow-read start-server.ts
# Visit: http://localhost:8000
```

**Option 2: Modify Server Entry Point**
Edit [`server.ts`](server.ts:58) to serve the refactored version:
```typescript
// Change line 58 from:
const html = await Deno.readTextFile("./frontend/index.html");
// To:
const html = await Deno.readTextFile("./frontend/index-refactored.html");
```

Then run:
```bash
deno run -A server.ts
```

### Refactored Backend (New Architecture)

The refactored backend uses the new entry point:

```bash
deno run -A main.ts
```

This version includes:
- Dependency Injection Container
- Middleware Pipeline (Auth, CORS, Logging, Rate Limiting)
- Clean Architecture with Controllers, Services, Repositories
- Automatic smoke tests on startup

## 🧪 Running Tests

### Run All Tests

```bash
deno test --allow-net --allow-read tests/
```

### Run Specific Test Categories

```bash
# Backend services only
deno test --allow-net --allow-read tests/backend/services/

# Backend controllers only
deno test --allow-net --allow-read tests/backend/controllers/

# Frontend components only
deno test --allow-net --allow-read tests/frontend/components/

# Integration tests only
deno test --allow-net --allow-read tests/integration/
```

### Run with Coverage

```bash
deno test --allow-net --allow-read --coverage=coverage
```

## 🛠️ Common Development Workflows

### 1. Start Backend with Smoke Tests

```bash
deno run -A main.ts
```

This will:
- Initialize the refactored backend
- Run smoke tests to verify SmartShell API connectivity
- Start the server on port 8000
- Display all available API endpoints

### 2. Start Backend in Watch Mode

```bash
deno run --watch -A server.ts
```

The server will automatically restart when you save changes to any file.

### 3. Start Frontend Dev Server

```bash
cd frontend
deno run --allow-net --allow-read start-server.ts
```

This serves the refactored frontend with:
- Hot reload for TypeScript files
- API proxy to backend on port 8001
- Static file serving from `src/` directory

### 4. Build Frontend (If Needed)

```bash
cd frontend
deno run build.ts
```

### 5. Run Smoke Tests Only

```bash
deno task smoke
```

## 📁 Project Structure Overview

```
smartshell-deno/
├── main.ts                 # Refactored backend entry point
├── server.ts               # Original backend entry point
├── deno.json              # Deno configuration and tasks
├── .env                   # Environment variables (create from .env.example)
├── .env.example           # Environment template
│
├── src/backend/           # Refactored backend (Clean Architecture)
│   ├── bootstrap/        # Application initialization
│   ├── controllers/      # HTTP request handlers
│   ├── services/         # Business logic
│   ├── repositories/     # Data access layer
│   ├── middleware/       # Cross-cutting concerns
│   ├── routes/           # API routes
│   └── domain/           # Entities and interfaces
│
├── src/frontend/          # Refactored frontend
│   ├── components/       # UI components
│   ├── services/         # Frontend services
│   ├── state/            # State management
│   ├── events/           # Event system
│   └── modules/          # Feature modules
│
├── backend/              # Legacy backend (deprecated)
├── frontend/             # Legacy frontend files
│   ├── index.html        # Original frontend
│   ├── index-refactored.html  # Refactored frontend entry
│   ├── build.ts          # Build script
│   └── start-server.ts   # Dev server
│
└── tests/                # Test suites
    ├── backend/
    ├── frontend/
    └── integration/
```

## 🔧 Available Deno Tasks

The project includes several predefined tasks in [`deno.json`](deno.json:2):

```bash
deno task dev    # Run with watch mode (development)
deno task run    # Run without watch (production)
deno task smoke  # Run smoke tests
deno task cache  # Cache dependencies
```

## 🌐 API Endpoints

When the server starts, it will display all available endpoints:

```
Available endpoints:
  GET  /api/auth/login
  POST /api/auth/logout
  GET  /api/hosts
  GET  /api/hosts/:id
  GET  /api/bookings
  POST /api/bookings
  DELETE /api/bookings/:id
  GET  /api/sessions
  POST /api/sessions
  GET  /api/payments
  POST /api/payments
```

## 🐛 Troubleshooting

### Permission Denied Errors

Ensure you're running Deno with the correct permissions:

```bash
deno run --allow-net --allow-read --allow-write -A server.ts
```

The `-A` flag grants all permissions.

### SmartShell API Connection Failed

1. Verify your credentials in `.env` are correct
2. Check your internet connection
3. Ensure SHELL_HOST is set to the correct value (usually "billing")
4. Run smoke tests to verify connectivity:
   ```bash
   deno task smoke
   ```

### Port Already in Use

Change the port in your `.env` file:

```env
PORT=8001
```

Or set it via environment variable:

```bash
PORT=8001 deno run -A server.ts
```

### TypeScript Compilation Errors

Clear the Deno cache and try again:

```bash
deno cache --reload server.ts sdk.ts config.ts main.ts
deno run -A server.ts
```

### Frontend Not Loading

1. Check that the server is running
2. Verify the correct HTML file is being served
3. Check browser console for errors
4. Ensure static files are accessible

## 📚 Next Steps

- Read [RUN_GUIDE.md](RUN_GUIDE.md) for detailed instructions
- Check [README.md](README.md) for architecture overview
- See [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md) for refactoring details
- Explore [src/backend/README.md](src/backend/README.md) for backend architecture
- Explore [src/frontend/README.md](src/frontend/README.md) for frontend architecture

## 💡 Tips

1. **Use Watch Mode**: Always use `--watch` flag during development for automatic restarts
2. **Check Logs**: Monitor console output for API errors and warnings
3. **Test Early**: Run smoke tests after any configuration changes
4. **Use Environment Files**: Never commit `.env` files with real credentials
5. **Version Compatibility**: Ensure Deno version is 1.40 or higher

## 🆘 Need Help?

- Check the [troubleshooting section](#-troubleshooting) above
- Review [RUN_GUIDE.md](RUN_GUIDE.md) for detailed solutions
- Examine server logs for specific error messages
- Verify environment configuration matches requirements

---

**Ready to go?** Start with step 1 above and you'll have the application running in minutes!
