import React, { useState } from 'react';
import type { ProfilePageProps } from './types';
import { User, Mail, Shield, Eye, EyeOff, Check } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import toast from 'react-hot-toast';

export const ProfilePage: React.FC<ProfilePageProps> = ({ user }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }
    if (newPassword.length < 4) {
      toast.error('Mật khẩu mới phải có ít nhất 4 ký tự!');
      return;
    }

    try {
      setIsLoading(true);
      await api.put('/users/change-password', { oldPassword, newPassword });
      toast.success('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Đổi mật khẩu thất bại. Vui lòng thử lại.'));
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition pr-10";

  return (
    <section className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        {/* Header Cover */}
        <div className="h-32 bg-gradient-to-r from-primary to-indigo-400 dark:from-indigo-900 dark:to-purple-900"></div>

        {/* Profile Info */}
        <div className="px-6 sm:px-10 pb-8">
          <div className="relative flex items-center mb-6">
            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shadow-md -mt-12 shrink-0">
              <User size={48} />
            </div>
            <div className="ml-5 mt-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.username}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Thành viên SmartFinance</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Info */}
            <div className="md:col-span-1 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">Thông tin cá nhân</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                    <User size={18} className="text-gray-400 dark:text-gray-500" />
                    <span className="font-medium">{user.username}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <Mail size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="truncate font-medium">{user.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Change Password */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">Đổi mật khẩu</h3>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-primary dark:text-indigo-400">
                      <Shield size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Bảo mật tài khoản</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Nhập mật khẩu hiện tại để xác thực và đặt mật khẩu mới</p>
                    </div>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    {/* Old Password */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Mật khẩu hiện tại</label>
                      <div className="relative">
                        <input
                          type={showOld ? 'text' : 'password'}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="Nhập mật khẩu hiện tại"
                          className={inputClass}
                          required
                        />
                        <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Mật khẩu mới</label>
                      <div className="relative">
                        <input
                          type={showNew ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Nhập mật khẩu mới (ít nhất 4 ký tự)"
                          className={inputClass}
                          required
                        />
                        <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Xác nhận mật khẩu mới</label>
                      <div className="relative">
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu mới"
                          className={inputClass}
                          required
                        />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {confirmPassword && newPassword && confirmPassword !== newPassword && (
                        <p className="text-xs text-red-500 mt-1">Mật khẩu xác nhận không khớp</p>
                      )}
                      {confirmPassword && newPassword && confirmPassword === newPassword && (
                        <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1"><Check size={12} /> Mật khẩu khớp</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 px-4 bg-primary hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                      ) : (
                        <Shield size={16} />
                      )}
                      {isLoading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;
