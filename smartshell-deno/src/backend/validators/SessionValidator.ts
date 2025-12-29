/**
 * Session Validator Implementation
 * Implements validation logic for Session entities
 * Follows SOLID principles and dependency injection
 */
import { IValidator, ValidationResult, ValidationError, DetailedValidationResult } from '../domain/interfaces/IValidator.ts';
import { Session, CreateSessionRequest } from '../domain/entities/Session.ts';

/**
 * Validator for Session entities
 */
export class SessionValidator implements IValidator<CreateSessionRequest> {
  /**
   * Validate session creation data
   */
  validate(data: CreateSessionRequest): ValidationResult {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Session data is required');
      return { isValid: false, errors };
    }
    
    // Validate userId
    if (!data.userId || typeof data.userId !== 'string') {
      errors.push('User ID is required');
    } else if (data.userId.trim().length === 0) {
      errors.push('User ID cannot be empty');
    }
    
    // Validate isActive
    if (typeof data.isActive !== 'boolean') {
      errors.push('Active status must be a boolean');
    }
    
    // Validate user if provided
    if (data.user !== undefined && data.user !== null) {
      if (typeof data.user !== 'object') {
        errors.push('User must be an object');
      }
    }
    
    // Validate clientToken if provided
    if (data.clientToken !== undefined && data.clientToken !== null) {
      if (typeof data.clientToken !== 'string') {
        errors.push('Client token must be a string');
      } else if (data.clientToken.trim().length === 0) {
        errors.push('Client token cannot be empty');
      }
    }
    
    // Validate IP address if provided
    if (data.ip !== undefined && data.ip !== null) {
      if (typeof data.ip !== 'string') {
        errors.push('IP address must be a string');
      } else if (data.ip.trim().length === 0) {
        errors.push('IP address cannot be empty');
      } else if (!this.isValidIpAddress(data.ip)) {
        errors.push('Invalid IP address format');
      }
    }
    
