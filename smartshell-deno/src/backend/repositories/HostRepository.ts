/**
 * Host Repository Implementation
 * Implements repository pattern for Host entity
 * Follows SOLID principles and dependency injection
 */
import { IRepository } from '../domain/interfaces/IRepository.ts';
import { Host, CreateHostRequest, UpdateHostRequest, HostGroup } from '../domain/entities/Host.ts';

/**
 * In-memory implementation of HostRepository
 * In a real application, this would connect to a database
 */
export class HostRepository implements IRepository<Host, number> {
  private hosts: Map<number, Host> = new Map();
  private nextId: number = 1;

  constructor() {
    // Initialize with some default hosts
    this.seedData();
  }

  /**
   * Find a host by ID
   */
  async findById(id: number): Promise<Host | null> {
    try {
      const host = this.hosts.get(id);
      return host || null;
    } catch (error) {
      console.error(`Error finding host by ID ${id}:`, error);
      throw new Error(`Failed to find host: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find all hosts
   */
  async findAll(): Promise<Host[]> {
    try {
      return Array.from(this.hosts.values());
    } catch (error) {
      console.error('Error finding all hosts:', error);
      throw new Error(`Failed to find all hosts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find hosts matching filter criteria
   */
  async find(filter: Partial<Host>): Promise<Host[]> {
    try {
      const hosts = Array.from(this.hosts.values());
      
      if (!filter || Object.keys(filter).length === 0) {
        return hosts;
      }

      return hosts.filter(host => {
        return Object.entries(filter).every(([key, value]) => {
          return host[key as keyof Host] === value;
        });
      });
    } catch (error) {
      console.error('Error filtering hosts:', error);
      throw new Error(`Failed to filter hosts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new host
   */
  async create(hostData: CreateHostRequest): Promise<Host> {
    try {
      const id = this.nextId++;
      
      const newHost: Host = {
        id,
        ...hostData
      };
      
      this.hosts.set(id, newHost);
      return newHost;
    } catch (error) {
      console.error('Error creating host:', error);
      throw new Error(`Failed to create host: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing host
   */
  async update(id: number, updates: UpdateHostRequest): Promise<Host> {
    try {
      const existingHost = this.hosts.get(id);
      
      if (!existingHost) {
        throw new Error(`Host with ID ${id} not found`);
      }
      
      const updatedHost: Host = {
        ...existingHost,
        ...updates
      };
      
      this.hosts.set(id, updatedHost);
      return updatedHost;
    } catch (error) {
      console.error(`Error updating host with ID ${id}:`, error);
      throw new Error(`Failed to update host: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a host by ID
   */
  async delete(id: number): Promise<boolean> {
    try {
      const existed = this.hosts.has(id);
      this.hosts.delete(id);
      return existed;
    } catch (error) {
      console.error(`Error deleting host with ID ${id}:`, error);
      throw new Error(`Failed to delete host: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find hosts by location within a radius
   */
  async findByLocation(x: number, y: number, radius: number): Promise<Host[]> {
    try {
      const hosts = Array.from(this.hosts.values());
      
      return hosts.filter(host => {
        if (!host.coord_x || !host.coord_y) {
          return false;
        }
        
        const distance = Math.sqrt(
          Math.pow(host.coord_x - x, 2) + Math.pow(host.coord_y - y, 2)
        );
        
        return distance <= radius;
      });
    } catch (error) {
      console.error(`Error finding hosts by location (${x}, ${y}) with radius ${radius}:`, error);
      throw new Error(`Failed to find hosts by location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find hosts by group ID
   */
  async findByGroup(groupId: string): Promise<Host[]> {
    try {
      const hosts = Array.from(this.hosts.values());
      return hosts.filter(host => host.group?.id === groupId);
    } catch (error) {
      console.error(`Error finding hosts by group ${groupId}:`, error);
      throw new Error(`Failed to find hosts by group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find hosts by IP address
   */
  async findByIp(ipAddress: string): Promise<Host | null> {
    try {
      const hosts = Array.from(this.hosts.values());
      return hosts.find(host => host.ip_addr === ipAddress) || null;
    } catch (error) {
      console.error(`Error finding host by IP ${ipAddress}:`, error);
      throw new Error(`Failed to find host by IP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find hosts with active sessions
   */
  async findWithActiveSessions(): Promise<Host[]> {
    try {
      const hosts = Array.from(this.hosts.values());
      return hosts.filter(host => 
        host.session && 
        host.session.user && 
        host.session.started_at
      );
    } catch (error) {
      console.error('Error finding hosts with active sessions:', error);
      throw new Error(`Failed to find hosts with active sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find available hosts (not in service)
   */
  async findAvailable(): Promise<Host[]> {
    try {
      const hosts = Array.from(this.hosts.values());
      return hosts.filter(host => 
        !host.session || 
        !host.session.user || 
        !host.session.started_at
      );
    } catch (error) {
      console.error('Error finding available hosts:', error);
      throw new Error(`Failed to find available hosts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Seed initial data
   */
  private seedData(): void {
    const defaultHosts: CreateHostRequest[] = [
      {
        alias: 'Host-1',
        ip_addr: '192.168.1.10',
        coord_x: 10,
        coord_y: 20,
        group: { id: 'group1', title: 'Group 1' },
        session: null
      },
      {
        alias: 'Host-2',
        ip_addr: '192.168.1.11',
        coord_x: 15,
        coord_y: 25,
        group: { id: 'group1', title: 'Group 1' },
        session: null
      },
      {
        alias: 'Host-3',
        ip_addr: '192.168.1.12',
        coord_x: 5,
        coord_y: 15,
        group: { id: 'group2', title: 'Group 2' },
        session: null
      },
      {
        alias: 'Host-4',
        ip_addr: '192.168.1.13',
        coord_x: 20,
        coord_y: 30,
        group: { id: 'group2', title: 'Group 2' },
        session: {
          user: 'user1',
          started_at: new Date().toISOString(),
          duration: 3600,
          elapsed: 1800,
          time_left: 1800
        }
      }
    ];

    defaultHosts.forEach(host => {
      this.create(host);
    });
  }
}