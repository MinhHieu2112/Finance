import React, { useState } from 'react';
import { ScanText, X } from 'lucide-react';
import { Button } from '../Button/Button';
import { api, getApiErrorMessage } from '../../lib/api';
import type { OCRResponse, ReceiptOCRPanelProps, TransactionPayload } from './types';

// Bảng điều khiển quét hóa đơn, sử dụng công nghệ OCR để tự động trích xuất thông tin giao dịch từ ảnh tải lên.
export const ReceiptOCRPanel: React.FC<ReceiptOCRPanelProps> = ({
	isOpen,
	onClose,
	onDraftPrepared,
}) => {
	const [receiptFile, setReceiptFile] = useState<File | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (!isOpen) {
		return null;
	}

	const resetAndClose = () => {
		setReceiptFile(null);
		setError(null);
		onClose();
	};

	const handleReceiptOCR = async () => {
		try {
			setError(null);
			setIsSubmitting(true);

			const formData = new FormData();
			if (receiptFile) {
				formData.append('receipt', receiptFile);
			}

			const mcpResponse = await api.post('/nlp/mcp-tools', formData);
			const orchestrationData = mcpResponse.data
			// const receiptPayload = orchestrationData?.result?.data || orchestrationData?.result || orchestrationData;

			const receiptData = await api.post<OCRResponse>(
				'/nlp/add-by-receipt-image',
				{ data: orchestrationData.result }
			);

			const data = receiptData.data;
			onDraftPrepared(data.result[0] as TransactionPayload);
			resetAndClose();
		} catch (submitError) {
			setError(getApiErrorMessage(submitError, 'Không thể xử lý hóa đơn này ngay bãy giờ.'));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center" onClick={resetAndClose}>
			<div
				className="w-full max-w-xl bg-white dark:bg-[#1a1c26] rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-[#2a2d3d] transition-colors"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="px-6 py-4 border-b border-gray-100 dark:border-[#2a2d3d] flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-sm">
							<ScanText size={20} />
						</div>
						<div>
						<h2 className="text-lg font-bold text-gray-900 dark:text-white">Quét Hóa Đơn</h2>
						<p className="text-xs text-gray-500 dark:text-slate-400">Tự động trích xuất thông tin từ ảnh hóa đơn.</p>
						</div>
					</div>
					<button type="button" onClick={resetAndClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors p-1.5" aria-label="Close">
						<X size={22} />
					</button>
				</div>

				<div className="px-6 py-8 space-y-6 max-h-[65vh] overflow-y-auto">
					<div className="space-y-2">
						<label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Chọn tệp hình ảnh</label>
						<input
							type="file"
							accept="image/*"
							onChange={(event) => setReceiptFile(event.target.files?.[0] || null)}
							className="block w-full text-sm text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-[#2a2d3d] bg-gray-50 dark:bg-[#13151f] rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-primary dark:file:text-indigo-400 hover:file:bg-indigo-100 transition-all cursor-pointer"
						/>
					</div>

					<Button onClick={handleReceiptOCR} isLoading={isSubmitting} className="w-full py-3 shadow-lg shadow-primary/20">
						<ScanText size={18} />
						Trích xuất và xem lại giao dịch
					</Button>
					{error && (
						<div className="rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 text-sm font-medium flex items-center gap-2">
							<div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
							{error}
						</div>
					)}
				</div>

				<div className="px-6 py-4 bg-gray-50/50 dark:bg-[#13151f]/50 border-t border-gray-100 dark:border-[#2a2d3d] flex justify-end">
					<Button variant="secondary" onClick={resetAndClose}>Hủy bỏ</Button>
				</div>
			</div>
		</div>
	);
};
