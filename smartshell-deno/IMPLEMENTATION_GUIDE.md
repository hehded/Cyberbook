# SmartShell Deno - Implementation Guide

## Introduction

This guide provides detailed implementation examples for the refactoring plan. It includes specific code examples for each component, showing how to implement the MVC architecture with proper SOLID principles.

## Part 1: Backend Implementation

### 1.1 Dependency Injection Container

```typescript
// backend/di/Container.ts
export interface ServiceIdentifier<T> {
  token: string;
}

export class DIContainer {
  private services = new Map<string, any>();
  private factories = new Map<string, () => any>();
  private singletons = new Map<string, any>();

  register<T>(identifier: ServiceIdentifier<T>, factory: () => T): void {
    this.factories.set(identifier.token, factory);
  }

  registerSingleton<T>(identifier: ServiceIdentifier<T>, factory: () => T): void {
    this.singletons.set(identifier.token, factory);
  }

  resolve<T>(identifier: ServiceIdentifier<T>): T {
    const token = identifier.token;
    
    // Check if already instantiated (singleton)
    if (this.services.has(token)) {
      return this.services.get(token);
    }

    // Check if singleton factory exists
    if (this.singletons.has(token)) {
      const instance = this.singletons.get(token)();
      this.services.set(token, instance);
      return instance;
    }

    // Check if regular factory exists
    if (this.factories.has(token)) {
      return this.factories.get(token)();
    }

    throw new Error(`Service ${token} not registered`);
  }
}

// Service tokens
export const SERVICE_TOKENS = {
  HOST_REPOSITORY: 'HostRepository',
  BOOKING_REPOSITORY: 'BookingRepository',
  CLIENT_REPOSITORY: 'ClientRepository',
  PAYMENT_REPOSITORY: 'PaymentRepository',
  AUTH_SERVICE: 'AuthService',
  BOOKING_SERVICE: 'BookingService',
  HOST_SERVICE: 'HostService',
  PAYMENT_SERVICE: 'PaymentService',
  ACHIEVEMENT_SERVICE: 'AchievementService',
  LEADERBOARD_SERVICE: 'LeaderboardService',
  TOKEN_MANAGER: 'TokenManager',
  SECURITY_UTILS: 'SecurityUtils',
  SMARTSHELL_ADAPTER: 'SmartShellAdapter',
} as const;
```

### 1.2 Domain Interfaces

```typescript
// backend/domain/interfaces/IRepository.ts
export interface IRepository<T, ID = string | number> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  find(filter: Partial<T>): Promise<T[]>;
  create(entity: Omit<T, 'id'>): Promise<T>;
  update(id: ID, updates: Partial<T>): Promise<T>;
  delete(id: ID): Promise<boolean>;
}

// backend/domain/interfaces/IService.ts
export interface IService<T, ID = string | number> {
  getById(id: ID): Promise<T | null>;
  getAll(): Promise<T[]>;
  create(data: any): Promise<T>;
  update(id: ID, data: any): Promise<T>;
  delete(id: ID): Promise<boolean>;
}

// backend/domain/interfaces/IValidator.ts
export interface IValidator<T> {
  validate(data: T): ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
```

### 1.3 Domain Entities

```typescript
// backend/domain/entities/User.ts
export interface User {
  id: string;
  nickname: string;
  phone: string;
  deposit: number;
  bonus: number;
  login: string;
}

// backend/domain/entities/Host.ts
export interface Host {
  id: number | string;
  alias?: string | null;
  ip_addr?: string | null;
  coord_x?: number | null;
  coord_y?: number | null;
  group?: { id: string; title?: string } | null;
  session?: {
    user: string | null;
    started_at: string | null;
    duration: number | null;
    elapsed: number | null;
    time_left: number | null;
  } | null;
}

// backend/domain/entities/Booking.ts
export interface Booking {
  id: number;
  from: string;
  to: string;
  status: string;
  client?: {
    id: number;
    nickname?: string;
    phone?: string;
  };
  hosts: Array<{ id: number; alias?: string }>;
}

// backend/domain/entities/Payment.ts
export interface Payment {
  id: string;
  created_at: string;
  sum: number;
  bonus: number;
  is_refunded: boolean;
  paymentMethod: string;
  client_id: string;
}
```

### 1.4 Repository Implementation

