import summaryRepository from './Repository';
import { Types } from 'mongoose';
import { MonthlyPoint } from '../forecastingTrend/types';

class summaryService {
    // Chuyển đổi dữ liệu ngày tháng sang định dạng chuỗi "YYYY-MM" để phân loại theo tháng
    private monthKey(dateInput: string | Date): string | null {
        const raw = dateInput instanceof Date ? dateInput.toISOString() : String(dateInput || '').trim();
        if (!raw) return null;
        const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00`) : new Date(raw);
        if (Number.isNaN(date.getTime())) return null;
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    // Xử lý và tính toán tổng hợp dữ liệu giao dịch (Thu, chi, nợ, tiết kiệm)
    processSummary(transactions: any[]) {
        let totalIncome = 0;
        let totalExpense = 0;
        let totalDebt = 0;
        let totalSavings = 0;
        const expensesByCategory: Record<string, number> = {};
        const monthlyMap = new Map<string, { income: number; expense: number }>();

        transactions.forEach(t => {
            const amount = Number(t.base_amount || t.total_amount) || 0;
            const key = this.monthKey(t.date);

            if (t.type === 'income') totalIncome += amount;
            else if (t.type === 'debt') totalDebt += amount;
            else if (t.type === 'savings') totalSavings += amount;
            else if (t.type === 'expense') {
                totalExpense += amount;
                (t.details || []).forEach((d: any) => {
                    const catName = d.categoryName || 'Khác';
                    expensesByCategory[catName] = (expensesByCategory[catName] || 0) + (Number(d.base_amount || d.amount) * (d.quantity || 1));
                });
            }

            if (key) {
                if (!monthlyMap.has(key)) monthlyMap.set(key, { income: 0, expense: 0 });
                const point = monthlyMap.get(key)!;
                if (t.type === 'income') point.income += amount;
                else if (t.type === 'expense') point.expense += amount;
            }
        });

        const sortedExpenses = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]);
        const topExpense = sortedExpenses.length > 0 ? sortedExpenses[0] : null;

        let summaryText = `Phân tích tài chính của bạn: \n`;
        summaryText += `• Thu nhập thuần: ${totalIncome.toLocaleString()}đ. \n`;
        summaryText += `• Chi tiêu thuần: ${totalExpense.toLocaleString()}đ. \n`;
        summaryText += `• Số dư thặng dư (Thu nhập - Chi tiêu): ${(totalIncome - totalExpense).toLocaleString()}đ. \n`;
        
        if (totalDebt > 0) summaryText += `• Các khoản vay/nợ mới: ${totalDebt.toLocaleString()}đ. \n`;
        if (totalSavings > 0) summaryText += `• Các khoản gửi tiết kiệm: ${totalSavings.toLocaleString()}đ. \n`;
        
        if (topExpense) summaryText += `• Danh mục chi nhiều nhất: "${topExpense[0]}" (${topExpense[1].toLocaleString()}đ). \n`;

        const monthlySeries = Array.from(monthlyMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([month, values]) => ({ month, ...values })) as MonthlyPoint[];

        return {
            summaryText,
            totalIncome,
            totalExpense,
            topExpenseName: topExpense ? topExpense[0] : null,
            topExpenseAmount: topExpense ? topExpense[1] : 0,
            monthlySeries
        };
    }

    // Lấy dữ liệu giao dịch từ repository và thực hiện quy trình tóm tắt phân tích
    async getSummary(userId: Types.ObjectId, months: number = 6) {
        const transactions = await summaryRepository.getTransactions(userId, months);
        return this.processSummary(transactions);
    }
}

export default new summaryService();
