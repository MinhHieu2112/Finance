import summaryService from '../../modules/Analysis/summary/Service';

describe('SummaryService', () => {
    const mockTransactions = [
        {
            date: '2024-05-01',
            type: 'income',
            total_amount: 1000000,
            base_amount: 1000000
        },
        {
            date: '2024-05-15',
            type: 'expense',
            total_amount: 400000,
            base_amount: 400000
        }
    ];

    test('should correctly process transaction summary', () => {
        const result = summaryService.processSummary(mockTransactions as any);
        
        expect(result.totalIncome).toBe(1000000);
        expect(result.totalExpense).toBe(400000);
        expect(result.summaryText).toContain('1,000,000đ');
    });
});
