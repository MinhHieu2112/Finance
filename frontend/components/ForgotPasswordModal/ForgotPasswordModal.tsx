import React, { useState, useEffect } from 'react';
import { Phone, Lock, Key, ArrowRight, CheckCircle2, ShieldQuestion, Clock, Loader2, KeyRound } from 'lucide-react';
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
        
        // Show OTP in toast for 20 seconds as requested
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-slate-900 shadow-2xl rounded-[2rem] pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-2 border-indigo-500 overflow-hidden`}>
            <div className="flex-1 w-0 p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600">
                    <KeyRound size={24} />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Mã xác thực OTP (Demo)</p>
                  <p className="mt-1 text-4xl font-black text-indigo-600 tracking-[0.2em]">{otpCode}</p>
                  <p className="mt-2 text-[10px] text-gray-400 font-bold uppercase">Mã này sẽ biến mất sau 20 giây</p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200 dark:border-slate-800">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-bold text-indigo-600 hover:text-indigo-500 focus:outline-none"
              >
                Đóng
              </button>
            </div>
          </div>
        ), { duration: 20000, position: 'top-center' });

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
    setError(null);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
                <ShieldQuestion size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Quên mật khẩu?</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">Nhập số điện thoại của bạn để nhận mã khôi phục.</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider ml-1">Số điện thoại</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                  <Phone size={18} />
                </div>
                <input
                  type="tel"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-white font-medium"
                  placeholder="0912 xxx xxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full py-4 text-sm font-bold shadow-xl shadow-indigo-500/20" isLoading={loading}>
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
                className="w-full text-center text-3xl font-black py-4 bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-white tracking-[0.3em]"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
              <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">Nhập mã 6 chữ số</p>
            </div>

            <Button type="submit" className="w-full py-4 text-sm font-bold shadow-xl shadow-indigo-500/20">
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
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    min={4}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-white font-medium"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider ml-1">Xác nhận mật khẩu</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <CheckCircle2 size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    min={4}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-white font-medium"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full py-4 text-sm font-bold shadow-xl shadow-indigo-500/20" isLoading={loading}>
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
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <Toaster />
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" 
        onClick={loading ? undefined : onClose}
      />
      
      {/* Modal Content */}
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
function setError(arg0: null) {
  throw new Error('Function not implemented.');
}

