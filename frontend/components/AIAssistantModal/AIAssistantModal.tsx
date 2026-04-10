import React, { useState } from 'react';
import { Button } from '../Button/Button';
import { Transaction } from '../../types/Transactions';
import { Sparkles, X } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';

interface QuerySummary {
	answer: string;
	total: number;
	count: number;
	transactions: Transaction[];
}

interface OrchestratorResponse {
	success: boolean;
	result: Record<string, unknown>;
}

interface AddQueryResponse {
	success: boolean;
	result: {
		intent: 'add' | 'query';
		data: Transaction[];
	};
}

interface AIAssistantModalProps {
	isOpen: boolean;
	onClose: () => void;
	onTransactionCreated: (transaction: Transaction) => void;
}

const formatMoney = (value: number) => `${Math.round(value).toLocaleString('en-US')} VND`;

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
	isOpen,
	onClose,
	onTransactionCreated,
}) => {
	const [prompt, setPrompt] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [detectedIntent, setDetectedIntent] = useState<'add' | 'query' | null>(null);
	const [createdTransactions, setCreatedTransactions] = useState<Transaction[]>([]);
	const [queryResult, setQueryResult] = useState<QuerySummary | null>(null);

	if (!isOpen) {
		return null;
	}

	const handleUnifiedPrompt = async () => {
		try {
			setError(null);
			setIsSubmitting(true);
			setQueryResult(null);
			setCreatedTransactions([]);
			setDetectedIntent(null);

			const formData = new FormData();
			formData.append('prompt', prompt);

			const orchestratorResponse = await api.post<OrchestratorResponse>('/nlp/mcp-tools', formData);
			const orchestrationData = orchestratorResponse.data;

			const addQueryResponse = await api.post<AddQueryResponse>('/nlp/add&query',
				{ data: orchestrationData.result },
			);

			const addQueryData = addQueryResponse.data;
			setDetectedIntent(addQueryData.result.intent);

			if (addQueryData.result.intent === 'add') {
				const created = addQueryData.result.data || [];
				setCreatedTransactions(created);

				created.forEach((transaction) => {
					onTransactionCreated(transaction);
				});

				if (!created.length) {
					setError('AI did not create any transaction from this prompt.');
				}

				return;
			}

			const matched = addQueryData.result.data || [];
			const total = matched.reduce((sum, transaction) => sum + (Number(transaction.total_amount) || 0), 0);
			setQueryResult({
				answer: matched.length
					? `Found ${matched.length} transaction(s), total ${formatMoney(total)}.`
					: 'No matching transaction found for this query.',
				total,
				count: matched.length,
				transactions: matched,
			});

		} catch (submitError) {
			setError(getApiErrorMessage(submitError, 'Cannot process this prompt right now.'));
		} finally {
			setIsSubmitting(false);
		}
	};

	const resetAndClose = () => {
		setError(null);
		setDetectedIntent(null);
		setCreatedTransactions([]);
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
							<h2 className="text-lg font-bold text-gray-900">AI Assistant</h2>
							<p className="text-sm text-gray-500">One prompt for add transaction or financial query</p>
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
							placeholder="Hom nay chi 50k an sang | Toi da chi bao nhieu cho cafe trong thang 12"
							className="w-full rounded-xl border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-300"
						/>
						<Button onClick={handleUnifiedPrompt} isLoading={isSubmitting}>Send Prompt</Button>

						{detectedIntent && (
							<div className="rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-700 px-3 py-2 text-sm">
								Detected intent: {detectedIntent}
							</div>
						)}

						{createdTransactions.length > 0 && (
							<div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm space-y-2">
								<p className="font-semibold text-emerald-800">Transaction created ({createdTransactions.length})</p>
								<div className="space-y-2 max-h-44 overflow-y-auto">
									{createdTransactions.map((transaction) => (
										<div key={transaction._id} className="rounded-lg border border-emerald-200 bg-white px-3 py-2">
											<p className="font-medium text-gray-800">{transaction.description}</p>
											<p className="text-xs text-gray-600">
												{formatMoney(transaction.total_amount)} | {transaction.type} | {transaction.details[0]?.categoryName || 'Other'} | {transaction.date}
											</p>
										</div>
									))}
								</div>
							</div>
						)}

						{queryResult && (
							<div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
								<div>
									<p className="font-semibold text-gray-800">Answer</p>
									<p className="text-gray-700 mt-1">{queryResult.answer}</p>
								</div>
								<div className="grid grid-cols-2 gap-2 text-xs">
									<div className="rounded-lg border border-gray-200 bg-white p-2">Total: {formatMoney(queryResult.total)}</div>
									<div className="rounded-lg border border-gray-200 bg-white p-2">Matches: {queryResult.count}</div>
								</div>
								{queryResult.transactions.length > 0 && (
									<div className="space-y-2">
										<p className="font-semibold text-gray-700">Matched transactions</p>
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