```typescript
// backend/repositories/HostRepository.ts
import { IRepository } from '../domain/interfaces/IRepository.ts';
import { Host } from '../domain/entities/Host.ts';
import { SmartShellAdapter } from '../infrastructure/SmartShellAdapter.ts';

export class HostRepository implements IRepository<Host, number> {
  constructor(private smartShellAdapter: SmartShellAdapter) {}

  async findById(id: number): Promise<Host | null> {
    const hosts = await this.findAll();
    return hosts.find(host => host.id === id) || null;
  }

  async findAll(): Promise<Host[]> {
    return this.smartShellAdapter.fetchHosts();
  }

  async find(filter: Partial<Host>): Promise<Host[]> {
    const hosts = await this.findAll();
    return hosts.filter(host => {
      return Object.entries(filter).every(([key, value]) => {
        return host[key as keyof Host] === value;
      });
    });
  }

  async create(entity: Omit<Host, 'id'>): Promise<Host> {
    throw new Error('Host creation not supported through API');
  }

  async update(id: number, updates: Partial<Host>): Promise<Host> {
    throw new Error('Host updates not supported through API');
  }

  async delete(id: number): Promise<boolean> {
    throw new Error('Host deletion not supported through API');
  }
}
```

### 1.5 Service Implementation

```typescript
// backend/services/AuthService.ts
import { IService } from '../domain/interfaces/IService.ts';
import { User } from '../domain/entities/User.ts';
import { ClientRepository } from '../repositories/ClientRepository.ts';
import { TokenManager } from '../infrastructure/TokenManager.ts';
import { SecurityUtils } from '../infrastructure/SecurityProvider.ts';
import { ValidationResult } from '../domain/interfaces/IValidator.ts';

export interface LoginRequest {
  login: string;
  password: string;
  ip?: string;
  userAgent?: string;
}

export interface LoginResponse {
  success: boolean;
  sessionId?: string;
  user?: User;
  error?: string;
}

export class AuthService implements IService<User, string> {
  constructor(
    private clientRepository: ClientRepository,
    private tokenManager: TokenManager,
    private securityUtils: SecurityUtils
  ) {}

  async authenticate(request: LoginRequest): Promise<LoginResponse> {
    // Demo user check
    if (request.login === "demo" && request.password === "demo") {
      const demoUser: User = {
        id: "demo",
        nickname: "Demo User",
        phone: "+371 Demo",
        deposit: 15.50,
        bonus: 3.25,
        login: request.login,
      };

      const sessionId = this.tokenManager.createSession(
        "demo",
        demoUser,
        undefined,
        request.ip,
        request.userAgent
      );

      return { success: true, sessionId, user: demoUser };
    }

    // Rate limiting check
    const rateLimitResult = this.securityUtils.loginRateLimiter(request.ip || "unknown");
    if (!rateLimitResult.allowed) {
      return { success: false, error: "Too many login attempts. Try again later." };
    }

    // Input validation
    const sanitizedLogin = this.securityUtils.sanitizeInput(request.login);
    if (!sanitizedLogin || sanitizedLogin !== request.login) {
      return { success: false, error: "Invalid login format" };
    }

    try {
      // Authenticate with SmartShell API
      const clientToken = await this.clientRepository.authenticate(
        sanitizedLogin,
        request.password
      );

      if (!clientToken) {
        return { success: false, error: "Invalid login or password" };
      }

      // Get user data
      const user = await this.clientRepository.findByLogin(sanitizedLogin);
      if (!user) {
        return { success: false, error: "User not found" };
      }

      // Create session
      const sessionId = this.tokenManager.createSession(
        user.id,
        user,
        clientToken,
        request.ip,
        request.userAgent
      );

      return { success: true, sessionId, user };
    } catch (error) {
      console.error("Authentication error:", error);
      return { success: false, error: "Authentication failed" };
    }
  }

  async validateSession(sessionId: string, ip?: string, userAgent?: string): Promise<User | null> {
    const result = this.tokenManager.validateSession(sessionId, ip, userAgent);
    return result.valid ? result.sessionData?.user || null : null;
  }

  async logout(sessionId: string): Promise<boolean> {
    return this.tokenManager.removeSession(sessionId);
  }

  // Implement IService interface
  async getById(id: string): Promise<User | null> {
    return this.clientRepository.findById(id);
  }

  async getAll(): Promise<User[]> {
    return this.clientRepository.findAll();
  }

  async create(data: any): Promise<User> {
    throw new Error('User creation not supported');
  }

  async update(id: string, data: any): Promise<User> {
    throw new Error('User updates not supported');
  }

  async delete(id: string): Promise<boolean> {
    throw new Error('User deletion not supported');
  }
}
```

