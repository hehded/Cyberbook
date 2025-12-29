/**
 * User Repository Implementation
 * Implements repository pattern for User entity
 * Follows SOLID principles and dependency injection
 */
import { IRepository } from '../domain/interfaces/IRepository.ts';
import { User, CreateUserRequest, UpdateUserRequest } from '../domain/entities/User.ts';

/**
 * In-memory implementation of UserRepository
 * In a real application, this would connect to a database
 */
export class UserRepository implements IRepository<User, string> {
  private users: Map<string, User> = new Map();
  private nextId: number = 1;

  constructor() {
    // Initialize with some default users
    this.seedData();
  }

  /**
   * Find a user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      const user = this.users.get(id);
      return user || null;
    } catch (error) {
      console.error(`Error finding user by ID ${id}:`, error);
      throw new Error(`Failed to find user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find all users
   */
  async findAll(): Promise<User[]> {
    try {
      return Array.from(this.users.values());
    } catch (error) {
      console.error('Error finding all users:', error);
      throw new Error(`Failed to find all users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find users matching filter criteria
   */
  async find(filter: Partial<User>): Promise<User[]> {
    try {
      const users = Array.from(this.users.values());
      
      if (!filter || Object.keys(filter).length === 0) {
        return users;
      }

      return users.filter(user => {
        return Object.entries(filter).every(([key, value]) => {
          return user[key as keyof User] === value;
        });
      });
    } catch (error) {
      console.error('Error filtering users:', error);
      throw new Error(`Failed to filter users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new user
   */
  async create(userData: CreateUserRequest): Promise<User> {
    try {
      const id = this.nextId.toString();
      this.nextId++;
      
      const newUser: User = {
        id,
        ...userData
      };
      
      this.users.set(id, newUser);
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing user
   */
  async update(id: string, updates: UpdateUserRequest): Promise<User> {
    try {
      const existingUser = this.users.get(id);
      
      if (!existingUser) {
        throw new Error(`User with ID ${id} not found`);
      }
      
      const updatedUser: User = {
        ...existingUser,
        ...updates
      };
      
      this.users.set(id, updatedUser);
      return updatedUser;
    } catch (error) {
      console.error(`Error updating user with ID ${id}:`, error);
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a user by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      const existed = this.users.has(id);
      this.users.delete(id);
      return existed;
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find user by login
   */
  async findByLogin(login: string): Promise<User | null> {
    try {
      const users = Array.from(this.users.values());
      return users.find(user => user.login === login) || null;
    } catch (error) {
      console.error(`Error finding user by login ${login}:`, error);
      throw new Error(`Failed to find user by login: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Seed initial data
   */
  private seedData(): void {
    const defaultUsers: CreateUserRequest[] = [
      {
        nickname: 'admin',
        phone: '+1234567890',
        deposit: 1000,
        bonus: 100,
        login: 'admin'
      },
      {
        nickname: 'user1',
        phone: '+0987654321',
        deposit: 500,
        bonus: 50,
        login: 'user1'
      }
    ];

    defaultUsers.forEach(user => {
      this.create(user);
    });
  }
}