/**
 * Booking Entity
 * Represents a booking for one or more hosts
 * Follows Domain-Driven Design principles
 */
export interface Booking {
  id: number;
  from: string;
  to: string;
  status: string;
  client?: {
    id: number;
    nickname?: string;
    phone?: string;
  };
  hosts: Array<{ id: number; alias?: string }>;
}

/**
 * Booking creation data (without ID)
 */
export type CreateBookingRequest = Omit<Booking, 'id'>;

/**
 * Booking update data (partial)
 */
export type UpdateBookingRequest = Partial<CreateBookingRequest>;

/**
 * Booking Status enumeration
 */
export enum BookingStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  PENDING = 'PENDING'
}

/**
 * Booking Client information
 */
export interface BookingClient {
  id: number;
  nickname?: string;
  phone?: string;
}

/**
 * Booking Host information
 */
export interface BookingHost {
  id: number;
  alias?: string;
}