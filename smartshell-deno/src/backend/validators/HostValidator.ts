/**
 * Host Validator Implementation
 * Implements validation logic for Host entities
 * Follows SOLID principles and dependency injection
 */
import { IValidator, ValidationResult, ValidationError, DetailedValidationResult } from '../domain/interfaces/IValidator.ts';
import { Host, CreateHostRequest, UpdateHostRequest, HostGroup } from '../domain/entities/Host.ts';

/**
 * Validator for Host entities
 */
export class HostValidator implements IValidator<CreateHostRequest> {
  /**
   * Validate host creation data
   */
  validate(data: CreateHostRequest): ValidationResult {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Host data is required');
      return { isValid: false, errors };
    }
    
    // Validate alias if provided
    if (data.alias !== undefined && data.alias !== null) {
      if (typeof data.alias !== 'string') {
        errors.push('Alias must be a string');
      } else if (data.alias.trim().length === 0) {
        errors.push('Alias cannot be empty');
      } else if (data.alias.length > 100) {
        errors.push('Alias must not exceed 100 characters');
      }
    }
    
    // Validate IP address if provided
    if (data.ip_addr !== undefined && data.ip_addr !== null) {
      if (typeof data.ip_addr !== 'string') {
        errors.push('IP address must be a string');
      } else if (data.ip_addr.trim().length === 0) {
        errors.push('IP address cannot be empty');
      } else if (!this.isValidIpAddress(data.ip_addr)) {
        errors.push('Invalid IP address format');
      }
    }
    
    // Validate coordinates if provided
    if (data.coord_x !== undefined && data.coord_x !== null) {
      if (typeof data.coord_x !== 'number' || isNaN(data.coord_x)) {
        errors.push('X coordinate must be a valid number');
      }
    }
    
    if (data.coord_y !== undefined && data.coord_y !== null) {
      if (typeof data.coord_y !== 'number' || isNaN(data.coord_y)) {
        errors.push('Y coordinate must be a valid number');
      }
    }
    
    // Validate group if provided
    if (data.group !== undefined && data.group !== null) {
      if (!data.group || typeof data.group !== 'object') {
        errors.push('Group must be an object');
      } else if (!data.group.id || typeof data.group.id !== 'string') {
        errors.push('Group ID is required');
      }
    }
    
