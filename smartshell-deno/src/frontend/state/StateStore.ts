/**
 * State management using Observer pattern
 * Provides centralized state with reactive updates
 */

import { eventBus, EVENTS } from '../events/EventBus.ts';

export interface State {
  // Authentication state
  auth: {
    isAuthenticated: boolean;
    user: any | null;
    sessionId: string | null;
  };
  
  // Data state
  hosts: any[];
  bookings: any[];
  games: any[];
  achievements: any[];
  payments: any;
  leaderboard: any;
  
  // UI state
  ui: {
    selectedGroup: string;
    selectedHosts: Set<number>;
    hoveredHost: any | null;
    loading: {
      hosts: boolean;
      bookings: boolean;
      games: boolean;
      achievements: boolean;
      payments: boolean;
      leaderboard: boolean;
    };
    modals: {
      login: boolean;
      booking: boolean;
      pcInfo: boolean;
      games: boolean;
      leaderboard: boolean;
    };
    filters: {
      gameGroup: string;
      popularOnly: boolean;
    };
  };
  
  // Map state
  map: {
    scale: number;
    offsetX: number;
    offsetY: number;
    padding: number;
  };
}

/**
 * State Store class implementing Observer pattern
 */
export class StateStore {
  private static instance: StateStore;
  private state: State;
  private subscribers: Map<string, Set<(state: State) => void>> = new Map();

  private constructor() {
    this.state = this.getInitialState();
  }

  /**
   * Singleton pattern
   */
  public static getInstance(): StateStore {
    if (!StateStore.instance) {
      StateStore.instance = new StateStore();
    }
    return StateStore.instance;
  }

  /**
   * Get initial state
   */
  private getInitialState(): State {
    return {
      auth: {
        isAuthenticated: false,
        user: null,
        sessionId: null,
      },
      hosts: [],
      bookings: [],
      games: [],
      achievements: [],
      payments: null,
      leaderboard: null,
      ui: {
        selectedGroup: '',
        selectedHosts: new Set(),
        hoveredHost: null,
        loading: {
          hosts: false,
          bookings: false,
          games: false,
          achievements: false,
          payments: false,
          leaderboard: false,
        },
        modals: {
          login: false,
          booking: false,
          pcInfo: false,
          games: false,
          leaderboard: false,
        },
        filters: {
          gameGroup: '',
          popularOnly: false,
        },
      },
      map: {
        scale: 48,
        offsetX: 0,
        offsetY: 0,
        padding: 36,
      },
    };
  }

  /**
   * Get current state
   */
  public getState(): State {
    return this.state;
  }

  /**
   * Get specific state slice
   */
  public getStateSlice<K extends keyof State>(key: K): State[K] {
    return this.state[key];
  }

  /**
   * Update state with new values
   */
  public setState(updates: Partial<State>): void {
    const prevState = { ...this.state };
    
    // Deep merge updates
    this.state = this.mergeDeep(this.state, updates);
    
    // Notify subscribers
    this.notifySubscribers();
    
    // Emit specific events for state changes
    this.emitStateEvents(prevState, this.state);
  }

  /**
   * Update specific state slice
   */
  public setStateSlice<K extends keyof State>(
    key: K, 
    value: State[K]
  ): void {
    this.setState({ [key]: value } as Partial<State>);
  }

  /**
   * Subscribe to state changes
   */
  public subscribe(callback: (state: State) => void): () => void {
    const id = Date.now().toString();
    
    if (!this.subscribers.has('all')) {
      this.subscribers.set('all', new Set());
    }
    
    this.subscribers.get('all')!.add(callback);
    
    // Call immediately with current state
    callback(this.state);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.get('all')?.delete(callback);
    };
  }

  /**
   * Subscribe to specific state slice
   */
  public subscribeToSlice<K extends keyof State>(
    key: K,
    callback: (value: State[K]) => void
  ): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    
    this.subscribers.get(key)!.add(callback);
    
    // Call immediately with current value
    callback(this.state[key]);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.get(key)?.delete(callback);
    };
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(): void {
    // Notify all subscribers
    this.subscribers.get('all')?.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('Error in state subscriber:', error);
      }
    });
    
    // Notify slice subscribers
    this.subscribers.forEach((subscribers, key) => {
      if (key !== 'all') {
        subscribers.forEach(callback => {
          try {
            callback(this.state[key as keyof State]);
          } catch (error) {
            console.error(`Error in ${key} subscriber:`, error);
          }
        });
      }
    });
  }

  /**
   * Emit events for specific state changes
   */
  private emitStateEvents(prevState: State, newState: State): void {
    // Authentication events
    if (prevState.auth.isAuthenticated !== newState.auth.isAuthenticated) {
      if (newState.auth.isAuthenticated) {
        eventBus.publish(EVENTS.USER_LOGIN, newState.auth.user);
      } else {
        eventBus.publish(EVENTS.USER_LOGOUT, {});
      }
    }

    // Data events
    if (prevState.hosts !== newState.hosts && newState.hosts.length > 0) {
      eventBus.publish(EVENTS.HOSTS_LOADED, newState.hosts);
    }
    
    if (prevState.bookings !== newState.bookings && newState.bookings.length > 0) {
      eventBus.publish(EVENTS.BOOKINGS_LOADED, newState.bookings);
    }
    
    if (prevState.games !== newState.games && newState.games.length > 0) {
      eventBus.publish(EVENTS.GAMES_LOADED, newState.games);
    }

    // UI events
    if (prevState.ui.selectedGroup !== newState.ui.selectedGroup) {
      eventBus.publish(EVENTS.GROUP_FILTER_CHANGED, newState.ui.selectedGroup);
    }
  }

  /**
   * Deep merge objects
   */
  private mergeDeep(target: any, source: any): any {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.mergeDeep(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }

  /**
   * Check if value is an object
   */
  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Reset state to initial values
   */
  public reset(): void {
    this.state = this.getInitialState();
    this.notifySubscribers();
  }
}

// Export singleton instance
export const stateStore = StateStore.getInstance();

// Selector functions for common state access patterns
export const selectors = {
  // Authentication selectors
  isAuthenticated: (state: State) => state.auth.isAuthenticated,
  currentUser: (state: State) => state.auth.user,
  
  // Data selectors
  allHosts: (state: State) => state.hosts,
  allBookings: (state: State) => state.bookings,
  allGames: (state: State) => state.games,
  
  // UI selectors
  selectedGroup: (state: State) => state.ui.selectedGroup,
  selectedHosts: (state: State) => state.ui.selectedHosts,
  isLoading: (state: State, key: keyof State['ui']['loading']) => 
    state.ui.loading[key],
  
  // Computed selectors
  availableHosts: (state: State) => 
    state.hosts.filter(host => !host.session),
  busyHosts: (state: State) => 
    state.hosts.filter(host => host.session),
  bookedHosts: (state: State) => {
    const bookedHostIds = new Set();
    state.bookings.forEach(booking => {
      booking.hosts.forEach((host: any) => {
        const hostInState = state.hosts.find(h => h.id === host.id);
        if (hostInState && !hostInState.session) {
          bookedHostIds.add(host.id);
        }
      });
    });
    return state.hosts.filter(host => bookedHostIds.has(host.id));
  },
};