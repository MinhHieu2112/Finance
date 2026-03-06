import { Transaction, TransactionType, Category } from '../types';

// Initial data so the app isn't empty when first opened
export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    description: 'Lương tháng này',
    amount: 5000,
    type: TransactionType.INCOME,
    category: Category.SALARY,
    date: '2023-10-01',
  },
  {
    id: '2',
    description: 'Đi siêu thị',
    amount: 150,
    type: TransactionType.EXPENSE,
    category: Category.FOOD,
    date: '2023-10-02',
  },
  {
    id: '3',
    description: 'Grab đi làm',
    amount: 25,
    type: TransactionType.EXPENSE,
    category: Category.TRANSPORT,
    date: '2023-10-03',
  },
  {
    id: '4',
    description: 'Đăng ký Netflix',
    amount: 15,
    type: TransactionType.EXPENSE,
    category: Category.ENTERTAINMENT,
    date: '2023-10-05',
  },
  {
    id: '5',
    description: 'Dự án Freelance',
    amount: 1200,
    type: TransactionType.INCOME,
    category: Category.OTHER,
    date: '2023-10-10',
  },
];

export const CATEGORY_OPTIONS = Object.values(Category);