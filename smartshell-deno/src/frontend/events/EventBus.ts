/**
 * EventBus implementation using Observer pattern
 * Provides decoupled communication between components
 */
export interface IEventBus {
  subscribe<T>(event: string, callback: (data: T) => void): () => void;
  publish<T>(event: string, data: T): void;
  unsubscribe(event: string, callback: Function): void;
  clear(): void;
}

export class EventBus implements IEventBus {
  private static instance: EventBus;
  private events: Map<string, Set<Function>> = new Map();

  private constructor() {}

  /**
   * Singleton pattern implementation
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event
   * @param event Event name
   * @param callback Callback function
   * @returns Unsubscribe function
   */
  subscribe<T>(event: string, callback: (data: T) => void): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }

    this.events.get(event)!.add(callback);

    // Return unsubscribe function
    return () => this.unsubscribe(event, callback);
  }

  /**
   * Publish an event
   * @param event Event name
   * @param data Event data
   */
  publish<T>(event: string, data: T): void {
    if (!this.events.has(event)) {
      return;
    }

    const callbacks = this.events.get(event)!;
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Unsubscribe from an event
   * @param event Event name
   * @param callback Callback function
   */
  unsubscribe(event: string, callback: Function): void {
    if (!this.events.has(event)) {
      return;
    }

    this.events.get(event)!.delete(callback);
    
    // Clean up empty event sets
    if (this.events.get(event)!.size === 0) {
      this.events.delete(event);
    }
  }

  /**
   * Clear all event subscriptions
   */
  clear(): void {
    this.events.clear();
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();

// Event type definitions for type safety
export const EVENTS = {
  // Authentication events
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  SESSION_EXPIRED: 'session:expired',
  
  // Data events
  HOSTS_LOADED: 'hosts:loaded',
  BOOKINGS_LOADED: 'bookings:loaded',
  GAMES_LOADED: 'games:loaded',
  
  // UI events
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  TOAST_SHOW: 'toast:show',
  
  // Booking events
  BOOKING_CREATED: 'booking:created',
  BOOKING_CANCELLED: 'booking:cancelled',
  BOOKING_SELECTED: 'booking:selected',
  
  // Filter events
  GROUP_FILTER_CHANGED: 'filter:group:changed',
  GAME_FILTER_CHANGED: 'filter:game:changed',
  
  // Error events
  ERROR_OCCURRED: 'error:occurred',
  NETWORK_ERROR: 'error:network',
} as const;

export type EventType = typeof EVENTS[keyof typeof EVENTS];