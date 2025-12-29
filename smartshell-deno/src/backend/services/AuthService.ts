/**
 * Authentication Service Implementation
 * Implements authentication logic with proper error handling and validation
 * Follows SOLID principles and dependency injection
 */
import { IAuthService, LoginRequest, LoginResponse } from '../domain/interfaces/IService.ts';
import { UserRepository } from '../repositories/UserRepository.ts';
import { SessionRepository } from '../repositories/SessionRepository.ts';
import { UserValidator, LoginValidator } from '../validators/index.ts';
import { User } from '../domain/entities/User.ts';
import { Session } from '../domain/entities/Session.ts';

/**
 * Custom error types for authentication
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class SessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionError';
  }
}

/**
 * Authentication Service
 */
export class AuthService implements IAuthService {
  private userRepository: UserRepository;
  private sessionRepository: SessionRepository;
  private userValidator: UserValidator;
  private loginValidator: LoginValidator;

  constructor(
    userRepository: UserRepository,
    sessionRepository: SessionRepository
  ) {
    this.userRepository = userRepository;
    this.sessionRepository = sessionRepository;
    this.userValidator = new UserValidator();
    this.loginValidator = new LoginValidator();
  }

  /**
   * Authenticate user credentials
   */
  async authenticate(request: LoginRequest): Promise<LoginResponse> {
    try {
      console.log(`[AuthService] Authentication attempt for login: ${request.login}`);
      
      // Validate input
      const validation = this.loginValidator.validate({
        login: request.login,
        password: request.password
      });

      if (!validation.isValid) {
        console.log(`[AuthService] Validation failed: ${validation.errors.join(', ')}`);
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Find user by login
      const user = await this.userRepository.findByLogin(request.login);
      
      if (!user) {
        console.log(`[AuthService] User not found: ${request.login}`);
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      console.log(`[AuthService] User found: ${user.login} (ID: ${user.id})`);

      // In a real application, you would hash and compare passwords
      // For this example, we'll use a simple check
      if (!this.validatePassword(request.password, user)) {
        console.log(`[AuthService] Password validation failed for user: ${user.login}`);
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Create session
      const session = await this.sessionRepository.create({
        userId: user.id,
        user: user,
        ip: request.ip,
        userAgent: request.userAgent,
        isActive: true
      });

      console.log(`[AuthService] User ${user.login} authenticated successfully. Session ID: ${session.id}`);

      return {
        success: true,
        sessionId: session.id,
        user: user
      };
    } catch (error) {
      console.error('Authentication error:', error);
      throw new AuthenticationError(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate a session token
   */
  async validateSession(sessionId: string, ip?: string, userAgent?: string): Promise<User | null> {
    try {
      if (!sessionId) {
        throw new SessionError('Session ID is required');
      }

      // Validate session
      const sessionValidation = await this.sessionRepository.validateSession(sessionId, ip, userAgent);
      
      if (!sessionValidation.valid) {
        throw new SessionError(sessionValidation.error || 'Invalid session');
      }

      if (!sessionValidation.sessionData) {
        throw new SessionError('Session data not found');
      }

      // Get user from session
      const userId = sessionValidation.sessionData.userId;
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new SessionError('User not found for session');
      }

      return user;
    } catch (error) {
      console.error('Session validation error:', error);
      
      if (error instanceof SessionError) {
        throw error;
      }
      
      throw new SessionError(`Session validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Logout user by invalidating session
   */
  async logout(sessionId: string): Promise<boolean> {
    try {
      if (!sessionId) {
        throw new SessionError('Session ID is required');
      }

      // Deactivate session
      const deactivated = await this.sessionRepository.deactivate(sessionId);
      
      if (deactivated) {
        console.log(`Session ${sessionId} deactivated successfully`);
      } else {
        console.warn(`Session ${sessionId} not found or already inactive`);
      }

      return deactivated;
    } catch (error) {
      console.error('Logout error:', error);
      throw new SessionError(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refresh an existing session
   */
  async refreshSession(sessionId: string): Promise<Session | null> {
    try {
      if (!sessionId) {
        throw new SessionError('Session ID is required');
      }

      const session = await this.sessionRepository.findById(sessionId);
      
      if (!session) {
        throw new SessionError('Session not found');
      }

      if (!session.isActive) {
        throw new SessionError('Session is inactive');
      }

      // Extend session expiration
      const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      const updatedSession = await this.sessionRepository.update(sessionId, {
        expiresAt: newExpiresAt
      });

      console.log(`Session ${sessionId} refreshed successfully`);
      return updatedSession;
    } catch (error) {
      console.error('Session refresh error:', error);
      
      if (error instanceof SessionError) {
        throw error;
      }
      
      throw new SessionError(`Session refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    try {
      if (!userId) {
        throw new SessionError('User ID is required');
      }

      const sessions = await this.sessionRepository.findByUserId(userId);
      const activeSessions = sessions.filter(session => session.isActive);
      
      return activeSessions;
    } catch (error) {
      console.error('Get user sessions error:', error);
      throw new SessionError(`Failed to get user sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Logout all sessions for a user
   */
  async logoutAllSessions(userId: string): Promise<number> {
    try {
      if (!userId) {
        throw new SessionError('User ID is required');
      }

      const sessions = await this.sessionRepository.findByUserId(userId);
      const activeSessions = sessions.filter(session => session.isActive);
      
      let deactivatedCount = 0;
      
      for (const session of activeSessions) {
        const deactivated = await this.sessionRepository.deactivate(session.id);
        if (deactivated) {
          deactivatedCount++;
        }
      }

      console.log(`Deactivated ${deactivatedCount} sessions for user ${userId}`);
      return deactivatedCount;
    } catch (error) {
      console.error('Logout all sessions error:', error);
      throw new SessionError(`Failed to logout all sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
   * Validate password (simplified for demonstration)
   * In a real application, you would use proper password hashing
   */
  private validatePassword(password: string, user: User): boolean {
    // This is a simplified check for demonstration
    // In a real application, you would use bcrypt or similar
    return password.length >= 6; // Simple check for demonstration
  }
}