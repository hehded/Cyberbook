/**
 * Payment Service Implementation
 * Implements payment processing logic with proper error handling and validation
 * Follows SOLID principles and dependency injection
 */
import { IPaymentService, PaymentRequest, PaymentStats } from '../domain/interfaces/IService.ts';
import { PaymentRepository } from '../repositories/PaymentRepository.ts';
import { UserRepository } from '../repositories/UserRepository.ts';
import { BookingRepository } from '../repositories/BookingRepository.ts';
import { PaymentValidator, PaymentRequestValidator, RefundRequestValidator } from '../validators/index.ts';
import { Payment, PaymentMethod } from '../domain/entities/Payment.ts';
import { User } from '../domain/entities/User.ts';
import { Booking } from '../domain/entities/Booking.ts';

/**
 * Custom error types for payment operations
 */
export class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class RefundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RefundError';
  }
}

/**
 * Payment Service
 */
export class PaymentService implements IPaymentService {
  private paymentRepository: PaymentRepository;
  private userRepository: UserRepository;
  private bookingRepository: BookingRepository;
  private paymentValidator: PaymentValidator;
  private paymentRequestValidator: PaymentRequestValidator;
  private refundRequestValidator: RefundRequestValidator;

  constructor(
    paymentRepository: PaymentRepository,
    userRepository: UserRepository,
    bookingRepository: BookingRepository
  ) {
    this.paymentRepository = paymentRepository;
    this.userRepository = userRepository;
    this.bookingRepository = bookingRepository;
    this.paymentValidator = new PaymentValidator();
    this.paymentRequestValidator = new PaymentRequestValidator();
    this.refundRequestValidator = new RefundRequestValidator();
  }

