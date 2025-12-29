/**
 * Logging Middleware
 * Follows Middleware Pattern and SOLID principles
 * Provides request/response logging for monitoring and debugging
 */

// Use global types for Request and Response
type Request = globalThis.Request;
type Response = globalThis.Response;

export interface LoggingOptions {
  logRequests?: boolean;
  logResponses?: boolean;
  logHeaders?: boolean;
  logBody?: boolean;
  excludePaths?: string[];
  logLevel?: 'info' | 'debug' | 'warn' | 'error';
}

export function createLoggingMiddleware(options: LoggingOptions = {}) {
  const {
    logRequests = true,
    logResponses = true,
    logHeaders = false,
    logBody = false,
    excludePaths = ['/health', '/metrics'],
    logLevel = 'info'
  } = options;

  return async (req: Request, next: () => Promise<Response>): Promise<Response> => {
    const startTime = Date.now();
    const url = new URL(req.url);
    
    // Skip logging for excluded paths
    if (excludePaths.some(path => url.pathname.startsWith(path))) {
      return await next();
    }

    // Log request
    if (logRequests) {
      const logData: any = {
        method: req.method,
        url: req.url,
        pathname: url.pathname,
        timestamp: new Date().toISOString(),
        userAgent: req.headers.get('user-agent'),
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      };

      if (logHeaders) {
        logData.headers = Object.fromEntries(req.headers.entries());
      }

      if (logBody && req.method !== 'GET') {
        try {
          const body = await req.clone().text();
          if (body) {
            logData.body = body.substring(0, 1000); // Limit body size in logs
          }
        } catch (error) {
          logData.bodyError = 'Failed to read body';
        }
      }

      logMessage('request', logData, logLevel);
    }

    // Execute request
    const response = await next();
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Log response
    if (logResponses) {
      const logData: any = {
        method: req.method,
        url: req.url,
        pathname: url.pathname,
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      };

      if (logHeaders) {
        logData.responseHeaders = Object.fromEntries(response.headers.entries());
      }

      // Try to get response size
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        logData.contentLength = contentLength;
      }

      logMessage('response', logData, logLevel);
    }

    return response;
  };
}

/**
 * Simple request logging middleware
 */
export const simpleLoggingMiddleware = createLoggingMiddleware({
  logRequests: true,
  logResponses: true,
  logHeaders: false,
  logBody: false
});

/**
 * Detailed logging middleware for development
 */
export const detailedLoggingMiddleware = createLoggingMiddleware({
  logRequests: true,
  logResponses: true,
  logHeaders: true,
  logBody: true,
  excludePaths: [],
  logLevel: 'debug'
});

/**
 * Production logging middleware (minimal logs)
 */
export const productionLoggingMiddleware = createLoggingMiddleware({
  logRequests: true,
  logResponses: true,
  logHeaders: false,
  logBody: false,
  excludePaths: ['/health', '/metrics', '/favicon.ico'],
  logLevel: 'info'
});

/**
 * Helper function to log messages with consistent format
 */
function logMessage(type: string, data: any, level: string): void {
  const logEntry = {
    type,
    timestamp: new Date().toISOString(),
    ...data
  };

  switch (level) {
    case 'debug':
      console.debug(JSON.stringify(logEntry));
      break;
    case 'info':
      console.info(JSON.stringify(logEntry));
      break;
    case 'warn':
      console.warn(JSON.stringify(logEntry));
      break;
    case 'error':
      console.error(JSON.stringify(logEntry));
      break;
    default:
      console.log(JSON.stringify(logEntry));
  }
}

/**
 * Performance monitoring middleware
 */
export function createPerformanceMiddleware() {
  const requestCounts = new Map<string, number>();
  const responseTimes = new Map<string, number[]>();

  return async (req: Request, next: () => Promise<Response>): Promise<Response> => {
    const startTime = Date.now();
    const url = new URL(req.url);
    const path = url.pathname;

    const response = await next();
    const duration = Date.now() - startTime;

    // Update metrics
    const currentCount = requestCounts.get(path) || 0;
    requestCounts.set(path, currentCount + 1);

    const times = responseTimes.get(path) || [];
    times.push(duration);
    responseTimes.set(path, times);

    // Log performance metrics
    if (requestCounts.size % 100 === 0) { // Log every 100 requests
      console.info('Performance metrics:', {
        requestCounts: Object.fromEntries(requestCounts),
        averageResponseTimes: Object.fromEntries(
          Array.from(responseTimes.entries()).map(([path, times]) => [
            path,
            times.reduce((sum, time) => sum + time, 0) / times.length
          ])
        )
      });
    }

    return response;
  };
}