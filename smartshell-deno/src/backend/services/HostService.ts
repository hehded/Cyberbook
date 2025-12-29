/**
 * Host Service Implementation
 * Implements host management logic with proper error handling and validation
 * Follows SOLID principles and dependency injection
 */
import { IHostService, HostStatus } from '../domain/interfaces/IService.ts';
import { HostRepository } from '../repositories/HostRepository.ts';
import { BookingRepository } from '../repositories/BookingRepository.ts';
import { HostValidator, LocationValidator } from '../validators/index.ts';
import { Host } from '../domain/entities/Host.ts';
import { Booking, BookingStatus } from '../domain/entities/Booking.ts';

/**
 * Custom error types for host operations
 */
export class HostError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HostError';
  }
}

/**
 * Host Service
 */
export class HostService implements IHostService {
  private hostRepository: HostRepository;
  private bookingRepository: BookingRepository;
  private hostValidator: HostValidator;
  private locationValidator: LocationValidator;

  constructor(
    hostRepository: HostRepository,
    bookingRepository: BookingRepository
  ) {
    this.hostRepository = hostRepository;
    this.bookingRepository = bookingRepository;
    this.hostValidator = new HostValidator();
    this.locationValidator = new LocationValidator();
  }

  /**
   * Get all hosts
   */
  async getAllHosts(): Promise<Host[]> {
    try {
      const hosts = await this.hostRepository.findAll();
      
      console.log(`Found ${hosts.length} hosts`);
      return hosts;
    } catch (error) {
      console.error('Get all hosts error:', error);
      throw new HostError(`Failed to get all hosts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get hosts by location
   */
  async getHostsByLocation(x: number, y: number, radius: number): Promise<Host[]> {
    try {
      // Validate location parameters
      const validation = this.locationValidator.validate({ x, y, radius });
      
      if (!validation.isValid) {
        throw new HostError(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const hosts = await this.hostRepository.findByLocation(x, y, radius);
      
      console.log(`Found ${hosts.length} hosts within radius ${radius} of (${x}, ${y})`);
      return hosts;
    } catch (error) {
      console.error('Get hosts by location error:', error);
      
      if (error instanceof HostError) {
        throw error;
      }
      
      throw new HostError(`Failed to get hosts by location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get host status
   */
  async getHostStatus(hostId: number): Promise<HostStatus> {
    try {
      if (!hostId) {
        throw new HostError('Host ID is required');
      }

      const host = await this.hostRepository.findById(hostId);
      
      if (!host) {
        throw new HostError(`Host with ID ${hostId} not found`);
      }

      // Determine if host is online (has IP address)
      const online = !!host.ip_addr;

      // Determine if host is in service (has active session)
      const inService = !!(host.session && host.session.user && host.session.started_at);

      // Get current session if in service
      let currentSession;
      if (inService) {
        // Find active booking for this host
        const activeBookings = await this.bookingRepository.findActiveBookingsForHosts([hostId]);
        
        if (activeBookings.length > 0) {
          const booking = activeBookings[0];
          currentSession = {
            id: booking.id.toString(),
            userId: host.session?.user || '',
            ip: host.ip_addr || undefined,
            userAgent: undefined,
            createdAt: new Date(booking.from),
            expiresAt: new Date(booking.to),
            isActive: true
          };
        }
      }

      const status: HostStatus = {
        online,
        inService,
        currentSession
      };

      console.log(`Retrieved status for host ${hostId}: online=${online}, inService=${inService}`);
      return status;
    } catch (error) {
      console.error('Get host status error:', error);
      
      if (error instanceof HostError) {
        throw error;
      }
      
      throw new HostError(`Failed to get host status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get host by ID
   */
  async getHostById(hostId: number): Promise<Host | null> {
    try {
      if (!hostId) {
        throw new HostError('Host ID is required');
      }

      const host = await this.hostRepository.findById(hostId);
      return host;
    } catch (error) {
      console.error('Get host by ID error:', error);
      
      if (error instanceof HostError) {
        throw error;
      }
      
      throw new HostError(`Failed to get host: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new host
   */
  async createHost(hostData: Omit<Host, 'id'>): Promise<Host> {
    try {
      // Validate host data
      const validation = this.hostValidator.validate(hostData);
      
      if (!validation.isValid) {
        throw new HostError(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const host = await this.hostRepository.create(hostData);
      
      console.log(`Created host with ID ${host.id}`);
      return host;
    } catch (error) {
      console.error('Create host error:', error);
      
      if (error instanceof HostError) {
        throw error;
      }
      
      throw new HostError(`Failed to create host: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing host
   */
  async updateHost(hostId: number, updates: Partial<Omit<Host, 'id'>>): Promise<Host> {
    try {
      if (!hostId) {
        throw new HostError('Host ID is required');
      }

      // Validate update data
      const validation = this.hostValidator.validateUpdate(updates);
      
      if (!validation.isValid) {
        throw new HostError(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const existingHost = await this.hostRepository.findById(hostId);
      
      if (!existingHost) {
        throw new HostError(`Host with ID ${hostId} not found`);
      }

      const updatedHost = await this.hostRepository.update(hostId, updates);
      
      console.log(`Updated host with ID ${hostId}`);
      return updatedHost;
    } catch (error) {
      console.error('Update host error:', error);
      
      if (error instanceof HostError) {
        throw error;
      }
      
      throw new HostError(`Failed to update host: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a host
   */
  async deleteHost(hostId: number): Promise<boolean> {
    try {
      if (!hostId) {
        throw new HostError('Host ID is required');
      }

      // Check if host has active bookings
      const activeBookings = await this.bookingRepository.findActiveBookingsForHosts([hostId]);
      
      if (activeBookings.length > 0) {
        throw new HostError(`Cannot delete host with ID ${hostId}: has active bookings`);
      }

      const deleted = await this.hostRepository.delete(hostId);
      
      if (deleted) {
        console.log(`Deleted host with ID ${hostId}`);
      } else {
        console.warn(`Host with ID ${hostId} not found for deletion`);
      }
      
      return deleted;
    } catch (error) {
      console.error('Delete host error:', error);
      
      if (error instanceof HostError) {
        throw error;
      }
      
      throw new HostError(`Failed to delete host: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available hosts (not in service)
   */
  async getAvailableHosts(): Promise<Host[]> {
    try {
      const availableHosts = await this.hostRepository.findAvailable();
      
      console.log(`Found ${availableHosts.length} available hosts`);
      return availableHosts;
    } catch (error) {
      console.error('Get available hosts error:', error);
      throw new HostError(`Failed to get available hosts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get hosts by group
   */
  async getHostsByGroup(groupId: string): Promise<Host[]> {
    try {
      if (!groupId) {
        throw new HostError('Group ID is required');
      }

      const hosts = await this.hostRepository.findByGroup(groupId);
      
      console.log(`Found ${hosts.length} hosts in group ${groupId}`);
      return hosts;
    } catch (error) {
      console.error('Get hosts by group error:', error);
      
      if (error instanceof HostError) {
        throw error;
      }
      
      throw new HostError(`Failed to get hosts by group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update host session information
   */
  async updateHostSession(hostId: number, sessionInfo: Host['session']): Promise<Host> {
    try {
      if (!hostId) {
        throw new HostError('Host ID is required');
      }

      const existingHost = await this.hostRepository.findById(hostId);
      
      if (!existingHost) {
        throw new HostError(`Host with ID ${hostId} not found`);
      }

      const updatedHost = await this.hostRepository.update(hostId, {
        session: sessionInfo
      });
      
      console.log(`Updated session for host ${hostId}`);
      return updatedHost;
    } catch (error) {
      console.error('Update host session error:', error);
      
      if (error instanceof HostError) {
        throw error;
      }
      
      throw new HostError(`Failed to update host session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}