  /**
   * Get payment statistics for a user
   */
  async getUserPaymentStats(userId: string): Promise<PaymentStats> {
    try {
      if (!userId) {
        throw new PaymentError('User ID is required');
      }

      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new PaymentError(`User with ID ${userId} not found`);
      }

      const stats = await this.paymentRepository.getClientPaymentStats(userId);
      
      console.log(`Retrieved payment stats for user ${userId}`);
      return stats;
    } catch (error) {
      console.error('Get user payment stats error:', error);
      
      if (error instanceof PaymentError) {
        throw error;
      }
      
      throw new PaymentError(`Failed to get user payment stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process a payment
   */
  async processPayment(request: PaymentRequest): Promise<Payment> {
    try {
      // Validate payment request
      const validation = this.paymentRequestValidator.validate(request);
      
      if (!validation.isValid) {
        throw new PaymentError(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if user exists
      const user = await this.userRepository.findById(request.userId);
      
      if (!user) {
        throw new PaymentError(`User with ID ${request.userId} not found`);
      }

      // Check if booking exists (if provided)
      if (request.bookingId) {
        const booking = await this.bookingRepository.findById(request.bookingId);
        
        if (!booking) {
          throw new PaymentError(`Booking with ID ${request.bookingId} not found`);
        }
      }

      // Calculate bonus (10% of payment amount)
      const bonus = request.amount * 0.1;

      // Create payment
      const paymentData = {
        sum: request.amount,
        bonus,
        is_refunded: false,
        paymentMethod: request.method,
        client_id: request.userId
      };

      // Validate payment data
      const paymentValidation = this.paymentValidator.validate(paymentData);
      
      if (!paymentValidation.isValid) {
        throw new PaymentError(`Payment validation failed: ${paymentValidation.errors.join(', ')}`);
      }

      const payment = await this.paymentRepository.create(paymentData);
      
      // Update user's deposit and bonus
      await this.userRepository.update(request.userId, {
        deposit: user.deposit + request.amount,
        bonus: user.bonus + bonus
      });

      console.log(`Processed payment ${payment.id} for user ${request.userId}, amount: ${request.amount}`);
      return payment;
    } catch (error) {
      console.error('Process payment error:', error);
      
      if (error instanceof PaymentError) {
        throw error;
      }
      
      throw new PaymentError(`Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId: string): Promise<boolean> {
    try {
      if (!paymentId) {
        throw new RefundError('Payment ID is required');
      }

      const payment = await this.paymentRepository.findById(paymentId);
      
      if (!payment) {
        throw new RefundError(`Payment with ID ${paymentId} not found`);
      }

      if (payment.is_refunded) {
        throw new RefundError(`Payment ${paymentId} is already refunded`);
      }

      // Update payment to refunded
      await this.paymentRepository.update(paymentId, {
        is_refunded: true
      });

      // Update user's deposit and bonus
      const user = await this.userRepository.findById(payment.client_id);
      
      if (user) {
        await this.userRepository.update(payment.client_id, {
          deposit: Math.max(0, user.deposit - payment.sum),
          bonus: Math.max(0, user.bonus - payment.bonus)
        });
      }

      console.log(`Refunded payment ${paymentId} for user ${payment.client_id}, amount: ${payment.sum}`);
      return true;
    } catch (error) {
      console.error('Refund payment error:', error);
      
      if (error instanceof RefundError) {
        throw error;
      }
      
      throw new RefundError(`Failed to refund payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<Payment | null> {
    try {
      if (!paymentId) {
        throw new PaymentError('Payment ID is required');
      }

      const payment = await this.paymentRepository.findById(paymentId);
      return payment;
    } catch (error) {
      console.error('Get payment by ID error:', error);
      
      if (error instanceof PaymentError) {
        throw error;
      }
      
      throw new PaymentError(`Failed to get payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get payments for a user
   */
  async getUserPayments(userId: string): Promise<Payment[]> {
    try {
      if (!userId) {
        throw new PaymentError('User ID is required');
      }

      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new PaymentError(`User with ID ${userId} not found`);
      }

      const payments = await this.paymentRepository.findByClientId(userId);
      
      console.log(`Found ${payments.length} payments for user ${userId}`);
      return payments;
    } catch (error) {
      console.error('Get user payments error:', error);
      
      if (error instanceof PaymentError) {
        throw error;
      }
      
      throw new PaymentError(`Failed to get user payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get payments by method
   */
  async getPaymentsByMethod(method: PaymentMethod): Promise<Payment[]> {
    try {
      if (!method) {
        throw new PaymentError('Payment method is required');
      }

      if (!Object.values(PaymentMethod).includes(method)) {
        throw new PaymentError('Invalid payment method');
      }

      const payments = await this.paymentRepository.findByPaymentMethod(method);
      
      console.log(`Found ${payments.length} payments with method ${method}`);
      return payments;
    } catch (error) {
      console.error('Get payments by method error:', error);
      
      if (error instanceof PaymentError) {
        throw error;
      }
      
      throw new PaymentError(`Failed to get payments by method: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get refunded payments
   */
  async getRefundedPayments(): Promise<Payment[]> {
    try {
      const payments = await this.paymentRepository.findRefunded();
      
      console.log(`Found ${payments.length} refunded payments`);
      return payments;
    } catch (error) {
      console.error('Get refunded payments error:', error);
      throw new PaymentError(`Failed to get refunded payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get payments by date range
   */
  async getPaymentsByDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
    try {
      if (!startDate || !endDate) {
        throw new PaymentError('Start date and end date are required');
      }

      if (startDate >= endDate) {
        throw new PaymentError('Start date must be before end date');
      }

      const payments = await this.paymentRepository.findByDateRange(startDate, endDate);
      
      console.log(`Found ${payments.length} payments between ${startDate.toDateString()} and ${endDate.toDateString()}`);
      return payments;
    } catch (error) {
      console.error('Get payments by date range error:', error);
      
      if (error instanceof PaymentError) {
        throw error;
      }
      
      throw new PaymentError(`Failed to get payments by date range: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}