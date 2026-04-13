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
        const message = data.message || 'Authentication failed. Please try again.';
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
      setError(getApiErrorMessage(err, 'Unable to connect to the server. Please try again.'));
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
