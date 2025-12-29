/**
 * Payment Repository Implementation
 * Implements repository pattern for Payment entity
 * Follows SOLID principles and dependency injection
 */
import { IRepository } from '../domain/interfaces/IRepository.ts';
import { Payment, CreatePaymentRequest, UpdatePaymentRequest, PaymentMethod } from '../domain/entities/Payment.ts';

/**
 * In-memory implementation of PaymentRepository
 * In a real application, this would connect to a database
 */
export class PaymentRepository implements IRepository<Payment, string> {
  private payments: Map<string, Payment> = new Map();
  private nextId: number = 1;

  constructor() {
    // Initialize with some default payments
    this.seedData();
  }

  /**
   * Generate a unique payment ID
   */
  private generateId(): string {
    return `payment_${this.nextId++}_${Date.now()}`;
  }

  /**
   * Find a payment by ID
   */
  async findById(id: string): Promise<Payment | null> {
    try {
      const payment = this.payments.get(id);
      return payment || null;
    } catch (error) {
      console.error(`Error finding payment by ID ${id}:`, error);
      throw new Error(`Failed to find payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find all payments
   */
  async findAll(): Promise<Payment[]> {
    try {
      return Array.from(this.payments.values());
    } catch (error) {
      console.error('Error finding all payments:', error);
      throw new Error(`Failed to find all payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find payments matching filter criteria
   */
  async find(filter: Partial<Payment>): Promise<Payment[]> {
    try {
      const payments = Array.from(this.payments.values());
      
      if (!filter || Object.keys(filter).length === 0) {
        return payments;
      }

      return payments.filter(payment => {
        return Object.entries(filter).every(([key, value]) => {
          return payment[key as keyof Payment] === value;
        });
      });
    } catch (error) {
      console.error('Error filtering payments:', error);
      throw new Error(`Failed to filter payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new payment
   */
  async create(paymentData: CreatePaymentRequest): Promise<Payment> {
    try {
      const id = this.generateId();
      const created_at = new Date().toISOString();
      
      const newPayment: Payment = {
        id,
        created_at,
        ...paymentData
      };
      
      this.payments.set(id, newPayment);
      return newPayment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw new Error(`Failed to create payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing payment
   */
  async update(id: string, updates: UpdatePaymentRequest): Promise<Payment> {
    try {
      const existingPayment = this.payments.get(id);
      
      if (!existingPayment) {
        throw new Error(`Payment with ID ${id} not found`);
      }
      
      const updatedPayment: Payment = {
        ...existingPayment,
        ...updates
      };
      
      this.payments.set(id, updatedPayment);
      return updatedPayment;
    } catch (error) {
      console.error(`Error updating payment with ID ${id}:`, error);
      throw new Error(`Failed to update payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a payment by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      const existed = this.payments.has(id);
      this.payments.delete(id);
      return existed;
    } catch (error) {
      console.error(`Error deleting payment with ID ${id}:`, error);
      throw new Error(`Failed to delete payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find payments by client ID
   */
  async findByClientId(clientId: string): Promise<Payment[]> {
    try {
      const payments = Array.from(this.payments.values());
      return payments.filter(payment => payment.client_id === clientId);
    } catch (error) {
      console.error(`Error finding payments by client ID ${clientId}:`, error);
      throw new Error(`Failed to find payments by client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find payments by payment method
   */
  async findByPaymentMethod(method: PaymentMethod): Promise<Payment[]> {
    try {
      const payments = Array.from(this.payments.values());
      return payments.filter(payment => payment.paymentMethod === method);
    } catch (error) {
      console.error(`Error finding payments by method ${method}:`, error);
      throw new Error(`Failed to find payments by method: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find refunded payments
   */
  async findRefunded(): Promise<Payment[]> {
    try {
      const payments = Array.from(this.payments.values());
      return payments.filter(payment => payment.is_refunded);
    } catch (error) {
      console.error('Error finding refunded payments:', error);
      throw new Error(`Failed to find refunded payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find payments by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
    try {
      const payments = Array.from(this.payments.values());
      const start = startDate.toISOString();
      const end = endDate.toISOString();
      
      return payments.filter(payment => 
        payment.created_at >= start && payment.created_at <= end
      );
    } catch (error) {
      console.error(`Error finding payments by date range (${startDate}, ${endDate}):`, error);
      throw new Error(`Failed to find payments by date range: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get payment statistics for a client
   */
  async getClientPaymentStats(clientId: string): Promise<{
    totalSpent: number;
    totalBonus: number;
    paymentCount: number;
    averagePayment: number;
    lastPayment?: Payment;
  }> {
    try {
      const clientPayments = await this.findByClientId(clientId);
      const nonRefundedPayments = clientPayments.filter(p => !p.is_refunded);
      
      const totalSpent = nonRefundedPayments.reduce((sum, payment) => sum + payment.sum, 0);
      const totalBonus = nonRefundedPayments.reduce((sum, payment) => sum + payment.bonus, 0);
      const paymentCount = nonRefundedPayments.length;
      const averagePayment = paymentCount > 0 ? totalSpent / paymentCount : 0;
      
      // Sort by creation date to get the last payment
      const sortedPayments = [...nonRefundedPayments].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const lastPayment = sortedPayments.length > 0 ? sortedPayments[0] : undefined;
      
      return {
        totalSpent,
        totalBonus,
        paymentCount,
        averagePayment,
        lastPayment
      };
    } catch (error) {
      console.error(`Error getting payment stats for client ${clientId}:`, error);
      throw new Error(`Failed to get payment stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Seed initial data
   */
  private seedData(): void {
    const defaultPayments: CreatePaymentRequest[] = [
      {
        sum: 100,
        bonus: 10,
        is_refunded: false,
        paymentMethod: PaymentMethod.CARD,
        client_id: '1'
      },
      {
        sum: 50,
        bonus: 5,
        is_refunded: false,
        paymentMethod: PaymentMethod.CASH,
        client_id: '1'
      },
      {
        sum: 75,
        bonus: 7.5,
        is_refunded: true,
        paymentMethod: PaymentMethod.ONLINE,
        client_id: '2'
      }
    ];

    defaultPayments.forEach(payment => {
      this.create(payment);
    });
  }
}