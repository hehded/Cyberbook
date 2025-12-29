/**
 * Payment Validator Implementation
 * Implements validation logic for Payment entities
 * Follows SOLID principles and dependency injection
 */
import { IValidator, ValidationResult, ValidationError, DetailedValidationResult } from '../domain/interfaces/IValidator.ts';
import { Payment, CreatePaymentRequest, UpdatePaymentRequest, PaymentMethod } from '../domain/entities/Payment.ts';

/**
 * Validator for Payment entities
 */
export class PaymentValidator implements IValidator<CreatePaymentRequest> {
  /**
   * Validate payment creation data
   */
  validate(data: CreatePaymentRequest): ValidationResult {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Payment data is required');
      return { isValid: false, errors };
    }
    
    // Validate sum
    if (typeof data.sum !== 'number' || isNaN(data.sum)) {
      errors.push('Payment amount must be a valid number');
    } else if (data.sum <= 0) {
      errors.push('Payment amount must be greater than 0');
    } else if (data.sum > 999999.99) {
      errors.push('Payment amount is too large');
    }
    
    // Validate bonus
    if (typeof data.bonus !== 'number' || isNaN(data.bonus)) {
      errors.push('Bonus amount must be a valid number');
    } else if (data.bonus < 0) {
      errors.push('Bonus amount cannot be negative');
    } else if (data.bonus > data.sum) {
      errors.push('Bonus amount cannot exceed payment amount');
    }
    
    // Validate is_refunded
    if (typeof data.is_refunded !== 'boolean') {
      errors.push('Refund status must be a boolean');
    }
    
    // Validate payment method
    if (!data.paymentMethod || typeof data.paymentMethod !== 'string') {
      errors.push('Payment method is required');
    } else if (!Object.values(PaymentMethod).includes(data.paymentMethod as PaymentMethod)) {
      errors.push('Invalid payment method');
    }
    
