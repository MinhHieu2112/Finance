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
		<div className="fixed inset-0 z-[60] bg-black/50 p-4 flex items-center justify-center" onClick={onClose}>
			<div
				className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="px-5 py-4 border-b border-gray-100 flex items-start gap-3">
					<div className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center ${isConfirm ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
						{isConfirm ? <AlertTriangle size={18} /> : <CircleAlert size={18} />}
					</div>
					<div className="flex-1">
						<h3 className="text-base font-semibold text-gray-900">
							{title || (isConfirm ? 'Please confirm' : 'Error')}
						</h3>
						<p className="mt-1 text-sm text-gray-600 break-words">{message}</p>
					</div>
				</div>

				<div className="px-5 py-4 flex items-center justify-end gap-2">
					{isConfirm ? (
						<>
							<Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
								{cancelText}
							</Button>
							<Button type="button" onClick={onConfirm} isLoading={isLoading}>
								{confirmText || 'Confirm'}
							</Button>
						</>
					) : (
						<Button type="button" onClick={onClose}>
							OK
						</Button>
					)}
				</div>
			</div>
		</div>
	);
};
