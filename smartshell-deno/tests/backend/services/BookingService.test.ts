/**
 * Booking Service Tests
 * Tests for the BookingService implementation
 */

import { assertEquals, assertThrows } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { BookingService } from "../../../src/backend/services/BookingService.ts";
import { BookingRepository } from "../../../src/backend/repositories/BookingRepository.ts";
import { HostRepository } from "../../../src/backend/repositories/HostRepository.ts";
import { UserRepository } from "../../../src/backend/repositories/UserRepository.ts";
import { BookingStatus } from "../../../src/backend/domain/entities/Booking.ts";

Deno.test("BookingService.getBookingById should return a specific booking", async () => {
  const bookingRepository = new BookingRepository();
  const hostRepository = new HostRepository();
  const userRepository = new UserRepository();
  const bookingService = new BookingService(bookingRepository, hostRepository, userRepository);
  
  const booking = await bookingService.getBookingById(1);
  
  assertEquals(booking?.id, 1);
});

Deno.test("BookingService.getBookingById should return null for non-existent booking", async () => {
  const bookingRepository = new BookingRepository();
  const hostRepository = new HostRepository();
  const userRepository = new UserRepository();
  const bookingService = new BookingService(bookingRepository, hostRepository, userRepository);
  
  const booking = await bookingService.getBookingById(999);
  
  assertEquals(booking, null);
});

Deno.test("BookingService.getUserBookings should return bookings for user", async () => {
  const bookingRepository = new BookingRepository();
  const hostRepository = new HostRepository();
  const userRepository = new UserRepository();
  const bookingService = new BookingService(bookingRepository, hostRepository, userRepository);
  
  const bookings = await bookingService.getUserBookings("1");
  
  assertEquals(Array.isArray(bookings), true);
});

Deno.test("BookingService.getAvailableTimeSlots should return time slots for hosts", async () => {
  const bookingRepository = new BookingRepository();
  const hostRepository = new HostRepository();
  const userRepository = new UserRepository();
  const bookingService = new BookingService(bookingRepository, hostRepository, userRepository);
  
  const timeSlots = await bookingService.getAvailableTimeSlots([1, 2], new Date());
  
  assertEquals(Array.isArray(timeSlots), true);
  assertEquals(timeSlots.length > 0, true);
});

Deno.test("BookingService.createBooking should create a new booking", async () => {
  const bookingRepository = new BookingRepository();
  const hostRepository = new HostRepository();
  const userRepository = new UserRepository();
  const bookingService = new BookingService(bookingRepository, hostRepository, userRepository);
  
  const bookingRequest = {
    userId: "1",
    hostIds: [1],
    from: new Date("2023-01-01T10:00:00Z"),
    to: new Date("2023-01-01T12:00:00Z")
  };
  
  const newBooking = await bookingService.createBooking(bookingRequest);
  
  assertEquals(newBooking.status, BookingStatus.PENDING);
  assertEquals(typeof newBooking.id, "number");
});

Deno.test("BookingService.updateBookingStatus should update booking status", async () => {
  const bookingRepository = new BookingRepository();
  const hostRepository = new HostRepository();
  const userRepository = new UserRepository();
  const bookingService = new BookingService(bookingRepository, hostRepository, userRepository);
  
  const updatedBooking = await bookingService.updateBookingStatus(1, BookingStatus.COMPLETED);
  
  assertEquals(updatedBooking.status, BookingStatus.COMPLETED);
  assertEquals(updatedBooking.id, 1);
});

Deno.test("BookingService.cancelBooking should cancel a booking", async () => {
  const bookingRepository = new BookingRepository();
  const hostRepository = new HostRepository();
  const userRepository = new UserRepository();
  const bookingService = new BookingService(bookingRepository, hostRepository, userRepository);
  
  // First create a booking to cancel
  const bookingRequest = {
    userId: "1",
    hostIds: [2],
    from: new Date("2023-01-01T10:00:00Z"),
    to: new Date("2023-01-01T12:00:00Z")
  };
  
  const newBooking = await bookingService.createBooking(bookingRequest);
  const cancelled = await bookingService.cancelBooking(newBooking.id as number);
  
  assertEquals(cancelled, true);
});

Deno.test("BookingService.getBookingById should throw error for invalid booking ID", async () => {
  const bookingRepository = new BookingRepository();
  const hostRepository = new HostRepository();
  const userRepository = new UserRepository();
  const bookingService = new BookingService(bookingRepository, hostRepository, userRepository);
  
  assertThrows(
    () => bookingService.getBookingById(0),
    Error,
    "Booking ID is required"
  );
});