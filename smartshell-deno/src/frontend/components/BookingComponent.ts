/**
 * Booking Component for managing user bookings
 * Handles booking creation, viewing, and cancellation
 */

import { BaseComponent, ComponentConfig } from './BaseComponent.ts';
import { stateStore, State } from '../state/StateStore.ts';
import { eventBus, EVENTS } from '../events/EventBus.ts';
import { bookingApi } from '../services/ApiService.ts';

export interface BookingData {
  hosts: number[];
  from: string;
  to: string;
  notes?: string;
}

export class BookingComponent extends BaseComponent {
  private form: HTMLFormElement | null = null;
  private hostSelect: HTMLSelectElement | null = null;
  private dateFromInput: HTMLInputElement | null = null;
  private dateToInput: HTMLInputElement | null = null;
  private notesInput: HTMLTextAreaElement | null = null;
  private submitBtn: HTMLButtonElement | null = null;
  private bookingsList: HTMLElement | null = null;
  private errorElement: HTMLElement | null = null;

  constructor(config: ComponentConfig = {}) {
    super({
      element: config.element || '#bookingModal',
      template: config.template || `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Book a Computer</h3>
            <button class="close-btn" id="closeBookingModal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="error-message" id="bookingError"></div>
            <form id="bookingForm">
              <div class="form-group">
                <label for="hostSelect">Select Computer</label>
                <select id="hostSelect" multiple required>
                  <!-- Options will be populated dynamically -->
                </select>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="dateFrom">From</label>
                  <input type="datetime-local" id="dateFrom" required>
                </div>
                <div class="form-group">
                  <label for="dateTo">To</label>
                  <input type="datetime-local" id="dateTo" required>
                </div>
              </div>
              <div class="form-group">
                <label for="notes">Notes (optional)</label>
                <textarea id="notes" rows="3"></textarea>
              </div>
              <button type="submit" id="bookingSubmitBtn" class="btn btn-primary">Book Now</button>
            </form>
          </div>
          <div class="modal-footer">
            <h4>Your Bookings</h4>
            <div id="bookingsList" class="bookings-list">
              <!-- Bookings will be populated here -->
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
        .form-group {
          margin-bottom: 15px;
        }
        .form-row {
          display: flex;
          gap: 15px;
        }
        .form-row .form-group {
          flex: 1;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
          color: var(--text);
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
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
        .modal-footer {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--border);
        }
        .modal-footer h4 {
          margin-top: 0;
          color: var(--text);
        }
        .bookings-list {
          margin-top: 15px;
        }
        .booking-item {
          padding: 10px;
          border: 1px solid var(--border);
          border-radius: 4px;
          margin-bottom: 10px;
          background: var(--input-bg);
        }
        .booking-item h5 {
          margin: 0 0 5px 0;
          color: var(--text);
        }
        .booking-item p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        .booking-actions {
          margin-top: 10px;
          display: flex;
          gap: 10px;
        }
        .btn-danger {
          background: var(--danger);
          color: white;
        }
        .btn-danger:hover {
          background: #c82333;
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
    this.loadBookings();
  }

  /**
   * Initialize DOM elements
   */
  private initializeElements(): void {
    this.form = this.findElement('#bookingForm') as HTMLFormElement;
    this.hostSelect = this.findElement('#hostSelect') as HTMLSelectElement;
    this.dateFromInput = this.findElement('#dateFrom') as HTMLInputElement;
    this.dateToInput = this.findElement('#dateTo') as HTMLInputElement;
    this.notesInput = this.findElement('#notes') as HTMLTextAreaElement;
    this.submitBtn = this.findElement('#bookingSubmitBtn') as HTMLButtonElement;
    this.bookingsList = this.findElement('#bookingsList') as HTMLElement;
    this.errorElement = this.findElement('#bookingError') as HTMLElement;
    const closeBtn = this.findElement('#closeBookingModal') as HTMLButtonElement;

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
        this.handleBookingSubmit();
      });
    }

    // Set minimum date to now
    if (this.dateFromInput) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      this.dateFromInput.min = now.toISOString().slice(0, 16);
      
      this.dateFromInput.addEventListener('change', () => {
        this.updateMinToDate();
      });
    }
  }

  /**
   * Subscribe to event bus
   */
  protected override subscribeToEvents(): void {
    // Subscribe to modal open events
    this.subscribeToEvent(EVENTS.MODAL_OPEN, (data: { type: string; message?: string }) => {
      if (data.type === 'booking') {
        this.show();
        this.populateHostOptions();
      }
    });

    // Subscribe to modal close events
    this.subscribeToEvent(EVENTS.MODAL_CLOSE, (data: { type: string }) => {
      if (data.type === 'booking') {
        this.hide();
      }
    });

    // Subscribe to booking selection events
    this.subscribeToEvent(EVENTS.BOOKING_SELECTED, (data: { hostIds: number[] }) => {
      if (this.hostSelect && data.hostIds.length > 0) {
        // Pre-select hosts
        Array.from(this.hostSelect.options).forEach((option) => {
          const optElement = option as HTMLOptionElement;
          optElement.selected = data.hostIds.includes(parseInt(optElement.value));
        });
      }
    });

    // Subscribe to booking events
    this.subscribeToEvent(EVENTS.BOOKING_CREATED, () => {
      this.loadBookings();
    });

    this.subscribeToEvent(EVENTS.BOOKING_CANCELLED, () => {
      this.loadBookings();
    });
  }

  /**
   * Update minimum date for "to" input based on "from" input
   */
  private updateMinToDate(): void {
    if (!this.dateFromInput || !this.dateToInput) return;

    const fromDate = new Date(this.dateFromInput.value);
    fromDate.setMinutes(fromDate.getMinutes() - fromDate.getTimezoneOffset());
    this.dateToInput.min = fromDate.toISOString().slice(0, 16);
  }

  /**
   * Populate host options
   */
  private populateHostOptions(): void {
    if (!this.hostSelect) return;

    const state = this.getState();
    const availableHosts = state.hosts.filter(host => !host.session);

    // Clear existing options
    this.hostSelect.innerHTML = '';

    // Add options for available hosts
    availableHosts.forEach(host => {
      const option = document.createElement('option') as HTMLOptionElement;
      option.value = host.id.toString();
      option.textContent = host.alias || `Computer ${host.id}`;
      if (host.group?.title) {
        option.textContent += ` (${host.group.title})`;
      }
      this.hostSelect?.appendChild(option);
    });
  }

  /**
   * Handle booking form submission
   */
  private async handleBookingSubmit(): Promise<void> {
    if (!this.hostSelect || !this.dateFromInput || !this.dateToInput || !this.submitBtn) return;

    const selectedHosts = Array.from(this.hostSelect.selectedOptions).map(
      option => parseInt((option as HTMLOptionElement).value)
    );

    if (selectedHosts.length === 0) {
      this.showError('Please select at least one computer');
      return;
    }

    const fromDate = new Date(this.dateFromInput.value);
    const toDate = new Date(this.dateToInput.value);

    if (fromDate >= toDate) {
      this.showError('End time must be after start time');
      return;
    }

    const bookingData: BookingData = {
      hosts: selectedHosts,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      notes: this.notesInput?.value || ''
    };

    // Show loading state
    this.setLoading(true);
    this.clearError();

    try {
      const response = await bookingApi.createBooking(bookingData);
      
      if (response.success) {
        // Reset form
        this.resetForm();
        
        // Update state
        this.loadBookings();
        
        // Publish booking created event
        this.publishEvent(EVENTS.BOOKING_CREATED, response.data);
        
        // Show success message
        this.showError('Booking created successfully!', 'success');
      } else {
        this.showError(response.error || 'Failed to create booking');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to create booking');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Load user bookings
   */
  private async loadBookings(): Promise<void> {
    try {
      const bookings = await bookingApi.getBookings();
      
      // Update state
      this.setStateSlice('bookings', bookings);
      
      // Render bookings
      this.renderBookings(bookings);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      this.showError('Failed to load bookings');
    }
  }

  /**
   * Render bookings list
   */
  private renderBookings(bookings: any[]): void {
    if (!this.bookingsList) return;

    if (bookings.length === 0) {
      this.bookingsList.innerHTML = '<p>No bookings found.</p>';
      return;
    }

    this.bookingsList.innerHTML = '';
    
    bookings.forEach(booking => {
      const bookingItem = document.createElement('div');
      bookingItem.className = 'booking-item';
      
      const fromDate = new Date(booking.from);
      const toDate = new Date(booking.to);
      const dateStr = fromDate.toLocaleDateString('en-US', { 
        day: 'numeric', month: 'short', year: 'numeric' 
      });
      const fromTime = fromDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', minute: '2-digit' 
      });
      const toTime = toDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', minute: '2-digit' 
      });
      
      const hostNames = booking.hosts.map((host: any) => 
        host.alias || `Computer ${host.id}`
      ).join(', ');
      
      bookingItem.innerHTML = `
        <h5>${hostNames}</h5>
        <p>${dateStr}, ${fromTime} - ${toTime}</p>
        ${booking.notes ? `<p>Notes: ${booking.notes}</p>` : ''}
        <div class="booking-actions">
          <button class="btn btn-danger cancel-booking" data-id="${booking.id}">Cancel</button>
        </div>
      `;
      
      this.bookingsList?.appendChild(bookingItem);
    });

    // Add event listeners to cancel buttons
    this.bookingsList.querySelectorAll('.cancel-booking').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as unknown as HTMLElement;
        const bookingId = parseInt(target.getAttribute('data-id') || '0');
        this.cancelBooking(bookingId);
      });
    });
  }

  /**
   * Cancel booking
   */
  private async cancelBooking(bookingId: number): Promise<void> {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const response = await bookingApi.cancelBooking(bookingId);
      
      if (response.success) {
        // Reload bookings
        this.loadBookings();
        
        // Publish booking cancelled event
        this.publishEvent(EVENTS.BOOKING_CANCELLED, { bookingId });
        
        // Show success message
        this.showError('Booking cancelled successfully!', 'success');
      } else {
        this.showError(response.error || 'Failed to cancel booking');
      }
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to cancel booking');
    }
  }

  /**
   * Set loading state
   */
  private setLoading(isLoading: boolean): void {
    if (!this.submitBtn) return;

    if (isLoading) {
      this.submitBtn.disabled = true;
      this.submitBtn.textContent = 'Booking...';
    } else {
      this.submitBtn.disabled = false;
      this.submitBtn.textContent = 'Book Now';
    }
  }

  /**
   * Show error message
   */
  private showError(message: string, type: string = 'error'): void {
    if (!this.errorElement) return;

    this.errorElement.textContent = message;
    this.errorElement.style.display = 'block';
    
    if (type === 'success') {
      this.errorElement.style.color = 'var(--success)';
      this.errorElement.style.background = 'rgba(40, 167, 69, 0.1)';
    } else {
      this.errorElement.style.color = 'var(--danger)';
      this.errorElement.style.background = 'rgba(220, 53, 69, 0.1)';
    }
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
    if (this.form) this.form.reset();
    this.clearError();
  }

  /**
   * Show component
   */
  public override show(): void {
    this.element.style.display = 'flex';
    this.resetForm();
    this.populateHostOptions();
  }

  /**
   * Hide component
   */
  public override hide(): void {
    this.element.style.display = 'none';
    this.resetForm();
  }
}