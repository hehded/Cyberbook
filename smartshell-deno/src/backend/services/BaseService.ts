/**
 * Base Service Class
 * Follows Template Method Pattern and SOLID principles
 * Provides common functionality for all services
 */
import { IService } from '../domain/interfaces/IService.ts';
import { IRepository } from '../domain/interfaces/IRepository.ts';

export abstract class BaseService<T, ID = string | number> implements IService<T, ID> {
  protected repository: IRepository<T, ID>;

  constructor(repository: IRepository<T, ID>) {
    this.repository = repository;
  }

  /**
   * Get an entity by its ID
   */
  async getById(id: ID): Promise<T | null> {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      console.error(`Error getting entity by ID ${id}:`, error);
      throw new Error(`Failed to get entity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all entities
   */
  async getAll(): Promise<T[]> {
    try {
      return await this.repository.findAll();
    } catch (error) {
      console.error('Error getting all entities:', error);
      throw new Error(`Failed to get entities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new entity
   */
  async create(data: any): Promise<T> {
    try {
      // Validate data before creation
      this.validateCreateData(data);
      
      return await this.repository.create(data);
    } catch (error) {
      console.error('Error creating entity:', error);
      throw new Error(`Failed to create entity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing entity
   */
  async update(id: ID, data: any): Promise<T> {
    try {
      // Validate data before update
      this.validateUpdateData(data);
      
      return await this.repository.update(id, data);
    } catch (error) {
      console.error(`Error updating entity with ID ${id}:`, error);
      throw new Error(`Failed to update entity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete an entity by ID
   */
  async delete(id: ID): Promise<boolean> {
    try {
      return await this.repository.delete(id);
    } catch (error) {
      console.error(`Error deleting entity with ID ${id}:`, error);
      throw new Error(`Failed to delete entity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find entities matching filter criteria
   */
  async find(filter: Partial<T>): Promise<T[]> {
    try {
      return await this.repository.find(filter);
    } catch (error) {
      console.error('Error finding entities:', error);
      throw new Error(`Failed to find entities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate data for creation (to be overridden by subclasses)
   */
  protected validateCreateData(data: any): void {
    // Default implementation - can be overridden
    if (!data) {
      throw new Error('Data is required for creation');
    }
  }

  /**
   * Validate data for update (to be overridden by subclasses)
   */
  protected validateUpdateData(data: any): void {
    // Default implementation - can be overridden
    if (!data) {
      throw new Error('Data is required for update');
    }
  }

  /**
   * Handle service errors consistently
   */
  protected handleError(error: unknown, context: string): never {
    console.error(`Error in ${context}:`, error);
    
    if (error instanceof Error) {
      // Re-throw known error types
      if (error.name === 'ValidationError' || 
          error.name === 'AuthenticationError' || 
          error.name === 'AuthorizationError' ||
          error.name === 'NotFoundError') {
        throw error;
      }
      
      // Wrap unknown errors
      throw new Error(`${context}: ${error.message}`);
    }
    
    throw new Error(`${context}: Unknown error occurred`);
  }
}