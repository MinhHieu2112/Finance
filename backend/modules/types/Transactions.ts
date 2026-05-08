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

export enum Currency {
  VND = 'VND',
  USD = 'USD',
  EUR = 'EUR',
  JPY = 'JPY',
  GBP = 'GBP',
}

// Định nghĩa kiểu dữ liệu cho chi tiết từng mục trong giao dịch.
export interface transactionDetailSchema {
	categoryId: Types.ObjectId;
	categoryName: string;
	quantity: number;
	amount: number | string;
	base_amount?: number;
	name: string;
}

// Định nghĩa kiểu dữ liệu đầy đủ cho một giao dịch.
export interface transactionSchema {
	userId: Types.ObjectId;
	description: string;
	type: string;
	frequency: string;
	date: Date;
	total_amount: number | string;
	currency: Currency;
	base_amount?: number;
	details: transactionDetailSchema[];
	createdAt?: Date;
	updatedAt?: Date;
}

// Định nghĩa kiểu dữ liệu dùng cho việc cập nhật thông tin giao dịch.
export interface editTransactionSchema {
	description: string;
	type: string;
	frequency: string;
	date: Date;
	total_amount: number | string;
	currency: Currency;
	base_amount?: number;
	details: transactionDetailSchema[];
}
