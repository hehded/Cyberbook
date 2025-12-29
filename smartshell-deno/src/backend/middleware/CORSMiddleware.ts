/**
 * CORS Middleware
 * Follows Middleware Pattern and SOLID principles
 * Handles Cross-Origin Resource Sharing
 */

// Use global types for Request and Response
type Request = globalThis.Request;
type Response = globalThis.Response;

export interface CORSMiddlewareOptions {
  allowedOrigins?: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export function createCORSMiddleware(options: CORSMiddlewareOptions = {}) {
  const {
    allowedOrigins = ['*'],
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    credentials = true,
    maxAge = 86400 // 24 hours
  } = options;

  return async (req: Request, next: () => Promise<Response>): Promise<Response> => {
    const origin = req.headers.get('origin');
    const method = req.headers.get('access-control-request-method');
    const headers = req.headers.get('access-control-request-headers');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      const responseHeaders = new Headers();
      
      // Set allowed origin
      if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
        responseHeaders.set('Access-Control-Allow-Origin', origin || '*');
      }
      
      // Set allowed methods
      if (method) {
        const requestedMethods = method.split(',').map(m => m.trim());
        const allowedRequestedMethods = requestedMethods.filter(m => 
          allowedMethods.includes(m)
        );
        if (allowedRequestedMethods.length > 0) {
          responseHeaders.set('Access-Control-Allow-Methods', 
            allowedRequestedMethods.join(', '));
        }
      } else {
        responseHeaders.set('Access-Control-Allow-Methods', allowedMethods.join(', '));
      }
      
      // Set allowed headers
      if (headers) {
        const requestedHeaders = headers.split(',').map(h => h.trim());
        const allowedRequestedHeaders = requestedHeaders.filter(h => 
          allowedHeaders.includes(h)
        );
        if (allowedRequestedHeaders.length > 0) {
          responseHeaders.set('Access-Control-Allow-Headers', 
            allowedRequestedHeaders.join(', '));
        }
      } else {
        responseHeaders.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));
      }
      
      // Set other CORS headers
      if (credentials) {
        responseHeaders.set('Access-Control-Allow-Credentials', 'true');
      }
      
      responseHeaders.set('Access-Control-Max-Age', maxAge.toString());
      
      return new Response(null, { 
        status: 200, 
        headers: responseHeaders 
      });
    }

    // Handle actual requests
    const response = await next();
    
    // Add CORS headers to response
    const responseHeaders = new Headers(response.headers);
    
    // Set allowed origin
    if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
      responseHeaders.set('Access-Control-Allow-Origin', origin || '*');
    }
    
    // Set other CORS headers
    if (credentials) {
      responseHeaders.set('Access-Control-Allow-Credentials', 'true');
    }
    
    responseHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
    
    // Create new response with CORS headers
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  };
}

/**
 * Simple CORS middleware for development
 */
export const simpleCORSMiddleware = createCORSMiddleware({
  allowedOrigins: ['*'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

/**
 * Restrictive CORS middleware for production
 */
export const restrictiveCORSMiddleware = createCORSMiddleware({
  allowedOrigins: [
    Deno.env.get('FRONTEND_URL') || 'https://smartshell.example.com'
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 7200 // 2 hours
});