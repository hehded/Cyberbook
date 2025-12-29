/**
 * Host Component for displaying host information
 * Handles host details and status display
 */

import { BaseComponent, ComponentConfig } from './BaseComponent.ts';
import { stateStore, State } from '../state/StateStore.ts';
import { eventBus, EVENTS } from '../events/EventBus.ts';
import { hostApi } from '../services/ApiService.ts';

export interface HostData {
  id: number;
  alias?: string;
  group?: {
    id: string;
    title: string;
  };
  coord_x: number;
  coord_y: number;
  session?: {
    user?: string;
    started_at?: string;
    duration?: number;
    time_left?: number;
  };
}

export class HostComponent extends BaseComponent {
  private hostInfo: HTMLElement | null = null;
  private hostList: HTMLElement | null = null;
  private loadingIndicator: HTMLElement | null = null;
  private errorElement: HTMLElement | null = null;
  private currentHost: HostData | null = null;

  constructor(config: ComponentConfig = {}) {
    super({
      element: config.element || '#pcInfoModal',
      template: config.template || `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Computer Information</h3>
            <button class="close-btn" id="closeHostModal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="error-message" id="hostError"></div>
            <div class="loading-indicator" id="hostLoading" style="display: none;">
              <i class="fas fa-spinner fa-spin"></i> Loading...
            </div>
            <div id="hostInfo" style="display: none;">
              <!-- Host details will be populated here -->
            </div>
          </div>
          <div class="modal-footer">
            <button id="bookHostBtn" class="btn btn-primary">Book This Computer</button>
          </div>
        </div>
      `,
      styles: config.styles || `
        .modal-content {
          background: var(--card-bg);
          border-radius: 8px;
          padding: 20px;
          max-width: 500px;
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
        .error-message {
          color: var(--danger);
          margin-bottom: 15px;
          padding: 10px;
          border-radius: 4px;
          background: rgba(220, 53, 69, 0.1);
          display: none;
        }
        .loading-indicator {
          text-align: center;
          padding: 20px;
          color: var(--text-secondary);
        }
        .host-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .detail-group {
          margin-bottom: 15px;
        }
        .detail-label {
          font-weight: 600;
          color: var(--text);
          margin-bottom: 5px;
        }
        .detail-value {
          color: var(--text-secondary);
        }
        .status-indicator {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 8px;
        }
        .status-free {
          background: var(--free);
        }
        .status-busy {
          background: var(--busy);
        }
        .status-booked {
          background: var(--booked);
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
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .session-info {
          background: var(--input-bg);
          padding: 10px;
          border-radius: 4px;
          margin-top: 10px;
        }
        .session-info p {
          margin: 5px 0;
          color: var(--text-secondary);
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
    this.hostInfo = this.findElement('#hostInfo');
    this.loadingIndicator = this.findElement('#hostLoading');
    this.errorElement = this.findElement('#hostError');
    const closeBtn = this.findElement('#closeHostModal');
    const bookBtn = this.findElement('#bookHostBtn');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide();
      });
    }

    if (bookBtn) {
      bookBtn.addEventListener('click', () => {
        this.handleBookHost();
      });
    }
  }

  /**
   * Bind DOM events
   */
  protected override bindEvents(): void {
    // Events are handled through the event bus
  }

  /**
   * Subscribe to event bus
   */
  protected override subscribeToEvents(): void {
    // Subscribe to modal open events
    this.subscribeToEvent(EVENTS.MODAL_OPEN, (data: { type: string; data?: any }) => {
      if (data.type === 'pcInfo' && data.data) {
        this.show();
        this.loadHostDetails(data.data.id);
      }
    });

    // Subscribe to modal close events
    this.subscribeToEvent(EVENTS.MODAL_CLOSE, (data: { type: string }) => {
      if (data.type === 'pcInfo') {
        this.hide();
      }
    });
  }

  /**
   * Load host details
   */
  private async loadHostDetails(hostId: number): Promise<void> {
    if (!this.hostInfo || !this.loadingIndicator) return;

    // Show loading state
    this.hostInfo.style.display = 'none';
    this.loadingIndicator.style.display = 'block';
    this.clearError();

    try {
      // Get host from state first
      const state = this.getState();
      let host = state.hosts.find(h => h.id === hostId);

      // If not found in state, fetch from API
      if (!host) {
        host = await hostApi.getHost(hostId);
      }

      if (host) {
        this.currentHost = host;
        this.renderHostDetails(host);
      } else {
        this.showError('Host not found');
      }
    } catch (error) {
      console.error('Failed to load host details:', error);
      this.showError(error instanceof Error ? error.message : 'Failed to load host details');
    } finally {
      // Hide loading state
      this.loadingIndicator.style.display = 'none';
    }
  }

  /**
   * Render host details
   */
  private renderHostDetails(host: HostData): void {
    if (!this.hostInfo) return;

    const status = this.getHostStatus(host);
    const position = host.coord_x !== undefined && host.coord_y !== undefined 
      ? `Row ${host.coord_y + 1}, Column ${host.coord_x + 1}` 
      : 'Unknown';

    this.hostInfo.innerHTML = `
      <div class="host-details">
        <div class="detail-group">
          <div class="detail-label">Computer Name</div>
          <div class="detail-value">${host.alias || `Computer ${host.id}`}</div>
        </div>
        <div class="detail-group">
          <div class="detail-label">Status</div>
          <div class="detail-value">
            <span class="status-indicator status-${status.class}"></span>
            ${status.text}
          </div>
        </div>
        <div class="detail-group">
          <div class="detail-label">Group</div>
          <div class="detail-value">${host.group?.title || 'No group'}</div>
        </div>
        <div class="detail-group">
          <div class="detail-label">Position</div>
          <div class="detail-value">${position}</div>
        </div>
      </div>
      ${host.session ? this.renderSessionInfo(host.session) : ''}
    `;

    this.hostInfo.style.display = 'block';

    // Update book button state
    const bookBtn = this.findElement('#bookHostBtn') as HTMLButtonElement;
    if (bookBtn) {
      bookBtn.disabled = status.class === 'busy';
      if (status.class === 'busy') {
        bookBtn.textContent = 'Currently in Use';
      } else {
        bookBtn.textContent = 'Book This Computer';
      }
    }
  }

  /**
   * Render session information
   */
  private renderSessionInfo(session: any): string {
    let timeInfo = '';
    
    if (session.time_left && session.time_left > 0) {
      const hours = Math.floor(session.time_left / 3600);
      const minutes = Math.floor((session.time_left % 3600) / 60);
      timeInfo = hours > 0 
        ? `${hours}h ${minutes}m remaining` 
        : `${minutes}m remaining`;
    } else if (session.started_at && session.duration) {
      const start = new Date(session.started_at);
      const end = new Date(start.getTime() + session.duration * 1000);
      const timeLeft = Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000));
      const hours = Math.floor(timeLeft / 3600);
      const minutes = Math.floor((timeLeft % 3600) / 60);
      timeInfo = hours > 0 
        ? `${hours}h ${minutes}m remaining` 
        : `${minutes}m remaining`;
    }

    return `
      <div class="session-info">
        <h4>Current Session</h4>
        <p><strong>User:</strong> ${session.user || 'Unknown'}</p>
        ${timeInfo ? `<p><strong>Time:</strong> ${timeInfo}</p>` : ''}
      </div>
    `;
  }

  /**
   * Get host status
   */
  private getHostStatus(host: HostData): { class: string; text: string } {
    if (host.session) {
      return { class: 'busy', text: 'In Use' };
    }

    const state = this.getState();
    const hasBooking = state.bookings.some(b => 
      b.hosts.some((bh: any) => bh.id === host.id)
    );

    if (hasBooking) {
      return { class: 'booked', text: 'Booked' };
    }

    return { class: 'free', text: 'Available' };
  }

  /**
   * Handle book host button click
   */
  private handleBookHost(): void {
    if (!this.currentHost) return;

    // Open booking modal with this host pre-selected
    this.publishEvent(EVENTS.MODAL_OPEN, { 
      type: 'booking' 
    });

    this.publishEvent(EVENTS.BOOKING_SELECTED, {
      hostIds: [this.currentHost.id]
    });

    // Close this modal
    this.hide();
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
   * Show component
   */
  public override show(): void {
    this.element.style.display = 'flex';
    this.clearError();
  }

  /**
   * Hide component
   */
  public override hide(): void {
    this.element.style.display = 'none';
    this.currentHost = null;
  }
}