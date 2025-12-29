/**
 * Security Provider
 * Follows SOLID principles
 * Provides security utilities and validation
 */

export class SecurityProvider {
  private rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes

  /**
   * Sanitize input string to prevent XSS and injection attacks
   */
  sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .trim();
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  isValidPhone(phone: string): boolean {
    // Basic phone validation - can be enhanced based on requirements
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (!password) {
      return {
        isValid: false,
        score: 0,
        feedback: ['Password is required']
      };
    }

    // Length check
    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    // Contains lowercase
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain lowercase letters');
    }

    // Contains uppercase
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain uppercase letters');
    }

    // Contains numbers
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain numbers');
    }

    // Contains special characters
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain special characters');
    }

    // Common password check
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.includes(password.toLowerCase())) {
      score -= 2;
      feedback.push('Password is too common');
    }

    return {
      isValid: score >= 3 && feedback.length === 0,
      score: Math.max(0, score),
      feedback
    };
  }

  /**
   * Hash password using secure algorithm
   */
  async hashPassword(password: string, salt?: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + (salt || ''));
    
    // Use Web Crypto API for secure hashing
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Rate limiting for login attempts
   */
  loginRateLimiter(identifier: string): { allowed: boolean; resetIn?: number } {
    const now = Date.now();
    const key = `login:${identifier}`;
    
    let entry = this.rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + this.windowMs
      };
      this.rateLimitStore.set(key, entry);
      return { allowed: true };
    }
    
    if (entry.count >= this.maxAttempts) {
      const resetIn = Math.ceil((entry.resetTime - now) / 1000);
      return { allowed: false, resetIn };
    }
    
    entry.count++;
    return { allowed: true };
  }

  /**
   * Validate IP address format
   */
  isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Extract IP from request headers
   */
  extractIP(headers: Headers): string {
    return headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           headers.get('x-real-ip') ||
           headers.get('x-client-ip') ||
           'unknown';
  }

  /**
   * Check if request is from allowed origin
   */
  isAllowedOrigin(origin: string, allowedOrigins: string[]): boolean {
    if (allowedOrigins.includes('*')) {
      return true;
    }
    
    return allowedOrigins.some(allowed => {
      if (allowed === origin) return true;
      
      // Support wildcard subdomains
      if (allowed.startsWith('*.')) {
        const domain = allowed.substring(2);
        return origin.endsWith(domain);
      }
      
      return false;
    });
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken(): string {
    return this.generateSecureToken(24);
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(token: string, sessionToken: string): boolean {
    return !!(token && sessionToken && token === sessionToken);
  }

  /**
   * Escape HTML entities
   */
  escapeHTML(text: string): string {
    // Simple HTML escaping without DOM dependency
    return text
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Clean up rate limit entries
   */
  cleanupRateLimit(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  /**
   * Get rate limit statistics
   */
  getRateLimitStats(): { totalEntries: number; activeEntries: number } {
    const now = Date.now();
    let activeEntries = 0;
    
    for (const entry of this.rateLimitStore.values()) {
      if (now <= entry.resetTime) {
        activeEntries++;
      }
    }
    
    return {
      totalEntries: this.rateLimitStore.size,
      activeEntries
    };
  }
}