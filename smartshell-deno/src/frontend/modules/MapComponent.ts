/**
 * Map Component for visualizing hosts
 * Handles canvas rendering and user interactions
 */

import { BaseComponent } from '../components/BaseComponent.ts';
import { stateStore, State, selectors } from '../state/StateStore.ts';
import { eventBus, EVENTS } from '../events/EventBus.ts';

/**
 * Map Component Class
 */
export class MapComponent extends BaseComponent {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private resizeTimeout: number | null = null;

  constructor() {
    super({
      element: '#mapCard'
    });
  }

  /**
   * Initialize component
   */
  protected override onInit(): void {
    this.canvas = this.findElement('#map') as HTMLCanvasElement;
    if (!this.canvas) {
      console.error('Map canvas not found');
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      console.error('Failed to get canvas context');
      return;
    }

    this.setupCanvas();
    this.bindEvents();
    this.subscribeToState();
    this.draw();
  }

  /**
   * Setup canvas
   */
  private setupCanvas(): void {
    if (!this.canvas || !this.ctx) return;

    this.resizeCanvas();
    this.setupCanvasEvents();
  }

  /**
   * Resize canvas
   */
  private resizeCanvas(): void {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    
    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  /**
   * Setup canvas events
   */
  private setupCanvasEvents(): void {
    if (!this.canvas) return;

    // Mouse move event
    this.canvas.addEventListener('mousemove', (e) => {
      this.handleMouseMove(e);
    });

    // Click event
    this.canvas.addEventListener('click', (e) => {
      this.handleClick(e);
    });
  }

  /**
   * Bind DOM events
   */
  protected override bindEvents(): void {
    // Window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  /**
   * Subscribe to state changes
   */
  protected override subscribeToState(): void {
    // Hosts data
    this.subscribeToStateSlice('hosts', () => {
      this.draw();
    });

    // Bookings data
    this.subscribeToStateSlice('bookings', () => {
      this.draw();
    });

    // UI state
    this.subscribeToStateSlice('ui', (ui) => {
      this.draw();
    });

    // Map state
    this.subscribeToStateSlice('map', () => {
      this.draw();
    });
  }

  /**
   * Handle mouse move
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const host = this.getHostAtPosition(x, y);
    const state = this.getState();
    
    // Update hovered host
    if (state.ui.hoveredHost !== host) {
      this.setStateSlice('ui', {
        ...state.ui,
        hoveredHost: host
      });
    }

    // Update cursor
    this.canvas.style.cursor = host ? 'pointer' : 'default';

    // Show tooltip
    this.showTooltip(host, e.clientX, e.clientY);
  }

  /**
   * Handle click
   */
  private handleClick(e: MouseEvent): void {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const host = this.getHostAtPosition(x, y);
    
    if (!host) return;

    const state = this.getState();
    
    if (e.ctrlKey || e.metaKey) {
      // Multi-select mode
      if (!host.session) {
        const selectedHosts = new Set(state.ui.selectedHosts);
        if (selectedHosts.has(host.id)) {
          selectedHosts.delete(host.id);
        } else {
          selectedHosts.add(host.id);
        }
        
        this.setStateSlice('ui', {
          ...state.ui,
          selectedHosts
        });
        
        this.publishEvent(EVENTS.BOOKING_SELECTED, {
          hostIds: Array.from(selectedHosts)
        });
      }
    } else {
      // Single selection - open PC info modal
      this.publishEvent(EVENTS.MODAL_OPEN, {
        type: 'pcInfo',
        data: host
      });
    }
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = setTimeout(() => {
      this.setStateSlice('map', {
        ...this.getStateSlice('map'),
        // Reset fitted flag to recalculate layout
      });
      this.draw();
    }, 100);
  }

  /**
   * Get host at position
   */
  private getHostAtPosition(x: number, y: number): any {
    const state = this.getState();
    const hosts = this.getFilteredHosts(state.hosts, state.ui.selectedGroup);
    const bounds = this.computeBounds(hosts);
    
    for (const host of hosts) {
      if (!Number.isFinite(host.coord_x) || !Number.isFinite(host.coord_y)) continue;
      
      const gx = (host.coord_x - bounds.minX);
      const gy = (host.coord_y - bounds.minY);
      const mapState = state.map;
      const scale = mapState.scale;
      const offsetX = mapState.offsetX;
      const offsetY = mapState.offsetY;
      
      const cx = offsetX + gx * scale + scale / 2;
      const cy = offsetY + gy * scale + scale / 2;
      const w = Math.max(scale - 8, 36);
      const h = Math.max(scale - 8, 38);
      const hx = cx - w / 2;
      const hy = cy - h / 2;
      
      if (x >= hx && x <= hx + w && y >= hy && y <= hy + h) {
        return host;
      }
    }
    
    return null;
  }

  /**
   * Get filtered hosts
   */
  private getFilteredHosts(hosts: any[], selectedGroup: string): any[] {
    if (!selectedGroup) return hosts;
    return hosts.filter(h => h.group?.id === selectedGroup);
  }

  /**
   * Compute bounds
   */
  private computeBounds(hosts: any[]): { minX: number; minY: number; maxX: number; maxY: number } {
    const withCoords = hosts.filter(h => 
      Number.isFinite(h.coord_x) && Number.isFinite(h.coord_y)
    );
    
    if (!withCoords.length) {
      return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
    }
    
    const xs = withCoords.map(h => h.coord_x);
    const ys = withCoords.map(h => h.coord_y);
    
    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys)
    };
  }

