/**
 * Generic Service Interface
 * Follows Service Layer Pattern and SOLID principles
 * Provides abstraction for business logic operations
 */
export interface IService<T, ID = string | number> {
  /**
   * Get an entity by its ID
   */
  getById(id: ID): Promise<T | null>;
  
  /**
   * Get all entities
   */
  getAll(): Promise<T[]>;
  
  /**
   * Create a new entity
   */
  create(data: any): Promise<T>;
  
  /**
   * Update an existing entity
   */
  update(id: ID, data: any): Promise<T>;
  
  /**
   * Delete an entity by ID
   */
  delete(id: ID): Promise<boolean>;
}

/**
 * Authentication Service Interface
 * Follows Interface Segregation Principle
 */
export interface IAuthService {
  /**
   * Authenticate user credentials
   */
  authenticate(request: LoginRequest): Promise<LoginResponse>;
  
  /**
   * Validate a session token
   */
  validateSession(sessionId: string, ip?: string, userAgent?: string): Promise<User | null>;
  
  /**
   * Logout user by invalidating session
   */
  logout(sessionId: string): Promise<boolean>;
}

/**
 * Booking Service Interface
 * Follows Interface Segregation Principle
 */
export interface IBookingService {
  /**
   * Create a new booking
   */
  createBooking(request: CreateBookingRequest): Promise<Booking>;
  
  /**
   * Cancel an existing booking
   */
  cancelBooking(bookingId: number): Promise<boolean>;
  
  /**
   * Get bookings for a user
   */
  getUserBookings(userId: string): Promise<Booking[]>;
  
  /**
   * Get available time slots for hosts
   */
  getAvailableTimeSlots(hostIds: number[], date: Date): Promise<TimeSlot[]>;
}

/**
 * Host Service Interface
 * Follows Interface Segregation Principle
 */
export interface IHostService {
  /**
   * Get all hosts
   */
  getAllHosts(): Promise<Host[]>;
  
  /**
   * Get hosts by location
   */
  getHostsByLocation(x: number, y: number, radius: number): Promise<Host[]>;
  
  /**
   * Get host status
   */
  getHostStatus(hostId: number): Promise<HostStatus>;
}

/**
 * Payment Service Interface
 * Follows Interface Segregation Principle
 */
export interface IPaymentService {
  /**
   * Get payment statistics for a user
   */
  getUserPaymentStats(userId: string): Promise<PaymentStats>;
  
  /**
   * Process a payment
   */
  processPayment(request: PaymentRequest): Promise<Payment>;
  
  /**
   * Refund a payment
   */
  refundPayment(paymentId: string): Promise<boolean>;
}

// Type definitions for service interfaces
export interface LoginRequest {
  login: string;
  password: string;
  ip?: string;
  userAgent?: string;
}

export interface LoginResponse {
  success: boolean;
  sessionId?: string;
  user?: User;
  error?: string;
}

export interface CreateBookingRequest {
  hostIds: number[];
  from: Date;
  to: Date;
  userId: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface HostStatus {
  online: boolean;
  inService: boolean;
  currentSession?: Session;
}

export interface PaymentRequest {
  amount: number;
  userId: string;
  bookingId?: number;
  method: string;
}

export interface PaymentStats {
  totalSpent: number;
  totalBonus: number;
  lastPayment?: Payment;
}

// Import entity types (avoiding circular dependencies)
import { User, Host, Booking, Payment, Session } from '../entities/index.ts';