import React from 'react';
import { AuthScreen } from '../../components/AuthScreen/AuthScreen';
import type { LoginPageProps } from './types';

// Trang đăng nhập và đăng ký tài khoản tập trung
export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  return <AuthScreen onLogin={onLogin} />;
};