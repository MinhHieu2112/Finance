import React from 'react';
import { AlertTriangle, CircleAlert } from 'lucide-react';
import { Button } from '../Button/Button';

type ToastModalType = 'error' | 'confirm';

type ToastModalProps = {
	isOpen: boolean;
	type?: ToastModalType;
	title?: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	isLoading?: boolean;
	onClose: () => void;
	onConfirm?: () => void | Promise<void>;
};

export const ToastModal: React.FC<ToastModalProps> = ({
	isOpen,
	type = 'error',
	title,
	message,
	confirmText,
	cancelText = 'Cancel',
	isLoading = false,
	onClose,
	onConfirm,
}) => {
	if (!isOpen) {
		return null;
	}

	const isConfirm = type === 'confirm';

	return (
		<div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center" onClick={onClose}>
			<div
				className="w-full max-w-md rounded-[2rem] bg-white dark:bg-[#1a1c26] shadow-2xl border border-gray-100 dark:border-[#2a2d3d] overflow-hidden transition-all"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="px-8 py-8 flex flex-col items-center text-center">
					<div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-6 shadow-lg ${isConfirm ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 shadow-amber-500/10' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 shadow-red-500/10'}`}>
						{isConfirm ? <AlertTriangle size={32} /> : <CircleAlert size={32} />}
					</div>
					
					<h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
						{title || (isConfirm ? 'Xác nhận hành động' : 'Đã xảy ra lỗi')}
					</h3>
					<p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed font-medium break-words px-4">{message}</p>
				</div>

				<div className="px-8 py-6 bg-gray-50/50 dark:bg-[#13151f]/50 border-t border-gray-100 dark:border-[#2a2d3d] flex items-center justify-center gap-3">
					{isConfirm ? (
						<>
							<Button type="button" variant="secondary" onClick={onClose} disabled={isLoading} className="flex-1">
								{cancelText}
							</Button>
							<Button type="button" onClick={onConfirm} isLoading={isLoading} className={`flex-1 shadow-lg ${isConfirm ? 'shadow-amber-500/10' : 'shadow-red-500/10'}`}>
								{confirmText || 'Xác nhận'}
							</Button>
						</>
					) : (
						<Button type="button" onClick={onClose} className="w-full shadow-lg shadow-indigo-600/10">
							Đã hiểu
						</Button>
					)}
				</div>
			</div>
		</div>
	);
};