    // Validate client_id
    if (!data.client_id || typeof data.client_id !== 'string') {
      errors.push('Client ID is required');
    } else if (data.client_id.trim().length === 0) {
      errors.push('Client ID cannot be empty');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate payment update data
   */
  validateUpdate(data: UpdatePaymentRequest): ValidationResult {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Update data is required');
      return { isValid: false, errors };
    }
    
    // Validate sum if provided
    if (data.sum !== undefined) {
      if (typeof data.sum !== 'number' || isNaN(data.sum)) {
        errors.push('Payment amount must be a valid number');
      } else if (data.sum <= 0) {
        errors.push('Payment amount must be greater than 0');
      } else if (data.sum > 999999.99) {
        errors.push('Payment amount is too large');
      }
    }
    
    // Validate bonus if provided
    if (data.bonus !== undefined) {
      if (typeof data.bonus !== 'number' || isNaN(data.bonus)) {
        errors.push('Bonus amount must be a valid number');
      } else if (data.bonus < 0) {
        errors.push('Bonus amount cannot be negative');
      } else if (data.sum !== undefined && data.bonus > data.sum) {
        errors.push('Bonus amount cannot exceed payment amount');
      }
    }
    
    // Validate is_refunded if provided
    if (data.is_refunded !== undefined && typeof data.is_refunded !== 'boolean') {
      errors.push('Refund status must be a boolean');
    }
    
    // Validate payment method if provided
    if (data.paymentMethod !== undefined) {
      if (!data.paymentMethod || typeof data.paymentMethod !== 'string') {
        errors.push('Payment method cannot be empty');
      } else if (!Object.values(PaymentMethod).includes(data.paymentMethod as PaymentMethod)) {
        errors.push('Invalid payment method');
      }
    }
    
    // Validate client_id if provided
    if (data.client_id !== undefined) {
      if (!data.client_id || typeof data.client_id !== 'string') {
        errors.push('Client ID cannot be empty');
      } else if (data.client_id.trim().length === 0) {
        errors.push('Client ID cannot be empty');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate with detailed error information
   */
  validateDetailed(data: CreatePaymentRequest): DetailedValidationResult {
    const errors: ValidationError[] = [];
    const errorMessages: string[] = [];
    
    if (!data) {
      errors.push({ field: 'payment', message: 'Payment data is required', code: 'REQUIRED' });
      errorMessages.push('Payment data is required');
      return { isValid: false, errors, errorMessages };
    }
    
    // Validate sum
    if (typeof data.sum !== 'number' || isNaN(data.sum)) {
      errors.push({ field: 'sum', message: 'Payment amount must be a valid number', code: 'INVALID_TYPE' });
      errorMessages.push('Payment amount must be a valid number');
    } else if (data.sum <= 0) {
      errors.push({ field: 'sum', message: 'Payment amount must be greater than 0', code: 'INVALID_VALUE' });
      errorMessages.push('Payment amount must be greater than 0');
    } else if (data.sum > 999999.99) {
      errors.push({ field: 'sum', message: 'Payment amount is too large', code: 'MAX_VALUE' });
      errorMessages.push('Payment amount is too large');
    }
    
    // Validate bonus
    if (typeof data.bonus !== 'number' || isNaN(data.bonus)) {
      errors.push({ field: 'bonus', message: 'Bonus amount must be a valid number', code: 'INVALID_TYPE' });
      errorMessages.push('Bonus amount must be a valid number');
    } else if (data.bonus < 0) {
      errors.push({ field: 'bonus', message: 'Bonus amount cannot be negative', code: 'INVALID_VALUE' });
      errorMessages.push('Bonus amount cannot be negative');
    } else if (data.bonus > data.sum) {
      errors.push({ field: 'bonus', message: 'Bonus amount cannot exceed payment amount', code: 'INVALID_RANGE' });
      errorMessages.push('Bonus amount cannot exceed payment amount');
    }
    
    // Validate is_refunded
    if (typeof data.is_refunded !== 'boolean') {
      errors.push({ field: 'is_refunded', message: 'Refund status must be a boolean', code: 'INVALID_TYPE' });
      errorMessages.push('Refund status must be a boolean');
    }
    
    // Validate payment method
    if (!data.paymentMethod || typeof data.paymentMethod !== 'string') {
      errors.push({ field: 'paymentMethod', message: 'Payment method is required', code: 'REQUIRED' });
      errorMessages.push('Payment method is required');
    } else if (!Object.values(PaymentMethod).includes(data.paymentMethod as PaymentMethod)) {
      errors.push({ field: 'paymentMethod', message: 'Invalid payment method', code: 'INVALID_VALUE' });
      errorMessages.push('Invalid payment method');
    }
    
    // Validate client_id
    if (!data.client_id || typeof data.client_id !== 'string') {
      errors.push({ field: 'client_id', message: 'Client ID is required', code: 'REQUIRED' });
      errorMessages.push('Client ID is required');
    } else if (data.client_id.trim().length === 0) {
      errors.push({ field: 'client_id', message: 'Client ID cannot be empty', code: 'EMPTY_VALUE' });
      errorMessages.push('Client ID cannot be empty');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      errorMessages
    };
  }
}

/**
 * Payment request validator for processing payments
 */
export class PaymentRequestValidator implements IValidator<{ amount: number; userId: string; method: string; bookingId?: number }> {
  validate(data: { amount: number; userId: string; method: string; bookingId?: number }): ValidationResult {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Payment request data is required');
      return { isValid: false, errors };
    }
    
    // Validate amount
    if (typeof data.amount !== 'number' || isNaN(data.amount)) {
      errors.push('Payment amount must be a valid number');
    } else if (data.amount <= 0) {
      errors.push('Payment amount must be greater than 0');
    } else if (data.amount > 999999.99) {
      errors.push('Payment amount is too large');
    }
    
    // Validate userId
    if (!data.userId || typeof data.userId !== 'string') {
      errors.push('User ID is required');
    } else if (data.userId.trim().length === 0) {
      errors.push('User ID cannot be empty');
    }
    
    // Validate method
    if (!data.method || typeof data.method !== 'string') {
      errors.push('Payment method is required');
    } else if (!Object.values(PaymentMethod).includes(data.method as PaymentMethod)) {
      errors.push('Invalid payment method');
    }
    
    // Validate bookingId if provided
    if (data.bookingId !== undefined) {
      if (typeof data.bookingId !== 'number' || isNaN(data.bookingId) || data.bookingId <= 0) {
        errors.push('Booking ID must be a positive number');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Refund request validator
 */
export class RefundRequestValidator implements IValidator<{ paymentId: string; reason?: string }> {
  validate(data: { paymentId: string; reason?: string }): ValidationResult {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Refund request data is required');
      return { isValid: false, errors };
    }
    
    // Validate paymentId
    if (!data.paymentId || typeof data.paymentId !== 'string') {
      errors.push('Payment ID is required');
    } else if (data.paymentId.trim().length === 0) {
      errors.push('Payment ID cannot be empty');
    }
    
    // Validate reason if provided
    if (data.reason !== undefined) {
      if (typeof data.reason !== 'string') {
        errors.push('Refund reason must be a string');
      } else if (data.reason.length > 500) {
        errors.push('Refund reason is too long');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}