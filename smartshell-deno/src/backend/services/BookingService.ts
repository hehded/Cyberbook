/**
 * Booking Service Implementation
 * Implements booking logic with proper error handling and validation
 * Follows SOLID principles and dependency injection
 */
import { IBookingService, CreateBookingRequest, TimeSlot } from '../domain/interfaces/IService.ts';
import { BookingRepository } from '../repositories/BookingRepository.ts';
import { HostRepository } from '../repositories/HostRepository.ts';
import { UserRepository } from '../repositories/UserRepository.ts';
import { BookingValidator, TimeSlotValidator } from '../validators/index.ts';
import { Booking, BookingStatus } from '../domain/entities/Booking.ts';
import { Host } from '../domain/entities/Host.ts';
import { User } from '../domain/entities/User.ts';

/**
 * Custom error types for booking operations
 */
export class BookingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingError';
  }
}

export class HostUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HostUnavailableError';
  }
}

/**
 * Booking Service
 */
export class BookingService implements IBookingService {
  private bookingRepository: BookingRepository;
  private hostRepository: HostRepository;
  private userRepository: UserRepository;
  private bookingValidator: BookingValidator;
  private timeSlotValidator: TimeSlotValidator;

  constructor(
    bookingRepository: BookingRepository,
    hostRepository: HostRepository,
    userRepository: UserRepository
  ) {
    this.bookingRepository = bookingRepository;
    this.hostRepository = hostRepository;
    this.userRepository = userRepository;
    this.bookingValidator = new BookingValidator();
    this.timeSlotValidator = new TimeSlotValidator();
  }

