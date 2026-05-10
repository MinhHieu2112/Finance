import savingSuggestionService from '../../modules/Analysis/savingSuggestion/Service';

describe('SavingSuggestionService', () => {
    test('should return deficit warning when income < expense', () => {
        const advice = savingSuggestionService.getSavingAdvice(100, 200, 0, 0);
        expect(advice).toContain('Cảnh báo thâm hụt');
    });

    test('should return debt warning when DTI > 0.3', () => {
        const advice = savingSuggestionService.getSavingAdvice(1000, 500, 400, 0);
        expect(advice).toContain('Chỉ số nợ (DTI)');
    });

    test('should return emergency fund warning when fund < 3 months', () => {
        const advice = savingSuggestionService.getSavingAdvice(1000, 500, 0, 1000);
        expect(advice).toContain('Quỹ dự phòng hiện chỉ đủ');
    });

    test('should return low savings warning when savingsRate < 0.3', () => {
        const advice = savingSuggestionService.getSavingAdvice(1000, 800, 0, 5000);
        expect(advice).toContain('Tỷ lệ tiết kiệm hiện tại');
    });

    test('should return success message when all criteria met', () => {
        const advice = savingSuggestionService.getSavingAdvice(1000, 500, 0, 5000);
        expect(advice).toContain('Tuyệt vời');
    });
});