    // Validate session if provided
    if (data.session !== undefined && data.session !== null) {
      if (!data.session || typeof data.session !== 'object') {
        errors.push('Session must be an object');
      } else {
        // Validate session user
        if (data.session.user !== undefined && data.session.user !== null) {
          if (typeof data.session.user !== 'string') {
            errors.push('Session user must be a string');
          }
        }
        
        // Validate session started_at
        if (data.session.started_at !== undefined && data.session.started_at !== null) {
          if (typeof data.session.started_at !== 'string') {
            errors.push('Session started_at must be a string');
          } else if (!this.isValidDate(data.session.started_at)) {
            errors.push('Invalid session started_at date format');
          }
        }
        
        // Validate session duration
        if (data.session.duration !== undefined && data.session.duration !== null) {
          if (typeof data.session.duration !== 'number' || data.session.duration < 0) {
            errors.push('Session duration must be a non-negative number');
          }
        }
        
        // Validate session elapsed
        if (data.session.elapsed !== undefined && data.session.elapsed !== null) {
          if (typeof data.session.elapsed !== 'number' || data.session.elapsed < 0) {
            errors.push('Session elapsed must be a non-negative number');
          }
        }
        
        // Validate session time_left
        if (data.session.time_left !== undefined && data.session.time_left !== null) {
          if (typeof data.session.time_left !== 'number' || data.session.time_left < 0) {
            errors.push('Session time_left must be a non-negative number');
          }
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate host update data
   */
  validateUpdate(data: UpdateHostRequest): ValidationResult {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Update data is required');
      return { isValid: false, errors };
    }
    
    // Validate alias if provided
    if (data.alias !== undefined) {
      if (data.alias !== null && typeof data.alias !== 'string') {
        errors.push('Alias must be a string or null');
      } else if (data.alias !== null && data.alias.trim().length === 0) {
        errors.push('Alias cannot be empty');
      } else if (data.alias !== null && data.alias.length > 100) {
        errors.push('Alias must not exceed 100 characters');
      }
    }
    
    // Validate IP address if provided
    if (data.ip_addr !== undefined) {
      if (data.ip_addr !== null && typeof data.ip_addr !== 'string') {
        errors.push('IP address must be a string or null');
      } else if (data.ip_addr !== null && data.ip_addr.trim().length === 0) {
        errors.push('IP address cannot be empty');
      } else if (data.ip_addr !== null && !this.isValidIpAddress(data.ip_addr)) {
        errors.push('Invalid IP address format');
      }
    }
    
    // Validate coordinates if provided
    if (data.coord_x !== undefined) {
      if (data.coord_x !== null && (typeof data.coord_x !== 'number' || isNaN(data.coord_x))) {
        errors.push('X coordinate must be a valid number or null');
      }
    }
    
    if (data.coord_y !== undefined) {
      if (data.coord_y !== null && (typeof data.coord_y !== 'number' || isNaN(data.coord_y))) {
        errors.push('Y coordinate must be a valid number or null');
      }
    }
    
    // Validate group if provided
    if (data.group !== undefined) {
      if (data.group !== null && (!data.group || typeof data.group !== 'object')) {
        errors.push('Group must be an object or null');
      } else if (data.group !== null && (!data.group.id || typeof data.group.id !== 'string')) {
        errors.push('Group ID is required');
      }
    }
    
    // Validate session if provided
    if (data.session !== undefined) {
      if (data.session !== null && (!data.session || typeof data.session !== 'object')) {
        errors.push('Session must be an object or null');
      } else if (data.session !== null) {
        // Validate session user
        if (data.session.user !== undefined && data.session.user !== null) {
          if (typeof data.session.user !== 'string') {
            errors.push('Session user must be a string');
          }
        }
        
        // Validate session started_at
        if (data.session.started_at !== undefined && data.session.started_at !== null) {
          if (typeof data.session.started_at !== 'string') {
            errors.push('Session started_at must be a string');
          } else if (!this.isValidDate(data.session.started_at)) {
            errors.push('Invalid session started_at date format');
          }
        }
        
        // Validate session duration
        if (data.session.duration !== undefined && data.session.duration !== null) {
          if (typeof data.session.duration !== 'number' || data.session.duration < 0) {
            errors.push('Session duration must be a non-negative number');
          }
        }
        
        // Validate session elapsed
        if (data.session.elapsed !== undefined && data.session.elapsed !== null) {
          if (typeof data.session.elapsed !== 'number' || data.session.elapsed < 0) {
            errors.push('Session elapsed must be a non-negative number');
          }
        }
        
        // Validate session time_left
        if (data.session.time_left !== undefined && data.session.time_left !== null) {
          if (typeof data.session.time_left !== 'number' || data.session.time_left < 0) {
            errors.push('Session time_left must be a non-negative number');
          }
        }
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
  validateDetailed(data: CreateHostRequest): DetailedValidationResult {
    const errors: ValidationError[] = [];
    const errorMessages: string[] = [];
    
    if (!data) {
      errors.push({ field: 'host', message: 'Host data is required', code: 'REQUIRED' });
      errorMessages.push('Host data is required');
      return { isValid: false, errors, errorMessages };
    }
    
    // Validate alias if provided
    if (data.alias !== undefined && data.alias !== null) {
      if (typeof data.alias !== 'string') {
        errors.push({ field: 'alias', message: 'Alias must be a string', code: 'INVALID_TYPE' });
        errorMessages.push('Alias must be a string');
      } else if (data.alias.trim().length === 0) {
        errors.push({ field: 'alias', message: 'Alias cannot be empty', code: 'EMPTY_VALUE' });
        errorMessages.push('Alias cannot be empty');
      } else if (data.alias.length > 100) {
        errors.push({ field: 'alias', message: 'Alias must not exceed 100 characters', code: 'MAX_LENGTH' });
        errorMessages.push('Alias must not exceed 100 characters');
      }
    }
    
    // Validate IP address if provided
    if (data.ip_addr !== undefined && data.ip_addr !== null) {
      if (typeof data.ip_addr !== 'string') {
        errors.push({ field: 'ip_addr', message: 'IP address must be a string', code: 'INVALID_TYPE' });
        errorMessages.push('IP address must be a string');
      } else if (data.ip_addr.trim().length === 0) {
        errors.push({ field: 'ip_addr', message: 'IP address cannot be empty', code: 'EMPTY_VALUE' });
        errorMessages.push('IP address cannot be empty');
      } else if (!this.isValidIpAddress(data.ip_addr)) {
        errors.push({ field: 'ip_addr', message: 'Invalid IP address format', code: 'INVALID_FORMAT' });
        errorMessages.push('Invalid IP address format');
      }
    }
    
    // Validate coordinates if provided
    if (data.coord_x !== undefined && data.coord_x !== null) {
      if (typeof data.coord_x !== 'number' || isNaN(data.coord_x)) {
        errors.push({ field: 'coord_x', message: 'X coordinate must be a valid number', code: 'INVALID_TYPE' });
        errorMessages.push('X coordinate must be a valid number');
      }
    }
    
    if (data.coord_y !== undefined && data.coord_y !== null) {
      if (typeof data.coord_y !== 'number' || isNaN(data.coord_y)) {
        errors.push({ field: 'coord_y', message: 'Y coordinate must be a valid number', code: 'INVALID_TYPE' });
        errorMessages.push('Y coordinate must be a valid number');
      }
    }
    
    // Validate group if provided
    if (data.group !== undefined && data.group !== null) {
      if (!data.group || typeof data.group !== 'object') {
        errors.push({ field: 'group', message: 'Group must be an object', code: 'INVALID_TYPE' });
        errorMessages.push('Group must be an object');
      } else if (!data.group.id || typeof data.group.id !== 'string') {
        errors.push({ field: 'group.id', message: 'Group ID is required', code: 'REQUIRED' });
        errorMessages.push('Group ID is required');
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
  
  /**
   * Check if date string is valid
   */
  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
}

/**
 * Location validator for host location searches
 */
export class LocationValidator implements IValidator<{ x: number; y: number; radius: number }> {
  validate(data: { x: number; y: number; radius: number }): ValidationResult {
    const errors: string[] = [];
    
    if (!data) {
      errors.push('Location data is required');
      return { isValid: false, errors };
    }
    
    // Validate X coordinate
    if (typeof data.x !== 'number' || isNaN(data.x)) {
      errors.push('X coordinate must be a valid number');
    }
    
    // Validate Y coordinate
    if (typeof data.y !== 'number' || isNaN(data.y)) {
      errors.push('Y coordinate must be a valid number');
    }
    
    // Validate radius
    if (typeof data.radius !== 'number' || isNaN(data.radius)) {
      errors.push('Radius must be a valid number');
    } else if (data.radius <= 0) {
      errors.push('Radius must be greater than 0');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}