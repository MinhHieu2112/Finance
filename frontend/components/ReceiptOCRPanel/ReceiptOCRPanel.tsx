import React, { useState } from 'react';
import { ScanText, X } from 'lucide-react';
import { Button } from '../Button/Button';
import { type Transaction } from '../../types/Transactions';

const API_BASE_URL = 'http://localhost:4000/api';

interface ParsedTransaction {
	description: string;
	amount: number;
	type: 'income' | 'expense';
	category: string;
	frequency: string;
	date: string;
	confidence: 'high' | 'medium' | 'low';
	sourceText: string;
	item?: string;
	quantity?: number;
	unitPrice?: number;
	totalAmount?: number;
}

interface OCRResponse {
	success: boolean;
	rawText: string;
	parsed: ParsedTransaction;
	transaction: Transaction;
}

interface ReceiptOCRPanelProps {
	isOpen: boolean;
	token: string;
	onClose: () => void;
	onTransactionCreated: (transaction: Transaction) => void;
}

const formatMoney = (value: number) => `${Math.round(value).toLocaleString('en-US')} VND`;

export const ReceiptOCRPanel: React.FC<ReceiptOCRPanelProps> = ({
	isOpen,
	token,
	onClose,
	onTransactionCreated,
}) => {
	const [receiptFile, setReceiptFile] = useState<File | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [ocrResult, setOcrResult] = useState<OCRResponse | null>(null);

	if (!isOpen) {
		return null;
	}

	const parseErrorMessage = async (response: Response) => {
		const fallback = 'Request failed. Please try again.';
		try {
			const data = await response.json() as { message?: string; error?: string };
			return data.message || data.error || fallback;
		} catch {
			return fallback;
		}
	};

	const handleReceiptOCR = async () => {
		if (!receiptFile) {
			setError('Please choose a receipt image first.');
			return;
		}

		try {
			setError(null);
			setIsSubmitting(true);

			const formData = new FormData();
			formData.append('receipt', receiptFile);

			const response = await fetch(`${API_BASE_URL}/analysis/assistant/receipt-ocr`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			});

			if (!response.ok) {
				throw new Error(await parseErrorMessage(response));
			}

			const data = await response.json() as OCRResponse;
			setOcrResult(data);
			onTransactionCreated(data.transaction);
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : 'Cannot process this receipt image right now.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const resetAndClose = () => {
		setReceiptFile(null);
		setError(null);
		setOcrResult(null);
		onClose();
	};

	return (
		<div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center" onClick={resetAndClose}>
			<div
				className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
							<ScanText size={18} />
						</div>
						<div>
							<h2 className="text-lg font-bold text-gray-900">Receipt OCR</h2>
							<p className="text-sm text-gray-500">Upload receipt image and auto-create a transaction.</p>
						</div>
					</div>
					<button type="button" onClick={resetAndClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
						<X size={22} />
					</button>
				</div>

				<div className="px-6 py-5 space-y-3 max-h-[65vh] overflow-y-auto">
					<input
						type="file"
						accept="image/*"
						onChange={(event) => setReceiptFile(event.target.files?.[0] || null)}
						className="block w-full text-sm text-gray-700 border border-amber-200 bg-white rounded-lg p-2"
					/>

					<Button onClick={handleReceiptOCR} isLoading={isSubmitting}>
						<ScanText size={16} />
						Extract And Create Transaction
					</Button>

					{ocrResult && (
						<div className="space-y-3 rounded-xl border border-amber-200 bg-white p-4 text-sm">
							<div>
								<p className="font-semibold text-gray-900">OCR parsed transaction</p>
								<p className="text-gray-700">{ocrResult.parsed.description} | {formatMoney(ocrResult.parsed.amount)}</p>
								<p className="text-gray-700">{ocrResult.parsed.category} | {ocrResult.parsed.date}</p>
							</div>
							<details>
								<summary className="cursor-pointer text-xs text-gray-600">View OCR raw text</summary>
								<pre className="mt-2 text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-auto whitespace-pre-wrap">{ocrResult.rawText}</pre>
							</details>
						</div>
					)}

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
