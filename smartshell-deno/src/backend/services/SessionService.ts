/**
 * Session Service Implementation
 * Implements session management logic with proper error handling and validation
 * Follows SOLID principles and dependency injection
 */
import { SessionRepository } from '../repositories/SessionRepository.ts';
import { UserRepository } from '../repositories/UserRepository.ts';
import { SessionValidator, SessionValidationRequestValidator, SessionDeactivationRequestValidator } from '../validators/index.ts';
import { Session, CreateSessionRequest } from '../domain/entities/Session.ts';
import { User } from '../domain/entities/User.ts';

/**
 * Custom error types for session operations
 */
export class SessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionError';
  }
}

/**
 * Session Service
 */
export class SessionService {
  private sessionRepository: SessionRepository;
  private userRepository: UserRepository;
  private sessionValidator: SessionValidator;
  private sessionValidationRequestValidator: SessionValidationRequestValidator;
  private sessionDeactivationRequestValidator: SessionDeactivationRequestValidator;

  constructor(
    sessionRepository: SessionRepository,
    userRepository: UserRepository
  ) {
    this.sessionRepository = sessionRepository;
    this.userRepository = userRepository;
    this.sessionValidator = new SessionValidator();
    this.sessionValidationRequestValidator = new SessionValidationRequestValidator();
    this.sessionDeactivationRequestValidator = new SessionDeactivationRequestValidator();
  }

  /**
   * Create a new session
   */
  async createSession(sessionData: CreateSessionRequest): Promise<Session> {
    try {
      // Validate session data
      const validation = this.sessionValidator.validate(sessionData);
      
      if (!validation.isValid) {
        throw new SessionError(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if user exists
      const user = await this.userRepository.findById(sessionData.userId);
      
      if (!user) {
        throw new SessionError(`User with ID ${sessionData.userId} not found`);
      }

      // Create session
      const session = await this.sessionRepository.create({
        ...sessionData,
        user: user
      });
      
      console.log(`Created session ${session.id} for user ${sessionData.userId}`);
      return session;
    } catch (error) {
      console.error('Create session error:', error);
      
      if (error instanceof SessionError) {
        throw error;
      }
      
      throw new SessionError(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: string): Promise<Session | null> {
    try {
      if (!sessionId) {
        throw new SessionError('Session ID is required');
      }

      const session = await this.sessionRepository.findById(sessionId);
      return session;
    } catch (error) {
      console.error('Get session by ID error:', error);
      
      if (error instanceof SessionError) {
        throw error;
      }
      
      throw new SessionError(`Failed to get session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate a session
   */
  async validateSession(sessionId: string, ip?: string, userAgent?: string): Promise<{ valid: boolean; session?: Session; error?: string }> {
    try {
      // Validate request
      const validation = this.sessionValidationRequestValidator.validate({
        sessionId,
        ip,
        userAgent
      });
      
      if (!validation.isValid) {
        return {
          valid: false,
          error: validation.errors.join(', ')
        };
      }

      // Validate session
      const result = await this.sessionRepository.validateSession(sessionId, ip, userAgent);
      
      if (result.valid && result.sessionData) {
        // Get user information
        const user = await this.userRepository.findById(result.sessionData.userId);
        
        if (user) {
          return {
            valid: true,
            session: {
              ...result.sessionData,
              user: user
            }
          };
        }
      }
      
      return {
        valid: result.valid,
        error: result.error
      };
    } catch (error) {
      console.error('Validate session error:', error);
      
      if (error instanceof SessionError) {
        throw error;
      }
      
      throw new SessionError(`Failed to validate session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deactivate a session (logout)
   */
  async deactivateSession(sessionId: string): Promise<boolean> {
    try {
      // Validate request
      const validation = this.sessionDeactivationRequestValidator.validate({ sessionId });
      
      if (!validation.isValid) {
        throw new SessionError(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const deactivated = await this.sessionRepository.deactivate(sessionId);
      
      if (deactivated) {
        console.log(`Deactivated session ${sessionId}`);
      } else {
        console.warn(`Session ${sessionId} not found or already inactive`);
      }
      
      return deactivated;
    } catch (error) {
      console.error('Deactivate session error:', error);
      
      if (error instanceof SessionError) {
        throw error;
      }
      
      throw new SessionError(`Failed to deactivate session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get sessions for a user
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    try {
      if (!userId) {
        throw new SessionError('User ID is required');
      }

      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new SessionError(`User with ID ${userId} not found`);
      }

      const sessions = await this.sessionRepository.findByUserId(userId);
      
      console.log(`Found ${sessions.length} sessions for user ${userId}`);
      return sessions;
    } catch (error) {
      console.error('Get user sessions error:', error);
      
      if (error instanceof SessionError) {
        throw error;
      }
      
      throw new SessionError(`Failed to get user sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get active sessions
   */
  async getActiveSessions(): Promise<Session[]> {
    try {
      const sessions = await this.sessionRepository.findActive();
      
      console.log(`Found ${sessions.length} active sessions`);
      return sessions;
    } catch (error) {
      console.error('Get active sessions error:', error);
      throw new SessionError(`Failed to get active sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get expired sessions
   */
  async getExpiredSessions(): Promise<Session[]> {
    try {
      const sessions = await this.sessionRepository.findExpired();
      
      console.log(`Found ${sessions.length} expired sessions`);
      return sessions;
    } catch (error) {
      console.error('Get expired sessions error:', error);
      throw new SessionError(`Failed to get expired sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const cleanedCount = await this.sessionRepository.cleanupExpired();
      
      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} expired sessions`);
      }
      
      return cleanedCount;
    } catch (error) {
      console.error('Cleanup expired sessions error:', error);
      throw new SessionError(`Failed to cleanup expired sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update session
   */
  async updateSession(sessionId: string, updates: Partial<Omit<Session, 'id' | 'createdAt'>>): Promise<Session> {
    try {
      if (!sessionId) {
        throw new SessionError('Session ID is required');
      }

      const existingSession = await this.sessionRepository.findById(sessionId);
      
      if (!existingSession) {
        throw new SessionError(`Session with ID ${sessionId} not found`);
      }

      const updatedSession = await this.sessionRepository.update(sessionId, updates);
      
      console.log(`Updated session ${sessionId}`);
      return updatedSession;
    } catch (error) {
      console.error('Update session error:', error);
      
      if (error instanceof SessionError) {
        throw error;
      }
      
      throw new SessionError(`Failed to update session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      if (!sessionId) {
        throw new SessionError('Session ID is required');
      }

      const deleted = await this.sessionRepository.delete(sessionId);
      
      if (deleted) {
        console.log(`Deleted session ${sessionId}`);
      } else {
        console.warn(`Session ${sessionId} not found for deletion`);
      }
      
      return deleted;
    } catch (error) {
      console.error('Delete session error:', error);
      
      if (error instanceof SessionError) {
        throw error;
      }
      
      throw new SessionError(`Failed to delete session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get sessions by IP address
   */
  async getSessionsByIp(ip: string): Promise<Session[]> {
    try {
      if (!ip) {
        throw new SessionError('IP address is required');
      }

      const sessions = await this.sessionRepository.findByIp(ip);
      
      console.log(`Found ${sessions.length} sessions for IP ${ip}`);
      return sessions;
    } catch (error) {
      console.error('Get sessions by IP error:', error);
      
      if (error instanceof SessionError) {
        throw error;
      }
      
      throw new SessionError(`Failed to get sessions by IP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}