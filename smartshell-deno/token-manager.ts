// token-manager.ts

export interface SessionData {
  userId: string;
  user: any;
  clientToken?: string;
  createdAt: number;
  lastAccess: number;
  expiresAt: number;
  ip?: string;
  userAgent?: string;
}

export class TokenManager {
  private sessions = new Map<string, SessionData>();
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 часа
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 минут
  private cleanupTimer: number;

  constructor() {
    // Запускаем периодическую очистку просроченных сессий
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.CLEANUP_INTERVAL);
  }

  // Генерация безопасного токена сессии
  generateSessionToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Создание новой сессии с улучшенной безопасностью
  createSession(
    userId: string, 
    user: any, 
    clientToken?: string, 
    ip?: string, 
    userAgent?: string
  ): string {
    const sessionId = this.generateSessionToken();
    const now = Date.now();
    
    const sessionData: SessionData = {
      userId,
      user: {
        id: user.id,
        nickname: user.nickname,
        phone: user.phone,
        deposit: user.deposit,
        bonus: user.bonus,
        login: user.login
      },
      clientToken,
      createdAt: now,
      lastAccess: now,
      expiresAt: now + this.SESSION_TIMEOUT,
      ip,
      userAgent
    };

    this.sessions.set(sessionId, sessionData);
    console.log("[TOKEN] Session created:", { userId, sessionId: sessionId.substring(0, 8) + "...", ip });
    
    return sessionId;
  }

  // Валидация сессии с проверкой безопасности
  validateSession(
    sessionId: string, 
    ip?: string, 
    userAgent?: string
  ): { valid: boolean; sessionData?: SessionData; error?: string } {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      console.log("[TOKEN] Session not found:", sessionId.substring(0, 8) + "...");
      return { valid: false, error: "Session not found" };
    }

    const now = Date.now();

    // Проверка срока действия
    if (now > session.expiresAt) {
      console.log("[TOKEN] Session expired:", { userId: session.userId, age: now - session.createdAt });
      this.sessions.delete(sessionId);
      return { valid: false, error: "Session expired" };
    }

    // Проверка IP-адреса (если указан)
    if (session.ip && ip && session.ip !== ip) {
      console.log("[TOKEN] IP mismatch:", { expected: session.ip, actual: ip, userId: session.userId });
      // Не блокируем, но логируем подозрительную активность
    }

    // Проверка User-Agent (если указан)
    if (session.userAgent && userAgent && session.userAgent !== userAgent) {
      console.log("[TOKEN] User-Agent mismatch:", { userId: session.userId });
      // Не блокируем, но логируем
    }

    // Обновляем время последнего доступа
    session.lastAccess = now;
    
    // Обновляем срок действия (скользящая сессия)
    session.expiresAt = now + this.SESSION_TIMEOUT;

    console.log("[TOKEN] Session validated:", { userId: session.userId });
    return { valid: true, sessionData: session };
  }

  // Удаление сессии
  removeSession(sessionId: string): boolean {
    const existed = this.sessions.has(sessionId);
    if (existed) {
      const session = this.sessions.get(sessionId);
      console.log("[TOKEN] Session removed:", { userId: session?.userId });
      this.sessions.delete(sessionId);
    }
    return existed;
  }

  // Очистка просроченных сессий
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log("[TOKEN] Cleaned up expired sessions:", cleanedCount);
    }
  }

  // Получение информации о сессии
  getSessionInfo(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Возвращаем копию без чувствительных данных
      return {
        userId: session.userId,
        user: session.user,
        createdAt: session.createdAt,
        lastAccess: session.lastAccess,
        expiresAt: session.expiresAt
      };
    }
    return null;
  }

  // Получение всех активных сессий пользователя
  getUserSessions(userId: string): SessionData[] {
    const userSessions: SessionData[] = [];
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        userSessions.push(session);
      }
    }
    return userSessions;
  }

  // Завершение всех сессий пользователя
  revokeAllUserSessions(userId: string): number {
    let revokedCount = 0;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
        revokedCount++;
      }
    }
    console.log("[TOKEN] Revoked all sessions for user:", { userId, count: revokedCount });
    return revokedCount;
  }

  // Получение статистики
  getStats(): { totalSessions: number; activeSessions: number } {
    const now = Date.now();
    let activeCount = 0;
    
    for (const session of this.sessions.values()) {
      if (now <= session.expiresAt) {
        activeCount++;
      }
    }
    
    return {
      totalSessions: this.sessions.size,
      activeSessions: activeCount
    };
  }

  // Остановка менеджера токенов
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.sessions.clear();
    console.log("[TOKEN] Token manager destroyed");
  }
}

// Экспорт singleton экземпляра
export const tokenManager = new TokenManager();