### 1.6 Controller Implementation

```typescript
// backend/controllers/AuthController.ts
import { Request, Response } from 'https://deno.land/std@0.224.0/http/server.ts';
import { AuthService } from '../services/AuthService.ts';
import { ResponseFactory } from '../factories/ResponseFactory.ts';
import { LoginRequest } from '../services/AuthService.ts';

export class AuthController {
  constructor(private authService: AuthService) {}

  async login(req: Request): Promise<Response> {
    try {
      const loginData: LoginRequest = await req.json();
      const clientIP = req.headers.get("x-forwarded-for") || "unknown";
      const userAgent = req.headers.get("user-agent") || "unknown";

      const result = await this.authService.authenticate({
        ...loginData,
        ip: clientIP,
        userAgent
      });

      if (result.success) {
        return ResponseFactory.success({
          sessionId: result.sessionId,
          user: result.user
        });
      } else {
        return ResponseFactory.error(result.error || "Login failed", 401);
      }
    } catch (error) {
      console.error("Login error:", error);
      return ResponseFactory.error("Internal server error", 500);
    }
  }

  async logout(req: Request): Promise<Response> {
    try {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return ResponseFactory.error("Invalid authorization header", 401);
      }

      const sessionId = authHeader.slice(7);
      const success = await this.authService.logout(sessionId);

      if (success) {
        return ResponseFactory.success({ message: "Logged out successfully" });
      } else {
        return ResponseFactory.error("Logout failed", 400);
      }
    } catch (error) {
      console.error("Logout error:", error);
      return ResponseFactory.error("Internal server error", 500);
    }
  }
}
```

### 1.7 Response Factory

```typescript
// backend/factories/ResponseFactory.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ResponseFactory {
  static success<T>(data: T, message?: string): Response {
    const body: ApiResponse<T> = {
      success: true,
      data,
      message
    };

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: this.getCORSHeaders()
    });
  }

  static error(message: string, status: number = 400): Response {
    const body: ApiResponse<null> = {
      success: false,
      error: message
    };

    return new Response(JSON.stringify(body), {
      status,
      headers: this.getCORSHeaders()
    });
  }

  static validation(errors: string[]): Response {
    const body: ApiResponse<null> = {
      success: false,
      error: "Validation failed",
      message: errors.join(", ")
    };

    return new Response(JSON.stringify(body), {
      status: 400,
      headers: this.getCORSHeaders()
    });
  }

  private static getCORSHeaders(): Headers {
    const headers = new Headers();
    const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";
    headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    headers.set("Content-Type", "application/json");
    return headers;
  }
}
```

### 1.8 Middleware Implementation

```typescript
// backend/middleware/AuthMiddleware.ts
import { Request, Response } from 'https://deno.land/std@0.224.0/http/server.ts';
import { AuthService } from '../services/AuthService.ts';
import { ResponseFactory } from '../factories/ResponseFactory.ts';

export interface AuthenticatedRequest extends Request {
  user?: any;
  sessionId?: string;
}

export function createAuthMiddleware(authService: AuthService) {
  return async (req: Request, next: () => Promise<Response>): Promise<Response> => {
    // Skip auth for login endpoint
    if (req.url.includes('/api/login')) {
      return await next();
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return ResponseFactory.error("Unauthorized", 401);
    }

    const sessionId = authHeader.slice(7);
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const user = await authService.validateSession(sessionId, clientIP, userAgent);
    if (!user) {
      return ResponseFactory.error("Invalid or expired session", 401);
    }

    // Add user to request for downstream handlers
    (req as AuthenticatedRequest).user = user;
    (req as AuthenticatedRequest).sessionId = sessionId;

    return await next();
  };
}
```

### 1.9 SmartShell Adapter

