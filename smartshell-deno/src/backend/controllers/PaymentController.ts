/**
 * Payment Controller
 * Handles payment processing endpoints
 * Follows SOLID principles and dependency injection
 */
import { BaseController } from './BaseController.ts';
import { ResponseFactory } from '../factories/ResponseFactory.ts';
import { DIContainer, SERVICE_TOKENS } from '../di/Container.ts';
import { PaymentService } from '../services/PaymentService.ts';
import { AuthService } from '../services/AuthService.ts';

// Use global types for Request and Response
type Request = globalThis.Request;
type Response = globalThis.Response;

export class PaymentController extends BaseController {
  private paymentService: PaymentService;
  private authService: AuthService;

  constructor(container: DIContainer) {
    super();
    this.paymentService = container.resolve({ token: SERVICE_TOKENS.PAYMENT_SERVICE } as any);
    this.authService = container.resolve({ token: SERVICE_TOKENS.AUTH_SERVICE } as any);
  }

  /**
   * Get payment statistics for the current user
   * GET /api/payments
   */
  async getUserPaymentStats(req: Request): Promise<Response> {
    return this.handleRequest(async () => {
      const sessionId = this.extractSessionId(req);
      
      if (!sessionId) {
        return ResponseFactory.unauthorized("No session provided");
      }

      // Validate session and get user
      const user = await this.authService.validateSession(sessionId, this.getClientIP(req), this.getUserAgent(req));
      
      if (!user) {
        return ResponseFactory.unauthorized("Invalid or expired session");
      }

      try {
        const paymentStats = await this.paymentService.getUserPaymentStats(user.id);
        return ResponseFactory.success(paymentStats);
      } catch (error) {
        console.error("Get payment stats error:", error);
        return ResponseFactory.error("Failed to fetch payment statistics", 500);
      }
    });
  }

  /**
   * Process a new payment
   * POST /api/payments
   */
  async processPayment(req: Request): Promise<Response> {
    return this.handleRequest(async () => {
      const sessionId = this.extractSessionId(req);
      
      if (!sessionId) {
        return ResponseFactory.unauthorized("No session provided");
      }

      // Validate session and get user
      const user = await this.authService.validateSession(sessionId, this.getClientIP(req), this.getUserAgent(req));
      
      if (!user) {
        return ResponseFactory.unauthorized("Invalid or expired session");
      }

      const { amount, bookingId, method } = await this.getRequestBody<{
        amount: number;
        bookingId?: number;
        method: string;
      }>(req);

      // Validate required fields
      if (!amount || !method) {
        return ResponseFactory.validation(["Amount and payment method are required"]);
      }

      // Validate amount
      if (!Number.isFinite(amount) || amount <= 0) {
        return ResponseFactory.validation(["Amount must be a positive number"]);
      }

      // Validate method
      const validMethods = ['CASH', 'CARD', 'BONUS'];
      if (!validMethods.includes(method.toUpperCase())) {
        return ResponseFactory.validation([`Invalid payment method. Must be one of: ${validMethods.join(', ')}`]);
      }

      try {
        const payment = await this.paymentService.processPayment({
          amount,
          userId: user.id,
          bookingId,
          method: method.toUpperCase()
        });

        return ResponseFactory.created({
          success: true,
          payment
        });
      } catch (error) {
        console.error("Process payment error:", error);
        return ResponseFactory.error("Failed to process payment", 500);
      }
    });
  }

  /**
   * Refund a payment
   * POST /api/payments/:id/refund
   */
  async refundPayment(req: Request): Promise<Response> {
    return this.handleRequest(async () => {
      const sessionId = this.extractSessionId(req);
      
      if (!sessionId) {
        return ResponseFactory.unauthorized("No session provided");
      }

      // Validate session and get user
      const user = await this.authService.validateSession(sessionId, this.getClientIP(req), this.getUserAgent(req));
      
      if (!user) {
        return ResponseFactory.unauthorized("Invalid or expired session");
      }

      const pathParams = this.getPathParams(req, "/api/payments/:id/refund");
      const paymentId = pathParams.id;

      if (!paymentId) {
        return ResponseFactory.validation(["Payment ID is required"]);
      }

      try {
        const success = await this.paymentService.refundPayment(paymentId);
        
        if (!success) {
          return ResponseFactory.error("Payment not found or cannot be refunded", 404);
        }

        return ResponseFactory.success({
          success: true,
          message: "Payment refunded successfully"
        });
      } catch (error) {
        console.error("Refund payment error:", error);
        return ResponseFactory.error("Failed to refund payment", 500);
      }
    });
  }

  /**
   * Get payment history for the current user
   * GET /api/payments/history
   */
  async getPaymentHistory(req: Request): Promise<Response> {
    return this.handleRequest(async () => {
      const sessionId = this.extractSessionId(req);
      
      if (!sessionId) {
        return ResponseFactory.unauthorized("No session provided");
      }

      // Validate session and get user
      const user = await this.authService.validateSession(sessionId, this.getClientIP(req), this.getUserAgent(req));
      
      if (!user) {
        return ResponseFactory.unauthorized("Invalid or expired session");
      }

      const queryParams = this.getQueryParams(req);
      const page = parseInt(queryParams.page) || 1;
      const limit = parseInt(queryParams.limit) || 10;

      // Validate pagination
      if (page < 1) {
        return ResponseFactory.validation(["Page must be greater than 0"]);
      }

      if (limit < 1 || limit > 100) {
        return ResponseFactory.validation(["Limit must be between 1 and 100"]);
      }

      try {
        // This is a workaround since the original API doesn't have this endpoint
        // In a real implementation, this would be part of the PaymentService
        return ResponseFactory.success({
          payments: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        });
      } catch (error) {
        console.error("Get payment history error:", error);
        return ResponseFactory.error("Failed to fetch payment history", 500);
      }
    });
  }
}