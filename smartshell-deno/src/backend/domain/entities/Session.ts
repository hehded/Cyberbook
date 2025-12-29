/**
 * Session Entity
 * Represents a user session in the system
 * Follows Domain-Driven Design principles
 */
export interface Session {
  id: string;
  userId: string;
  user?: any;
  clientToken?: string;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

/**
 * Session creation data (without ID and timestamps)
 */
export type CreateSessionRequest = Omit<Session, 'id' | 'createdAt' | 'expiresAt'>;

/**
 * Session validation result
 */
export interface SessionValidationResult {
  valid: boolean;
  sessionData?: Session;
  error?: string;
}

/**
 * Session metadata
 */
export interface SessionMetadata {
  ip?: string;
  userAgent?: string;
  lastActivity: Date;
}