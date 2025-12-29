/**
 * Main Application Module
 * Initializes and coordinates all frontend components
 */

import { eventBus, EVENTS } from '../events/EventBus.ts';
import { stateStore, State, selectors } from '../state/StateStore.ts';
import { BaseComponent } from '../components/BaseComponent.ts';
import { hostApi, bookingApi, gameApi, achievementApi, paymentApi, leaderboardApi } from '../services/ApiService.ts';

// Import components
import { MapComponent } from './MapComponent.ts';
import {
  LoginComponent,
  BookingComponent,
  HostComponent,
  PaymentComponent,
  ProfileComponent,
  ModalComponent
} from '../components/index.ts';

/**
 * Main Application Class
 */
export class App {
  private components: BaseComponent[] = [];
  private isInitialized = false;

  constructor() {
    this.init();
  }

  /**
   * Initialize application
   */
  private async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Restore session from localStorage
      this.restoreSession();

      // Initialize event listeners
      this.setupEventListeners();

      // Load initial data
      await this.loadInitialData();

      // Setup auto-refresh
      this.setupAutoRefresh();

      this.isInitialized = true;
      console.log('App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.handleError(error);
    }
  }

  /**
   * Restore user session from localStorage
   */
  private restoreSession(): void {
    const sessionId = localStorage.getItem('sessionId');
    const userStr = localStorage.getItem('user');
    
    if (sessionId && userStr) {
      try {
        const user = JSON.parse(userStr);
        stateStore.setStateSlice('auth', {
          isAuthenticated: true,
          sessionId,
          user
        });

        // Update UI
        this.updateUserInfo(user);
        eventBus.publish(EVENTS.USER_LOGIN, user);
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem('sessionId');
        localStorage.removeItem('user');
      }
    }
  }

  /**
   * Setup global event listeners
   */
  private setupEventListeners(): void {
    // Authentication events
    eventBus.subscribe(EVENTS.USER_LOGIN, (user) => {
      this.updateUserInfo(user);
    });

    eventBus.subscribe(EVENTS.USER_LOGOUT, () => {
      this.clearUserInfo();
    });

    eventBus.subscribe(EVENTS.SESSION_EXPIRED, () => {
      this.clearUserInfo();
      eventBus.publish(EVENTS.MODAL_OPEN, { 
        type: 'login',
        message: 'Session expired. Please login again.' 
      });
    });

    // Error events
    eventBus.subscribe(EVENTS.ERROR_OCCURRED, (data: { message: string }) => {
      this.showError(data.message);
    });

    eventBus.subscribe(EVENTS.NETWORK_ERROR, (data: { message: string }) => {
      this.showError(`Network error: ${data.message}`);
    });

    // Modal events - now handled by ModalComponent
    // These are kept for backward compatibility with existing code
    eventBus.subscribe(EVENTS.MODAL_OPEN, (data: { type: string; message?: string }) => {
      this.openModal(data.type, data.message);
    });

    eventBus.subscribe(EVENTS.MODAL_CLOSE, (data: { type: string }) => {
      this.closeModal(data.type);
    });

    // Window events
    window.addEventListener('resize', () => {
      this.handleResize();
    });

    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  /**
   * Load initial data
   */
  private async loadInitialData(): Promise<void> {
    try {
      // Set loading states
      stateStore.setStateSlice('ui', {
        ...stateStore.getStateSlice('ui'),
        loading: {
          ...stateStore.getStateSlice('ui').loading,
          hosts: true,
          bookings: true,
          games: false,
          achievements: false,
          payments: false,
          leaderboard: false,
        }
      });

      // Load data in parallel
      const [hosts, bookings] = await Promise.all([
        hostApi.getHosts(),
        bookingApi.getBookings()
      ]);

      // Update state with loaded data
      stateStore.setState({
        hosts,
        bookings
      });

      // Update loading states
      stateStore.setStateSlice('ui', {
        ...stateStore.getStateSlice('ui'),
        loading: {
          ...stateStore.getStateSlice('ui').loading,
          hosts: false,
          bookings: false
        }
      });

      // Load user-specific data if authenticated
      if (stateStore.getStateSlice('auth').isAuthenticated) {
        await this.loadUserData();
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      this.handleError(error);
    }
  }

  /**
   * Load user-specific data
   */
  private async loadUserData(): Promise<void> {
    try {
      // Set loading states
      stateStore.setStateSlice('ui', {
        ...stateStore.getStateSlice('ui'),
        loading: {
          ...stateStore.getStateSlice('ui').loading,
          achievements: true,
          payments: true
        }
      });

      // Load data in parallel
      const [achievements, payments] = await Promise.all([
        achievementApi.getAchievements(),
        paymentApi.getPayments()
      ]);

      // Update state
      stateStore.setState({
        achievements,
        payments
      });

      // Update loading states
      stateStore.setStateSlice('ui', {
        ...stateStore.getStateSlice('ui'),
        loading: {
          ...stateStore.getStateSlice('ui').loading,
          achievements: false,
          payments: false
        }
      });
    } catch (error) {
      console.error('Failed to load user data:', error);
      this.handleError(error);
    }
  }

  /**
   * Setup auto-refresh intervals
   */
  private setupAutoRefresh(): void {
    // Refresh data every 30 seconds
    setInterval(async () => {
      try {
        const [hosts, bookings] = await Promise.all([
          hostApi.getHosts(),
          bookingApi.getBookings()
        ]);

        stateStore.setState({
          hosts,
          bookings
        });
      } catch (error) {
        console.error('Failed to refresh data:', error);
      }
    }, 30000);
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    // Trigger map redraw
    eventBus.publish(EVENTS.GROUP_FILTER_CHANGED, 
      stateStore.getStateSlice('ui').selectedGroup
    );
  }

  /**
   * Update user info in UI
   */
  private updateUserInfo(user: any): void {
    const userInfoEl = document.getElementById('userInfo');
    const authBtnEl = document.getElementById('authBtn');
    
    if (userInfoEl && user) {
      const balance = ((user.deposit || 0) + (user.bonus || 0)).toFixed(2);
      userInfoEl.innerHTML = `<i class="fas fa-user"></i> ${user.nickname || ''} • <i class="fas fa-wallet" style="font-size:0.75rem;"></i> ${balance}€`;
    }
    
    if (authBtnEl) {
      authBtnEl.innerHTML = '<i class="fas fa-sign-out-alt"></i> <span class="hide-mobile">Logout</span>';
    }
  }

  /**
   * Clear user info from UI
   */
  private clearUserInfo(): void {
    const userInfoEl = document.getElementById('userInfo');
    const authBtnEl = document.getElementById('authBtn');
    
    if (userInfoEl) {
      userInfoEl.innerHTML = '';
    }
    
    if (authBtnEl) {
      authBtnEl.innerHTML = '<i class="fas fa-user-circle"></i> <span class="hide-mobile">Login</span>';
    }
  }

  /**
   * Open modal
   */
  private openModal(type: string, message?: string): void {
    const modalEl = document.getElementById(`${type}Modal`) || 
                   document.getElementById(type);
    
    if (modalEl) {
      modalEl.style.display = 'flex';
      
      // Set message if provided
      if (message && type === 'login') {
        const errorEl = document.getElementById('loginError');
        if (errorEl) {
          errorEl.textContent = message;
        }
      }
    }
  }

  /**
   * Close modal
   */
  private closeModal(type: string): void {
    const modalEl = document.getElementById(`${type}Modal`) || 
                   document.getElementById(type);
    
    if (modalEl) {
      modalEl.style.display = 'none';
    }
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    eventBus.publish(EVENTS.TOAST_SHOW, {
      type: 'error',
      message
    });
  }

  /**
   * Handle errors
   */
  private handleError(error: any): void {
    console.error('App error:', error);
    this.showError(error.message || 'An error occurred');
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    // Destroy components
    this.components.forEach(component => {
      if (component && typeof component.destroy === 'function') {
        component.destroy();
      }
    });
    this.components = [];
  }

  /**
   * Get current state
   */
  public getState(): State {
    return stateStore.getState();
  }

  /**
   * Add component to app
   */
  public addComponent(component: BaseComponent): void {
    this.components.push(component);
  }

  /**
   * Remove component from app
   */
  public removeComponent(component: BaseComponent): void {
    const index = this.components.indexOf(component);
    if (index > -1) {
      this.components.splice(index, 1);
      component.destroy();
    }
  }
}

// Create and export singleton instance
export const app = new App();