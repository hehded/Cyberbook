/**
 * Validator Interface
 * Follows Interface Segregation Principle
 * Provides abstraction for input validation
 */
export interface IValidator<T> {
  /**
   * Validate input data
   */
  validate(data: T): ValidationResult;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Async validator interface for complex validations
 */
export interface IAsyncValidator<T> extends IValidator<T> {
  /**
   * Validate input data asynchronously
   */
  validateAsync(data: T): Promise<ValidationResult>;
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Detailed validation result
 */
export interface DetailedValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  errorMessages: string[];
}

/**
 * Validator factory interface
 */
export interface IValidatorFactory {
  /**
   * Create a validator for a specific type
   */
  createValidator<T>(type: string): IValidator<T>;
}