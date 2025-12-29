/**
 * Profile Component for displaying user profile information
 * Handles user profile display and editing
 */

import { BaseComponent, ComponentConfig } from './BaseComponent.ts';
import { stateStore, State } from '../state/StateStore.ts';
import { eventBus, EVENTS } from '../events/EventBus.ts';
import { authApi } from '../services/ApiService.ts';

export interface ProfileData {
  id: number;
  nickname: string;
  email?: string;
  deposit: number;
  bonus: number;
  created_at?: string;
  last_login?: string;
}

export class ProfileComponent extends BaseComponent {
  private form: HTMLFormElement | null = null;
  private nicknameInput: HTMLInputElement | null = null;
  private emailInput: HTMLInputElement | null = null;
  private currentPasswordInput: HTMLInputElement | null = null;
  private newPasswordInput: HTMLInputElement | null = null;
  private confirmPasswordInput: HTMLInputElement | null = null;
  private submitBtn: HTMLButtonElement | null = null;
  private profileInfo: HTMLElement | null = null;
  private errorElement: HTMLElement | null = null;
  private successElement: HTMLElement | null = null;

  constructor(config: ComponentConfig = {}) {
    super({
      element: config.element || '#profileModal',
      template: config.template || `
        <div class="modal-content">
          <div class="modal-header">
            <h3>User Profile</h3>
            <button class="close-btn" id="closeProfileModal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="error-message" id="profileError"></div>
            <div class="success-message" id="profileSuccess"></div>
            
            <div class="tabs">
              <button class="tab-btn active" data-tab="view">View Profile</button>
              <button class="tab-btn" data-tab="edit">Edit Profile</button>
              <button class="tab-btn" data-tab="password">Change Password</button>
            </div>
            
            <div class="tab-content" id="viewTab">
              <div id="profileInfo">
                <!-- Profile info will be populated here -->
              </div>
            </div>
            
            <div class="tab-content" id="editTab" style="display: none;">
              <form id="editProfileForm">
                <div class="form-group">
                  <label for="nicknameInput">Nickname</label>
                  <input type="text" id="nicknameInput" required>
                </div>
                <div class="form-group">
                  <label for="emailInput">Email</label>
                  <input type="email" id="emailInput">
                </div>
                <button type="submit" class="btn btn-primary">Save Changes</button>
              </form>
            </div>
            
            <div class="tab-content" id="passwordTab" style="display: none;">
              <form id="changePasswordForm">
                <div class="form-group">
                  <label for="currentPasswordInput">Current Password</label>
                  <input type="password" id="currentPasswordInput" required>
                </div>
                <div class="form-group">
                  <label for="newPasswordInput">New Password</label>
                  <input type="password" id="newPasswordInput" required>
                </div>
                <div class="form-group">
                  <label for="confirmPasswordInput">Confirm New Password</label>
                  <input type="password" id="confirmPasswordInput" required>
                </div>
                <button type="submit" class="btn btn-primary">Change Password</button>
              </form>
            </div>
          </div>
        </div>
      `,
      styles: config.styles || `
        .modal-content {
          background: var(--card-bg);
          border-radius: 8px;
          padding: 20px;
          max-width: 600px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
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
        .tabs {
          display: flex;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }
        .tab-btn {
          background: none;
          border: none;
          padding: 10px 15px;
          cursor: pointer;
          color: var(--text-secondary);
          border-bottom: 2px solid transparent;
        }
        .tab-btn.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }
        .tab-content {
          margin-bottom: 20px;
        }
        .error-message {
          color: var(--danger);
          margin-bottom: 15px;
          padding: 10px;
          border-radius: 4px;
          background: rgba(220, 53, 69, 0.1);
          display: none;
        }
        .success-message {
          color: var(--success);
          margin-bottom: 15px;
          padding: 10px;
          border-radius: 4px;
          background: rgba(40, 167, 69, 0.1);
          display: none;
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
        .profile-info {
          background: var(--input-bg);
          padding: 15px;
          border-radius: 4px;
        }
        .profile-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid var(--border);
        }
        .profile-row:last-child {
          border-bottom: none;
        }
        .profile-label {
          font-weight: 600;
          color: var(--text);
        }
        .profile-value {
          color: var(--text-secondary);
        }
        .balance-amount {
          font-weight: 700;
          color: var(--primary);
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
    this.loadProfile();
  }

  /**
   * Initialize DOM elements
   */
  private initializeElements(): void {
    this.profileInfo = this.findElement('#profileInfo');
    this.errorElement = this.findElement('#profileError');
    this.successElement = this.findElement('#profileSuccess');
    
    // Edit profile form
    const editForm = this.findElement('#editProfileForm') as HTMLFormElement;
    this.nicknameInput = this.findElement('#nicknameInput') as HTMLInputElement;
    this.emailInput = this.findElement('#emailInput') as HTMLInputElement;
    
    // Change password form
    const passwordForm = this.findElement('#changePasswordForm') as HTMLFormElement;
    this.currentPasswordInput = this.findElement('#currentPasswordInput') as HTMLInputElement;
    this.newPasswordInput = this.findElement('#newPasswordInput') as HTMLInputElement;
    this.confirmPasswordInput = this.findElement('#confirmPasswordInput') as HTMLInputElement;
    
    const closeBtn = this.findElement('#closeProfileModal') as HTMLButtonElement;

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide();
      });
    }

    if (editForm) {
      editForm.addEventListener('submit', (e: Event) => {
        e.preventDefault();
        this.handleProfileUpdate();
      });
    }

    if (passwordForm) {
      passwordForm.addEventListener('submit', (e: Event) => {
        e.preventDefault();
        this.handlePasswordChange();
      });
    }
  }

  /**
   * Bind DOM events
   */
  protected override bindEvents(): void {
    // Tab switching
    const tabBtns = this.findElements('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.getAttribute('data-tab') || 'view');
      });
    });
  }

  /**
   * Subscribe to event bus
   */
  protected override subscribeToEvents(): void {
    // Subscribe to modal open events
    this.subscribeToEvent(EVENTS.MODAL_OPEN, (data: { type: string; message?: string }) => {
      if (data.type === 'profile') {
        this.show();
        this.loadProfile();
      }
    });

    // Subscribe to modal close events
    this.subscribeToEvent(EVENTS.MODAL_CLOSE, (data: { type: string }) => {
      if (data.type === 'profile') {
        this.hide();
      }
    });

    // Subscribe to user login events
    this.subscribeToEvent(EVENTS.USER_LOGIN, () => {
      this.loadProfile();
    });
  }

  /**
   * Switch tab
   */
  private switchTab(tabName: string): void {
    // Update tab buttons
    const tabBtns = this.findElements('.tab-btn');
    tabBtns.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update tab content
    const tabs = this.findElements('.tab-content');
    tabs.forEach(tab => {
      if (tab.id === `${tabName}Tab`) {
        tab.style.display = 'block';
      } else {
        tab.style.display = 'none';
      }
    });

    this.clearMessages();
  }

  /**
   * Load profile
   */
  private loadProfile(): void {
    const state = this.getState();
    const user = state.auth.user;
    
    if (!user) {
      this.showError('Please login to view your profile');
      return;
    }

    this.renderProfileInfo(user);
    this.populateEditForm(user);
  }

  /**
   * Render profile information
   */
  private renderProfileInfo(user: ProfileData): void {
    if (!this.profileInfo) return;

    const balance = (user.deposit || 0) + (user.bonus || 0);
    const createdAt = user.created_at ? new Date(user.created_at) : null;
    const lastLogin = user.last_login ? new Date(user.last_login) : null;

    this.profileInfo.innerHTML = `
      <div class="profile-row">
        <div class="profile-label">Nickname</div>
        <div class="profile-value">${user.nickname}</div>
      </div>
      <div class="profile-row">
        <div class="profile-label">Email</div>
        <div class="profile-value">${user.email || 'Not set'}</div>
      </div>
      <div class="profile-row">
        <div class="profile-label">Balance</div>
        <div class="profile-value balance-amount">€${balance.toFixed(2)}</div>
      </div>
      <div class="profile-row">
        <div class="profile-label">Deposit</div>
        <div class="profile-value">€${(user.deposit || 0).toFixed(2)}</div>
      </div>
      <div class="profile-row">
        <div class="profile-label">Bonus</div>
        <div class="profile-value">€${(user.bonus || 0).toFixed(2)}</div>
      </div>
      ${createdAt ? `
        <div class="profile-row">
          <div class="profile-label">Member Since</div>
          <div class="profile-value">${createdAt.toLocaleDateString('en-US', { 
            day: 'numeric', month: 'long', year: 'numeric' 
          })}</div>
        </div>
      ` : ''}
      ${lastLogin ? `
        <div class="profile-row">
          <div class="profile-label">Last Login</div>
          <div class="profile-value">${lastLogin.toLocaleDateString('en-US', { 
            day: 'numeric', month: 'short', year: 'numeric' 
          })} ${lastLogin.toLocaleTimeString('en-US', { 
            hour: '2-digit', minute: '2-digit' 
          })}</div>
        </div>
      ` : ''}
    `;
  }

  /**
   * Populate edit form
   */
  private populateEditForm(user: ProfileData): void {
    if (this.nicknameInput) {
      this.nicknameInput.value = user.nickname;
    }
    if (this.emailInput) {
      this.emailInput.value = user.email || '';
    }
  }

  /**
   * Handle profile update
   */
  private async handleProfileUpdate(): Promise<void> {
    if (!this.nicknameInput) return;

    const nickname = this.nicknameInput.value.trim();
    const email = this.emailInput?.value.trim() || '';

    if (!nickname) {
      this.showError('Nickname is required');
      return;
    }

    // Show loading state
    this.setLoading(true);
    this.clearMessages();

    try {
      // In a real app, this would call an API to update the profile
      // For demo purposes, we'll simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update state
      const state = this.getState();
      const updatedUser = {
        ...state.auth.user,
        nickname,
        email
      };
      
      this.setStateSlice('auth', {
        ...state.auth,
        user: updatedUser
      });
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Re-render profile info
      this.renderProfileInfo(updatedUser);
      
      // Switch back to view tab
      this.switchTab('view');
      
      // Show success message
      this.showSuccess('Profile updated successfully!');
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Handle password change
   */
  private async handlePasswordChange(): Promise<void> {
    if (!this.currentPasswordInput || !this.newPasswordInput || !this.confirmPasswordInput) return;

    const currentPassword = this.currentPasswordInput.value;
    const newPassword = this.newPasswordInput.value;
    const confirmPassword = this.confirmPasswordInput.value;

    if (!currentPassword || !newPassword || !confirmPassword) {
      this.showError('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      this.showError('Password must be at least 6 characters');
      return;
    }

    // Show loading state
    this.setLoading(true);
    this.clearMessages();

    try {
      // In a real app, this would call an API to change the password
      // For demo purposes, we'll simulate a successful change
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Clear password fields
      if (this.currentPasswordInput) this.currentPasswordInput.value = '';
      if (this.newPasswordInput) this.newPasswordInput.value = '';
      if (this.confirmPasswordInput) this.confirmPasswordInput.value = '';
      
      // Switch back to view tab
      this.switchTab('view');
      
      // Show success message
      this.showSuccess('Password changed successfully!');
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Set loading state
   */
  private setLoading(isLoading: boolean): void {
    const submitBtns = this.findElements('.btn-primary') as HTMLButtonElement[];
    
    submitBtns.forEach(btn => {
      if (isLoading) {
        btn.disabled = true;
        btn.textContent = 'Saving...';
      } else {
        btn.disabled = false;
        btn.textContent = btn.id === 'editProfileSubmit' ? 'Save Changes' : 'Change Password';
      }
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    if (!this.errorElement) return;

    this.errorElement.textContent = message;
    this.errorElement.style.display = 'block';
    if (this.successElement) {
      this.successElement.style.display = 'none';
    }
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    if (!this.successElement) return;

    this.successElement.textContent = message;
    this.successElement.style.display = 'block';
    (this.errorElement as HTMLElement).style.display = 'none';
  }

  /**
   * Clear all messages
   */
  private clearMessages(): void {
    if (this.errorElement) {
      this.errorElement.textContent = '';
      (this.errorElement as HTMLElement).style.display = 'none';
    }
    if (this.successElement) {
      this.successElement.textContent = '';
      this.successElement.style.display = 'none';
    }
  }

  /**
   * Show component
   */
  public override show(): void {
    this.element.style.display = 'flex';
    this.switchTab('view');
    this.loadProfile();
  }

  /**
   * Hide component
   */
  public override hide(): void {
    this.element.style.display = 'none';
    this.clearMessages();
  }
}