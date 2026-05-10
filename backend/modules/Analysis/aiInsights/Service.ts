import insightsRepository from './Repository';
import { Types } from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import savingSuggestionService from '../savingSuggestion/Service';
import forecastingTrendService from '../forecastingTrend/Service';
import summaryService from '../summary/Service';

class insightsService {
    private _genAI: GoogleGenAI | null = null;

    // Lấy instance Gemini AI, khởi tạo nếu chưa có
    private get genAI(): GoogleGenAI {
        if (!this._genAI) {
            const apiKey = (process.env.GEMINI_API_KEY || '').trim();
            this._genAI = new GoogleGenAI({ apiKey });
        }
        return this._genAI;
    }

    // Tạo thông tin phân tích tài chính dựa trên các thuật toán logic dự phòng (Fallback)
    private async generateRuleBasedInsights(userId: Types.ObjectId, transactions: any[]) {
        // Lấy dữ liệu thống kê tổng hợp
        const data = summaryService.processSummary(transactions);

        // Lấy dữ liệu bổ trợ (Nợ chưa trả và Số dư thực tế)
        const [totalUnpaidDebt, currentBalance] = await Promise.all([
            insightsRepository.getTotalUnpaidDebt(userId),
            insightsRepository.getTotalBalance(userId)
        ]);

        // Kết hợp kết quả từ Forecasting và Saving Suggestions
        return {
            analysis: data.summaryText,
            prediction: forecastingTrendService.getTrendPrediction(data.monthlySeries),
            advice: savingSuggestionService.getSavingAdvice(
                data.totalIncome, 
                data.totalExpense, 
                totalUnpaidDebt, 
                currentBalance
            )
        };
    }

    // Hàm chính: Sử dụng AI Gemini để phân tích thói quen chi tiêu và đưa ra lời khuyên
    async generateInsights(userId: Types.ObjectId) {
        // Lấy dữ liệu 3 tháng gần nhất để phân tích
        const transactions = await insightsRepository.getRecentTransactions(userId, 3);
        
        if (!transactions || transactions.length === 0) {
            return {
                analysis: "Bạn chưa có đủ dữ liệu giao dịch để AI có thể phân tích.",
                prediction: "Cần thêm dữ liệu để dự đoán.",
                advice: "Hãy bắt đầu ghi chép các khoản thu chi của bạn hàng ngày."
            };
        }

        // Chuẩn bị dữ liệu cho AI
        const summaryObj: any = { incomes: [], expenses: [], debts: [], savings: [] };
        transactions.forEach(t => {
            const amount = t.base_amount || t.total_amount;
            if (t.type === 'income') summaryObj.incomes.push({ date: t.date, amount, desc: t.description });
            else if (t.type === 'debt') summaryObj.debts.push({ date: t.date, amount, desc: t.description });
            else if (t.type === 'savings') summaryObj.savings.push({ date: t.date, amount, desc: t.description });
            else if (t.type === 'expense') {
                summaryObj.expenses.push({ 
                    date: t.date, amount, desc: t.description, 
                    details: t.details.map((d: any) => ({ category: d.categoryName, amount: (d.base_amount || d.amount) * d.quantity })) 
                });
            }
        });

        const prompt = `Tôi cung cấp cho bạn dữ liệu tài chính trong 3 tháng gần nhất của tôi. Hãy phân tích và trả về JSON: { "analysis": "...", "prediction": "...", "advice": "..." }\n\nDữ liệu: ${JSON.stringify(summaryObj).substring(0, 3000)}`;

        try {
            if (!process.env.GEMINI_API_KEY) throw new Error("No API key provided");
            
            const response = await this.genAI.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt
            });

            if (!response) throw new Error("No response from AI");
            
            const text = response.text;
            if (!text) throw new Error("Empty response text");
            
            let jsonStr = text;
            const match = text.match(/```(?:json)?\n([\s\S]*?)\n```/);
            if (match) jsonStr = match[1];
            else if (text.startsWith('```json')) jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            else if (text.startsWith('{')) jsonStr = text.trim();
            else throw new Error("Invalid response format from AI");

            const parsed = JSON.parse(jsonStr);
            return {
                analysis: parsed.analysis || "",
                prediction: parsed.prediction || "",
                advice: parsed.advice || ""
            };
        } catch (error) {
            console.error("AI Insight Error, falling back to rule-based:", error);
            return this.generateRuleBasedInsights(userId, transactions);
        }
    }
}

export default new insightsService();
