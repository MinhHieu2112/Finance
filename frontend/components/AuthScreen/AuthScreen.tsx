import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Phone, Chrome, Facebook, Linkedin } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import { ForgotPasswordModal } from '../ForgotPasswordModal/ForgotPasswordModal';
import type { AuthResponse, AuthScreenProps } from './types';
import './AuthScreen.css';


export const AuthScreen = ({ onLogin }: AuthScreenProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const endpoint = isLogin ? '/users/login' : '/users/register';
      const payload = isLogin
        ? { email, password }
        : { email, password, username, phone };

      const response = await api.post<AuthResponse>(endpoint, payload);
      const data = response.data;

      if (!data.success) {
        toast.error(data.message || 'Vui lòng kiểm tra thông tin.');
        return;
      }

      toast.success(isLogin ? 'Đăng nhập thành công!' : 'Đăng ký thành công!');
      onLogin({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        token: data.token,
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Thao tác thất bại.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] dark:bg-slate-950 p-4 font-sans transition-colors duration-500">
      <div className={`auth-container ${!isLogin ? 'right-panel-active' : ''} dark:bg-slate-900 border-none`}>
        {/* Sign Up Form */}
        <div className="form-container sign-up-container bg-white dark:bg-slate-900">
          <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center h-full px-12 text-center">
            <h1 className="text-3xl font-black text-primary mb-2">Tạo tài khoản</h1>
            <div className="social-container">
              <a href="#" className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"><Facebook size={18} /></a>
              <a href="#" className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"><Chrome size={18} /></a>
              <a href="#" className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"><Linkedin size={18} /></a>
            </div>
            <span className="text-xs text-slate-400 mb-4">hoặc sử dụng email để đăng ký</span>
            
            <div className="w-full space-y-3">
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" placeholder="Họ và tên" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
                  value={username} onChange={(e) => setUsername(e.target.value)} required
                />
              </div>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" placeholder="Email" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
                  value={email} onChange={(e) => setEmail(e.target.value)} required
                />
              </div>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="tel" placeholder="Số điện thoại" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
                  value={phone} onChange={(e) => setPhone(e.target.value)} required
                />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password" placeholder="Mật khẩu" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
                  value={password} onChange={(e) => setPassword(e.target.value)} required
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="mt-6 px-10 py-2.5 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary transition-all active:scale-95 shadow-lg shadow-primary/25"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Đăng ký'}
            </button>
          </form>
        </div>

        {/* Sign In Form */}
        <div className="form-container sign-in-container bg-white dark:bg-slate-900">
          <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center h-full px-12 text-center">
            <h1 className="text-3xl font-black text-primary mb-2">Đăng nhập</h1>
            <div className="social-container">
              <a href="#" className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"><Facebook size={18} /></a>
              <a href="#" className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"><Chrome size={18} /></a>
              <a href="#" className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"><Linkedin size={18} /></a>
            </div>
            <span className="text-xs text-slate-400 mb-4">hoặc sử dụng tài khoản của bạn</span>
            
            <div className="w-full space-y-3">
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" placeholder="Email" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
                  value={email} onChange={(e) => setEmail(e.target.value)} required
                />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password" placeholder="Mật khẩu" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
                  value={password} onChange={(e) => setPassword(e.target.value)} required
                />
              </div>
            </div>
            
            <button 
              type="button" 
              onClick={() => setIsForgotModalOpen(true)}
              className="mt-4 text-xs text-slate-400 hover:text-primary transition-colors"
            >
              Quên mật khẩu?
            </button>
            
            <button 
              type="submit" 
              className="mt-6 px-10 py-2.5 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary transition-all active:scale-95 shadow-lg shadow-primary/25"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>
        </div>

        {/* Overlay */}
        <div className="overlay-container hidden md:block">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1 className="text-3xl font-black mb-4">Chào mừng trở lại!</h1>
              <p className="text-sm leading-relaxed mb-8 opacity-90">Để giữ kết nối với chúng tôi, vui lòng đăng nhập bằng thông tin cá nhân của bạn</p>
              <button 
                className="px-10 py-2.5 border border-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-primary transition-all active:scale-95"
                onClick={() => setIsLogin(true)}
              >
                Đăng nhập
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1 className="text-3xl font-black mb-4">Chào bạn!</h1>
              <p className="text-sm leading-relaxed mb-8 opacity-90">Nhập thông tin cá nhân của bạn và bắt đầu hành trình quản lý tài chính thông minh</p>
              <button 
                className="px-10 py-2.5 border border-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-primary transition-all active:scale-95"
                onClick={() => setIsLogin(false)}
              >
                Đăng ký
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Toggle Link */}
        <div className="md:hidden absolute bottom-6 left-0 w-full text-center z-10">
          <p className="text-sm text-slate-500">
            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-primary font-bold"
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </div>

      <ForgotPasswordModal 
        isOpen={isForgotModalOpen} 
        onClose={() => setIsForgotModalOpen(false)} 
      />
    </div>
  );
};
