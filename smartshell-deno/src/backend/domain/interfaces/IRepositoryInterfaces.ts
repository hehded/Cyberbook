/**
 * Specific Repository Interfaces
 * Follows Interface Segregation Principle
 * Provides specialized interfaces for each entity type
 */

import { IRepository, IReadOnlyRepository, IWriteOnlyRepository } from './IRepository.ts';
import { User, Host, Booking, Payment, Session } from '../entities/index.ts';

/**
 * User Repository Interface
 */
export interface IUserRepository extends IRepository<User, string> {
  /**
   * Find user by login
   */
  findByLogin(login: string): Promise<User | null>;
  
  /**
   * Find user by phone
   */
  findByPhone(phone: string): Promise<User | null>;
  
  /**
   * Authenticate user credentials
   */
  authenticate(login: string, password: string): Promise<string | null>;
}

/**
 * Host Repository Interface
 */
export interface IHostRepository extends IRepository<Host, number> {
  /**
   * Find hosts by location
   */
  findByLocation(x: number, y: number, radius: number): Promise<Host[]>;
  
  /**
   * Find hosts by group
   */
  findByGroup(groupId: string): Promise<Host[]>;
  
  /**
   * Find online hosts
   */
  findOnline(): Promise<Host[]>;
  
  /**
   * Find available hosts
   */
  findAvailable(): Promise<Host[]>;
}

/**
 * Booking Repository Interface
 */
export interface IBookingRepository extends IRepository<Booking, number> {
  /**
   * Find bookings by user ID
   */
  findByUserId(userId: string): Promise<Booking[]>;
  
  /**
   * Find bookings by host ID
   */
  findByHostId(hostId: number): Promise<Booking[]>;
  
  /**
   * Find active bookings
   */
  findActive(): Promise<Booking[]>;
  
  /**
   * Find bookings in date range
   */
  findByDateRange(from: Date, to: Date): Promise<Booking[]>;
  
  /**
   * Check if host is available for booking
   */
  checkAvailability(hostId: number, from: Date, to: Date): Promise<boolean>;
}

/**
 * Payment Repository Interface
 */
export interface IPaymentRepository extends IRepository<Payment, string> {
  /**
   * Find payments by user ID
   */
  findByUserId(userId: string): Promise<Payment[]>;
  
  /**
   * Find payments by booking ID
   */
  findByBookingId(bookingId: number): Promise<Payment[]>;
  
  /**
   * Find payments by date range
   */
  findByDateRange(from: Date, to: Date): Promise<Payment[]>;
  
  /**
   * Get payment statistics for user
   */
  getPaymentStats(userId: string): Promise<{
    totalSpent: number;
    totalBonus: number;
    paymentCount: number;
  }>;
  
  /**
   * Find refunded payments
   */
  findRefunded(): Promise<Payment[]>;
}

/**
 * Session Repository Interface
 */
export interface ISessionRepository extends IRepository<Session, string> {
  /**
   * Find session by user ID
   */
  findByUserId(userId: string): Promise<Session[]>;
  
  /**
   * Find active sessions
   */
  findActive(): Promise<Session[]>;
  
  /**
   * Find expired sessions
   */
  findExpired(): Promise<Session[]>;
  
  /**
   * Clean up expired sessions
   */
  cleanupExpired(): Promise<number>;
  
  /**
   * Validate session with IP and user agent
   */
  validateSession(sessionId: string, ip?: string, userAgent?: string): Promise<Session | null>;
}