import AppError from '../../../utils/appError';
import forecastingTrendRepository from './Repository';
import summaryService from '../summary/Service';
import type { ForecastingTrendResult, MonthlyPoint } from './types';
import { Types } from 'mongoose';

class forecastingTrendService {
    // Chỉ số Alpha (mượt dữ liệu) và Beta (mượt xu hướng) cho mô hình Holt
    private readonly ALPHA = 0.4;
    private readonly BETA = 0.3;

    // Khử nhiễu dữ liệu (Winsorization) để loại bỏ các biến động chi tiêu bất thường
    private cleanData(series: number[]): number[] {
        if (series.length < 3) return series;
        const sorted = [...series].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        return series.map(v => Math.max(lowerBound, Math.min(upperBound, v)));
    }

    // Thực hiện thuật toán Holt (Double Exponential Smoothing) để dự báo xu hướng
    private analyzeTrendHolt(series: number[]) {
        // Nếu không có dữ liệu, trả về 0
        if (series.length === 0) return { forecast: 0, trend: 'stable' as const };
        
        // Nếu chỉ có 1 tháng, dự báo bằng chính tháng đó
        if (series.length === 1) return { forecast: series[0], trend: 'stable' as const };
        
        const cleanedSeries = this.cleanData(series);
        const avgValue = cleanedSeries.reduce((a, b) => a + b, 0) / cleanedSeries.length;

        let level = cleanedSeries[0];
        let trend = cleanedSeries[1] - cleanedSeries[0];

        for (let i = 1; i < cleanedSeries.length; i++) {
            const lastLevel = level;
            level = this.ALPHA * cleanedSeries[i] + (1 - this.ALPHA) * (level + trend);
            trend = this.BETA * (level - lastLevel) + (1 - this.BETA) * trend;
        }

        // Dự báo cơ bản
        let forecast = level + trend;
        
        if (forecast < avgValue * 0.3 && avgValue > 0) {
            forecast = avgValue * 0.8; 
        }

        const threshold = avgValue * 0.05;
        let trendStatus: 'up' | 'down' | 'stable' = 'stable';
        if (trend > threshold) trendStatus = 'up';
        else if (trend < -threshold) trendStatus = 'down';

        return { forecast: Math.max(0, forecast), trend: trendStatus };
    }

    // Lấy dữ liệu dự báo tài chính tổng quát cho người dùng
    async getForecastingTrend(userId: Types.ObjectId) {
        if (!userId) throw new AppError('User id is required', 400);

        const transactions = await forecastingTrendRepository.getRecentTransactions(500, userId);
        const { monthlySeries } = summaryService.processSummary(transactions);
        
        const recentSeries = monthlySeries.slice(-6);
        const expenseSeries = recentSeries.map(p => p.expense);
        const { forecast, trend } = this.analyzeTrendHolt(expenseSeries);

        return {
            monthlySeries: recentSeries,
            expenseTrend: trend,
            nextMonthForecast: forecast
        } as ForecastingTrendResult;
    }

    // Chuyển đổi kết quả dự báo thành văn bản nhận xét ngắn gọn
    getTrendPrediction(monthlySeries: MonthlyPoint[]) {
        const series = monthlySeries.map(p => p.expense);
        const { trend, forecast } = this.analyzeTrendHolt(series);
        
        const messages = {
            up: `Cảnh báo: Chi tiêu đang có xu hướng tăng. Dự kiến tháng tới bạn sẽ cần khoảng ${Math.round(forecast).toLocaleString()}đ.`,
            down: `Tín hiệu tốt: Bạn đang kiểm soát chi tiêu chặt chẽ hơn. Dự kiến tháng tới chỉ cần ${Math.round(forecast).toLocaleString()}đ.`,
            stable: `Chi tiêu ổn định. Dự kiến tháng tới dao động quanh mức ${Math.round(forecast).toLocaleString()}đ.`
        };

        return messages[trend];
    }
}

export default new forecastingTrendService();
