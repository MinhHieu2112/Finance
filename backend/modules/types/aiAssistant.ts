export interface IntentTransactionPayload {
	type: 'income' | 'expense';
	description: string;
	total_amount: number;
	date: Date;
	category: string;
	frequency: 'weekly' | 'monthly' | 'yearly' | 'one-time';
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
