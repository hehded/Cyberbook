/**
 * Payment Entity
 * Represents a payment transaction in the system
 * Follows Domain-Driven Design principles
 */
export interface Payment {
  id: string;
  created_at: string;
  sum: number;
  bonus: number;
  is_refunded: boolean;
  paymentMethod: string;
  client_id: string;
}

/**
 * Payment creation data (without ID)
 */
export type CreatePaymentRequest = Omit<Payment, 'id' | 'created_at'>;

/**
 * Payment update data (partial)
 */
export type UpdatePaymentRequest = Partial<CreatePaymentRequest>;

/**
 * Payment Method enumeration
 */
export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  BONUS = 'BONUS',
  ONLINE = 'ONLINE'
}

/**
 * Payment statistics
 */
export interface PaymentStats {
  totalSpent: number;
  totalBonus: number;
  lastPayment?: Payment;
  paymentCount: number;
  averagePayment: number;
}