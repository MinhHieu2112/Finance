import { Types } from 'mongoose';

interface transactionDetail{
	categoryName: string;
	quantity: number;
	amount: number;
	name: string;
	
}

export interface IntentTransactionPayload {
	description: string;
	type: 'income' | 'expense';
	frequency: 'weekly' | 'monthly' | 'yearly' | 'one-time';
	date: Date;
	total_amount: number;
	details: transactionDetail[];
}

export interface IntentQueryPayload {
	type?: 'income' | 'expense';
	category_keyword?: string | null;
	time?: {
		years: number;
		months: number[];
	}[];
}

export interface IntentDetectionResult {
	intent: 'add' | 'query';
	transactions?: IntentTransactionPayload[];
	query?: IntentQueryPayload;
}
