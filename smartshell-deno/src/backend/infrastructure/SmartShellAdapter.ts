/**
 * SmartShell Adapter
 * Follows Adapter Pattern and SOLID principles
 * Provides abstraction over SmartShell SDK
 */
import { Host, Booking } from '../domain/entities/index.ts';

export class SmartShellAdapter {
  private shell: any;

  constructor() {
    // Import and initialize SmartShell SDK
    // This would be replaced with actual SDK import
    this.shell = null; // Placeholder
  }

  /**
   * Fetch all hosts from SmartShell API
   */
  async fetchHosts(): Promise<Host[]> {
    const query = `
      query {
        hosts {
          id
          alias
          ip_addr
          coord_x
          coord_y
          online
          in_service
          group { id title }
          client_sessions {
            id
            duration
            elapsed
            started_at
            finished_at
            time_left
            status
            client { nickname }
          }
        }
      }
    `;

    try {
      // This would use the actual SDK call
      // const res: any = await this.shell.call(query as any);
      
      // Mock implementation for now
      const res = await this.mockHostQuery();
      
      if (res?.errors?.length) {
        console.warn("[SmartShellAdapter] GraphQL errors:", res.errors);
        return [];
      }

      const raw = res?.data?.hosts ?? res?.hosts ?? [];
      if (!Array.isArray(raw)) return [];

      return raw.map(this.transformHostData).filter(Boolean) as Host[];
    } catch (error) {
      console.error("[SmartShellAdapter] Error fetching hosts:", error);
      return [];
    }
  }

  /**
   * Fetch bookings from SmartShell API
   */
  async fetchBookings(): Promise<Booking[]> {
    const now = new Date();
    const inWeek = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const formatDate = (date: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };
    
    const query = `
      query {
        getBookings(
          from: "${formatDate(now)}"
          to: "${formatDate(inWeek)}"
          status: "ACTIVE"
        ) {
          data {
            id
            from
            to
            status
            client {
              id
              nickname
              phone
            }
            hosts
          }
        }
      }
    `;

    try {
      // This would use the actual SDK call
      // const res: any = await this.shell.call(query as any);
      
      // Mock implementation for now
      const res = await this.mockBookingQuery();
      
      if (res?.errors?.length) {
        console.warn("[SmartShellAdapter] GraphQL errors:", res.errors);
        return [];
      }

      const bookingsData = res?.getBookings?.data ?? [];
      return bookingsData.map(this.transformBookingData);
    } catch (error) {
      console.error("[SmartShellAdapter] Error fetching bookings:", error);
      return [];
    }
  }

  /**
   * Authenticate client with SmartShell API
   */
  async authenticateClient(login: string, password: string): Promise<string | null> {
    const escapedPassword = password.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    
    const mutation = `
      mutation {
        clientLogin(input: {
          login: "${login}"
          password: "${escapedPassword}"
        }) {
          access_token
          token_type
          expires_in
        }
      }
    `;

    try {
      // This would use the actual SDK call
      // const result: any = await this.shell.call(mutation as any);
      
      // Mock implementation for now
      const result = await this.mockAuthentication(login, password);

      if (result?.errors?.length) {
        return null;
      }

      return result?.clientLogin?.access_token || null;
    } catch (error) {
      console.error("[SmartShellAdapter] Authentication error:", error);
      return null;
    }
  }

  /**
   * Transform raw host data from API to domain entity
   */
  private transformHostData = (raw: any): Host | null => {
    if (!raw || typeof raw !== "object") return null;

    let session = null;
    if (Array.isArray(raw.client_sessions) && raw.client_sessions.length > 0) {
      const active = raw.client_sessions.find((s: any) =>
        s && (!s.finished_at || s.finished_at === null || s.status === "ACTIVE")
      );
      if (active) {
        session = {
          user: active.client?.nickname ?? null,
          started_at: active.started_at ?? null,
          duration: active.duration ?? null,
          elapsed: active.elapsed ?? null,
          time_left: active.time_left ?? null,
        };
      }
    }

    const gx = raw.coord_x != null ? Number(raw.coord_x) : undefined;
    const gy = raw.coord_y != null ? Number(raw.coord_y) : undefined;
    const group = raw.group?.id
      ? { id: String(raw.group.id), title: raw.group.title ?? "" }
      : null;

    return {
      id: raw.id,
      alias: raw.alias ?? null,
      ip_addr: raw.ip_addr ?? null,
      coord_x: Number.isFinite(gx as number) ? gx : undefined,
      coord_y: Number.isFinite(gy as number) ? gy : undefined,
      group,
      session,
    } as Host;
  };

  /**
   * Transform raw booking data from API to domain entity
   */
  private transformBookingData = (raw: any): Booking => {
    const hostIds = Array.isArray(raw.hosts) ? raw.hosts : [raw.hosts];
    
    return {
      id: raw.id,
      from: raw.from,
      to: raw.to,
      status: raw.status,
      client: raw.client,
      hosts: hostIds.map((hostId: number) => ({
        id: hostId,
        alias: `PC ${hostId}`
      }))
    };
  };

  /**
   * Mock host query for development
   */
  private async mockHostQuery(): Promise<any> {
    // Mock data for development
    return {
      data: {
        hosts: [
          {
            id: 1,
            alias: "PC-01",
            ip_addr: "192.168.1.101",
            coord_x: 100,
            coord_y: 200,
            online: true,
            in_service: true,
            group: { id: "1", title: "Main Hall" },
            client_sessions: []
          },
          {
            id: 2,
            alias: "PC-02",
            ip_addr: "192.168.1.102",
            coord_x: 150,
            coord_y: 200,
            online: true,
            in_service: false,
            group: { id: "1", title: "Main Hall" },
            client_sessions: [
              {
                id: 1,
                duration: 3600,
                elapsed: 1800,
                started_at: "2023-01-01 10:00:00",
                finished_at: null,
                time_left: 1800,
                status: "ACTIVE",
                client: { nickname: "John Doe" }
              }
            ]
          }
        ]
      }
    };
  }

  /**
   * Mock booking query for development
   */
  private async mockBookingQuery(): Promise<any> {
    // Mock data for development
    return {
      getBookings: {
        data: [
          {
            id: 1,
            from: "2023-01-01 14:00:00",
            to: "2023-01-01 16:00:00",
            status: "ACTIVE",
            client: {
              id: 1,
              nickname: "John Doe",
              phone: "+37112345678"
            },
            hosts: [1, 2]
          }
        ]
      }
    };
  }

  /**
   * Mock authentication for development
   */
  private async mockAuthentication(loginParam: string, passwordParam: string): Promise<any> {
    // Mock authentication for demo user
    if (loginParam === "demo" && passwordParam === "demo") {
      return {
        clientLogin: {
          access_token: "mock-token-12345",
          token_type: "Bearer",
          expires_in: 3600
        }
      };
    }
    
    // Mock authentication for test user
    if (loginParam === "test" && passwordParam === "test") {
      return {
        clientLogin: {
          access_token: "mock-token-67890",
          token_type: "Bearer",
          expires_in: 3600
        }
      };
    }
    
    return { errors: [{ message: "Invalid credentials" }] };
  }
}