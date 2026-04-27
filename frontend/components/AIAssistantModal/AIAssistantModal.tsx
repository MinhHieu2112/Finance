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

const formatMoney = (value: number) => `${Math.round(value).toLocaleString('en-US')} VND`;

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
		<div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
			<div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
				<div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
							<Sparkles size={18} />
						</div>
						<div>
						<h2 className="text-lg font-bold text-gray-900">Trợ lý AI</h2>
						<p className="text-sm text-gray-500">Một lờ nhập cho thao tác thêm giao dịch hoặc truy vấn tài chính</p>
						</div>
					</div>
					<button type="button" onClick={resetAndClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
						<X size={22} />
					</button>
				</div>

				<div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
					<div className="space-y-3">
						<textarea
							value={prompt}
							onChange={(event) => setPrompt(event.target.value)}
							rows={4}
							placeholder="Hôm nay chi 50k ăn sáng | Tôi đã chi bao nhiều cho cafe trong tháng 12"
							className="w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-300"
						/>
<Button onClick={handleUnifiedPrompt} isLoading={isSubmitting}>Gửi yêu cầu</Button>

						{detectedIntent && (
							<div className="rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-700 px-3 py-2 text-sm">
								Detected intent: {detectedIntent}
							</div>
						)}

						{queryResult && (
							<div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
							<div className="text-sm">
								<p className="font-semibold text-gray-800">Câu trả lời</p>
								<p className="text-gray-700 mt-1">{queryResult.answer}</p>
							</div>
							<div className="grid grid-cols-2 gap-2 text-xs">
								<div className="rounded-lg border border-gray-200 bg-white p-2">Tổng: {formatMoney(queryResult.total)}</div>
								<div className="rounded-lg border border-gray-200 bg-white p-2">Số giao dịch: {queryResult.count}</div>
							</div>
							{queryResult.transactions.length > 0 && (
								<div className="space-y-2">
									<p className="font-semibold text-gray-700">Giao dịch phù hợp</p>
										<div className="space-y-2 max-h-44 overflow-y-auto">
											{queryResult.transactions.map((transaction) => (
												<div key={transaction._id} className="rounded-lg border border-gray-200 bg-white px-3 py-2">
													<p className="font-medium text-gray-800">{transaction.description}</p>
													<p className="text-xs text-gray-600">
														{formatMoney(transaction.total_amount)} | {transaction.details[0]?.categoryName || 'Other'} | {transaction.date}
													</p>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						)}
					</div>

					{error && (
						<div className="rounded-lg border border-red-100 bg-red-50 text-red-700 px-3 py-2 text-sm">
							{error}
						</div>
					)}
				</div>

				<div className="px-6 py-4 border-t border-gray-100 flex justify-end">
					<Button variant="secondary" onClick={resetAndClose}>Close</Button>
				</div>
			</div>
		</div>
	);
};
