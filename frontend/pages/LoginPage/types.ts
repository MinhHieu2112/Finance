import type { User } from '../../types/Users';

export interface LoginPageProps {
  onLogin: (user: User) => void;
}
