/**
 * Host Entity
 * Represents a computer/host in the system
 * Follows Domain-Driven Design principles
 */
export interface Host {
  id: number | string;
  alias?: string | null;
  ip_addr?: string | null;
  coord_x?: number | null;
  coord_y?: number | null;
  group?: { id: string; title?: string } | null;
  session?: {
    user: string | null;
    started_at: string | null;
    duration: number | null;
    elapsed: number | null;
    time_left: number | null;
  } | null;
}

/**
 * Host creation data (without ID)
 */
export type CreateHostRequest = Omit<Host, 'id'>;

/**
 * Host update data (partial)
 */
export type UpdateHostRequest = Partial<CreateHostRequest>;

/**
 * Host Group entity
 */
export interface HostGroup {
  id: string;
  title?: string;
}