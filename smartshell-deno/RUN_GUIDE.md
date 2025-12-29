# Run Guide

Comprehensive guide for running the SmartShell Deno application in development and production environments.

## Table of Contents

- [Backend Server](#backend-server)
  - [Development Mode](#development-mode)
  - [Production Mode](#production-mode)
  - [Refactored Backend](#refactored-backend)
  - [Backend Configuration](#backend-configuration)
- [Frontend](#frontend)
  - [Original Frontend](#original-frontend)
  - [Refactored Frontend](#refactored-frontend)
  - [Frontend Build](#frontend-build)
  - [Frontend Development Server](#frontend-development-server)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Backend Server

The application provides two backend implementations:
- **Original Backend** ([`server.ts`](server.ts:1)) - Legacy implementation
- **Refactored Backend** ([`main.ts`](main.ts:1)) - New Clean Architecture implementation

### Development Mode

Development mode includes hot reload for automatic server restart when files change.

#### Using Deno Watch

```bash
deno run --watch -A server.ts
```

Or use the predefined task:

```bash
deno task dev
```

**Features:**
- Automatic restart on file changes
- Full permissions granted with `-A` flag
- Monitors all TypeScript files in the project
- Displays restart notifications in console

#### Development with Logging

For enhanced debugging, you can add environment variables:

```bash
LOG_LEVEL=debug deno run --watch -A server.ts
```

### Production Mode

Production mode runs without watch mode for better performance.

#### Standard Production Run

```bash
deno run -A server.ts
```

Or use the predefined task:

```bash
deno task run
```

#### Production with Specific Port

```bash
PORT=8080 deno run -A server.ts
```

#### Production with Custom Hostname

```bash
HOSTNAME=0.0.0.0 PORT=8080 deno run -A server.ts
```

### Refactored Backend

The refactored backend uses Clean Architecture with dependency injection, middleware, and comprehensive error handling.

#### Start Refactored Backend

```bash
deno run -A main.ts
```

**What happens on startup:**

1. **Application Initialization**
   - Dependency Injection Container setup
   - Service registration (Auth, Booking, Host, Session, Payment)
   - Middleware pipeline initialization
   - Router configuration with all routes

2. **Smoke Tests**
   - SmartShell API connectivity check
   - Club information retrieval
   - Host groups verification
   - GraphQL query validation

3. **Server Startup**
   - HTTP server starts on configured port (default: 8000)
   - All available routes are logged
   - Ready to handle requests

#### Example Startup Output

```
Initializing SmartShell with refactored architecture...
Starting server on http://localhost:8000
Server running at http://localhost:8000
Available endpoints:
  GET    /api/auth/login
  POST   /api/auth/logout
  GET    /api/hosts
  GET    /api/hosts/:id
  GET    /api/bookings
  POST   /api/bookings
  DELETE /api/bookings/:id
  GET    /api/sessions
  POST   /api/sessions
  GET    /api/payments
  POST   /api/payments

Running smoke tests...
Smoke test: SDK init...
Club: My Gaming Club ID: 6242
Host groups: 3
 - VIP Zone (ID: 1)
 - Standard Zone (ID: 2)
 - Tournament Zone (ID: 3)
Hosts: 45
Smoke test finished.
```

### Backend Configuration

#### Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

**Required Variables:**

```env
# SmartShell API Configuration
SHELL_HOST=billing              # SmartShell API host
SHELL_LOGIN=your_login          # Your SmartShell username
SHELL_PASSWORD=your_password    # Your SmartShell password
SHELL_CLUB_IDS=6242             # Comma-separated club IDs
```

**Optional Variables:**

```env
# Server Configuration
PORT=8000                       # Server port (default: 8000)
HOSTNAME=localhost              # Server hostname (default: localhost)

# Security Configuration
ALLOWED_ORIGIN=http://localhost:8000    # CORS allowed origin
SESSION_TIMEOUT_MS=86400000              # Session timeout (24 hours)
RATE_LIMIT_LOGIN=5                       # Max login attempts
RATE_LIMIT_WINDOW_MS=900000             # Rate limit window (15 minutes)
RATE_LIMIT_API=100                       # API rate limit
API_RATE_WINDOW_MS=60000                 # API rate window (1 minute)

# CORS Security
CORS_CREDENTIALS=true            # Allow credentials
CORS_MAX_AGE=86400               # CORS max age (24 hours)

# Security Headers
ENABLE_SECURITY_HEADERS=true     # Enable security headers
ENABLE_CSP=true                  # Enable Content Security Policy
ENABLE_XSS_PROTECTION=true       # Enable XSS protection
ENABLE_FRAME_PROTECTION=true     # Enable frame protection

# Logging
LOG_LEVEL=info                   # Log level: debug, info, warn, error
SECURITY_LOG_LEVEL=medium        # Security log level
```

#### Permission Flags

The backend requires the following permissions:

| Flag | Purpose |
|------|---------|
| `--allow-net` | Network access for API calls |
| `--allow-read` | Read access for files and templates |
| `--allow-write` | Write access for logs and cache |
| `--allow-env` | Environment variable access |
| `-A` | All permissions (equivalent to above) |

---

## Frontend

The application provides two frontend implementations:
- **Original Frontend** ([`frontend/index.html`](frontend/index.html:1)) - Legacy implementation
- **Refactored Frontend** ([`frontend/index-refactored.html`](frontend/index-refactored.html:1)) - New component-based architecture

### Original Frontend

The original frontend is served by the backend server by default.

#### Start Backend with Original Frontend

```bash
deno run -A server.ts
```

Then visit: `http://localhost:8000`

**Features:**
- Single-page application
- Embedded JavaScript
- Direct API integration
- Basic UI components

### Refactored Frontend

The refactored frontend uses a modern component-based architecture with state management and event system.

#### Option 1: Standalone Development Server

Run the frontend development server independently:

```bash
cd frontend
deno run --allow-net --allow-read start-server.ts
```

Then visit: `http://localhost:8000`

**Features:**
- Hot reload for TypeScript files
- API proxy to backend on port 8001
- Static file serving from `src/` directory
- Development-friendly error messages

#### Option 2: Backend Integration

Modify the backend to serve the refactored frontend:

1. Edit [`server.ts`](server.ts:58):

```typescript
// Change line 58 from:
const html = await Deno.readTextFile("./frontend/index.html");

// To:
const html = await Deno.readTextFile("./frontend/index-refactored.html");
```

2. Start the backend:

```bash
deno run -A server.ts
```

3. Visit: `http://localhost:8000`

#### Refactored Frontend Architecture

The refactored frontend consists of:

```
src/frontend/
├── components/       # Reusable UI components
│   ├── BaseComponent.ts      # Base component with lifecycle
│   ├── LoginComponent.ts     # Login component
│   ├── BookingComponent.ts   # Booking management
│   ├── HostComponent.ts      # Host monitoring
│   ├── PaymentComponent.ts   # Payment tracking
│   ├── ModalComponent.ts     # Modal dialogs
│   └── ProfileComponent.ts   # User profile
├── services/         # Frontend services
│   └── ApiService.ts         # API communication
├── state/            # State management
│   └── StateStore.ts         # Centralized state
├── events/           # Event system
│   └── EventBus.ts           # Event bus
├── modules/          # Feature modules
│   ├── App.ts                # Main application
│   └── MapComponent.ts       # Interactive map
├── templates/        # HTML templates
│   ├── main.html             # Main template
│   └── modals.html           # Modal templates
└── styles/           # CSS styles
    └── main.css              # Main stylesheet
```

### Frontend Build

The frontend includes a build script for production deployment.

#### Build Frontend

```bash
cd frontend
deno run build.ts
```

**What the build does:**
- Compiles TypeScript files
- Bundles components and modules
- Optimizes assets
- Outputs to `dist/` directory

#### Build Output Structure

```
dist/
├── index.html           # Main HTML file
├── bundle.js            # Bundled JavaScript
├── styles/
│   └── main.css         # Compiled styles
└── assets/              # Static assets
```

### Frontend Development Server

The development server provides hot reload and API proxying.

#### Start Development Server

```bash
cd frontend
deno run --allow-net --allow-read start-server.ts
```

**Features:**

1. **Hot Reload**
   - Automatically reloads on file changes
   - Preserves application state where possible
   - Shows build errors in browser console

2. **API Proxy**
   - Proxies `/api/*` requests to backend
   - Handles CORS automatically
   - Supports all HTTP methods

3. **Static File Serving**
   - Serves TypeScript, CSS, and HTML files
   - Correct MIME types for each file type
   - Supports nested directory structure

#### Development Server Configuration

Edit [`frontend/start-server.ts`](frontend/start-server.ts:8) to configure:

```typescript
const PORT = 8000;           // Frontend server port
const HOST = "localhost";    // Server hostname
const BACKEND_URL = "http://localhost:8001";  // Backend API URL
```

#### Accessing the Development Server

- Frontend: `http://localhost:8000`
- Backend API: `http://localhost:8001/api/*`

---

## Testing

The project includes comprehensive test suites for backend, frontend, and integration testing.

### Run All Tests

```bash
deno test --allow-net --allow-read tests/
```

### Run Specific Test Categories

#### Backend Service Tests

```bash
deno test --allow-net --allow-read tests/backend/services/
```

Tests:
- [`BookingService.test.ts`](tests/backend/services/BookingService.test.ts:1)
- [`HostService.test.ts`](tests/backend/services/HostService.test.ts:1)

#### Backend Controller Tests

```bash
deno test --allow-net --allow-read tests/backend/controllers/
```

Tests:
- [`HostController.test.ts`](tests/backend/controllers/HostController.test.ts:1)

#### Backend Repository Tests

```bash
deno test --allow-net --allow-read tests/backend/repositories/
```

Tests:
- [`HostRepository.test.ts`](tests/backend/repositories/HostRepository.test.ts:1)

#### Frontend Component Tests

```bash
deno test --allow-net --allow-read tests/frontend/components/
```

Tests:
- [`LoginComponent.test.ts`](tests/frontend/components/LoginComponent.test.ts:1)

#### Integration Tests

```bash
deno test --allow-net --allow-read tests/integration/
```

Tests:
- [`api.test.ts`](tests/integration/api.test.ts:1)

### Run with Coverage

```bash
deno test --allow-net --allow-read --coverage=coverage
```

Generate coverage report:

```bash
deno coverage coverage --lcov > coverage.lcov
```

### Run Specific Test File

```bash
deno test --allow-net --allow-read tests/backend/services/HostService.test.ts
```

### Run Tests in Watch Mode

```bash
deno test --allow-net --allow-read --watch tests/
```

### Smoke Tests

Smoke tests verify basic functionality and API connectivity:

```bash
deno task smoke
```

Or run directly:

```bash
deno run -A main.ts
```

Smoke tests include:
- SDK initialization
- Club information retrieval
- Host groups verification
- GraphQL query execution

---

## Production Deployment

### Prerequisites

Before deploying to production:

1. **Set Production Environment Variables**
   ```bash
   export SHELL_HOST=billing
   export SHELL_LOGIN=production_login
   export SHELL_PASSWORD=production_password
   export SHELL_CLUB_IDS=6242
   export PORT=8080
   export HOSTNAME=0.0.0.0
   export ALLOWED_ORIGIN=https://your-domain.com
   ```

2. **Build Frontend**
   ```bash
   cd frontend
   deno run build.ts
   cd ..
   ```

3. **Run Tests**
   ```bash
   deno test --allow-net --allow-read tests/
   ```

### Deployment Options

#### Option 1: Direct Deno Run

```bash
deno run --allow-net --allow-read --allow-write -A main.ts
```

#### Option 2: Compiled Binary

Compile to a standalone executable:

```bash
deno compile --allow-net --allow-read --allow-write -o smartshell main.ts
```

Run the compiled binary:

```bash
./smartshell
```

#### Option 3: Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM denoland/deno:1.40.0

WORKDIR /app

COPY . .

ENV PORT=8080
ENV HOSTNAME=0.0.0.0

EXPOSE 8080

CMD ["run", "--allow-net", "--allow-read", "--allow-write", "main.ts"]
```

Build and run:

```bash
docker build -t smartshell-deno .
docker run -p 8080:8080 \
  -e SHELL_LOGIN=your_login \
  -e SHELL_PASSWORD=your_password \
  -e SHELL_CLUB_IDS=6242 \
  smartshell-deno
```

#### Option 4: Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  smartshell:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SHELL_HOST=billing
      - SHELL_LOGIN=${SHELL_LOGIN}
      - SHELL_PASSWORD=${SHELL_PASSWORD}
      - SHELL_CLUB_IDS=${SHELL_CLUB_IDS}
      - PORT=8080
      - HOSTNAME=0.0.0.0
      - ALLOWED_ORIGIN=https://your-domain.com
    restart: unless-stopped
```

Run:

```bash
docker-compose up -d
```

### Reverse Proxy Configuration

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Deno
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files (if built)
    location /static/ {
        alias /app/dist/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Apache Configuration

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com

    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/your-cert.pem
    SSLCertificateKeyFile /etc/ssl/private/your-key.pem

    ProxyPreserveHost On
    ProxyRequests Off

    <Proxy *>
        Order deny,allow
        Allow from all
    </Proxy>

    ProxyPass / http://localhost:8080/
    ProxyPassReverse / http://localhost:8080/
</VirtualHost>
```

### Process Management

#### Using PM2

Install PM2:

```bash
npm install -g pm2
```

Create ecosystem file `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'smartshell',
    script: 'main.ts',
    interpreter: 'deno',
    interpreter_args: 'run --allow-net --allow-read --allow-write',
    env: {
      PORT: 8080,
      HOSTNAME: '0.0.0.0'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

Start with PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Using Systemd

Create `/etc/systemd/system/smartshell.service`:

```ini
[Unit]
Description=SmartShell Deno Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/smartshell-deno
Environment="PORT=8080"
Environment="HOSTNAME=0.0.0.0"
Environment="SHELL_LOGIN=your_login"
Environment="SHELL_PASSWORD=your_password"
Environment="SHELL_CLUB_IDS=6242"
ExecStart=/usr/bin/deno run --allow-net --allow-read --allow-write main.ts
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable smartshell
sudo systemctl start smartshell
sudo systemctl status smartshell
```

### Monitoring and Logging

#### Log Rotation

Create `/etc/logrotate.d/smartshell`:

```
/var/log/smartshell/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload smartshell > /dev/null 2>&1 || true
    endscript
}
```

#### Health Checks

Add health check endpoint to monitor application status:

```bash
curl http://localhost:8080/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2024-12-29T19:00:00.000Z",
  "version": "2.0.0"
}
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: Permission Denied

**Symptoms:**
```
error: Requires net access
error: Requires read access
```

**Solution:**
Run with proper permissions:

```bash
deno run --allow-net --allow-read --allow-write -A server.ts
```

Or use the `-A` flag for all permissions:

```bash
deno run -A server.ts
```

#### Issue: Port Already in Use

**Symptoms:**
```
error: Address already in use (os error 48)
```

**Solution:**

1. Find the process using the port:
   ```bash
   # Linux/macOS
   lsof -i :8000

   # Windows
   netstat -ano | findstr :8000
   ```

2. Kill the process:
   ```bash
   # Linux/macOS
   kill -9 <PID>

   # Windows
   taskkill /PID <PID> /F
   ```

3. Or use a different port:
   ```bash
   PORT=8001 deno run -A server.ts
   ```

#### Issue: SmartShell API Connection Failed

**Symptoms:**
```
Smoke test: SDK init...
currentClub failed: Network error
```

**Solution:**

1. Verify credentials in `.env`:
   ```bash
   cat .env
   ```

2. Check internet connection:
   ```bash
   ping billing.smartshell.com
   ```

3. Verify SHELL_HOST value:
   ```env
   SHELL_HOST=billing  # Should be "billing", "mobile-auth", "owner", or "host"
   ```

4. Run smoke tests to diagnose:
   ```bash
   deno task smoke
   ```

5. Check firewall settings:
   ```bash
   # Linux
   sudo ufw status

   # Windows
   netsh advfirewall show allprofiles
   ```

#### Issue: TypeScript Compilation Errors

**Symptoms:**
```
error: TS2345: Argument of type 'string' is not assignable to parameter of type 'number'
```

**Solution:**

1. Clear Deno cache:
   ```bash
   deno cache --reload server.ts sdk.ts config.ts main.ts
   ```

2. Update Deno to latest version:
   ```bash
   deno upgrade
   ```

3. Check TypeScript configuration in [`deno.json`](deno.json:8):
   ```json
   {
     "compilerOptions": {
       "strict": true
     }
   }
   ```

4. Run with `--check` flag for detailed errors:
   ```bash
   deno check server.ts
   ```

#### Issue: Frontend Not Loading

**Symptoms:**
- Browser shows blank page
- Console shows 404 errors
- Static files not found

**Solution:**

1. Verify server is running:
   ```bash
   curl http://localhost:8000
   ```

2. Check which HTML file is being served in [`server.ts`](server.ts:58):
   ```typescript
   const html = await Deno.readTextFile("./frontend/index.html");
   // or
   const html = await Deno.readTextFile("./frontend/index-refactored.html");
   ```

3. Check file permissions:
   ```bash
   ls -la frontend/
   ```

4. Verify file paths are correct:
   ```bash
   ls -la frontend/index.html
   ls -la frontend/index-refactored.html
   ```

5. Check browser console for specific errors:
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for red error messages

#### Issue: CORS Errors

**Symptoms:**
```
Access to fetch at 'http://localhost:8000/api/hosts' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**

1. Check `ALLOWED_ORIGIN` in `.env`:
   ```env
   ALLOWED_ORIGIN=http://localhost:3000
   ```

2. Or allow all origins (not recommended for production):
   ```env
   ALLOWED_ORIGIN=*
   ```

3. Restart server after changing `.env`:
   ```bash
   deno run -A server.ts
   ```

4. Verify CORS headers in response:
   ```bash
   curl -I http://localhost:8000/api/hosts
   ```

#### Issue: Rate Limiting Too Aggressive

**Symptoms:**
```
{"error": "rate_limit_exceeded"}
```

**Solution:**

1. Adjust rate limits in `.env`:
   ```env
   RATE_LIMIT_API=200
   API_RATE_WINDOW_MS=60000
   ```

2. Restart server:
   ```bash
   deno run -A server.ts
   ```

3. Or disable rate limiting for development (not recommended):
   - Comment out rate limiting code in [`server.ts`](server.ts:40)

#### Issue: Session Timeout Too Short

**Symptoms:**
- Users logged out frequently
- Session expired errors

**Solution:**

1. Increase session timeout in `.env`:
   ```env
   SESSION_TIMEOUT_MS=86400000  # 24 hours
   ```

2. Or use longer duration:
   ```env
   SESSION_TIMEOUT_MS=604800000  # 7 days
   ```

3. Restart server:
   ```bash
   deno run -A server.ts
   ```

#### Issue: Memory Usage High

**Symptoms:**
- Server becomes slow
- High memory consumption
- Possible memory leaks

**Solution:**

1. Monitor memory usage:
   ```bash
   # Linux/macOS
   ps aux | grep deno

   # Windows
   tasklist | findstr deno
   ```

2. Check for memory leaks:
   - Review code for event listener cleanup
   - Ensure proper disposal of resources
   - Check for circular references

3. Restart server periodically:
   ```bash
   # Using PM2
   pm2 restart smartshell

   # Using systemd
   sudo systemctl restart smartshell
   ```

4. Increase Deno memory limit:
   ```bash
   deno run --v8-flags=--max-old-space-size=4096 -A server.ts
   ```

#### Issue: Hot Reload Not Working

**Symptoms:**
- Changes not reflected
- Server not restarting

**Solution:**

1. Ensure using `--watch` flag:
   ```bash
   deno run --watch -A server.ts
   ```

2. Check watch mode is active:
   - Look for "Watching for file changes" message
   - Verify file modifications trigger restart

3. Check file permissions:
   ```bash
   ls -la *.ts
   ```

4. Try manual restart:
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   deno run -A server.ts
   ```

#### Issue: Database/Storage Issues

**Symptoms:**
- Data not persisting
- Token cache errors
- File write errors

**Solution:**

1. Check write permissions:
   ```bash
   ls -la token-cache.json
   ```

2. Verify disk space:
   ```bash
   # Linux/macOS
   df -h

   # Windows
   dir
   ```

3. Clear cache files:
   ```bash
   rm token-cache.json
   ```

4. Restart server:
   ```bash
   deno run -A server.ts
   ```

### Debug Mode

Enable debug logging for detailed information:

```bash
LOG_LEVEL=debug deno run -A server.ts
```

Debug output includes:
- Request/response details
- Middleware execution
- Service calls
- Error stack traces

### Getting Help

If you encounter issues not covered here:

1. **Check Logs**
   - Server console output
   - Browser console (F12)
   - Application logs

2. **Verify Configuration**
   - Environment variables in `.env`
   - File paths and permissions
   - Network connectivity

3. **Review Documentation**
   - [README.md](README.md) - Project overview
   - [QUICK_START.md](QUICK_START.md) - Quick setup guide
   - [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md) - Architecture details

4. **Test Components**
   - Run smoke tests: `deno task smoke`
   - Run unit tests: `deno test tests/`
   - Check API endpoints manually

5. **Check Deno Version**
   ```bash
   deno --version
   ```
   Ensure you're using Deno 1.40 or higher.

---

## Summary

This guide covers all aspects of running the SmartShell Deno application:

- **Backend**: Original and refactored versions with development and production modes
- **Frontend**: Original and refactored versions with build and development servers
- **Testing**: Comprehensive test suite with coverage reporting
- **Deployment**: Multiple deployment options including Docker and process managers
- **Troubleshooting**: Common issues and solutions

For quick setup, see [QUICK_START.md](QUICK_START.md). For architecture details, see [README.md](README.md).
