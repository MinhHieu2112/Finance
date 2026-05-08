import React, { useState } from 'react';
import { Button } from '../Button/Button';
import { Sparkles, X } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import type {
	AddQueryResponse,
	AIAssistantModalProps,
	DraftPreparationResponse,
	OrchestratorResponse,
	QuerySummary,
} from './types';

import { formatCurrency } from '../../lib/currencies';
import { Currency } from '../../types/Transactions';

const formatMoney = (value: number) => formatCurrency(value, Currency.VND);

// Cửa sổ trợ lý AI, cho phép người dùng nhập yêu cầu bằng ngôn ngữ tự nhiên để thêm giao dịch hoặc truy vấn dữ liệu.
export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
	isOpen,
	onClose,
	onDraftsPrepared,
}) => {
	const [prompt, setPrompt] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [detectedIntent, setDetectedIntent] = useState<'add' | 'query' | null>(null);
	const [queryResult, setQueryResult] = useState<QuerySummary | null>(null);

	if (!isOpen) {
		return null;
	}

	const handleUnifiedPrompt = async () => {
		try {
			setError(null);
			setIsSubmitting(true);
			setQueryResult(null);
			setDetectedIntent(null);

			const formData = new FormData();
			formData.append('prompt', prompt);

			const mcpResponse = await api.post<OrchestratorResponse>('/nlp/mcp-tools', formData);
			const orchestrationData = mcpResponse.data;

			const addQueryResponse = await api.post<AddQueryResponse>('/nlp/add&query',
				{ data: orchestrationData.result },
			);

			const addQueryData = addQueryResponse.data;
			setDetectedIntent(addQueryData.result.intent);

			if (addQueryData.result.intent === 'add') {				
				const draftData = addQueryData.result.data || [];

				if (!draftData.length) {
								setError('AI không trích xuất được bất kỳ giao dịch nào từ lần này.');
				}

				onDraftsPrepared(draftData);
				resetAndClose();
				return;
			}

			const matched = addQueryData.result.data || [];
			const total = matched.reduce((sum, transaction) => sum + (Number(transaction.total_amount) || 0), 0);
			setQueryResult({
				answer: matched.length
					? `Tìm thấy ${matched.length} giao dịch, tổng cộng ${formatMoney(total)}.`
					: 'Không tìm thấy giao dịch nào!.',
				total,
				count: matched.length,
				transactions: matched,
			});

		} catch (submitError) {
			setError(getApiErrorMessage(submitError, 'Hết lượt hỏi ! Vui lòng nâng cấp lên Pro trên AI Assistant.'));
		} finally {
			setIsSubmitting(false);
		}
	};

	const resetAndClose = () => {
		setError(null);
		setDetectedIntent(null);
		setQueryResult(null);
		onClose();
	};

	return (
		<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center" onClick={resetAndClose}>
			<div 
				className="w-full max-w-2xl bg-white dark:bg-[#1a1c26] rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-[#2a2d3d] transition-colors"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="px-6 py-4 border-b border-gray-100 dark:border-[#2a2d3d] flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
							<Sparkles size={20} />
						</div>
						<div>
						<h2 className="text-lg font-bold text-gray-900 dark:text-white">Trợ lý AI</h2>
						<p className="text-xs text-gray-500 dark:text-slate-400">Sử dụng ngôn ngữ tự nhiên để thao tác.</p>
						</div>
					</div>
					<button type="button" onClick={resetAndClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors p-1.5" aria-label="Close">
						<X size={22} />
					</button>
				</div>

				<div className="px-6 py-8 space-y-6 max-h-[75vh] overflow-y-auto">
					<div className="space-y-4">
						<div className="space-y-2">
							<label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nhập yêu cầu của bạn</label>
							<textarea
								value={prompt}
								onChange={(event) => setPrompt(event.target.value)}
								rows={4}
								placeholder="Ví dụ: 'Hôm nay tôi đã chi 50k ăn sáng' hoặc 'Tháng này tôi đã tiêu bao nhiêu tiền?'"
								className="w-full rounded-2xl border border-gray-200 dark:border-[#2a2d3d] bg-gray-50 dark:bg-[#13151f] p-4 text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all leading-relaxed"
							/>
						</div>
						
						<Button onClick={handleUnifiedPrompt} isLoading={isSubmitting} className="w-full py-3 shadow-lg shadow-indigo-600/20">
							<Sparkles size={18} className="mr-2" />
							Gửi yêu cầu tới AI
						</Button>

						{detectedIntent && (
							<div className="rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-4 py-2 text-[10px] font-black uppercase tracking-widest w-fit">
								Mục đích: {detectedIntent === 'add' ? 'Thêm giao dịch' : 'Truy vấn'}
							</div>
						)}

						{queryResult && (
							<div className="space-y-4 rounded-2xl border border-gray-100 dark:border-[#2a2d3d] bg-gray-50/50 dark:bg-[#13151f]/50 p-6">
								<div className="flex items-start gap-3">
									<div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-indigo-600/20">
										<Sparkles size={14} className="text-white" />
									</div>
									<div className="flex-1">
										<p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Câu trả lời từ AI</p>
										<p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{queryResult.answer}</p>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="rounded-xl border border-gray-100 dark:border-[#2a2d3d] bg-white dark:bg-[#1a1c26] p-4 shadow-sm">
										<p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Tổng cộng</p>
										<p className="text-lg font-black text-slate-900 dark:text-white">{formatMoney(queryResult.total)}</p>
									</div>
									<div className="rounded-xl border border-gray-100 dark:border-[#2a2d3d] bg-white dark:bg-[#1a1c26] p-4 shadow-sm">
										<p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Số lượng</p>
										<p className="text-lg font-black text-slate-900 dark:text-white">{queryResult.count} <span className="text-xs font-medium text-slate-500 lowercase">giao dịch</span></p>
									</div>
								</div>

								{queryResult.transactions.length > 0 && (
									<div className="space-y-3 pt-4 border-t border-gray-200 dark:border-[#2a2d3d]">
										<p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1">Chi tiết kết quả</p>
										<div className="space-y-2 max-h-56 overflow-y-auto pr-1">
											{queryResult.transactions.map((transaction) => (
												<div key={transaction._id} className="rounded-xl border border-gray-100 dark:border-[#2a2d3d] bg-white dark:bg-[#1a1c26] px-4 py-3 hover:border-indigo-500/30 transition-all group">
													<div className="flex justify-between items-start mb-1">
														<p className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-indigo-600 transition-colors">{transaction.description}</p>
														<span className="text-xs font-black text-slate-900 dark:text-white">{formatMoney(transaction.total_amount)}</span>
													</div>
													<div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
														<span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase tracking-tighter">
															{transaction.details[0]?.categoryName || 'Other'}
														</span>
														<span>•</span>
														<span>{transaction.date}</span>
													</div>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						)}
					</div>

					{error && (
						<div className="rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-3 text-sm font-medium flex items-center gap-2">
							<div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
							{error}
						</div>
					)}
				</div>

				<div className="px-6 py-4 bg-gray-50/50 dark:bg-[#13151f]/50 border-t border-gray-100 dark:border-[#2a2d3d] flex justify-end">
					<Button variant="secondary" onClick={resetAndClose}>Đóng cửa sổ</Button>
				</div>
			</div>
		</div>
	);
};
