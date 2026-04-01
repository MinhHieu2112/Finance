import React, { useState } from 'react';
import { Button } from '../Button/Button';
import { User } from '../../types/Users';

const API_BASE_URL = 'http://localhost:4000/api';

interface AuthResponse {
  success: boolean;
  user: Pick<User, 'id' | 'username' | 'email'>;
  token: string;
  message?: string;
}

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

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

    if (!email || !password) {
      setError('Vui long nhap day du email va mat khau.');
      return;
    }

    if (!isLogin && !username.trim()) {
      setError('Vui long nhap ten dang nhap.');
      return;
    }

    try {
      setLoading(true);

      const endpoint = isLogin ? '/users/login' : '/users/register';
      const payload = isLogin
        ? { email, password }
        : {
            email,
            password,
            username: username.trim(),
          };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Xac thuc that bai. Vui long thu lai.');
        return;
      }

      onLogin({ ...data.user, token: data.token });
    } catch (err) {
      console.error(err);
      setError('Khong the ket noi den may chu. Vui long thu lai.');
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
            {isLogin ? 'Chào mừng trở lại! Vui lòng đăng nhập.' : 'Tạo tài khoản để bắt đầu quản lý.'}
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
                placeholder = "Nguyen Van A"
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
              placeholder = "ban@example.com"
              value       = {email}
              onChange    = {(e) => setEmail(e.target.value)}
              required
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
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" className="w-full mt-6" disabled={loading}>
            {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
};
