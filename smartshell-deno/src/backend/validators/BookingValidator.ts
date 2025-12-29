/**
 * Booking Validator Implementation
 * Implements validation logic for Booking entities
 * Follows SOLID principles and dependency injection
 */
import { IValidator, ValidationResult, ValidationError, DetailedValidationResult } from '../domain/interfaces/IValidator.ts';
import { Booking, CreateBookingRequest, UpdateBookingRequest, BookingStatus } from '../domain/entities/Booking.ts';

/**
 * Validator for Booking entities
 */
export class BookingValidator implements IValidator<CreateBookingRequest> {
  /**
   * Validate booking creation data
   */
  validate(data: CreateBookingRequest): ValidationResult {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Booking data is required');
      return { isValid: false, errors };
    }
    
    // Validate from date
    if (!data.from) {
      errors.push('Start date is required');
    } else if (!this.isValidDate(data.from)) {
      errors.push('Invalid start date format');
    }
    
    // Validate to date
    if (!data.to) {
      errors.push('End date is required');
    } else if (!this.isValidDate(data.to)) {
      errors.push('Invalid end date format');
    }
    
    // Validate date range
    if (data.from && data.to && this.isValidDate(data.from) && this.isValidDate(data.to)) {
      const fromDate = new Date(data.from);
      const toDate = new Date(data.to);
      
      if (fromDate >= toDate) {
        errors.push('Start date must be before end date');
      }
      
      if (fromDate < new Date()) {
        errors.push('Start date cannot be in the past');
      }
    }
    
    // Validate status
    if (!data.status) {
      errors.push('Status is required');
    } else if (!Object.values(BookingStatus).includes(data.status as BookingStatus)) {
      errors.push('Invalid status value');
    }
    
    // Validate hosts
    if (!data.hosts || !Array.isArray(data.hosts) || data.hosts.length === 0) {
      errors.push('At least one host is required');
    } else {
      data.hosts.forEach((host, index) => {
        if (!host.id) {
          errors.push(`Host at index ${index} must have an ID`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate booking update data
   */
  validateUpdate(data: UpdateBookingRequest): ValidationResult {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Update data is required');
      return { isValid: false, errors };
    }
    
    // Validate from date if provided
    if (data.from !== undefined) {
      if (!data.from) {
        errors.push('Start date cannot be empty');
      } else if (!this.isValidDate(data.from)) {
        errors.push('Invalid start date format');
      }
    }
    
    // Validate to date if provided
    if (data.to !== undefined) {
      if (!data.to) {
        errors.push('End date cannot be empty');
      } else if (!this.isValidDate(data.to)) {
        errors.push('Invalid end date format');
      }
    }
    
    // Validate date range if both dates are provided
    if (data.from && data.to && this.isValidDate(data.from) && this.isValidDate(data.to)) {
      const fromDate = new Date(data.from);
      const toDate = new Date(data.to);
      
      if (fromDate >= toDate) {
        errors.push('Start date must be before end date');
      }
    }
    
    // Validate status if provided
    if (data.status !== undefined) {
      if (!data.status) {
        errors.push('Status cannot be empty');
      } else if (!Object.values(BookingStatus).includes(data.status as BookingStatus)) {
        errors.push('Invalid status value');
      }
    }
    
    // Validate hosts if provided
    if (data.hosts !== undefined) {
      if (!Array.isArray(data.hosts) || data.hosts.length === 0) {
        errors.push('At least one host is required');
      } else {
        data.hosts.forEach((host, index) => {
          if (!host.id) {
            errors.push(`Host at index ${index} must have an ID`);
          }
        });
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
  validateDetailed(data: CreateBookingRequest): DetailedValidationResult {
    const errors: ValidationError[] = [];
    const errorMessages: string[] = [];
    
    if (!data) {
      errors.push({ field: 'booking', message: 'Booking data is required', code: 'REQUIRED' });
      errorMessages.push('Booking data is required');
      return { isValid: false, errors, errorMessages };
    }
    
    // Validate from date
    if (!data.from) {
      errors.push({ field: 'from', message: 'Start date is required', code: 'REQUIRED' });
      errorMessages.push('Start date is required');
    } else if (!this.isValidDate(data.from)) {
      errors.push({ field: 'from', message: 'Invalid start date format', code: 'INVALID_FORMAT' });
      errorMessages.push('Invalid start date format');
    }
    
    // Validate to date
    if (!data.to) {
      errors.push({ field: 'to', message: 'End date is required', code: 'REQUIRED' });
      errorMessages.push('End date is required');
    } else if (!this.isValidDate(data.to)) {
      errors.push({ field: 'to', message: 'Invalid end date format', code: 'INVALID_FORMAT' });
      errorMessages.push('Invalid end date format');
    }
    
    // Validate date range
    if (data.from && data.to && this.isValidDate(data.from) && this.isValidDate(data.to)) {
      const fromDate = new Date(data.from);
      const toDate = new Date(data.to);
      
      if (fromDate >= toDate) {
        errors.push({ field: 'dateRange', message: 'Start date must be before end date', code: 'INVALID_RANGE' });
        errorMessages.push('Start date must be before end date');
      }
      
      if (fromDate < new Date()) {
        errors.push({ field: 'from', message: 'Start date cannot be in the past', code: 'PAST_DATE' });
        errorMessages.push('Start date cannot be in the past');
      }
    }
    
    // Validate status
    if (!data.status) {
      errors.push({ field: 'status', message: 'Status is required', code: 'REQUIRED' });
      errorMessages.push('Status is required');
    } else if (!Object.values(BookingStatus).includes(data.status as BookingStatus)) {
      errors.push({ field: 'status', message: 'Invalid status value', code: 'INVALID_VALUE' });
      errorMessages.push('Invalid status value');
    }
    
    // Validate hosts
    if (!data.hosts || !Array.isArray(data.hosts) || data.hosts.length === 0) {
      errors.push({ field: 'hosts', message: 'At least one host is required', code: 'REQUIRED' });
      errorMessages.push('At least one host is required');
    } else {
      data.hosts.forEach((host, index) => {
        if (!host.id) {
          errors.push({ 
            field: `hosts[${index}].id`, 
            message: `Host at index ${index} must have an ID`, 
            code: 'REQUIRED' 
          });
          errorMessages.push(`Host at index ${index} must have an ID`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      errorMessages
    };
  }
  
  /**
   * Check if date string is valid
   */
  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
}

/**
 * Time slot validator for booking availability
 */
export class TimeSlotValidator implements IValidator<{ start: Date; end: Date }> {
  validate(data: { start: Date; end: Date }): ValidationResult {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Time slot data is required');
      return { isValid: false, errors };
    }
    
    // Validate start time
    if (!data.start) {
      errors.push('Start time is required');
    } else if (!(data.start instanceof Date) || isNaN(data.start.getTime())) {
      errors.push('Invalid start time');
    }
    
    // Validate end time
    if (!data.end) {
      errors.push('End time is required');
    } else if (!(data.end instanceof Date) || isNaN(data.end.getTime())) {
      errors.push('Invalid end time');
    }
    
    // Validate time range
    if (data.start && data.end && 
        data.start instanceof Date && data.end instanceof Date &&
        !isNaN(data.start.getTime()) && !isNaN(data.end.getTime())) {
      if (data.start >= data.end) {
        errors.push('Start time must be before end time');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}