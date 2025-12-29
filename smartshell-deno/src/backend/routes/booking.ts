/**
 * Booking Routes
 * Maps booking endpoints to controller methods
 */
import { BookingController } from '../controllers/BookingController.ts';

// Use global types for Request and Response
type Request = globalThis.Request;
type Response = globalThis.Response;

export interface Route {
  method: string;
  path: string;
  handler: (req: Request) => Promise<Response>;
}

export default function bookingRoutes(controller: BookingController): Route[] {
  return [
    {
      method: 'POST',
      path: '/api/bookings',
      handler: controller.createBooking.bind(controller)
    },
    {
      method: 'GET',
      path: '/api/bookings',
      handler: controller.getBookings.bind(controller)
    },
    {
      method: 'GET',
      path: '/api/my-bookings',
      handler: controller.getUserBookings.bind(controller)
    },
    {
      method: 'DELETE',
      path: '/api/bookings/:id',
      handler: controller.cancelBooking.bind(controller)
    },
    {
      method: 'GET',
      path: '/api/hosts/:id/slots',
      handler: controller.getAvailableTimeSlots.bind(controller)
    }
  ];
}