```typescript
// backend/infrastructure/SmartShellAdapter.ts
import { shell } from '../../sdk.ts';
import { Host } from '../domain/entities/Host.ts';
import { Booking } from '../domain/entities/Booking.ts';

export class SmartShellAdapter {
  async fetchHosts(): Promise<Host[]> {
    const query = `
      query {
        hosts {
          id
          alias
          ip_addr
          coord_x
          coord_y
          online
          in_service
          group { id title }
          client_sessions {
            id
            duration
            elapsed
            started_at
            finished_at
            time_left
            status
            client { nickname }
          }
        }
      }
    `;

    try {
      const res: any = await shell.call(query as any);
      if (res?.errors?.length) {
        console.warn("[SmartShellAdapter] GraphQL errors:", res.errors);
        return [];
      }

      const raw = res?.data?.hosts ?? res?.hosts ?? [];
      if (!Array.isArray(raw)) return [];

      return raw.map(this.transformHostData).filter(Boolean) as Host[];
    } catch (error) {
      console.error("[SmartShellAdapter] Error fetching hosts:", error);
      return [];
    }
  }

  async fetchBookings(): Promise<Booking[]> {
    const now = new Date();
    const inWeek = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const formatDate = (date: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };
    
    const query = `
      query {
        getBookings(
          from: "${formatDate(now)}"
          to: "${formatDate(inWeek)}"
          status: "ACTIVE"
        ) {
          data {
            id
            from
            to
            status
            client {
              id
              nickname
              phone
            }
            hosts
          }
        }
      }
    `;

    try {
      const res: any = await shell.call(query as any);
      
      if (res?.errors?.length) {
        console.warn("[SmartShellAdapter] GraphQL errors:", res.errors);
        return [];
      }

      const bookingsData = res?.getBookings?.data ?? [];
      return bookingsData.map(this.transformBookingData);
    } catch (error) {
      console.error("[SmartShellAdapter] Error fetching bookings:", error);
      return [];
    }
  }

  async authenticateClient(login: string, password: string): Promise<string | null> {
    const escapedPassword = password.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    
    const mutation = `
      mutation {
        clientLogin(input: {
          login: "${login}"
          password: "${escapedPassword}"
        }) {
          access_token
          token_type
          expires_in
        }
      }
    `;

    try {
      const result: any = await shell.call(mutation as any);

      if (result?.errors?.length) {
        return null;
      }

      return result?.clientLogin?.access_token || null;
    } catch (error) {
      console.error("[SmartShellAdapter] Authentication error:", error);
      return null;
    }
  }

  private transformHostData(raw: any): Host | null {
    if (!raw || typeof raw !== "object") return null;

    let session = null;
    if (Array.isArray(raw.client_sessions) && raw.client_sessions.length > 0) {
      const active = raw.client_sessions.find((s: any) =>
        s && (!s.finished_at || s.finished_at === null || s.status === "ACTIVE")
      );
      if (active) {
        session = {
          user: active.client?.nickname ?? null,
          started_at: active.started_at ?? null,
          duration: active.duration ?? null,
          elapsed: active.elapsed ?? null,
          time_left: active.time_left ?? null,
        };
      }
    }

    const gx = raw.coord_x != null ? Number(raw.coord_x) : undefined;
    const gy = raw.coord_y != null ? Number(raw.coord_y) : undefined;
    const group = raw.group?.id
      ? { id: String(raw.group.id), title: raw.group.title ?? "" }
      : null;

    return {
      id: raw.id,
      alias: raw.alias ?? null,
      ip_addr: raw.ip_addr ?? null,
      coord_x: Number.isFinite(gx as number) ? gx : undefined,
      coord_y: Number.isFinite(gy as number) ? gy : undefined,
      group,
      session,
    } as Host;
  }

  private transformBookingData(raw: any): Booking {
    const hostIds = Array.isArray(raw.hosts) ? raw.hosts : [raw.hosts];
    
    return {
      id: raw.id,
      from: raw.from,
      to: raw.to,
      status: raw.status,
      client: raw.client,
      hosts: hostIds.map((hostId: number) => ({
        id: hostId,
        alias: `PC ${hostId}`
      }))
    };
  }
}
```

## Part 2: Frontend Implementation

### 2.1 Event Bus

```typescript
// frontend/events/EventBus.ts
export type EventHandler = (data: any) => void;

export class EventBus {
  private listeners = new Map<string, EventHandler[]>();

  on(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

// Global event bus instance
export const eventBus = new EventBus();

// Event types
export const EVENTS = {
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  BOOKING_CREATED: 'booking:created',
  BOOKING_CANCELLED: 'booking:cancelled',
  HOST_SELECTED: 'host:selected',
  HOST_DESELECTED: 'host:deselected',
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  DATA_REFRESH: 'data:refresh',
} as const;
```

### 2.2 API Service

