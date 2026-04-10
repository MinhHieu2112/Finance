import type { User } from '../../types/Users';

export interface AuthResponse {
  success: boolean;
  user: { id: string; username: string; email: string };
  token: string;
  message?: string;
}

export interface AuthScreenProps {
  onLogin: (user: User) => void;
}
