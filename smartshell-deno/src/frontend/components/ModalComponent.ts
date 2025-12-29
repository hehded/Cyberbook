/**
 * Modal Component for managing modal dialogs
 * Handles modal display, positioning, and behavior
 */

import { BaseComponent, ComponentConfig } from './BaseComponent.ts';
import { stateStore, State } from '../state/StateStore.ts';
import { eventBus, EVENTS } from '../events/EventBus.ts';

export interface ModalConfig {
  title: string;
  content: string;
  size?: 'small' | 'medium' | 'large';
  closable?: boolean;
  showCloseButton?: boolean;
}

export class ModalComponent extends BaseComponent {
  private modalContent: HTMLElement | null = null;
  private modalOverlay: HTMLElement | null = null;
  private closeButton: HTMLButtonElement | null = null;
  private isOpen = false;

  constructor(config: ComponentConfig = {}) {
    super({
      element: config.element || '#modalContainer',
      template: config.template || `
        <div class="modal-overlay" id="modalOverlay">
          <div class="modal" id="modalContent">
            <div class="modal-header">
              <h3 id="modalTitle">Modal Title</h3>
              <button class="close-btn" id="modalCloseBtn">&times;</button>
            </div>
            <div class="modal-body" id="modalBody">
              <!-- Modal content will be populated here -->
            </div>
          </div>
        </div>
      `,
      styles: config.styles || `
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        
        .modal-overlay.open {
          opacity: 1;
          visibility: visible;
        }
        
        .modal {
          background: var(--card-bg);
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          max-width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          transform: scale(0.8);
          transition: transform 0.3s ease;
        }
        
        .modal-overlay.open .modal {
          transform: scale(1);
        }
        
        .modal.small {
          max-width: 400px;
        }
        
        .modal.medium {
          max-width: 600px;
        }
        
        .modal.large {
          max-width: 800px;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
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
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        
        .close-btn:hover {
          background: rgba(0, 0, 0, 0.1);
        }
        
        .modal-body {
          padding: 20px;
        }
        
        @media (max-width: 768px) {
          .modal {
            max-width: 95%;
            margin: 10px;
          }
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
    this.modalOverlay = this.findElement('#modalOverlay');
    this.modalContent = this.findElement('#modalContent');
    this.closeButton = this.findElement('#modalCloseBtn') as HTMLButtonElement;
  }

  /**
   * Bind DOM events
   */
  protected override bindEvents(): void {
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => {
        this.close();
      });
    }

    if (this.modalOverlay) {
      this.modalOverlay.addEventListener('click', (e: Event) => {
        // Close modal when clicking on the overlay
        if (e.target === this.modalOverlay) {
          this.close();
        }
      });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  /**
   * Subscribe to event bus
   */
  protected override subscribeToEvents(): void {
    // Subscribe to modal open events
    this.subscribeToEvent(EVENTS.MODAL_OPEN, (data: { type: string; message?: string; config?: ModalConfig }) => {
      if (data.type === 'generic' && data.config) {
        this.open(data.config);
      }
    });

    // Subscribe to modal close events
    this.subscribeToEvent(EVENTS.MODAL_CLOSE, (data: { type: string }) => {
      if (data.type === 'generic') {
        this.close();
      }
    });
  }

  /**
   * Open modal with configuration
   */
  public open(config: ModalConfig): void {
    if (!this.modalOverlay || !this.modalContent) return;

    // Set modal title
    const titleElement = this.findElement('#modalTitle');
    if (titleElement) {
      titleElement.textContent = config.title;
    }

    // Set modal content
    const bodyElement = this.findElement('#modalBody');
    if (bodyElement) {
      bodyElement.innerHTML = config.content;
    }

    // Set modal size
    this.modalContent.className = 'modal';
    if (config.size) {
      this.modalContent.classList.add(config.size);
    }

    // Show/hide close button
    if (this.closeButton) {
      this.closeButton.style.display = config.closable !== false ? 'flex' : 'none';
    }

    // Show modal
    this.modalOverlay.classList.add('open');
    this.isOpen = true;

    // Focus management
    setTimeout(() => {
      // Focus first focusable element in modal
      const focusableElements = this.modalContent?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }, 100);
  }

  /**
   * Close modal
   */
  public close(): void {
    if (!this.modalOverlay) return;

    this.modalOverlay.classList.remove('open');
    this.isOpen = false;

    // Return focus to the element that opened the modal
    setTimeout(() => {
      // Find the last focused element before modal was opened
      const lastFocused = document.querySelector('[data-last-focused]') as HTMLElement;
      if (lastFocused) {
        lastFocused.focus();
        lastFocused.removeAttribute('data-last-focused');
      }
    }, 100);
  }

  /**
   * Show component (alias for open)
   */
  public override show(): void {
    // Default modal configuration
    this.open({
      title: 'Modal',
      content: '<p>Modal content</p>',
      size: 'medium',
      closable: true
    });
  }

  /**
   * Hide component (alias for close)
   */
  public override hide(): void {
    this.close();
  }

  /**
   * Check if modal is open
   */
  public isModalOpen(): boolean {
    return this.isOpen;
  }

  /**
   * Store the last focused element before opening modal
   */
  private storeLastFocusedElement(): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      activeElement.setAttribute('data-last-focused', 'true');
    }
  }

  /**
   * Override show to store last focused element
   */
  public openModal(config: ModalConfig): void {
    this.storeLastFocusedElement();
    this.open(config);
  }

  /**
   * Create and show a confirmation modal
   */
  public confirm(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    const content = `
      <p>${message}</p>
      <div class="modal-actions">
        <button class="btn btn-primary confirm-btn">Confirm</button>
        <button class="btn cancel-btn">Cancel</button>
      </div>
    `;

    this.openModal({
      title,
      content,
      size: 'small',
      closable: true
    });

    // Add event listeners to buttons
    setTimeout(() => {
      const confirmBtn = this.findElement('.confirm-btn') as HTMLButtonElement;
      const cancelBtn = this.findElement('.cancel-btn') as HTMLButtonElement;

      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
          this.close();
          onConfirm();
        });
      }

      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          this.close();
          if (onCancel) onCancel();
        });
      }
    }, 100);
  }

  /**
   * Create and show an alert modal
   */
  public alert(title: string, message: string, onClose?: () => void): void {
    const content = `
      <p>${message}</p>
      <div class="modal-actions">
        <button class="btn btn-primary alert-btn">OK</button>
      </div>
    `;

    this.openModal({
      title,
      content,
      size: 'small',
      closable: true
    });

    // Add event listener to button
    setTimeout(() => {
      const alertBtn = this.findElement('.alert-btn') as HTMLButtonElement;
      if (alertBtn) {
        alertBtn.addEventListener('click', () => {
          this.close();
          if (onClose) onClose();
        });
      }
    }, 100);
  }

  /**
   * Override destroy to clean up event listeners
   */
  public destroy(): void {
    // Remove keyboard event listener
    document.removeEventListener('keydown', () => {});
    
    super.destroy();
  }
}