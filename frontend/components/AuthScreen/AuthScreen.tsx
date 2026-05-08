import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, Lock, User, ArrowRight, ShieldCheck, TrendingUp, Zap, Phone } from 'lucide-react';
import { Button } from '../Button/Button';
import { api, getApiErrorMessage } from '../../lib/api';
import { ForgotPasswordModal } from '../ForgotPasswordModal/ForgotPasswordModal';
import type { AuthResponse, AuthScreenProps } from './types';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin]   = useState(true);
  const [email, setEmail]       = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Xử lý gửi biểu mẫu đăng nhập hoặc đăng ký.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const endpoint = isLogin ? '/users/login' : '/users/register';
      const payload = isLogin
        ? { email, password }
        : {
            email,
            password,
            username,
            phone,
          };

      const response = await api.post<AuthResponse>(endpoint, payload);
      const data = response.data;

      if (!data.success) {
        const message = data.message || 'Vui lòng kiểm tra thông tin và thử lại.';
        toast.error(message);
        return;
      }

      toast.success(isLogin ? 'Đăng nhập thành công!' : 'Đăng ký tài khoản thành công!');
      onLogin({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        token: data.token,
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-white dark:bg-slate-950 font-sans selection:bg-indigo-100 selection:text-indigo-600">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>

      {/* Left side: Branding & Marketing (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-600 overflow-hidden items-center justify-center p-12">
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/30 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 max-w-lg text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
              <Zap className="w-7 h-7 text-white" fill="white" />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black tracking-tight text-white leading-tight">Smart</span>
              <span className="text-xs font-black tracking-[0.4em] text-indigo-200 uppercase leading-none -mt-1">Finance</span>
            </div>
          </div>

          <h2 className="text-5xl font-bold leading-tight mb-6">
            Làm chủ tài chính, <br />
            <span className="text-indigo-200">Kiến tạo tương lai.</span>
          </h2>
          
          <p className="text-lg text-indigo-100/80 mb-12 leading-relaxed">
            Hệ thống quản lý tài chính thông minh tích hợp AI giúp bạn theo dõi chi tiêu, 
            phân tích xu hướng và đạt được các mục tiêu tiết kiệm nhanh hơn bao giờ hết.
          </p>

          <div className="grid grid-cols-1 gap-6">
            <FeatureItem 
              icon={<TrendingUp className="w-6 h-6" />} 
              title="Phân tích chuyên sâu" 
              desc="Theo dõi dòng tiền và dự báo chi tiêu thông minh bằng thuật toán AI." 
            />
            <FeatureItem 
              icon={<ShieldCheck className="w-6 h-6" />} 
              title="Bảo mật tuyệt đối" 
              desc="Dữ liệu của bạn được mã hóa và bảo vệ an toàn theo tiêu chuẩn ngân hàng." 
            />
          </div>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12 bg-gray-50 dark:bg-slate-900 transition-colors">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Logo for mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <Zap className="w-8 h-8 text-indigo-600" fill="currentColor" />
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">Smart</span>
              <span className="text-[9px] font-black tracking-[0.3em] text-indigo-600 dark:text-indigo-500 uppercase leading-none -mt-0.5">Finance</span>
            </div>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
              {isLogin ? 'Chào mừng trở lại!' : 'Bắt đầu hành trình'}
            </h2>
            <p className="text-gray-500 dark:text-slate-400">
              {isLogin 
                ? 'Đăng nhập vào hệ thống để tiếp tục quản lý tài chính.' 
                : 'Đăng ký tài khoản mới để trải nghiệm đầy đủ tính năng.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 ml-1">Tên đăng nhập</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 shadow-sm"
                    placeholder="Nguyễn Văn A"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 ml-1">Số điện thoại</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Phone size={18} />
                  </div>
                  <input
                    type="tel"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 shadow-sm"
                    placeholder="0912 xxx xxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 ml-1">Địa chỉ Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 shadow-sm"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Mật khẩu</label>
                {isLogin && (
                  <button 
                    type="button" 
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 shadow-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>



            <Button type="submit" className="w-full py-3.5 text-sm font-bold shadow-lg shadow-indigo-500/20" disabled={loading} isLoading={loading}>
              {isLogin ? 'Đăng nhập ngay' : 'Tạo tài khoản'}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 dark:border-slate-800 text-center">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {isLogin ? "Bạn là người mới?" : 'Đã có tài khoản?'}
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="ml-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold decoration-indigo-200 underline-offset-4 hover:underline"
              >
                {isLogin ? "Tham gia ngay" : 'Đăng nhập tại đây'}
              </button>
            </p>
          </div>
        </div>
      </div>

      <ForgotPasswordModal 
        isOpen={isForgotModalOpen} 
        onClose={() => setIsForgotModalOpen(false)} 
      />
    </div>
  );
};

const FeatureItem = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="flex gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <div>
      <h4 className="font-bold text-white mb-1">{title}</h4>
      <p className="text-sm text-indigo-100/60 leading-relaxed">{desc}</p>
    </div>
  </div>
);
