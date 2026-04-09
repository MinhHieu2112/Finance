import React, { useState } from 'react';
import { ScanText, X } from 'lucide-react';
import { Button } from '../Button/Button';
import { type TransactionPayload } from '../../types/Transactions';

const API_BASE_URL = 'http://localhost:4000/api';

interface OCRResponse {
	success: boolean;
	result: TransactionPayload[];
}

interface ReceiptOCRPanelProps {
	isOpen: boolean;
	token: string;
	onClose: () => void;
	onDraftPrepared: (draft: TransactionPayload) => void;
}

export const ReceiptOCRPanel: React.FC<ReceiptOCRPanelProps> = ({
	isOpen,
	token,
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

			const mcp_response = await fetch(`${API_BASE_URL}/nlp/mcp-tools`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			});

			if (!mcp_response.ok) {
				throw new Error(await parseErrorMessage(mcp_response));
			}

			const orchestrationData = await mcp_response.json();
			// const receiptPayload = orchestrationData?.result?.data || orchestrationData?.result || orchestrationData;

			const receiptData = await fetch(`${API_BASE_URL}/nlp/add-by-receipt-image`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ data: orchestrationData.result }),
			});

			if (!receiptData.ok) {
				throw new Error(await parseErrorMessage(receiptData));
			}
			
			const data = await receiptData.json() as OCRResponse;
			onDraftPrepared(data.result[0] as TransactionPayload);
			resetAndClose();
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : 'Cannot process this receipt image right now.');
		} finally {
			setIsSubmitting(false);
		}
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
							<p className="text-sm text-gray-500">Upload receipt image to pre-fill a transaction form for review.</p>
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
						Extract And Review Transaction
					</Button>

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
