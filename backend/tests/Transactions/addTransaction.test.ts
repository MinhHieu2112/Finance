import transactionService from '../../modules/Transactions/addTransaction/Service';
import transactionRepository from '../../modules/Transactions/addTransaction/Repository';
import AppError from '@/utils/appError';
import { TransactionType, TransactionFrequency } from '../../modules/types/Transactions';
import * as currencyConverter from '@/utils/currencyConverter';

// Mock repository and converter
jest.mock('../../modules/Transactions/addTransaction/Repository');
jest.mock('@/utils/currencyConverter');

describe('TransactionService', () => {
    const mockUserId = '60d5ecb8b392d60015f864a9';
    
    beforeEach(() => {
        jest.clearAllMocks();
        (currencyConverter.convertToBase as jest.Mock).mockImplementation((amount) => Promise.resolve(amount));
    });

    test('should throw error if mandatory fields are missing', async () => {
        const incompleteData: any = { userId: mockUserId };
        await expect(transactionService.addTransaction(incompleteData))
            .rejects.toThrow(AppError);
    });

    test('should throw error if expense exceeds balance', async () => {
        const expenseData: any = {
            userId: mockUserId,
            description: 'Test Expense',
            type: TransactionType.EXPENSE,
            frequency: TransactionFrequency.ONE_TIME,
            date: new Date(),
            details: [{ categoryId: 'cat1', amount: 1000, quantity: 1, name: 'Item' }]
        };

        (transactionRepository.findCategoryNameById as jest.Mock).mockResolvedValue({ name: 'Food' });
        (transactionRepository.getCurrentBalance as jest.Mock).mockResolvedValue(500); // Balance < Expense

        await expect(transactionService.addTransaction(expenseData))
            .rejects.toThrow('không đủ để thanh toán');
    });

    test('should add transaction successfully if balance is sufficient', async () => {
        const incomeData: any = {
            userId: mockUserId,
            description: 'Test Income',
            type: TransactionType.INCOME,
            frequency: TransactionFrequency.ONE_TIME,
            date: new Date(),
            details: [{ categoryId: 'cat1', amount: 1000, quantity: 1, name: 'Salary' }]
        };

        (transactionRepository.findCategoryNameById as jest.Mock).mockResolvedValue({ name: 'Work' });
        (transactionRepository.addTransaction as jest.Mock).mockResolvedValue({ ...incomeData, _id: 'tx123' });

        const result = await transactionService.addTransaction(incomeData);
        expect(result).toBeDefined();
        expect(transactionRepository.addTransaction).toHaveBeenCalled();
    });
});
