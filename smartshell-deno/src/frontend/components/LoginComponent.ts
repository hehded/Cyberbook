/**
 * Login Component for user authentication
 * Handles login form and authentication logic
 */

import { BaseComponent, ComponentConfig } from './BaseComponent.ts';
import { stateStore, State } from '../state/StateStore.ts';
import { eventBus, EVENTS } from '../events/EventBus.ts';
import { authApi } from '../services/ApiService.ts';

export interface LoginCredentials {
  login: string;
  password: string;
}

export class LoginComponent extends BaseComponent {
  private form: HTMLFormElement | null = null;
  private loginInput: HTMLInputElement | null = null;
  private passwordInput: HTMLInputElement | null = null;
  private submitBtn: HTMLButtonElement | null = null;
  private errorElement: HTMLElement | null = null;

  constructor(config: ComponentConfig = {}) {
    super({
      element: config.element || '#loginModal',
      template: config.template || `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Login to Your Account</h3>
            <button class="close-btn" id="closeLoginModal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="error-message" id="loginError"></div>
            <form id="loginForm">
              <div class="form-group">
                <label for="loginInput">Username or Email</label>
                <input type="text" id="loginInput" required>
              </div>
              <div class="form-group">
                <label for="passwordInput">Password</label>
                <input type="password" id="passwordInput" required>
              </div>
              <button type="submit" id="loginSubmitBtn" class="btn btn-primary">Login</button>
            </form>
          </div>
        </div>
      `,
      styles: config.styles || `
        .modal-content {
          background: var(--card-bg);
          border-radius: 8px;
          padding: 20px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border);
        }
        .modal-header h3 {
          margin: 0;
          color: var(--text);
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-secondary);
        }
        .form-group {
          margin-bottom: 15px;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
          color: var(--text);
        }
        .form-group input {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--border);
          border-radius: 4px;
          background: var(--input-bg);
          color: var(--text);
        }
        .btn {
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        .btn-primary {
          background: var(--primary);
          color: white;
        }
        .btn-primary:hover {
          background: var(--primary-dark);
        }
        .error-message {
          color: var(--danger);
          margin-bottom: 15px;
          padding: 10px;
          border-radius: 4px;
          background: rgba(220, 53, 69, 0.1);
          display: none;
        }
      `,
      props: config.props || {}
    });
  }

  /**
   * Initialize component
   */
  protected override onInit(): void {
    this.initializeElements();
    this.bindEvents();
    this.subscribeToEvents();
  }

  /**
   * Initialize DOM elements
   */
  private initializeElements(): void {
    this.form = this.findElement('#loginForm') as HTMLFormElement;
    this.loginInput = this.findElement('#loginInput') as HTMLInputElement;
    this.passwordInput = this.findElement('#passwordInput') as HTMLInputElement;
    this.submitBtn = this.findElement('#loginSubmitBtn') as HTMLButtonElement;
    this.errorElement = this.findElement('#loginError') as HTMLElement;
    const closeBtn = this.findElement('#closeLoginModal') as HTMLButtonElement;

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide();
      });
    }
  }

  /**
   * Bind DOM events
   */
  protected override bindEvents(): void {
    if (this.form) {
      this.form.addEventListener('submit', (e: Event) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Clear error on input
    if (this.loginInput) {
      this.loginInput.addEventListener('input', () => {
        this.clearError();
      });
    }

    if (this.passwordInput) {
      this.passwordInput.addEventListener('input', () => {
        this.clearError();
      });
    }
  }

  /**
   * Subscribe to event bus
   */
  protected override subscribeToEvents(): void {
    // Subscribe to modal open events
    this.subscribeToEvent(EVENTS.MODAL_OPEN, (data: { type: string; message?: string }) => {
      if (data.type === 'login') {
        this.show();
        if (data.message) {
          this.showError(data.message);
        }
      }
    });

    // Subscribe to modal close events
    this.subscribeToEvent(EVENTS.MODAL_CLOSE, (data: { type: string }) => {
      if (data.type === 'login') {
        this.hide();
      }
    });

    // Subscribe to authentication events
    this.subscribeToEvent(EVENTS.USER_LOGIN, () => {
      this.hide();
      this.resetForm();
    });

    this.subscribeToEvent(EVENTS.SESSION_EXPIRED, (data: { message?: string }) => {
      this.show();
      if (data.message) {
        this.showError(data.message);
      }
    });
  }

  /**
   * Handle login form submission
   */
  private async handleLogin(): Promise<void> {
    if (!this.loginInput || !this.passwordInput || !this.submitBtn) return;

    const credentials: LoginCredentials = {
      login: this.loginInput.value.trim(),
      password: this.passwordInput.value
    };

    if (!credentials.login || !credentials.password) {
      this.showError('Please enter both username and password');
      return;
    }

    // Show loading state
    this.setLoading(true);
    this.clearError();

    try {
      const response = await authApi.login(credentials);
      
      if (response.success && response.data) {
        // Store session data
        localStorage.setItem('sessionId', response.data.sessionId);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Update state
        this.setStateSlice('auth', {
          isAuthenticated: true,
          sessionId: response.data.sessionId,
          user: response.data.user
        });

        // Publish login event
        this.publishEvent(EVENTS.USER_LOGIN, response.data.user);
      } else {
        this.showError(response.error || 'Login failed');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Set loading state
   */
  private setLoading(isLoading: boolean): void {
    if (!this.submitBtn) return;

    if (isLoading) {
      this.submitBtn.disabled = true;
      this.submitBtn.textContent = 'Logging in...';
    } else {
      this.submitBtn.disabled = false;
      this.submitBtn.textContent = 'Login';
    }
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    if (!this.errorElement) return;

    this.errorElement.textContent = message;
    this.errorElement.style.display = 'block';
  }

  /**
   * Clear error message
   */
  private clearError(): void {
    if (!this.errorElement) return;

    this.errorElement.textContent = '';
    this.errorElement.style.display = 'none';
  }

  /**
   * Reset form
   */
  private resetForm(): void {
    if (this.loginInput) this.loginInput.value = '';
    if (this.passwordInput) this.passwordInput.value = '';
    this.clearError();
  }

  /**
   * Show component
   */
  public override show(): void {
    this.element.style.display = 'flex';
    this.resetForm();
    if (this.loginInput) {
      this.loginInput.focus();
    }
  }

  /**
   * Hide component
   */
  public override hide(): void {
    this.element.style.display = 'none';
    this.resetForm();
  }
}