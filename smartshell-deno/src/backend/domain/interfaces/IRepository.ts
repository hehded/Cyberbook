/**
 * Generic Repository Interface
 * Follows Repository Pattern and SOLID principles
 * Provides abstraction for data access operations
 */
export interface IRepository<T, ID = string | number> {
  /**
   * Find an entity by its ID
   */
  findById(id: ID): Promise<T | null>;
  
  /**
   * Find all entities
   */
  findAll(): Promise<T[]>;
  
  /**
   * Find entities matching the filter criteria
   */
  find(filter: Partial<T>): Promise<T[]>;
  
  /**
   * Create a new entity
   */
  create(entity: Omit<T, 'id'>): Promise<T>;
  
  /**
   * Update an existing entity
   */
  update(id: ID, updates: Partial<T>): Promise<T>;
  
  /**
   * Delete an entity by ID
   */
  delete(id: ID): Promise<boolean>;
}

/**
 * Read-only repository interface for queries only
 * Follows Interface Segregation Principle
 */
export interface IReadOnlyRepository<T, ID = string | number> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  find(filter: Partial<T>): Promise<T[]>;
}

/**
 * Write-only repository interface for commands only
 * Follows Interface Segregation Principle
 */
export interface IWriteOnlyRepository<T, ID = string | number> {
  create(entity: Omit<T, 'id'>): Promise<T>;
  update(id: ID, updates: Partial<T>): Promise<T>;
  delete(id: ID): Promise<boolean>;
}