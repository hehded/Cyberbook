/**
 * User Entity
 * Represents a user in the system
 * Follows Domain-Driven Design principles
 */
export interface User {
  id: string;
  nickname: string;
  phone: string;
  deposit: number;
  bonus: number;
  login: string;
}

/**
 * User creation data (without ID)
 */
export type CreateUserRequest = Omit<User, 'id'>;

/**
 * User update data (partial)
 */
export type UpdateUserRequest = Partial<CreateUserRequest>;