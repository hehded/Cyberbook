// security.ts
export class SecurityUtils {
  // Проверка на SQL инъекции
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    // Удаляем опасные символы
    return input
      .replace(/['"]/g, '')           // Кавычки
      .replace(/;/g, '')              // Точка с запятой
      .replace(/--/g, '')             // Комментарии SQL
      .replace(/\/\*/g, '')           // Начало комментария
      .replace(/\*\//g, '')           // Конец комментария
      .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b/gi, '') // SQL ключевые слова
      .trim();
  }

  // Валидация email
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Валидация телефона (латвийский формат)
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^(\+371|371)?[2-9]\d{6,7}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  // Валидация пароля
  static isValidPassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    // Проверка на распространенные пароли
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      errors.push('Password is too common');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Генерация CSRF токена
  static generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Проверка CSRF токена
  static validateCSRFToken(token: string, sessionToken: string): boolean {
    return !!(token && sessionToken && token === sessionToken);
  }

  // Ограничение частоты запросов
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, { count: number; resetTime: number }>();
    
    return (identifier: string): { allowed: boolean; resetIn?: number } => {
      const now = Date.now();
      const record = requests.get(identifier);
      
      if (!record || now > record.resetTime) {
        requests.set(identifier, { count: 1, resetTime: now + windowMs });
        return { allowed: true };
      }
      
      if (record.count >= maxRequests) {
        return { 
          allowed: false, 
          resetIn: Math.ceil((record.resetTime - now) / 1000) 
        };
      }
      
      record.count++;
      return { allowed: true };
    };
  }

  // Проверка на XSS
  static sanitizeHTML(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Валидация ID (число)
  static isValidId(id: any): boolean {
    const num = Number(id);
    return Number.isInteger(num) && num > 0 && num <= 2147483647; // Max 32-bit int
  }

  // Валидация UUID
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // Проверка на подозрительную активность
  static detectSuspiciousActivity(
    loginAttempts: number, 
    timeWindow: number, 
    maxAttempts: number = 5
  ): boolean {
    return loginAttempts >= maxAttempts && timeWindow < 300000; // 5 минут
  }

  // Логирование безопасности
  static logSecurityEvent(
    event: string, 
    details: Record<string, any>, 
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      severity,
      details,
      stack: new Error().stack
    };
    
    console.log(`[SECURITY-${severity.toUpperCase()}]`, JSON.stringify(logEntry, null, 2));
    
    // В продакшене здесь можно добавить отправку в SIEM систему
    if (severity === 'critical') {
      console.error('[CRITICAL SECURITY EVENT]', logEntry);
    }
  }

  // Проверка целостности данных
  static verifyDataIntegrity(data: string, expectedHash?: string): boolean {
    if (!expectedHash) return true;
    
    // Простая хеш-функция для демонстрации
    const hash = this.simpleHash(data);
    return hash === expectedHash;
  }

  // Простая хеш-функция (в продакшене использовать SHA-256)
  private static simpleHash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

// Экспорт экземпляров лимитеров
export const loginRateLimiter = SecurityUtils.createRateLimiter(5, 15 * 60 * 1000); // 5 попыток за 15 минут
export const apiRateLimiter = SecurityUtils.createRateLimiter(100, 60 * 1000); // 100 запросов в минуту