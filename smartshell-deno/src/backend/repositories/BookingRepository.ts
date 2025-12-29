/**
 * Booking Repository Implementation
 * Implements repository pattern for Booking entity
 * Follows SOLID principles and dependency injection
 */
import { IRepository } from '../domain/interfaces/IRepository.ts';
import { Booking, CreateBookingRequest, UpdateBookingRequest, BookingStatus } from '../domain/entities/Booking.ts';

/**
 * In-memory implementation of BookingRepository
 * In a real application, this would connect to a database
 */
export class BookingRepository implements IRepository<Booking, number> {
  private bookings: Map<number, Booking> = new Map();
  private nextId: number = 1;

  constructor() {
    // Initialize with some default bookings
    this.seedData();
  }

  /**
   * Find a booking by ID
   */
  async findById(id: number): Promise<Booking | null> {
    try {
      const booking = this.bookings.get(id);
      return booking || null;
    } catch (error) {
      console.error(`Error finding booking by ID ${id}:`, error);
      throw new Error(`Failed to find booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find all bookings
   */
  async findAll(): Promise<Booking[]> {
    try {
      return Array.from(this.bookings.values());
    } catch (error) {
      console.error('Error finding all bookings:', error);
      throw new Error(`Failed to find all bookings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find bookings matching filter criteria
   */
  async find(filter: Partial<Booking>): Promise<Booking[]> {
    try {
      const bookings = Array.from(this.bookings.values());
      
      if (!filter || Object.keys(filter).length === 0) {
        return bookings;
      }

      return bookings.filter(booking => {
        return Object.entries(filter).every(([key, value]) => {
          return booking[key as keyof Booking] === value;
        });
      });
    } catch (error) {
      console.error('Error filtering bookings:', error);
      throw new Error(`Failed to filter bookings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new booking
   */
  async create(bookingData: CreateBookingRequest): Promise<Booking> {
    try {
      const id = this.nextId++;
      
      const newBooking: Booking = {
        id,
        ...bookingData
      };
      
      this.bookings.set(id, newBooking);
      return newBooking;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw new Error(`Failed to create booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing booking
   */
  async update(id: number, updates: UpdateBookingRequest): Promise<Booking> {
    try {
      const existingBooking = this.bookings.get(id);
      
      if (!existingBooking) {
        throw new Error(`Booking with ID ${id} not found`);
      }
      
      const updatedBooking: Booking = {
        ...existingBooking,
        ...updates
      };
      
      this.bookings.set(id, updatedBooking);
      return updatedBooking;
    } catch (error) {
      console.error(`Error updating booking with ID ${id}:`, error);
      throw new Error(`Failed to update booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a booking by ID
   */
  async delete(id: number): Promise<boolean> {
    try {
      const existed = this.bookings.has(id);
      this.bookings.delete(id);
      return existed;
    } catch (error) {
      console.error(`Error deleting booking with ID ${id}:`, error);
      throw new Error(`Failed to delete booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find bookings by user ID
   */
  async findByUserId(userId: number): Promise<Booking[]> {
    try {
      const bookings = Array.from(this.bookings.values());
      return bookings.filter(booking => booking.client?.id === userId);
    } catch (error) {
      console.error(`Error finding bookings by user ID ${userId}:`, error);
      throw new Error(`Failed to find bookings by user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find bookings by status
   */
  async findByStatus(status: BookingStatus): Promise<Booking[]> {
    try {
      const bookings = Array.from(this.bookings.values());
      return bookings.filter(booking => booking.status === status);
    } catch (error) {
      console.error(`Error finding bookings by status ${status}:`, error);
      throw new Error(`Failed to find bookings by status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find active bookings for specific hosts
   */
  async findActiveBookingsForHosts(hostIds: number[]): Promise<Booking[]> {
    try {
      const bookings = Array.from(this.bookings.values());
      return bookings.filter(booking => 
        booking.status === BookingStatus.ACTIVE &&
        booking.hosts.some(host => hostIds.includes(host.id))
      );
    } catch (error) {
      console.error('Error finding active bookings for hosts:', error);
      throw new Error(`Failed to find active bookings for hosts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Seed initial data
   */
  private seedData(): void {
    const defaultBookings: CreateBookingRequest[] = [
      {
        from: '2023-01-01T10:00:00Z',
        to: '2023-01-01T12:00:00Z',
        status: BookingStatus.ACTIVE,
        client: {
          id: 1,
          nickname: 'admin',
          phone: '+1234567890'
        },
        hosts: [
          { id: 1, alias: 'Host-1' },
          { id: 2, alias: 'Host-2' }
        ]
      },
      {
        from: '2023-01-02T14:00:00Z',
        to: '2023-01-02T16:00:00Z',
        status: BookingStatus.PENDING,
        client: {
          id: 2,
          nickname: 'user1',
          phone: '+0987654321'
        },
        hosts: [
          { id: 3, alias: 'Host-3' }
        ]
      }
    ];

    defaultBookings.forEach(booking => {
      this.create(booking);
    });
  }
}