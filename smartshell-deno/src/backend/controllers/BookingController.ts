/**
 * Booking Controller
 * Handles booking CRUD endpoints
 * Follows SOLID principles and dependency injection
 */
import { BaseController } from './BaseController.ts';
import { ResponseFactory } from '../factories/ResponseFactory.ts';
import { DIContainer, SERVICE_TOKENS } from '../di/Container.ts';
import { BookingService } from '../services/BookingService.ts';
import { AuthService } from '../services/AuthService.ts';

// Use global types for Request and Response
type Request = globalThis.Request;
type Response = globalThis.Response;

export class BookingController extends BaseController {
  private bookingService: BookingService;
  private authService: AuthService;

  constructor(container: DIContainer) {
    super();
    this.bookingService = container.resolve({ token: SERVICE_TOKENS.BOOKING_SERVICE } as any);
    this.authService = container.resolve({ token: SERVICE_TOKENS.AUTH_SERVICE } as any);
  }

  /**
   * Create a new booking
   * POST /api/bookings
   */
  async createBooking(req: Request): Promise<Response> {
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

      const { phone, from, duration, hostIds, comment } = await this.getRequestBody<{
        phone?: string;
        from: string;
        duration: number;
        hostIds: number[];
        comment?: string;
      }>(req);

      // Validate required fields
      if (!from || !duration || !hostIds || !Array.isArray(hostIds) || hostIds.length === 0) {
        return ResponseFactory.validation(["Missing required fields: from, duration, hostIds"]);
      }

      // Validate duration
      if (!Number.isInteger(duration) || duration < 1 || duration > 24) {
        return ResponseFactory.validation(["Duration must be between 1 and 24 hours"]);
      }

      // Validate host IDs
      for (const hostId of hostIds) {
        if (!Number.isInteger(hostId) || hostId <= 0) {
          return ResponseFactory.validation([`Invalid host ID: ${hostId}`]);
        }
      }

      // Validate date
      const bookingFromDate = new Date(from);
      if (isNaN(bookingFromDate.getTime()) || bookingFromDate < new Date()) {
        return ResponseFactory.validation(["Invalid booking date"]);
      }

      try {
        const booking = await this.bookingService.createBooking({
          hostIds,
          from: bookingFromDate,
          to: new Date(bookingFromDate.getTime() + duration * 3600 * 1000),
          userId: user.id
        });

        return ResponseFactory.created({
          success: true,
          id: booking.id,
          booking
        });
      } catch (error) {
        console.error("Create booking error:", error);
        return ResponseFactory.error("Failed to create booking", 500);
      }
    });
  }

  /**
   * Get all bookings
   * GET /api/bookings
   */
  async getBookings(req: Request): Promise<Response> {
    return this.handleRequest(async () => {
      try {
        // For this endpoint, we'll get all bookings (admin function)
        // In a real application, this would require admin authentication
        const bookings = await this.bookingService.getBookingById(0); // This is a workaround
        return ResponseFactory.success([]); // Return empty array for now
      } catch (error) {
        console.error("Get bookings error:", error);
        return ResponseFactory.error("Failed to fetch bookings", 500);
      }
    });
  }

  /**
   * Get bookings for the current user
   * GET /api/my-bookings
   */
  async getUserBookings(req: Request): Promise<Response> {
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
        const bookings = await this.bookingService.getUserBookings(user.id);
        return ResponseFactory.success(bookings);
      } catch (error) {
        console.error("Get user bookings error:", error);
        return ResponseFactory.error("Failed to fetch user bookings", 500);
      }
    });
  }

  /**
   * Cancel a booking
   * DELETE /api/bookings/:id
   */
  async cancelBooking(req: Request): Promise<Response> {
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

      const pathParams = this.getPathParams(req, "/api/bookings/:id");
      const bookingId = parseInt(pathParams.id);

      if (!bookingId || isNaN(bookingId)) {
        return ResponseFactory.validation(["Invalid booking ID"]);
      }

      try {
        const success = await this.bookingService.cancelBooking(bookingId);
        
        if (!success) {
          return ResponseFactory.error("Booking not found or cannot be cancelled", 404);
        }

        return ResponseFactory.success({
          success: true,
          message: "Booking cancelled successfully"
        });
      } catch (error) {
        console.error("Cancel booking error:", error);
        return ResponseFactory.error("Failed to cancel booking", 500);
      }
    });
  }

  /**
   * Get available time slots for hosts
   * GET /api/hosts/:id/slots?date=YYYY-MM-DD
   */
  async getAvailableTimeSlots(req: Request): Promise<Response> {
    return this.handleRequest(async () => {
      const pathParams = this.getPathParams(req, "/api/hosts/:id/slots");
      const queryParams = this.getQueryParams(req);
      
      const hostId = parseInt(pathParams.id);
      const dateStr = queryParams.date;

      if (!hostId || isNaN(hostId)) {
        return ResponseFactory.validation(["Invalid host ID"]);
      }

      if (!dateStr) {
        return ResponseFactory.validation(["Date parameter is required"]);
      }

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return ResponseFactory.validation(["Invalid date format"]);
      }

      try {
        const timeSlots = await this.bookingService.getAvailableTimeSlots([hostId], date);
        return ResponseFactory.success(timeSlots);
      } catch (error) {
        console.error("Get available time slots error:", error);
        return ResponseFactory.error("Failed to fetch available time slots", 500);
      }
    });
  }
}