    // Validate user agent if provided
    if (data.userAgent !== undefined && data.userAgent !== null) {
      if (typeof data.userAgent !== 'string') {
        errors.push('User agent must be a string');
      } else if (data.userAgent.trim().length === 0) {
        errors.push('User agent cannot be empty');
      } else if (data.userAgent.length > 500) {
        errors.push('User agent is too long');
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
  validateDetailed(data: CreateSessionRequest): DetailedValidationResult {
    const errors: ValidationError[] = [];
    const errorMessages: string[] = [];
    
    if (!data) {
      errors.push({ field: 'session', message: 'Session data is required', code: 'REQUIRED' });
      errorMessages.push('Session data is required');
      return { isValid: false, errors, errorMessages };
    }
    
    // Validate userId
    if (!data.userId || typeof data.userId !== 'string') {
      errors.push({ field: 'userId', message: 'User ID is required', code: 'REQUIRED' });
      errorMessages.push('User ID is required');
    } else if (data.userId.trim().length === 0) {
      errors.push({ field: 'userId', message: 'User ID cannot be empty', code: 'EMPTY_VALUE' });
      errorMessages.push('User ID cannot be empty');
    }
    
    // Validate isActive
    if (typeof data.isActive !== 'boolean') {
      errors.push({ field: 'isActive', message: 'Active status must be a boolean', code: 'INVALID_TYPE' });
      errorMessages.push('Active status must be a boolean');
    }
    
    // Validate user if provided
    if (data.user !== undefined && data.user !== null) {
      if (typeof data.user !== 'object') {
        errors.push({ field: 'user', message: 'User must be an object', code: 'INVALID_TYPE' });
        errorMessages.push('User must be an object');
      }
    }
    
    // Validate clientToken if provided
    if (data.clientToken !== undefined && data.clientToken !== null) {
      if (typeof data.clientToken !== 'string') {
        errors.push({ field: 'clientToken', message: 'Client token must be a string', code: 'INVALID_TYPE' });
        errorMessages.push('Client token must be a string');
      } else if (data.clientToken.trim().length === 0) {
        errors.push({ field: 'clientToken', message: 'Client token cannot be empty', code: 'EMPTY_VALUE' });
        errorMessages.push('Client token cannot be empty');
      }
    }
    
    // Validate IP address if provided
    if (data.ip !== undefined && data.ip !== null) {
      if (typeof data.ip !== 'string') {
        errors.push({ field: 'ip', message: 'IP address must be a string', code: 'INVALID_TYPE' });
        errorMessages.push('IP address must be a string');
      } else if (data.ip.trim().length === 0) {
        errors.push({ field: 'ip', message: 'IP address cannot be empty', code: 'EMPTY_VALUE' });
        errorMessages.push('IP address cannot be empty');
      } else if (!this.isValidIpAddress(data.ip)) {
        errors.push({ field: 'ip', message: 'Invalid IP address format', code: 'INVALID_FORMAT' });
        errorMessages.push('Invalid IP address format');
      }
    }
    
    // Validate user agent if provided
    if (data.userAgent !== undefined && data.userAgent !== null) {
      if (typeof data.userAgent !== 'string') {
        errors.push({ field: 'userAgent', message: 'User agent must be a string', code: 'INVALID_TYPE' });
        errorMessages.push('User agent must be a string');
      } else if (data.userAgent.trim().length === 0) {
        errors.push({ field: 'userAgent', message: 'User agent cannot be empty', code: 'EMPTY_VALUE' });
        errorMessages.push('User agent cannot be empty');
      } else if (data.userAgent.length > 500) {
        errors.push({ field: 'userAgent', message: 'User agent is too long', code: 'MAX_LENGTH' });
        errorMessages.push('User agent is too long');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      errorMessages
    };
  }
  
  /**
   * Check if IP address is valid
   */
  private isValidIpAddress(ip: string): boolean {
    // Basic IPv4 validation - can be enhanced for IPv6
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
  }
}

/**
 * Session validation request validator
 */
export class SessionValidationRequestValidator implements IValidator<{ sessionId: string; ip?: string; userAgent?: string }> {
  validate(data: { sessionId: string; ip?: string; userAgent?: string }): ValidationResult {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Session validation data is required');
      return { isValid: false, errors };
    }
    
    // Validate sessionId
    if (!data.sessionId || typeof data.sessionId !== 'string') {
      errors.push('Session ID is required');
    } else if (data.sessionId.trim().length === 0) {
      errors.push('Session ID cannot be empty');
    }
    
    // Validate IP address if provided
    if (data.ip !== undefined && data.ip !== null) {
      if (typeof data.ip !== 'string') {
        errors.push('IP address must be a string');
      } else if (data.ip.trim().length === 0) {
        errors.push('IP address cannot be empty');
      } else if (!this.isValidIpAddress(data.ip)) {
        errors.push('Invalid IP address format');
      }
    }
    
    // Validate user agent if provided
    if (data.userAgent !== undefined && data.userAgent !== null) {
      if (typeof data.userAgent !== 'string') {
        errors.push('User agent must be a string');
      } else if (data.userAgent.trim().length === 0) {
        errors.push('User agent cannot be empty');
      } else if (data.userAgent.length > 500) {
        errors.push('User agent is too long');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Check if IP address is valid
   */
  private isValidIpAddress(ip: string): boolean {
    // Basic IPv4 validation - can be enhanced for IPv6
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
  }
}

/**
 * Session deactivation request validator
 */
export class SessionDeactivationRequestValidator implements IValidator<{ sessionId: string }> {
  validate(data: { sessionId: string }): ValidationResult {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Session deactivation data is required');
      return { isValid: false, errors };
    }
    
    // Validate sessionId
    if (!data.sessionId || typeof data.sessionId !== 'string') {
      errors.push('Session ID is required');
    } else if (data.sessionId.trim().length === 0) {
      errors.push('Session ID cannot be empty');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}