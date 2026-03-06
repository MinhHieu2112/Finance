import React from 'react';
import { AuthScreen } from '../components/Auth/AuthScreen';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  return <AuthScreen onLogin={onLogin} />;
};