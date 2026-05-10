import forecastingTrendService from '../../modules/Analysis/forecastingTrend/Service';

describe('ForecastingTrendService', () => {
    const mockSeries = [
        { month: '2024-01', income: 1000, expense: 500 },
        { month: '2024-02', income: 1100, expense: 600 },
        { month: '2024-03', income: 1200, expense: 700 }
    ];

    test('should predict upward trend when expenses are increasing', () => {
        const prediction = forecastingTrendService.getTrendPrediction(mockSeries);
        expect(prediction).toContain('có xu hướng tăng');
    });

    test('should handle stable trends correctly', () => {
        const stableSeries = [
            { month: '2024-01', income: 1000, expense: 500 },
            { month: '2024-02', income: 1000, expense: 500 },
            { month: '2024-03', income: 1000, expense: 500 }
        ];
        const prediction = forecastingTrendService.getTrendPrediction(stableSeries);
        expect(prediction).toContain('ổn định');
    });
});