```typescript
// frontend/services/ApiService.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ApiService {
  private baseUrl: string;
  private sessionId: string | null = null;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  clearSessionId(): void {
    this.sessionId = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers || {});

    headers.set('Content-Type', 'application/json');
    headers.set('X-Requested-With', 'XMLHttpRequest');

    if (this.sessionId) {
      headers.set('Authorization', `Bearer ${this.sessionId}`);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Global API service instance
export const apiService = new ApiService();
```

### 2.3 Authentication Service

```typescript
// frontend/services/AuthService.ts
import { apiService } from './ApiService.ts';
import { eventBus, EVENTS } from '../events/EventBus.ts';

export interface User {
  id: string;
  nickname: string;
  phone: string;
  deposit: number;
  bonus: number;
  login: string;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  sessionId?: string;
  user?: User;
  error?: string;
}

export class AuthService {
  private currentUser: User | null = null;
  private sessionId: string | null = null;

  constructor() {
    this.restoreSession();
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>('/api/login', credentials);

    if (response.success && response.data) {
      this.currentUser = response.data.user || null;
      this.sessionId = response.data.sessionId || null;
      
      if (this.sessionId) {
        apiService.setSessionId(this.sessionId);
        this.saveSession();
      }

      eventBus.emit(EVENTS.USER_LOGIN, this.currentUser);
    }

    return response.data || response;
  }

  async logout(): Promise<boolean> {
    if (!this.sessionId) return true;

    const response = await apiService.post('/api/logout', {});
    
    this.clearSession();
    eventBus.emit(EVENTS.USER_LOGOUT);
    
    return response.success;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isLoggedIn(): boolean {
    return !!(this.currentUser && this.sessionId);
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  private saveSession(): void {
    if (this.sessionId && this.currentUser) {
      localStorage.setItem('sessionId', this.sessionId);
      localStorage.setItem('user', JSON.stringify(this.currentUser));
    }
  }

  private restoreSession(): void {
    const sessionId = localStorage.getItem('sessionId');
    const userStr = localStorage.getItem('user');

    if (sessionId && userStr) {
      try {
        this.sessionId = sessionId;
        this.currentUser = JSON.parse(userStr);
        apiService.setSessionId(sessionId);
      } catch (error) {
        console.error('Failed to restore session:', error);
        this.clearSession();
      }
    }
  }

  private clearSession(): void {
    this.currentUser = null;
    this.sessionId = null;
    apiService.clearSessionId();
    localStorage.removeItem('sessionId');
    localStorage.removeItem('user');
  }
}

// Global auth service instance
export const authService = new AuthService();
```

### 2.4 Base Controller

```typescript
// frontend/controllers/BaseController.ts
export abstract class BaseController {
  protected eventBus: EventBus;
  protected elements: Map<string, HTMLElement> = new Map();

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  // Template method for initialization
  init(): void {
    this.cacheElements();
    this.bindEvents();
    this.subscribeToEvents();
    this.render();
  }

  // Cache DOM elements for performance
  protected cacheElements(): void {
    // Override in subclasses
  }

  // Bind DOM event listeners
  protected bindEvents(): void {
    // Override in subclasses
  }

  // Subscribe to application events
  protected subscribeToEvents(): void {
    // Override in subclasses
  }

  // Initial render
  protected render(): void {
    // Override in subclasses
  }

  // Helper method to get cached element
  protected getElement(selector: string): HTMLElement | null {
    return this.elements.get(selector) || null;
  }

  // Helper method to cache element
  protected cacheElement(selector: string): HTMLElement | null {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      this.elements.set(selector, element);
    }
    return element;
  }

  // Clean up resources
  destroy(): void {
    this.elements.clear();
  }
}
```

### 2.5 Authentication Controller

