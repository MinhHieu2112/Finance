import type { Types } from 'mongoose';

export interface AuthTokenPayload {
  id: Types.ObjectId;
  email: string;
  username: string;
}

export interface AuthPublicUser {
  id: Types.ObjectId;
  username: string;
  email: string;
}

export interface AuthResult {
  user: AuthPublicUser;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface UserCategorySchema {
  userId: Types.ObjectId;
  catalogId: Types.ObjectId;
  name: string;
  description: string;
  type: 'income' | 'expense';
}

export interface UserDefaultCategorySchema {
  name: string;
  description?: string;
  type: 'income' | 'expense';
}
