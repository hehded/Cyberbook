/**
 * Session Repository Implementation
 * Implements repository pattern for Session entity
 * Follows SOLID principles and dependency injection
 */
import { IRepository } from '../domain/interfaces/IRepository.ts';
import { Session, CreateSessionRequest, SessionValidationResult } from '../domain/entities/Session.ts';

/**
 * Session update data (partial)
 */
export type UpdateSessionRequest = Partial<Omit<Session, 'id' | 'createdAt'>>;

/**
 * In-memory implementation of SessionRepository
 * In a real application, this would connect to a database
 */
export class SessionRepository implements IRepository<Session, string> {
  private sessions: Map<string, Session> = new Map();
  private nextId: number = 1;

  constructor() {
    // Initialize with some default sessions
    this.seedData();
  }

  /**
   * Generate a unique session ID
   */
  private generateId(): string {
    return `session_${this.nextId++}_${Date.now()}`;
  }

  /**
   * Find a session by ID
   */
  async findById(id: string): Promise<Session | null> {
    try {
      const session = this.sessions.get(id);
      return session || null;
    } catch (error) {
      console.error(`Error finding session by ID ${id}:`, error);
      throw new Error(`Failed to find session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find all sessions
   */
  async findAll(): Promise<Session[]> {
    try {
      return Array.from(this.sessions.values());
    } catch (error) {
      console.error('Error finding all sessions:', error);
      throw new Error(`Failed to find all sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find sessions matching filter criteria
   */
  async find(filter: Partial<Session>): Promise<Session[]> {
    try {
      const sessions = Array.from(this.sessions.values());
      
      if (!filter || Object.keys(filter).length === 0) {
        return sessions;
      }

      return sessions.filter(session => {
        return Object.entries(filter).every(([key, value]) => {
          return session[key as keyof Session] === value;
        });
      });
    } catch (error) {
      console.error('Error filtering sessions:', error);
      throw new Error(`Failed to filter sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new session
   */
  async create(sessionData: CreateSessionRequest): Promise<Session> {
    try {
      const id = this.generateId();
      const createdAt = new Date();
      const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      
      const newSession: Session = {
        id,
        createdAt,
        expiresAt,
        ...sessionData,
        isActive: sessionData.isActive !== undefined ? sessionData.isActive : true
      };
      
      this.sessions.set(id, newSession);
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing session
   */
  async update(id: string, updates: UpdateSessionRequest): Promise<Session> {
    try {
      const existingSession = this.sessions.get(id);
      
      if (!existingSession) {
        throw new Error(`Session with ID ${id} not found`);
      }
      
      const updatedSession: Session = {
        ...existingSession,
        ...updates
      };
      
      this.sessions.set(id, updatedSession);
      return updatedSession;
    } catch (error) {
      console.error(`Error updating session with ID ${id}:`, error);
      throw new Error(`Failed to update session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a session by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      const existed = this.sessions.has(id);
      this.sessions.delete(id);
      return existed;
    } catch (error) {
      console.error(`Error deleting session with ID ${id}:`, error);
      throw new Error(`Failed to delete session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find sessions by user ID
   */
  async findByUserId(userId: string): Promise<Session[]> {
    try {
      const sessions = Array.from(this.sessions.values());
      return sessions.filter(session => session.userId === userId);
    } catch (error) {
      console.error(`Error finding sessions by user ID ${userId}:`, error);
      throw new Error(`Failed to find sessions by user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find active sessions
   */
  async findActive(): Promise<Session[]> {
    try {
      const sessions = Array.from(this.sessions.values());
      const now = new Date();
      
      return sessions.filter(session => 
        session.isActive && 
        session.expiresAt > now
      );
    } catch (error) {
      console.error('Error finding active sessions:', error);
      throw new Error(`Failed to find active sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find expired sessions
   */
  async findExpired(): Promise<Session[]> {
    try {
      const sessions = Array.from(this.sessions.values());
      const now = new Date();
      
      return sessions.filter(session => 
        session.expiresAt <= now
      );
    } catch (error) {
      console.error('Error finding expired sessions:', error);
      throw new Error(`Failed to find expired sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find sessions by IP address
   */
  async findByIp(ip: string): Promise<Session[]> {
    try {
      const sessions = Array.from(this.sessions.values());
      return sessions.filter(session => session.ip === ip);
    } catch (error) {
      console.error(`Error finding sessions by IP ${ip}:`, error);
      throw new Error(`Failed to find sessions by IP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate a session
   */
  async validateSession(sessionId: string, ip?: string, userAgent?: string): Promise<SessionValidationResult> {
    try {
      const session = await this.findById(sessionId);
      
      if (!session) {
        return {
          valid: false,
          error: 'Session not found'
        };
      }
      
      // Check if session is expired
      const now = new Date();
      if (session.expiresAt <= now) {
        return {
          valid: false,
          error: 'Session expired'
        };
      }
      
      // Check if session is active
      if (!session.isActive) {
        return {
          valid: false,
          error: 'Session is inactive'
        };
      }
      
      // Check IP address if provided
      if (ip && session.ip && session.ip !== ip) {
        return {
          valid: false,
          error: 'IP address mismatch'
        };
      }
      
      // Check user agent if provided
      if (userAgent && session.userAgent && session.userAgent !== userAgent) {
        return {
          valid: false,
          error: 'User agent mismatch'
        };
      }
      
      return {
        valid: true,
        sessionData: session
      };
    } catch (error) {
      console.error(`Error validating session ${sessionId}:`, error);
      return {
        valid: false,
        error: 'Failed to validate session'
      };
    }
  }

  /**
   * Deactivate a session (logout)
   */
  async deactivate(sessionId: string): Promise<boolean> {
    try {
      const session = await this.findById(sessionId);
      
      if (!session) {
        return false;
      }
      
      await this.update(sessionId, { isActive: false });
      return true;
    } catch (error) {
      console.error(`Error deactivating session ${sessionId}:`, error);
      throw new Error(`Failed to deactivate session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpired(): Promise<number> {
    try {
      const expiredSessions = await this.findExpired();
      let cleanedCount = 0;
      
      for (const session of expiredSessions) {
        await this.delete(session.id);
        cleanedCount++;
      }
      
      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      throw new Error(`Failed to cleanup expired sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Seed initial data
   */
  private seedData(): void {
    const defaultSessions: CreateSessionRequest[] = [
      {
        userId: '1',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        isActive: true
      },
      {
        userId: '2',
        ip: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        isActive: true
      }
    ];

    defaultSessions.forEach(session => {
      this.create(session);
    });
  }
}