```typescript
// frontend/controllers/AuthController.ts
import { BaseController } from './BaseController.ts';
import { authService, LoginRequest } from '../services/AuthService.ts';
import { eventBus, EVENTS } from '../events/EventBus.ts';
import { ModalController } from './ModalController.ts';

export class AuthController extends BaseController {
  private modalController: ModalController;

  constructor(eventBus: EventBus, modalController: ModalController) {
    super(eventBus);
    this.modalController = modalController;
  }

  protected cacheElements(): void {
    this.cacheElement('#authBtn');
    this.cacheElement('#loginInput');
    this.cacheElement('#passwordInput');
    this.cacheElement('#loginSubmit');
    this.cacheElement('#loginCancel');
    this.cacheElement('#loginError');
    this.cacheElement('#userInfo');
  }

  protected bindEvents(): void {
    const authBtn = this.getElement('#authBtn');
    const loginSubmit = this.getElement('#loginSubmit');
    const loginCancel = this.getElement('#loginCancel');
    const passwordInput = this.getElement('#passwordInput');

    if (authBtn) {
      authBtn.addEventListener('click', () => this.handleAuthClick());
    }

    if (loginSubmit) {
      loginSubmit.addEventListener('click', () => this.handleLogin());
    }

    if (loginCancel) {
      loginCancel.addEventListener('click', () => this.closeLoginModal());
    }

    if (passwordInput) {
      passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleLogin();
      });
    }
  }

  protected subscribeToEvents(): void {
    this.eventBus.on(EVENTS.USER_LOGIN, () => this.updateAuthUI());
    this.eventBus.on(EVENTS.USER_LOGOUT, () => this.updateAuthUI());
  }

  protected render(): void {
    this.updateAuthUI();
  }

  private handleAuthClick(): void {
    if (authService.isLoggedIn()) {
      this.logout();
    } else {
      this.openLoginModal();
    }
  }

  private async handleLogin(): Promise<void> {
    const loginInput = this.getElement('#loginInput') as HTMLInputElement;
    const passwordInput = this.getElement('#passwordInput') as HTMLInputElement;
    const errorElement = this.getElement('#loginError');

    if (!loginInput || !passwordInput) return;

    const login = loginInput.value.trim();
    const password = passwordInput.value;

    if (!login || !password) {
      if (errorElement) {
        errorElement.textContent = 'Please fill in all fields';
      }
      return;
    }

    const credentials: LoginRequest = { login, password };
    const result = await authService.login(credentials);

    if (result.success) {
      this.closeLoginModal();
      this.clearLoginForm();
    } else {
      if (errorElement) {
        errorElement.textContent = result.error || 'Login failed';
      }
    }
  }

  private async logout(): Promise<void> {
    await authService.logout();
  }

  private openLoginModal(): void {
    this.clearLoginForm();
    this.modalController.open('loginScreen');
  }

  private closeLoginModal(): void {
    this.modalController.close('loginScreen');
    this.clearLoginForm();
  }

  private clearLoginForm(): void {
    const loginInput = this.getElement('#loginInput') as HTMLInputElement;
    const passwordInput = this.getElement('#passwordInput') as HTMLInputElement;
    const errorElement = this.getElement('#loginError');

    if (loginInput) loginInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (errorElement) errorElement.textContent = '';
  }

  private updateAuthUI(): void {
    const authBtn = this.getElement('#authBtn');
    const userInfo = this.getElement('#userInfo');

    if (!authBtn || !userInfo) return;

    const user = authService.getCurrentUser();

    if (user) {
      const balance = ((user.deposit || 0) + (user.bonus || 0)).toFixed(2);
      authBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> <span class="hide-mobile">Logout</span>';
      userInfo.innerHTML = `<i class="fas fa-user"></i> ${user.nickname || ''} • <i class="fas fa-wallet" style="font-size:0.75rem;"></i> ${balance}€`;
    } else {
      authBtn.innerHTML = '<i class="fas fa-user-circle"></i> <span class="hide-mobile">Login</span>';
      userInfo.innerHTML = '';
    }
  }
}
```

### 2.6 Modal Controller

