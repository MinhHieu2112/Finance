import { type Request, type Response, type NextFunction } from 'express';
import forecastingTrendService from '../forecastingTrend/Service';
import savingSuggestionService from './Service';
import insightsRepository from '../aiInsights/Repository';

// Kết hợp dữ liệu dự báo và phân tích bất thường để đưa ra các gợi ý tiết kiệm tối ưu.
const getSavingSuggestion = async (_req: Request, res: Response, next: NextFunction) => {
	try {
		const authUser    = res.locals.authUser;
		const trend       = await forecastingTrendService.getForecastingTrend(authUser.id);
		
        // Lấy các chỉ số cần thiết cho thuật toán Thác nước
        const [totalUnpaidDebt, currentBalance] = await Promise.all([
            insightsRepository.getTotalUnpaidDebt(authUser.id),
            insightsRepository.getTotalBalance(authUser.id)
        ]);

        // Tính toán thu nhập và chi tiêu trung bình từ trend
        const recentMonthlySeries = trend.monthlySeries.slice(-3);
        const avgIncome = recentMonthlySeries.reduce((acc, p) => acc + p.income, 0) / (recentMonthlySeries.length || 1);
        const avgExpense = recentMonthlySeries.reduce((acc, p) => acc + p.expense, 0) / (recentMonthlySeries.length || 1);

		const savingsAdvice = savingSuggestionService.getSavingAdvice(avgIncome, avgExpense, totalUnpaidDebt, currentBalance);

		res.status(200).json({ success: true,
							   message: 'Tải gợi ý tiết kiệm thành công',
							   savingsPlan: [savingsAdvice] });
	} catch (error) {
		next(error);
	}
};

export default getSavingSuggestion;
