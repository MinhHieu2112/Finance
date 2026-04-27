import React, { useState } from 'react';
import { Button } from '../Button/Button';
import { api, getApiErrorMessage } from '../../lib/api';
import type { AuthResponse, AuthScreenProps } from './types';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin]   = useState(true);
  const [email, setEmail]       = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      const endpoint = isLogin ? '/users/login' : '/users/register';
      const payload = isLogin
        ? { email, password }
        : {
            email,
            password,
            username,
          };

      const response = await api.post<AuthResponse>(endpoint, payload);
      const data = response.data;

      if (!data.success) {
        const message = data.message || 'Vui lòng kiểm tra thông tin và thử lại.';
        setError(message);
        return;
      }

      onLogin({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        token: data.token,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            SmartFinance
          </h1>
          <p className="text-gray-500">
            {isLogin ? 'Chào mừng trở lại. Đăng nhập để tiếp tục.' : 'Tạo tài khoản của bạn để bắt đầu quản lý tài chính.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên đăng nhập
              </label>
              <input
                type        = "text"
                className   = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder = "john_doe"
                value       = {username}
                onChange    = {(e) => setUsername(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ Email</label>
            <input
              type        = "email"
              className   = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder = "you@example.com"
              value       = {email}
              onChange    = {(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input
              type        = "password"
              className   = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder = "••••••••"
              value       = {password}
              onChange    = {(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" className="w-full mt-6" disabled={loading}>
            {loading ? (isLogin ? 'Đang đăng nhập...' : 'Đang tạo tài khoản...') : (isLogin ? 'Đăng nhập' : 'Tạo tài khoản')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            {isLogin ? "Chưa có tài khoản? Tạo một cái" : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
};