  /**
   * Fit to view
   */
  private fitToView(): void {
    const state = this.getState();
    const hosts = this.getFilteredHosts(state.hosts, state.ui.selectedGroup);
    const bounds = this.computeBounds(hosts);
    const mapState = state.map;
    const padding = mapState.padding;
    
    if (!this.canvas) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const widthCells = (bounds.maxX - bounds.minX + 1) || 1;
    const heightCells = (bounds.maxY - bounds.minY + 1) || 1;
    const sx = (rect.width - padding * 2) / widthCells;
    const sy = (rect.height - padding * 2) / heightCells;
    const scale = Math.max(28, Math.floor(Math.min(sx, sy)));
    
    const gridW = widthCells * scale;
    const gridH = heightCells * scale;
    const offsetX = padding + Math.floor((rect.width - padding * 2 - gridW) / 2);
    const offsetY = padding + Math.floor((rect.height - padding * 2 - gridH) / 2);
    
    this.setStateSlice('map', {
      ...mapState,
      scale,
      offsetX,
      offsetY
    });
  }

  /**
   * Get color for host
   */
  private getColorForHost(host: any): string {
    const state = this.getState();
    
    if (host.session) {
      return getComputedStyle(document.documentElement).getPropertyValue('--busy').trim() || '#3b82f6';
    }
    
    const hasBooking = state.bookings.some(b => 
      b.hosts.some((bh: any) => bh.id == host.id)
    );
    
    if (hasBooking) {
      return getComputedStyle(document.documentElement).getPropertyValue('--booked').trim() || '#f59e0b';
    }
    
    return getComputedStyle(document.documentElement).getPropertyValue('--free').trim() || '#10b981';
  }

  /**
   * Get status emoji
   */
  private getStatusEmoji(host: any): string {
    const state = this.getState();
    
    if (host.session) return '●';
    
    const now = new Date();
    const hasActiveBooking = state.bookings.some(b => {
      const bookingStart = new Date(b.from);
      const bookingEnd = new Date(b.to);
      return b.hosts.some((bh: any) => bh.id == host.id) && 
             bookingStart <= now && bookingEnd > now;
    });
    
    if (hasActiveBooking) return '◆';
    
    const hasFutureBooking = state.bookings.some(b => {
      const bookingStart = new Date(b.from);
      return b.hosts.some((bh: any) => bh.id == host.id) && bookingStart > now;
    });
    
    if (hasFutureBooking) return '◇';
    
    return '○';
  }

