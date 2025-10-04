// backend/session.ts
export const sessions = new Map<string, { userId: number; expires: number }>();

// Periodic cleanup of expired sessions
setInterval(() => {
  const now = Date.now();
  for (const [sid, info] of sessions.entries()) {
    if (info.expires <= now) sessions.delete(sid);
  }
}, 5 * 60 * 1000);

export function generateSessionId(): string {
  return crypto.randomUUID();
}

export function createSession(userId: number, ttlMs = 24 * 60 * 60 * 1000): string {
  const sessionId = generateSessionId();
  sessions.set(sessionId, { userId, expires: Date.now() + ttlMs });
  return sessionId;
}

export function getSessionUserId(req: Request): number | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  
  const sessionId = authHeader.replace('Bearer ', '');
  const session = sessions.get(sessionId);
  
  if (!session || session.expires <= Date.now()) {
    if (session) sessions.delete(sessionId);
    return null;
  }
  
  return session.userId;
}