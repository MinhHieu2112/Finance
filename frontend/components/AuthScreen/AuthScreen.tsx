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
      setError('Please enter both email and password.');
      return;
    }

    if (!isLogin && !username.trim()) {
      setError('Please enter a username.');
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

      const rawBody = await response.text();
      let data: Partial<AuthResponse> = {};

      if (rawBody) {
        try {
          data = JSON.parse(rawBody) as Partial<AuthResponse>;
        } catch (_parseError) {
          data = {};
        }
      }

      if (!response.ok || !data.success) {
        setError(data.message || 'Authentication failed. Please try again.');
        return;
      }

      onLogin({ ...(data.user as Pick<User, 'id' | 'username' | 'email'>), token: data.token as string });
    } catch (err) {
      console.error(err);
      setError('Unable to connect to the server. Please try again.');
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
            {isLogin ? 'Welcome back. Sign in to continue.' : 'Create your account to start managing your finances.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type        = "email"
              className   = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder = "you@example.com"
              value       = {email}
              onChange    = {(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
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
            {loading ? (isLogin ? 'Signing In...' : 'Creating Account...') : (isLogin ? 'Sign In' : 'Create Account')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            {isLogin ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};
