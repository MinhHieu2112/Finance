import React, { useState, useEffect } from 'react';
import { Phone, Lock, Key, ArrowRight, CheckCircle2, ShieldQuestion, Loader2, KeyRound } from 'lucide-react';
import { Button } from '../Button/Button';
import { api, getApiErrorMessage } from '../../lib/api';
import toast, { Toaster } from 'react-hot-toast';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [receivedOtp, setReceivedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/users/forgot-password/request', { phone });
      if (res.data.success) {
        const otpCode = res.data.otp;
        setReceivedOtp(otpCode);
        
        // Hiển thị toast OTP với bộ đếm ngược 10 giây
        toast.custom((t) => <OtpToast t={t} otpCode={otpCode} />, { duration: 10000, position: 'top-center' });

        setStep(2);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không tìm thấy tài khoản với số điện thoại này.'));
    } finally {
      setLoading(false);
    }
  };

  // Xác thực mã OTP người dùng nhập vào.
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === receivedOtp) {
      setStep(3);
      toast.success('Xác thực mã OTP thành công!');
    } else {
      toast.error('Mã OTP không chính xác. Vui lòng kiểm tra lại.');
    }
  };

  // Gửi yêu cầu đặt lại mật khẩu mới.
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/users/forgot-password/reset', {
        phone,
        otp: receivedOtp,
        newPassword
      });
      setStep(4);
      toast.success('Đổi mật khẩu thành công!');
      
      setTimeout(() => {
        onClose();
        resetForm();
      }, 3000);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Đã có lỗi xảy ra khi đặt lại mật khẩu.'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setPhone('');
    setOtp('');
    setReceivedOtp('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary dark:text-indigo-400">
                <ShieldQuestion size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Quên mật khẩu?</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">Nhập số điện thoại của bạn để nhận mã khôi phục.</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider ml-1">Số điện thoại</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                  <Phone size={18} />
                </div>
                <input
                  type="tel"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all dark:text-white font-medium"
                  placeholder="0912 xxx xxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full py-4 text-sm font-bold shadow-xl shadow-primary/20" isLoading={loading}>
              Gửi mã OTP <ArrowRight size={18} className="ml-2" />
            </Button>
          </form>
        );

      case 2:
        return (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400">
                <Key size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Xác thực mã OTP</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                Hệ thống đã gửi mã OTP. Vui lòng kiểm tra thông báo và nhập vào đây.
              </p>
            </div>
            
            <div className="space-y-4 pt-4">
              <input
                type="text"
                required
                maxLength={6}
                className="w-full text-center text-3xl font-black py-4 bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all dark:text-white tracking-[0.3em]"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
              <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">Nhập mã 6 chữ số</p>
            </div>

            <Button type="submit" className="w-full py-4 text-sm font-bold shadow-xl shadow-primary/20">
              Xác nhận mã <CheckCircle2 size={18} className="ml-2" />
            </Button>
          </form>
        );

      case 3:
        return (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-600 dark:text-purple-400">
                <Lock size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Đặt mật khẩu mới</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">Đảm bảo mật khẩu mới đủ mạnh và dễ nhớ.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider ml-1">Mật khẩu mới</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    min={4}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all dark:text-white font-medium"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider ml-1">Xác nhận mật khẩu</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                    <CheckCircle2 size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    min={4}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all dark:text-white font-medium"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full py-4 text-sm font-bold shadow-xl shadow-primary/20" isLoading={loading}>
              Hoàn tất đổi mật khẩu <ArrowRight size={18} className="ml-2" />
            </Button>
          </form>
        );

      case 4:
        return (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/40 animate-bounce">
              <CheckCircle2 size={48} className="text-white" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Xong rồi!</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">Mật khẩu của bạn đã được cập nhật thành công. <br />Đang quay lại trang đăng nhập...</p>
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <Toaster />
      {/* Lớp phủ nền */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" 
        onClick={loading ? undefined : onClose}
      />
      
      {/* Nội dung Modal */}
      <div className="relative bg-white dark:bg-slate-950 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in-up border border-white dark:border-slate-800">
        <div className="p-8 md:p-10">
          {renderStep()}

          {step < 4 && (
            <button 
              onClick={onClose}
              disabled={loading}
              className="w-full mt-6 text-sm text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 font-bold transition-colors disabled:opacity-50"
            >
              Hủy bỏ và quay lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Component thông báo OTP nhỏ gọn với bộ đếm ngược 10 giây.
const OtpToast = ({ t, otpCode }: { t: any; otpCode: string }) => {
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  return (
    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-[340px] w-full bg-white dark:bg-slate-900 shadow-2xl rounded-2xl pointer-events-auto flex border border-indigo-100 dark:border-slate-800 overflow-hidden`}>
      <div className="flex-1 p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-primary shrink-0">
          <KeyRound size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mã OTP (Demo)</p>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded-md">
              {timeLeft}s
            </span>
          </div>
          <p className="text-2xl font-black text-primary tracking-[0.15em] leading-none">{otpCode}</p>
        </div>
      </div>
      <button
        onClick={() => toast.dismiss(t.id)}
        className="px-4 border-l border-slate-50 dark:border-slate-800 text-xs font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/50"
      >
        Đóng
      </button>
    </div>
  );
};
