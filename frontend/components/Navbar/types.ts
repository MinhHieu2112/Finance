import type { User } from '../../types/Users';

export interface NavbarProps {
  user: User;
  onLogout: () => void;
}