  /**
   * Create a new booking
   */
  async createBooking(request: CreateBookingRequest): Promise<Booking> {
    try {
      // Check if user exists
      const user = await this.userRepository.findById(request.userId.toString());
      if (!user) {
        throw new BookingError(`User with ID ${request.userId} not found`);
      }

      // Check if hosts exist and are available
      const hostIds = request.hostIds;
      const hosts = await Promise.all(
        hostIds.map(id => this.hostRepository.findById(id))
      );

      const missingHosts = hosts.filter(h => h === null);
      if (missingHosts.length > 0) {
        throw new BookingError(`Some hosts not found`);
      }

      // Check host availability for the requested time
      const availableHosts = await this.checkHostAvailability(hostIds, request.from, request.to);
      if (availableHosts.length !== hostIds.length) {
        throw new HostUnavailableError('Some hosts are not available for the requested time');
      }

      // Create booking data with host information
      const hostsInfo = hosts.map(host => {
        if (!host) throw new BookingError('Host information not found');
        return {
          id: typeof host.id === 'number' ? host.id : parseInt(host.id),
          alias: host.alias || undefined
        };
      });

      // Create booking
      const bookingData = {
        from: request.from.toISOString(),
        to: request.to.toISOString(),
        status: BookingStatus.PENDING,
        client: {
          id: parseInt(user.id),
          nickname: user.nickname,
          phone: user.phone
        },
        hosts: hostsInfo
      };

      // Validate booking data
      const validation = this.bookingValidator.validate(bookingData);
      
      if (!validation.isValid) {
        throw new BookingError(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const booking = await this.bookingRepository.create(bookingData);
      
      console.log(`Booking ${booking.id} created for user ${user.id}`);
      return booking;
    } catch (error) {
      console.error('Create booking error:', error);
      
      if (error instanceof BookingError || error instanceof HostUnavailableError) {
        throw error;
      }
      
      throw new BookingError(`Failed to create booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cancel an existing booking
   */
  async cancelBooking(bookingId: number): Promise<boolean> {
    try {
      if (!bookingId) {
        throw new BookingError('Booking ID is required');
      }

      const booking = await this.bookingRepository.findById(bookingId);
      
      if (!booking) {
        throw new BookingError(`Booking with ID ${bookingId} not found`);
      }

      if (booking.status === BookingStatus.CANCELLED) {
        throw new BookingError(`Booking ${bookingId} is already cancelled`);
      }

      if (booking.status === BookingStatus.COMPLETED) {
        throw new BookingError(`Cannot cancel completed booking ${bookingId}`);
      }

      // Update booking status to cancelled
      await this.bookingRepository.update(bookingId, {
        status: BookingStatus.CANCELLED
      });

      console.log(`Booking ${bookingId} cancelled successfully`);
      return true;
    } catch (error) {
      console.error('Cancel booking error:', error);
      
      if (error instanceof BookingError) {
        throw error;
      }
      
      throw new BookingError(`Failed to cancel booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get bookings for a user
   */
  async getUserBookings(userId: string): Promise<Booking[]> {
    try {
      if (!userId) {
        throw new BookingError('User ID is required');
      }

      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new BookingError(`User with ID ${userId} not found`);
      }

      const bookings = await this.bookingRepository.findByUserId(parseInt(userId));
      
      console.log(`Found ${bookings.length} bookings for user ${userId}`);
      return bookings;
    } catch (error) {
      console.error('Get user bookings error:', error);
      
      if (error instanceof BookingError) {
        throw error;
      }
      
      throw new BookingError(`Failed to get user bookings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available time slots for hosts
   */
  async getAvailableTimeSlots(hostIds: number[], date: Date): Promise<TimeSlot[]> {
    try {
      if (!hostIds || hostIds.length === 0) {
        throw new BookingError('Host IDs are required');
      }

      if (!date) {
        throw new BookingError('Date is required');
      }

      // Check if hosts exist
      const hosts = await Promise.all(
        hostIds.map(id => this.hostRepository.findById(id))
      );

      const missingHosts = hosts.filter(h => h === null);
      if (missingHosts.length > 0) {
        throw new BookingError(`Some hosts not found`);
      }

      // Get all bookings for the specified date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const allBookings = await this.bookingRepository.findAll();
      const dateBookings = allBookings.filter(booking => {
        const bookingFrom = new Date(booking.from);
        const bookingTo = new Date(booking.to);
        
        // Check if booking overlaps with the specified date
        return (
          (bookingFrom >= startOfDay && bookingFrom <= endOfDay) ||
          (bookingTo >= startOfDay && bookingTo <= endOfDay) ||
          (bookingFrom <= startOfDay && bookingTo >= endOfDay)
        );
      });

      // Filter bookings for the specified hosts
      const hostBookings = dateBookings.filter(booking =>
        booking.hosts.some(host => hostIds.includes(host.id))
      );

      // Generate time slots (assuming 1-hour slots from 8:00 to 22:00)
      const timeSlots: TimeSlot[] = [];
      const startHour = 8;
      const endHour = 22;

      for (let hour = startHour; hour < endHour; hour++) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        
        const slotEnd = new Date(date);
        slotEnd.setHours(hour + 1, 0, 0, 0);

        // Check if slot is available
        const isAvailable = !hostBookings.some(booking => {
          const bookingFrom = new Date(booking.from);
          const bookingTo = new Date(booking.to);
          
          // Check if booking overlaps with this time slot
          return (
            (bookingFrom < slotEnd && bookingTo > slotStart)
          );
        });

        timeSlots.push({
          start: slotStart,
          end: slotEnd,
          available: isAvailable
        });
      }

      console.log(`Generated ${timeSlots.length} time slots for ${hostIds.length} hosts on ${date.toDateString()}`);
      return timeSlots;
    } catch (error) {
      console.error('Get available time slots error:', error);
      
      if (error instanceof BookingError) {
        throw error;
      }
      
      throw new BookingError(`Failed to get available time slots: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get booking by ID
   */
  async getBookingById(bookingId: number): Promise<Booking | null> {
    try {
      if (!bookingId) {
        throw new BookingError('Booking ID is required');
      }

      const booking = await this.bookingRepository.findById(bookingId);
      return booking;
    } catch (error) {
      console.error('Get booking by ID error:', error);
      
      if (error instanceof BookingError) {
        throw error;
      }
      
      throw new BookingError(`Failed to get booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId: number, status: BookingStatus): Promise<Booking> {
    try {
      if (!bookingId) {
        throw new BookingError('Booking ID is required');
      }

      if (!status) {
        throw new BookingError('Status is required');
      }

      if (!Object.values(BookingStatus).includes(status)) {
        throw new BookingError('Invalid status value');
      }

      const booking = await this.bookingRepository.findById(bookingId);
      
      if (!booking) {
        throw new BookingError(`Booking with ID ${bookingId} not found`);
      }

      const updatedBooking = await this.bookingRepository.update(bookingId, {
        status
      });

      console.log(`Booking ${bookingId} status updated to ${status}`);
      return updatedBooking;
    } catch (error) {
      console.error('Update booking status error:', error);
      
      if (error instanceof BookingError) {
        throw error;
      }
      
      throw new BookingError(`Failed to update booking status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check host availability for a time range
   */
  private async checkHostAvailability(hostIds: number[], from: Date, to: Date): Promise<Host[]> {
    try {
      // Get active bookings for the specified hosts
      const activeBookings = await this.bookingRepository.findActiveBookingsForHosts(hostIds);
      
      // Filter bookings that overlap with the requested time
      const overlappingBookings = activeBookings.filter(booking => {
        const bookingFrom = new Date(booking.from);
        const bookingTo = new Date(booking.to);
        
        // Check if booking overlaps with the requested time
        return (
          (bookingFrom < to && bookingTo > from)
        );
      });

      // Get IDs of hosts that are already booked
      const bookedHostIds = overlappingBookings.flatMap(booking =>
        booking.hosts.map(host => host.id)
      );

      // Get available hosts
      const availableHosts: Host[] = [];
      
      for (const hostId of hostIds) {
        if (!bookedHostIds.includes(hostId)) {
          const host = await this.hostRepository.findById(hostId);
          if (host) {
            availableHosts.push(host);
          }
        }
      }

      return availableHosts;
    } catch (error) {
      console.error('Check host availability error:', error);
      throw new BookingError(`Failed to check host availability: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}