```typescript
// frontend/controllers/ModalController.ts
import { BaseController } from './BaseController.ts';
import { eventBus, EVENTS } from '../events/EventBus.ts';

export class ModalController extends BaseController {
  private openModals: Set<string> = new Set();

  protected cacheElements(): void {
    // Cache all modal elements
    document.querySelectorAll('[id$="Modal"]').forEach(modal => {
      this.cacheElement(`#${modal.id}`);
    });
  }

  protected bindEvents(): void {
    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeAll();
      }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAll();
      }
    });
  }

  open(modalId: string): void {
    const modal = this.getElement(`#${modalId}`);
    if (modal) {
      modal.style.display = 'flex';
      this.openModals.add(modalId);
      this.eventBus.emit(EVENTS.MODAL_OPEN, modalId);
    }
  }

  close(modalId: string): void {
    const modal = this.getElement(`#${modalId}`);
    if (modal) {
      modal.style.display = 'none';
      this.openModals.delete(modalId);
      this.eventBus.emit(EVENTS.MODAL_CLOSE, modalId);
    }
  }

  closeAll(): void {
    this.openModals.forEach(modalId => this.close(modalId));
  }

  isOpen(modalId: string): boolean {
    return this.openModals.has(modalId);
  }
}
```

## Part 3: Application Bootstrap

### 3.1 Backend Bootstrap

```typescript
// backend/bootstrap.ts
import { DIContainer, SERVICE_TOKENS } from './di/Container.ts';
import { SmartShellAdapter } from './infrastructure/SmartShellAdapter.ts';
import { TokenManager } from './infrastructure/TokenManager.ts';
import { SecurityProvider } from './infrastructure/SecurityProvider.ts';
import { HostRepository } from './repositories/HostRepository.ts';
import { BookingRepository } from './repositories/BookingRepository.ts';
import { ClientRepository } from './repositories/ClientRepository.ts';
import { AuthService } from './services/AuthService.ts';
import { BookingService } from './services/BookingService.ts';
import { HostService } from './services/HostService.ts';
import { AuthController } from './controllers/AuthController.ts';
import { BookingController } from './controllers/BookingController.ts';
import { HostController } from './controllers/HostController.ts';
import { createAuthMiddleware } from './middleware/AuthMiddleware.ts';
import { createRateLimitMiddleware } from './middleware/RateLimitMiddleware.ts';
import { createCORSMiddleware } from './middleware/CORSMiddleware.ts';
import { createErrorHandlingMiddleware } from './middleware/ErrorHandlingMiddleware.ts';

export function bootstrapContainer(): DIContainer {
  const container = new DIContainer();

  // Infrastructure
  container.registerSingleton(
    { token: SERVICE_TOKENS.SMARTSHELL_ADAPTER },
    () => new SmartShellAdapter()
  );

  container.registerSingleton(
    { token: SERVICE_TOKENS.TOKEN_MANAGER },
    () => new TokenManager()
  );

  container.registerSingleton(
    { token: SERVICE_TOKENS.SECURITY_UTILS },
    () => new SecurityProvider()
  );

  // Repositories
  container.register(
    { token: SERVICE_TOKENS.HOST_REPOSITORY },
    () => new HostRepository(container.resolve({ token: SERVICE_TOKENS.SMARTSHELL_ADAPTER }))
  );

  container.register(
    { token: SERVICE_TOKENS.BOOKING_REPOSITORY },
    () => new BookingRepository(container.resolve({ token: SERVICE_TOKENS.SMARTSHELL_ADAPTER }))
  );

  container.register(
    { token: SERVICE_TOKENS.CLIENT_REPOSITORY },
    () => new ClientRepository(container.resolve({ token: SERVICE_TOKENS.SMARTSHELL_ADAPTER }))
  );

  // Services
  container.register(
    { token: SERVICE_TOKENS.AUTH_SERVICE },
    () => new AuthService(
      container.resolve({ token: SERVICE_TOKENS.CLIENT_REPOSITORY }),
      container.resolve({ token: SERVICE_TOKENS.TOKEN_MANAGER }),
      container.resolve({ token: SERVICE_TOKENS.SECURITY_UTILS })
    )
  );

  container.register(
    { token: SERVICE_TOKENS.BOOKING_SERVICE },
    () => new BookingService(
      container.resolve({ token: SERVICE_TOKENS.BOOKING_REPOSITORY }),
      container.resolve({ token: SERVICE_TOKENS.HOST_REPOSITORY })
    )
  );

  container.register(
    { token: SERVICE_TOKENS.HOST_SERVICE },
    () => new HostService(
      container.resolve({ token: SERVICE_TOKENS.HOST_REPOSITORY })
    )
  );

  // Controllers
  container.register(
    { token: SERVICE_TOKENS.AUTH_CONTROLLER },
    () => new AuthController(container.resolve({ token: SERVICE_TOKENS.AUTH_SERVICE }))
  );

  container.register(
    { token: SERVICE_TOKENS.BOOKING_CONTROLLER },
    () => new BookingController(container.resolve({ token: SERVICE_TOKENS.BOOKING_SERVICE }))
  );

  container.register(
    { token: SERVICE_TOKENS.HOST_CONTROLLER },
    () => new HostController(container.resolve({ token: SERVICE_TOKENS.HOST_SERVICE }))
  );

  return container;
}

