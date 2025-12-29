/**
 * API Service layer for frontend-backend communication
 * Implements proper error handling and request/response processing
 */

import { eventBus, EVENTS } from '../events/EventBus.ts';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Base API service with common functionality
 */
export class ApiService {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };
  }

  /**
   * Get authentication token from localStorage
   */
  private getAuthToken(): string | null {
    const token = localStorage.getItem('sessionId');
    console.log(`[ApiService] getAuthToken - Token ${token ? 'found' : 'not found'} in localStorage`);
    return token;
  }

  /**
   * Prepare request headers
   */
  private prepareHeaders(options?: RequestOptions): Record<string, string> {
    const headers = { ...this.defaultHeaders };

    // Add auth token if not skipped
    if (!options?.skipAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log(`[ApiService] prepareHeaders - Adding Authorization header`);
      } else {
        console.log(`[ApiService] prepareHeaders - No token available, skipping Authorization header`);
      }
    } else {
      console.log(`[ApiService] prepareHeaders - skipAuth is true, skipping Authorization header`);
    }

    // Merge with additional headers
    if (options?.headers) {
      Object.assign(headers, options.headers as Record<string, string>);
    }

    return headers;
  }

  /**
   * Handle API errors
   */
  private async handleErrors(response: Response, options?: RequestOptions): Promise<void> {
    if (response.ok) return;

    // Handle authentication errors
    if (response.status === 401) {
      eventBus.publish(EVENTS.SESSION_EXPIRED, { status: response.status });
      localStorage.removeItem('sessionId');
      localStorage.removeItem('user');
      
      if (!options?.skipErrorHandling) {
        eventBus.publish(EVENTS.MODAL_OPEN, { 
          type: 'login',
          message: 'Session expired. Please login again.' 
        });
      }
      return;
    }

    // Handle other HTTP errors
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
      // If parsing fails, use status text
      errorMessage = response.statusText || errorMessage;
    }

    if (!options?.skipErrorHandling) {
      eventBus.publish(EVENTS.ERROR_OCCURRED, { 
        message: errorMessage,
        status: response.status 
      });
    }

    throw new Error(errorMessage);
  }

  /**
   * Make HTTP request with proper error handling
   */
  private async request<T>(
    endpoint: string,
    options?: RequestOptions
  ): Promise<T> {
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${this.baseUrl}${endpoint}`;

    const headers = this.prepareHeaders(options);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      await this.handleErrors(response, options);

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return response.text() as unknown as T;
    } catch (error) {
      if (error instanceof Error) {
        eventBus.publish(EVENTS.NETWORK_ERROR, { 
          message: error.message,
          endpoint 
        });
      }
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { 
      ...options, 
      method: 'GET' 
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string, 
    data?: any, 
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string, 
    data?: any, 
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { 
      ...options, 
      method: 'DELETE' 
    });
  }

  /**
   * Upload file
   */
  async upload<T>(
    endpoint: string, 
    file: File, 
    additionalData?: Record<string, any>,
    options?: RequestOptions
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const headers = this.prepareHeaders(options);
    // Remove content-type to let browser set it with boundary
    delete headers['Content-Type'];

    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      headers,
    });
  }
}

// Create singleton instance
export const apiService = new ApiService();

/**
 * Specialized API services
 */
export class AuthApiService extends ApiService {
  async login(credentials: { login: string; password: string }) {
    return this.post<ApiResponse>('/api/login', credentials, { skipAuth: true });
  }

  async logout() {
    return this.post<ApiResponse>('/api/logout');
  }
}

export class HostApiService extends ApiService {
  async getHosts() {
    return this.get<any[]>('/api/hosts', { cache: 'no-store' });
  }

  async getHost(id: number) {
    return this.get<any>(`/api/hosts/${id}`);
  }
}

export class BookingApiService extends ApiService {
  async getBookings() {
    return this.get<any[]>('/api/bookings', { cache: 'no-store' });
  }

  async createBooking(bookingData: any) {
    return this.post<ApiResponse>('/api/bookings', bookingData);
  }

  async cancelBooking(id: number) {
    return this.delete<ApiResponse>(`/api/bookings/${id}`);
  }
}

export class GameApiService extends ApiService {
  async getGames() {
    return this.get<any[]>('/api/shortcuts', { cache: 'no-store' });
  }
}

export class AchievementApiService extends ApiService {
  async getAchievements() {
    return this.get<any[]>('/api/achievements');
  }
}

export class PaymentApiService extends ApiService {
  async getPayments() {
    return this.get<any>('/api/payments');
  }
}

export class LeaderboardApiService extends ApiService {
  async getLeaderboard() {
    return this.get<any>('/api/leaderboard', { cache: 'no-store' });
  }
}

// Export service instances
export const authApi = new AuthApiService();
export const hostApi = new HostApiService();
export const bookingApi = new BookingApiService();
export const gameApi = new GameApiService();
export const achievementApi = new AchievementApiService();
export const paymentApi = new PaymentApiService();
export const leaderboardApi = new LeaderboardApiService();