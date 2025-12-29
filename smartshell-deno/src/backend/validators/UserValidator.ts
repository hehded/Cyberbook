/**
 * User Validator Implementation
 * Implements validation logic for User entities
 * Follows SOLID principles and dependency injection
 */
import { IValidator, ValidationResult, ValidationError, DetailedValidationResult } from '../domain/interfaces/IValidator.ts';
import { User, CreateUserRequest, UpdateUserRequest } from '../domain/entities/User.ts';

/**
 * Validator for User entities
 */
export class UserValidator implements IValidator<CreateUserRequest> {
  /**
   * Validate user creation data
   */
  validate(data: CreateUserRequest): ValidationResult {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('User data is required');
      return { isValid: false, errors };
    }
    
    // Validate nickname
    if (!data.nickname || data.nickname.trim().length === 0) {
      errors.push('Nickname is required');
    } else if (data.nickname.length < 2) {
      errors.push('Nickname must be at least 2 characters long');
    } else if (data.nickname.length > 50) {
      errors.push('Nickname must not exceed 50 characters');
    }
    
    // Validate phone
    if (!data.phone || data.phone.trim().length === 0) {
      errors.push('Phone number is required');
    } else if (!this.isValidPhone(data.phone)) {
      errors.push('Invalid phone number format');
    }
    
    // Validate deposit
    if (typeof data.deposit !== 'number' || data.deposit < 0) {
      errors.push('Deposit must be a non-negative number');
    }
    
    // Validate bonus
    if (typeof data.bonus !== 'number' || data.bonus < 0) {
      errors.push('Bonus must be a non-negative number');
    }
    
    // Validate login
    if (!data.login || data.login.trim().length === 0) {
      errors.push('Login is required');
    } else if (data.login.length < 3) {
      errors.push('Login must be at least 3 characters long');
    } else if (data.login.length > 30) {
      errors.push('Login must not exceed 30 characters');
    } else if (!/^[a-zA-Z0-9_]+$/.test(data.login)) {
      errors.push('Login can only contain letters, numbers, and underscores');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate user update data
   */
  validateUpdate(data: UpdateUserRequest): ValidationResult {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Update data is required');
      return { isValid: false, errors };
    }
    
    // Validate nickname if provided
    if (data.nickname !== undefined) {
      if (data.nickname.trim().length === 0) {
        errors.push('Nickname cannot be empty');
      } else if (data.nickname.length < 2) {
        errors.push('Nickname must be at least 2 characters long');
      } else if (data.nickname.length > 50) {
        errors.push('Nickname must not exceed 50 characters');
      }
    }
    
    // Validate phone if provided
    if (data.phone !== undefined) {
      if (data.phone.trim().length === 0) {
        errors.push('Phone number cannot be empty');
      } else if (!this.isValidPhone(data.phone)) {
        errors.push('Invalid phone number format');
      }
    }
    
    // Validate deposit if provided
    if (data.deposit !== undefined && (typeof data.deposit !== 'number' || data.deposit < 0)) {
      errors.push('Deposit must be a non-negative number');
    }
    
    // Validate bonus if provided
    if (data.bonus !== undefined && (typeof data.bonus !== 'number' || data.bonus < 0)) {
      errors.push('Bonus must be a non-negative number');
    }
    
    // Validate login if provided
    if (data.login !== undefined) {
      if (data.login.trim().length === 0) {
        errors.push('Login cannot be empty');
      } else if (data.login.length < 3) {
        errors.push('Login must be at least 3 characters long');
      } else if (data.login.length > 30) {
        errors.push('Login must not exceed 30 characters');
      } else if (!/^[a-zA-Z0-9_]+$/.test(data.login)) {
        errors.push('Login can only contain letters, numbers, and underscores');
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
  validateDetailed(data: CreateUserRequest): DetailedValidationResult {
    const errors: ValidationError[] = [];
    const errorMessages: string[] = [];
    
    if (!data) {
      errors.push({ field: 'user', message: 'User data is required', code: 'REQUIRED' });
      errorMessages.push('User data is required');
      return { isValid: false, errors, errorMessages };
    }
    
    // Validate nickname
    if (!data.nickname || data.nickname.trim().length === 0) {
      errors.push({ field: 'nickname', message: 'Nickname is required', code: 'REQUIRED' });
      errorMessages.push('Nickname is required');
    } else if (data.nickname.length < 2) {
      errors.push({ field: 'nickname', message: 'Nickname must be at least 2 characters long', code: 'MIN_LENGTH' });
      errorMessages.push('Nickname must be at least 2 characters long');
    } else if (data.nickname.length > 50) {
      errors.push({ field: 'nickname', message: 'Nickname must not exceed 50 characters', code: 'MAX_LENGTH' });
      errorMessages.push('Nickname must not exceed 50 characters');
    }
    
    // Validate phone
    if (!data.phone || data.phone.trim().length === 0) {
      errors.push({ field: 'phone', message: 'Phone number is required', code: 'REQUIRED' });
      errorMessages.push('Phone number is required');
    } else if (!this.isValidPhone(data.phone)) {
      errors.push({ field: 'phone', message: 'Invalid phone number format', code: 'INVALID_FORMAT' });
      errorMessages.push('Invalid phone number format');
    }
    
    // Validate deposit
    if (typeof data.deposit !== 'number' || data.deposit < 0) {
      errors.push({ field: 'deposit', message: 'Deposit must be a non-negative number', code: 'INVALID_VALUE' });
      errorMessages.push('Deposit must be a non-negative number');
    }
    
    // Validate bonus
    if (typeof data.bonus !== 'number' || data.bonus < 0) {
      errors.push({ field: 'bonus', message: 'Bonus must be a non-negative number', code: 'INVALID_VALUE' });
      errorMessages.push('Bonus must be a non-negative number');
    }
    
    // Validate login
    if (!data.login || data.login.trim().length === 0) {
      errors.push({ field: 'login', message: 'Login is required', code: 'REQUIRED' });
      errorMessages.push('Login is required');
    } else if (data.login.length < 3) {
      errors.push({ field: 'login', message: 'Login must be at least 3 characters long', code: 'MIN_LENGTH' });
      errorMessages.push('Login must be at least 3 characters long');
    } else if (data.login.length > 30) {
      errors.push({ field: 'login', message: 'Login must not exceed 30 characters', code: 'MAX_LENGTH' });
      errorMessages.push('Login must not exceed 30 characters');
    } else if (!/^[a-zA-Z0-9_]+$/.test(data.login)) {
      errors.push({ field: 'login', message: 'Login can only contain letters, numbers, and underscores', code: 'INVALID_FORMAT' });
      errorMessages.push('Login can only contain letters, numbers, and underscores');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      errorMessages
    };
  }
  
  /**
   * Check if phone number is valid
   */
  private isValidPhone(phone: string): boolean {
    // Basic phone validation - can be enhanced based on requirements
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  }
}

/**
 * Login credentials validator
 */
export class LoginValidator implements IValidator<{ login: string; password: string }> {
  validate(data: { login: string; password: string }): ValidationResult {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Login credentials are required');
      return { isValid: false, errors };
    }
    
    // Validate login
    if (!data.login || data.login.trim().length === 0) {
      errors.push('Login is required');
    }
    
    // Validate password
    if (!data.password || data.password.length === 0) {
      errors.push('Password is required');
    } else if (data.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}