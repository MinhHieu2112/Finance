// Enum for Transaction Types (Money coming in vs going out)
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

// Enum for Categories to keep data structured
export enum Category {
  FOOD = 'Ăn uống',
  TRANSPORT = 'Di chuyển',
  UTILITIES = 'Hóa đơn & Tiện ích',
  ENTERTAINMENT = 'Giải trí',
  SHOPPING = 'Mua sắm',
  HEALTH = 'Sức khỏe',
  SALARY = 'Lương',
  INVESTMENT = 'Đầu tư',
  OTHER = 'Khác',
}

// The shape of a single Transaction object
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string;
}

// User object for authentication context
export interface User {
  username: string;
  email: string;
}