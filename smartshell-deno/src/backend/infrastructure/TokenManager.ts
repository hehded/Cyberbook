/**
 * Token Manager
 * Follows SOLID principles
 * Manages session tokens and authentication
 */
import { Session, SessionValidationResult } from '../domain/entities/index.ts';

export class TokenManager {
  private sessions = new Map<string, Session>();
  private sessionTimeout: number = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Create a new session
   */
  createSession(
    userId: string,
    user: any,
    clientToken?: string,
    ip?: string,
    userAgent?: string
  ): string {
    const sessionId = this.generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.sessionTimeout);

    const session: Session = {
      id: sessionId,
      userId,
      user,
      clientToken,
      ip,
      userAgent,
      createdAt: now,
      expiresAt,
      isActive: true
    };

    this.sessions.set(sessionId, session);
    
    // Clean up expired sessions
    this.cleanupExpiredSessions();
    
    return sessionId;
  }

  /**
   * Validate a session
   */
  validateSession(
    sessionId: string,
    ip?: string,
    userAgent?: string
  ): SessionValidationResult {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return { valid: false, error: 'Session not found' };
    }

    if (!session.isActive) {
      return { valid: false, error: 'Session is inactive' };
    }

    if (session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return { valid: false, error: 'Session has expired' };
    }

    // Optional IP validation
    if (ip && session.ip && session.ip !== ip) {
      return { valid: false, error: 'Session IP mismatch' };
    }

    // Optional user agent validation
    if (userAgent && session.userAgent && session.userAgent !== userAgent) {
      return { valid: false, error: 'Session user agent mismatch' };
    }

    // Update last activity
    session.expiresAt = new Date(Date.now() + this.sessionTimeout);

    return { valid: true, sessionData: session };
  }

  /**
   * Remove a session
   */
  removeSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.delete(sessionId);
      return true;
    }
    return false;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (session && session.isActive && session.expiresAt > new Date()) {
      return session;
    }
    return null;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): Session[] {
    const now = new Date();
    const activeSessions: Session[] = [];
    
    for (const session of this.sessions.values()) {
      if (session.isActive && session.expiresAt > now) {
        activeSessions.push(session);
      }
    }
    
    return activeSessions;
  }

  /**
   * Get sessions by user ID
   */
  getSessionsByUserId(userId: string): Session[] {
    const userSessions: Session[] = [];
    
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.isActive) {
        userSessions.push(session);
      }
    }
    
    return userSessions;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): number {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now || !session.isActive) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
  } {
    const now = new Date();
    let activeCount = 0;
    let expiredCount = 0;
    
    for (const session of this.sessions.values()) {
      if (session.expiresAt < now || !session.isActive) {
        expiredCount++;
      } else {
        activeCount++;
      }
    }
    
    return {
      totalSessions: this.sessions.size,
      activeSessions: activeCount,
      expiredSessions: expiredCount
    };
  }

  /**
   * Extend session expiration
   */
  extendSession(sessionId: string, additionalTime: number): boolean {
    const session = this.sessions.get(sessionId);
    if (session && session.isActive) {
      session.expiresAt = new Date(Date.now() + additionalTime);
      return true;
    }
    return false;
  }

  /**
   * Invalidate all sessions for a user
   */
  invalidateUserSessions(userId: string): number {
    let invalidatedCount = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        session.isActive = false;
        this.sessions.delete(sessionId);
        invalidatedCount++;
      }
    }
    
    return invalidatedCount;
  }

  /**
   * Generate a secure session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomPart}`;
  }

  /**
   * Set session timeout
   */
  setSessionTimeout(timeout: number): void {
    this.sessionTimeout = timeout;
  }

  /**
   * Get session timeout
   */
  getSessionTimeout(): number {
    return this.sessionTimeout;
  }
}