export function setupMiddleware(container: DIContainer) {
  const authMiddleware = createAuthMiddleware(
    container.resolve({ token: SERVICE_TOKENS.AUTH_SERVICE })
  );

  const rateLimitMiddleware = createRateLimitMiddleware();
  const corsMiddleware = createCORSMiddleware();
  const errorHandlingMiddleware = createErrorHandlingMiddleware();

  return {
    authMiddleware,
    rateLimitMiddleware,
    corsMiddleware,
    errorHandlingMiddleware
  };
}
```

### 3.2 Frontend Bootstrap

```typescript
// frontend/bootstrap.ts
import { eventBus } from './events/EventBus.ts';
import { apiService } from './services/ApiService.ts';
import { authService } from './services/AuthService.ts';
import { ModalController } from './controllers/ModalController.ts';
import { AuthController } from './controllers/AuthController.ts';
import { BookingController } from './controllers/BookingController.ts';
import { HostController } from './controllers/HostController.ts';
import { MapController } from './controllers/MapController.ts';

export function bootstrapApplication(): void {
  // Initialize services
  apiService.setSessionId(authService.getSessionId() || '');

  // Initialize controllers
  const modalController = new ModalController(eventBus);
  const authController = new AuthController(eventBus, modalController);
  const bookingController = new BookingController(eventBus, modalController);
  const hostController = new HostController(eventBus);
  const mapController = new MapController(eventBus, modalController);

  // Initialize controllers
  modalController.init();
  authController.init();
  bookingController.init();
  hostController.init();
  mapController.init();

  // Setup global error handling
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });

  console.log('Application initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApplication);
} else {
  bootstrapApplication();
}
```

## Part 4: Testing Strategy

### 4.1 Unit Testing Example

```typescript
// tests/unit/services/AuthService.test.ts
import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/testing/asserts.ts';
import { AuthService } from '../../../backend/services/AuthService.ts';
import { User } from '../../../backend/domain/entities/User.ts';

// Mock dependencies
class MockClientRepository {
  async authenticate(login: string, password: string): Promise<string | null> {
    if (login === 'test' && password === 'password') {
      return 'mock-token';
    }
    return null;
  }

  async findByLogin(login: string): Promise<User | null> {
    if (login === 'test') {
      return {
        id: '1',
        nickname: 'Test User',
        phone: '+37112345678',
        deposit: 10,
        bonus: 5,
        login: 'test'
      };
    }
    return null;
  }
}

class MockTokenManager {
  createSession(userId: string, user: User, clientToken?: string, ip?: string, userAgent?: string): string {
    return 'mock-session-id';
  }

  validateSession(sessionId: string, ip?: string, userAgent?: string): any {
    return { valid: true };
  }

  removeSession(sessionId: string): boolean {
    return true;
  }
}

class MockSecurityUtils {
  sanitizeInput(input: string): string {
    return input;
  }

  loginRateLimiter(ip: string): { allowed: boolean; resetIn?: number } {
    return { allowed: true };
  }
}

Deno.test('AuthService - successful authentication', async () => {
  const mockClientRepo = new MockClientRepository();
  const mockTokenManager = new MockTokenManager();
  const mockSecurityUtils = new MockSecurityUtils();

  const authService = new AuthService(
    mockClientRepo as any,
    mockTokenManager as any,
    mockSecurityUtils as any
  );

  const result = await authService.authenticate({
    login: 'test',
    password: 'password'
  });

  assertEquals(result.success, true);
  assertExists(result.sessionId);
  assertExists(result.user);
  assertEquals(result.user?.login, 'test');
});

Deno.test('AuthService - failed authentication', async () => {
  const mockClientRepo = new MockClientRepository();
  const mockTokenManager = new MockTokenManager();
  const mockSecurityUtils = new MockSecurityUtils();

  const authService = new AuthService(
    mockClientRepo as any,
    mockTokenManager as any,
    mockSecurityUtils as any
  );

  const result = await authService.authenticate({
    login: 'test',
    password: 'wrong'
  });

  assertEquals(result.success, false);
  assertEquals(result.error, 'Invalid login or password');
});
```

## Conclusion

This implementation guide provides concrete examples of how to implement the refactored architecture. Each component follows SOLID principles and implements appropriate design patterns. The dependency injection container enables loose coupling and testability, while the clear separation of concerns makes the codebase more maintainable and scalable.

The next step would be to implement these components following the outlined phases, ensuring that each phase is thoroughly tested before moving to the next one.