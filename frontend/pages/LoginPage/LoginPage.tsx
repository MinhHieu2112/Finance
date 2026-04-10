import React from 'react';
import { AuthScreen } from '../../components/AuthScreen/AuthScreen';
import type { LoginPageProps } from './types';

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  return <AuthScreen onLogin={onLogin} />;
};