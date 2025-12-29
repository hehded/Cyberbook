/**
 * Payment Component for handling payment processing
 * Manages payment methods and transactions
 */

import { BaseComponent, ComponentConfig } from './BaseComponent.ts';
import { stateStore, State } from '../state/StateStore.ts';
import { eventBus, EVENTS } from '../events/EventBus.ts';
import { paymentApi } from '../services/ApiService.ts';

export interface PaymentData {
  amount: number;
  method: string;
  description?: string;
}

export class PaymentComponent extends BaseComponent {
  private form: HTMLFormElement | null = null;
  private amountInput: HTMLInputElement | null = null;
  private methodSelect: HTMLSelectElement | null = null;
  private descriptionInput: HTMLTextAreaElement | null = null;
  private submitBtn: HTMLButtonElement | null = null;
  private paymentHistory: HTMLElement | null = null;
  private errorElement: HTMLElement | null = null;
  private balanceElement: HTMLElement | null = null;

  constructor(config: ComponentConfig = {}) {
    super({
      element: config.element || '#paymentModal',
      template: config.template || `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Add Funds</h3>
            <button class="close-btn" id="closePaymentModal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="error-message" id="paymentError"></div>
            <div class="balance-info" id="balanceInfo">
              <!-- Balance will be populated here -->
            </div>
            <form id="paymentForm">
              <div class="form-group">
                <label for="amountInput">Amount (€)</label>
                <input type="number" id="amountInput" min="1" step="0.01" required>
              </div>
              <div class="form-group">
                <label for="methodSelect">Payment Method</label>
                <select id="methodSelect" required>
                  <option value="">Select payment method</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="paypal">PayPal</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div class="form-group">
                <label for="description">Description (optional)</label>
                <textarea id="description" rows="3"></textarea>
              </div>
              <button type="submit" id="paymentSubmitBtn" class="btn btn-primary">Add Funds</button>
            </form>
          </div>
          <div class="modal-footer">
            <h4>Payment History</h4>
            <div id="paymentHistory" class="payment-history">
              <!-- Payment history will be populated here -->
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
        .balance-info {
          background: var(--input-bg);
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .balance-label {
          font-weight: 600;
          color: var(--text);
        }
        .balance-amount {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--primary);
        }
        .form-group {
          margin-bottom: 15px;
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
        .payment-history {
          margin-top: 15px;
        }
        .payment-item {
          padding: 10px;
          border: 1px solid var(--border);
          border-radius: 4px;
          margin-bottom: 10px;
          background: var(--input-bg);
        }
        .payment-item h5 {
          margin: 0 0 5px 0;
          color: var(--text);
          display: flex;
          justify-content: space-between;
        }
        .payment-item p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        .payment-amount {
          font-weight: 600;
        }
        .payment-amount.success {
          color: var(--success);
        }
        .payment-amount.failed {
          color: var(--danger);
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
    this.loadPaymentData();
  }

  /**
   * Initialize DOM elements
   */
  private initializeElements(): void {
    this.form = this.findElement('#paymentForm') as HTMLFormElement;
    this.amountInput = this.findElement('#amountInput') as HTMLInputElement;
    this.methodSelect = this.findElement('#methodSelect') as HTMLSelectElement;
    this.descriptionInput = this.findElement('#description') as HTMLTextAreaElement;
    this.submitBtn = this.findElement('#paymentSubmitBtn') as HTMLButtonElement;
    this.paymentHistory = this.findElement('#paymentHistory') as HTMLElement;
    this.balanceElement = this.findElement('#balanceInfo') as HTMLElement;
    this.errorElement = this.findElement('#paymentError') as HTMLElement;
    const closeBtn = this.findElement('#closePaymentModal') as HTMLButtonElement;

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
        this.handlePaymentSubmit();
      });
    }
  }

  /**
   * Subscribe to event bus
   */
  protected override subscribeToEvents(): void {
    // Subscribe to modal open events
    this.subscribeToEvent(EVENTS.MODAL_OPEN, (data: { type: string; message?: string }) => {
      if (data.type === 'payment') {
        this.show();
      }
    });

    // Subscribe to modal close events
    this.subscribeToEvent(EVENTS.MODAL_CLOSE, (data: { type: string }) => {
      if (data.type === 'payment') {
        this.hide();
      }
    });
  }

  /**
   * Load payment data
   */
  private async loadPaymentData(): Promise<void> {
    try {
      // Load payment history
      const payments = await paymentApi.getPayments();
      
      // Update state
      this.setStateSlice('payments', payments);
      
      // Update balance
      this.updateBalance();
      
      // Render payment history
      this.renderPaymentHistory(payments);
    } catch (error) {
      console.error('Failed to load payment data:', error);
      this.showError('Failed to load payment data');
    }
  }

  /**
   * Update balance display
   */
  private updateBalance(): void {
    if (!this.balanceElement) return;

    const state = this.getState();
    const user = state.auth.user;
    
    if (user) {
      const balance = (user.deposit || 0) + (user.bonus || 0);
      this.balanceElement.innerHTML = `
        <div class="balance-label">Current Balance:</div>
        <div class="balance-amount">€${balance.toFixed(2)}</div>
      `;
    } else {
      this.balanceElement.innerHTML = `
        <div class="balance-label">Please login to view balance</div>
      `;
    }
  }

  /**
   * Render payment history
   */
  private renderPaymentHistory(payments: any[]): void {
    if (!this.paymentHistory) return;

    if (!payments || payments.length === 0) {
      this.paymentHistory.innerHTML = '<p>No payment history found.</p>';
      return;
    }

    this.paymentHistory.innerHTML = '';
    
    payments.slice(0, 10).forEach(payment => {
      const paymentItem = document.createElement('div');
      paymentItem.className = 'payment-item';
      
      const date = new Date(payment.created_at);
      const dateStr = date.toLocaleDateString('en-US', { 
        day: 'numeric', month: 'short', year: 'numeric' 
      });
      const timeStr = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', minute: '2-digit' 
      });
      
      const statusClass = payment.status === 'success' ? 'success' : 'failed';
      
      paymentItem.innerHTML = `
        <h5>
          <span>€${payment.amount.toFixed(2)}</span>
          <span class="payment-amount ${statusClass}">${payment.status}</span>
        </h5>
        <p>${dateStr} at ${timeStr}</p>
        <p>Method: ${payment.method}</p>
        ${payment.description ? `<p>${payment.description}</p>` : ''}
      `;
      
      this.paymentHistory?.appendChild(paymentItem);
    });
  }

  /**
   * Handle payment form submission
   */
  private async handlePaymentSubmit(): Promise<void> {
    if (!this.amountInput || !this.methodSelect || !this.submitBtn) return;

    const amount = parseFloat(this.amountInput.value);
    const method = this.methodSelect.value;

    if (!amount || amount <= 0) {
      this.showError('Please enter a valid amount');
      return;
    }

    if (!method) {
      this.showError('Please select a payment method');
      return;
    }

    const paymentData: PaymentData = {
      amount,
      method,
      description: this.descriptionInput?.value || ''
    };

    // Show loading state
    this.setLoading(true);
    this.clearError();

    try {
      // This would typically call a payment processing API
      // For demo purposes, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update user balance (in a real app, this would be done by the backend)
      const state = this.getState();
      const user = state.auth.user;
      if (user) {
        user.deposit = (user.deposit || 0) + amount;
        this.setStateSlice('auth', {
          ...state.auth,
          user
        });
      }
      
      // Update balance display
      this.updateBalance();
      
      // Reset form
      this.resetForm();
      
      // Reload payment data
      this.loadPaymentData();
      
      // Show success message
      this.showError('Payment processed successfully!', 'success');
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Payment failed');
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
      this.submitBtn.textContent = 'Processing...';
    } else {
      this.submitBtn.disabled = false;
      this.submitBtn.textContent = 'Add Funds';
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
    this.updateBalance();
  }

  /**
   * Hide component
   */
  public override hide(): void {
    this.element.style.display = 'none';
    this.resetForm();
  }
}