  /**
   * Show tooltip
   */
  private showTooltip(host: any | null, x: number, y: number): void {
    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;

    if (!host) {
      tooltip.style.display = 'none';
      return;
    }

    let tooltipText = `${this.getStatusEmoji(host)} ${host.alias ?? 'Seat ' + host.id}`;
    if (host.group?.title) tooltipText += ` • ${host.group.title}`;

    const state = this.getState();
    const now = new Date();
    
    const activeBooking = state.bookings.find(b => {
      const bookingStart = new Date(b.from);
      const bookingEnd = new Date(b.to);
      return b.hosts.some((bh: any) => bh.id == host.id) && 
             bookingStart <= now && bookingEnd > now;
    });
    
    if (activeBooking) {
      const fromDate = new Date(activeBooking.from);
      const toDate = new Date(activeBooking.to);
      const dateStr = fromDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const fromTime = fromDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const toTime = toDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      tooltipText += `<br>◆ Booked: ${dateStr}, ${fromTime} - ${toTime}`;
      if (activeBooking.client?.nickname) {
        tooltipText += ` (${activeBooking.client.nickname})`;
      }
    } else {
      const futureBooking = state.bookings.find(b => {
        const bookingStart = new Date(b.from);
        return b.hosts.some((bh: any) => bh.id == host.id) && bookingStart > now;
      });
      
      if (futureBooking) {
        const fromDate = new Date(futureBooking.from);
        const dateStr = fromDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        const fromTime = fromDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', minute: '2-digit', hour12: false 
        });
        tooltipText += `<br>◇ Future: ${dateStr}, ${fromTime}`;
        if (futureBooking.client?.nickname) {
          tooltipText += ` (${futureBooking.client.nickname})`;
        }
      }
    }

    if (host.session) {
      tooltipText += host.session.user 
        ? `<br>● Playing: ${host.session.user}` 
        : `<br>● In Use`;
      
      let timeLeft = null;
      if (host.session.time_left && host.session.time_left > 0) {
        timeLeft = host.session.time_left;
      } else if (host.session.started_at && host.session.duration) {
        const start = new Date(host.session.started_at);
        const end = new Date(start.getTime() + host.session.duration * 1000);
        timeLeft = Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000));
      }
      
      if (timeLeft && timeLeft > 0) {
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        tooltipText += hours > 0 
          ? `<br>⏱ Remaining: ${hours}h ${minutes}m` 
          : `<br>⏱ Remaining: ${minutes}m`;
      }
    }

    tooltip.innerHTML = tooltipText;
    tooltip.style.display = 'block';

    // Position tooltip
    requestAnimationFrame(() => {
      const tooltipRect = tooltip.getBoundingClientRect();
      const offset = 20;
      
      let tooltipX = x + offset;
      let tooltipY = y + offset;
      
      if (tooltipX + tooltipRect.width > window.innerWidth - 10) {
        tooltipX = x - tooltipRect.width - offset;
      }
      
      if (tooltipY + tooltipRect.height > window.innerHeight - 10) {
        tooltipY = y - tooltipRect.height - offset;
      }
      
      tooltip.style.left = tooltipX + 'px';
      tooltip.style.top = tooltipY + 'px';
    });
  }

  /**
   * Draw the map
   */
  private draw(): void {
    if (!this.canvas || !this.ctx) return;

    // Cancel previous animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.animationFrameId = requestAnimationFrame(() => {
      this.resizeCanvas();
      
      const state = this.getState();
      const hosts = this.getFilteredHosts(state.hosts, state.ui.selectedGroup);
      const rect = this.canvas.getBoundingClientRect();
      
      // Clear canvas
      this.ctx.clearRect(0, 0, rect.width, rect.height);
      this.ctx.fillStyle = '#07121b';
      this.ctx.fillRect(0, 0, rect.width, rect.height);
      
      // Fit to view if needed
      if (!this.draw._fittedOnce) { 
        this.fitToView(); 
        this.draw._fittedOnce = true; 
      }
      
      const bounds = this.computeBounds(hosts);
      const mapState = state.map;
      
      // Draw grid
      this.ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      this.ctx.lineWidth = 1;
      
      for (let x = bounds.minX; x <= bounds.maxX + 1; x++) {
        const px = mapState.offsetX + (x - bounds.minX) * mapState.scale;
        this.ctx.beginPath();
        this.ctx.moveTo(px, mapState.offsetY);
        this.ctx.lineTo(px, rect.height - mapState.offsetY);
        this.ctx.stroke();
      }
      
      for (let y = bounds.minY; y <= bounds.maxY + 1; y++) {
        const py = mapState.offsetY + (y - bounds.minY) * mapState.scale;
        this.ctx.beginPath();
        this.ctx.moveTo(mapState.offsetX, py);
        this.ctx.lineTo(rect.width - mapState.offsetX, py);
        this.ctx.stroke();
      }
      
      // Draw hosts
      this.ctx.textBaseline = 'middle';
      this.ctx.font = '12px Inter, system-ui';
      
      for (const host of hosts) {
        if (!Number.isFinite(host.coord_x) || !Number.isFinite(host.coord_y)) continue;
        
        const gx = (host.coord_x - bounds.minX);
        const gy = (host.coord_y - bounds.minY);
        const cx = mapState.offsetX + gx * mapState.scale + mapState.scale / 2;
        const cy = mapState.offsetY + gy * mapState.scale + mapState.scale / 2;
        const w = Math.max(mapState.scale - 8, 36);
        const h = Math.max(mapState.scale - 8, 38);
        const x = cx - w / 2;
        const y = cy - h / 2;
        
        const isHovered = state.ui.hoveredHost && state.ui.hoveredHost.id === host.id;
        const isSelected = state.ui.selectedHosts.has(host.id);
        
        // Draw host box
        this.ctx.fillStyle = this.getColorForHost(host);
        if (isHovered) this.ctx.globalAlpha = 0.85;
        this.roundRect(x, y, w, h, 8);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
        
        // Draw selection border
        if (isSelected) {
          this.ctx.strokeStyle = '#00bcd4';
          this.ctx.lineWidth = 3;
          this.roundRect(x, y, w, h, 8);
          this.ctx.stroke();
        }
        
        // Draw status emoji
        const emoji = this.getStatusEmoji(host);
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#ffffff';
        const emojiWidth = this.ctx.measureText(emoji).width;
        this.ctx.fillText(emoji, cx - emojiWidth / 2, cy - 8);
        
        // Draw host label
        this.ctx.font = '11px Inter, system-ui';
        this.ctx.fillStyle = '#061226';
        const label = host.alias ?? '—';
        this.clipText(label, x + 8, cy + 8, w - 16);
        
        // Draw session info
        if (host.session) {
          this.ctx.fillStyle = 'rgba(184,195,211,0.9)';
          let timeText = '';
          
          if (host.session.time_left && host.session.time_left > 0) {
            const endTime = new Date(Date.now() + host.session.time_left * 1000);
            timeText = 'до ' + endTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', minute: '2-digit', hour12: false 
            });
          } else if (host.session.started_at && host.session.duration) {
            const start = new Date(host.session.started_at);
            const end = new Date(start.getTime() + host.session.duration * 1000);
            timeText = 'до ' + end.toLocaleTimeString('en-US', { 
              hour: '2-digit', minute: '2-digit', hour12: false 
            });
          }
          
          if (timeText) {
            this.clipText(timeText, x + 8, cy + 18, w - 16);
          }
        }
      }
    });
  }

  /**
   * Draw rounded rectangle
   */
  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    if (!this.ctx) return;
    
    const rr = Math.min(r, w / 2, h / 2);
    this.ctx.beginPath();
    this.ctx.moveTo(x + rr, y);
    this.ctx.arcTo(x + w, y, x + w, y + h, rr);
    this.ctx.arcTo(x + w, y + h, x, y + h, rr);
    this.ctx.arcTo(x, y + h, x, y, rr);
    this.ctx.arcTo(x, y, x + w, y, rr);
    this.ctx.closePath();
  }

  /**
   * Clip text to width
   */
  private clipText(text: string, x: number, midY: number, maxW: number): void {
    if (!this.ctx) return;
    
    let t = String(text ?? "");
    while (this.ctx.measureText(t).width > maxW && t.length > 1) {
      t = t.slice(0, -1);
    }
    
    if (t !== text && maxW > 10) {
      t = t.slice(0, -1) + '…';
    }
    
    this.ctx.fillText(t, x, midY);
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Hide tooltip
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
    
    super.destroy();
  }
}