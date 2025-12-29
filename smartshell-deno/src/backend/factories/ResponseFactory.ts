/**
 * Response Factory
 * Follows Factory Pattern and SOLID principles
 * Provides standardized HTTP response creation
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ResponseFactory {
  /**
   * Create a success response
   */
  static success<T>(data: T, message?: string): Response {
    const body: ApiResponse<T> = {
      success: true,
      data,
      message
    };

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: this.getCORSHeaders()
    });
  }

  /**
   * Create an error response
   */
  static error(message: string, status: number = 400): Response {
    const body: ApiResponse<null> = {
      success: false,
      error: message
    };

    return new Response(JSON.stringify(body), {
      status,
      headers: this.getCORSHeaders()
    });
  }

  /**
   * Create a validation error response
   */
  static validation(errors: string[]): Response {
    const body: ApiResponse<null> = {
      success: false,
      error: "Validation failed",
      message: errors.join(", ")
    };

    return new Response(JSON.stringify(body), {
      status: 400,
      headers: this.getCORSHeaders()
    });
  }

  /**
   * Create a created response
   */
  static created<T>(data: T, message?: string): Response {
    const body: ApiResponse<T> = {
      success: true,
      data,
      message
    };

    return new Response(JSON.stringify(body), {
      status: 201,
      headers: this.getCORSHeaders()
    });
  }

  /**
   * Create a no content response
   */
  static noContent(): Response {
    return new Response(null, {
      status: 204,
      headers: this.getCORSHeaders()
    });
  }

  /**
   * Create a not found response
   */
  static notFound(message: string = "Resource not found"): Response {
    const body: ApiResponse<null> = {
      success: false,
      error: message
    };

    return new Response(JSON.stringify(body), {
      status: 404,
      headers: this.getCORSHeaders()
    });
  }

  /**
   * Create an unauthorized response
   */
  static unauthorized(message: string = "Unauthorized"): Response {
    const body: ApiResponse<null> = {
      success: false,
      error: message
    };

    return new Response(JSON.stringify(body), {
      status: 401,
      headers: this.getCORSHeaders()
    });
  }

  /**
   * Create a forbidden response
   */
  static forbidden(message: string = "Forbidden"): Response {
    const body: ApiResponse<null> = {
      success: false,
      error: message
    };

    return new Response(JSON.stringify(body), {
      status: 403,
      headers: this.getCORSHeaders()
    });
  }

  /**
   * Create a server error response
   */
  static serverError(message: string = "Internal server error"): Response {
    const body: ApiResponse<null> = {
      success: false,
      error: message
    };

    return new Response(JSON.stringify(body), {
      status: 500,
      headers: this.getCORSHeaders()
    });
  }

  /**
   * Get CORS headers for responses
   */
  private static getCORSHeaders(): Headers {
    const headers = new Headers();
    const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";
    headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    headers.set("Content-Type", "application/json");
    return headers;
  }

  /**
   * Create an OPTIONS response for CORS preflight
   */
  static options(): Response {
    return new Response(null, {
      status: 200,
      headers: this.getCORSHeaders()
    });
  }
}