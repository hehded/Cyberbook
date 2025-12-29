/**
 * Test Configuration
 * Common utilities and mocks for testing
 */

// Mock implementation of SmartShell API for testing
export class MockSmartShellAdapter {
  private hosts = [
    { id: "1", alias: "host1", online: true, in_service: true, ip_addr: "192.168.1.10" },
    { id: "2", alias: "host2", online: false, in_service: false, ip_addr: "192.168.1.11" }
  ];
  
  private bookings = [
    { id: "1", host_id: "1", user_id: "1", start_time: "2023-01-01T10:00:00Z", end_time: "2023-01-01T12:00:00Z" },
    { id: "2", host_id: "2", user_id: "2", start_time: "2023-01-02T14:00:00Z", end_time: "2023-01-02T16:00:00Z" }
  ];
  
  private sessions = [
    { id: "1", host_id: "1", user_id: "1", start_time: "2023-01-01T10:00:00Z", active: true }
  ];
  
  async getHosts() {
    return this.hosts;
  }
  
  async getHostById(id: string) {
    return this.hosts.find(h => h.id === id);
  }
  
  async getBookings() {
    return this.bookings;
  }
  
  async getBookingById(id: string) {
    return this.bookings.find(b => b.id === id);
  }
  
  async getSessions() {
    return this.sessions;
  }
  
  async getSessionById(id: string) {
    return this.sessions.find(s => s.id === id);
  }
  
  async createBooking(booking: any) {
    const newBooking = { ...booking, id: String(this.bookings.length + 1) };
    this.bookings.push(newBooking);
    return newBooking;
  }
  
  async createSession(session: any) {
    const newSession = { ...session, id: String(this.sessions.length + 1) };
    this.sessions.push(newSession);
    return newSession;
  }
  
  async updateSession(id: string, updates: any) {
    const index = this.sessions.findIndex(s => s.id === id);
    if (index !== -1) {
      this.sessions[index] = { ...this.sessions[index], ...updates };
      return this.sessions[index];
    }
    return null;
  }
  
  async deleteSession(id: string) {
    const index = this.sessions.findIndex(s => s.id === id);
    if (index !== -1) {
      return this.sessions.splice(index, 1)[0];
    }
    return null;
  }
}

// Mock implementation of TokenManager for testing
export class MockTokenManager {
  private tokens = new Map<string, { userId: string, expires: number }>();
  
  generateToken(userId: string): string {
    const token = `mock-token-${userId}-${Date.now()}`;
    this.tokens.set(token, { userId, expires: Date.now() + 3600000 }); // 1 hour
    return token;
  }
  
  verifyToken(token: string): { userId: string, valid: boolean } {
    const tokenData = this.tokens.get(token);
    if (!tokenData) {
      return { userId: "", valid: false };
    }
    
    if (Date.now() > tokenData.expires) {
      this.tokens.delete(token);
      return { userId: "", valid: false };
    }
    
    return { userId: tokenData.userId, valid: true };
  }
  
  revokeToken(token: string): boolean {
    return this.tokens.delete(token);
  }
}

// Helper function to create a mock request
export function createMockRequest(method: string, url: string, body?: any): Request {
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json"
    }
  };
  
  if (body) {
    init.body = JSON.stringify(body);
  }
  
  return new Request(url, init);
}

// Helper function to assert response
export function assertResponse(response: Response, expectedStatus: number, expectedData?: any) {
  if (response.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
  }
  
  if (expectedData !== undefined) {
    return response.json().then(data => {
      if (JSON.stringify(data) !== JSON.stringify(expectedData)) {
        throw new Error(`Expected data ${JSON.stringify(expectedData)}, got ${JSON.stringify(data)}`);
      }
    });
  }
  
  return Promise.resolve();
}

// Test data factory
export const TestDataFactory = {
  createHost: (overrides = {}) => ({
    id: 1,
    alias: "test-host",
    online: true,
    in_service: true,
    ip_addr: "192.168.1.100",
    ...overrides
  }),
  
  createBooking: (overrides = {}) => ({
    id: "test-booking-id",
    host_id: "test-host-id",
    user_id: "test-user-id",
    start_time: "2023-01-01T10:00:00Z",
    end_time: "2023-01-01T12:00:00Z",
    ...overrides
  }),
  
  createSession: (overrides = {}) => ({
    id: "test-session-id",
    host_id: "test-host-id",
    user_id: "test-user-id",
    start_time: "2023-01-01T10:00:00Z",
    active: true,
    ...overrides
  }),
  
  createUser: (overrides = {}) => ({
    id: "test-user-id",
    username: "testuser",
    email: "test@example.com",
    ...overrides
  })
};