import { Types } from 'mongoose';

export enum TransactionType {
  INCOME  = 'income',
  EXPENSE = 'expense',
}

export enum TransactionFrequency {
  WEEKLY   = 'weekly',
  MONTHLY  = 'monthly',
  YEARLY   = 'yearly',
  ONE_TIME = 'one-time',
}

export interface transactionDetailSchema {
	categoryId: Types.ObjectId;
	categoryName: string;
	quantity: number;
	amount: number;
	name: string;
}

export interface transactionSchema {
	userId: Types.ObjectId;
	description: string;
	type: string;
	frequency: string;
	date: Date;
	total_amount: number;
	details: transactionDetailSchema[];
	createdAt?: Date;
	updatedAt?: Date;
}

export interface editTransactionSchema {
	description: string;
	type: string;
	frequency: string;
	date: Date;
	total_amount: number;
	details: transactionDetailSchema[];
}
