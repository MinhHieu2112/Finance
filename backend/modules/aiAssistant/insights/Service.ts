import AppError from '../../../utils/appError';
import insightsRepository from './Repository';
import { Types } from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';

class insightsService {
    private genAI: GoogleGenerativeAI;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || '';
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    // Tạo thông tin phân tích dựa trên các quy tắc logic cơ bản (fallback khi AI không khả dụng).
    private generateRuleBasedInsights(transactions: any[]) {
        let totalIncome = 0;
        let totalExpense = 0;
        let totalDebt = 0;
        let totalSavings = 0;
        const expensesByCategory: Record<string, number> = {};

        transactions.forEach(t => {
            const amount = t.base_amount || t.total_amount;
            if (t.type === 'income') totalIncome += amount;
            else if (t.type === 'debt') totalDebt += amount;
            else if (t.type === 'savings') totalSavings += amount;
            else if (t.type === 'expense') {
                totalExpense += amount;
                t.details.forEach((d: any) => {
                    expensesByCategory[d.categoryName] = (expensesByCategory[d.categoryName] || 0) + ((d.base_amount || d.amount) * d.quantity);
                });
            }
        });

        const sortedExpenses = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]);
        const topExpense = sortedExpenses.length > 0 ? sortedExpenses[0] : null;

        const analysis = `Bạn đã chi tiêu ${totalExpense.toLocaleString()}đ và thu nhập ${totalIncome.toLocaleString()}đ. ${
            totalDebt > 0 ? `Bạn cũng phát sinh khoản nợ mới là ${totalDebt.toLocaleString()}đ. ` : ''
        }${
            totalSavings > 0 ? `Bạn đã tiết kiệm được ${totalSavings.toLocaleString()}đ. ` : ''
        }${
            topExpense ? `Danh mục chi tiêu lớn nhất là "${topExpense[0]}" với ${topExpense[1].toLocaleString()}đ.` : ''
        }`;

        let prediction = "Dự kiến tháng tới chi tiêu của bạn sẽ duy trì ở mức tương đương nếu không có khoản chi đột biến.";
        let advice = "Hãy xem xét giảm bớt chi tiêu ở các danh mục không thiết yếu.";

        if (topExpense && topExpense[1] > totalIncome * 0.3) {
            advice = `Khoản chi cho "${topExpense[0]}" đang khá cao (chiếm > 30% thu nhập). Bạn nên cân nhắc cắt giảm để tăng tiết kiệm.`;
        }

        return {
            analysis,
            prediction,
            advice
        };
    }

    // Sử dụng AI (Gemini) để phân tích thói quen chi tiêu và đưa ra lời khuyên tài chính.
    async generateInsights(userId: Types.ObjectId) {
        const transactions = await insightsRepository.getRecentTransactions(userId, 3);
        
        if (!transactions || transactions.length === 0) {
            return {
                analysis: "Bạn chưa có đủ dữ liệu giao dịch để AI có thể phân tích.",
                prediction: "Cần thêm dữ liệu để dự đoán.",
                advice: "Hãy bắt đầu ghi chép các khoản thu chi của bạn hàng ngày."
            };
        }

        // Prepare data for prompt
        const summaryObj: any = {
            incomes: [],
            expenses: [],
            debts: [],
            savings: []
        };

        transactions.forEach(t => {
            const amount = t.base_amount || t.total_amount;
            if (t.type === 'income') {
                summaryObj.incomes.push({ date: t.date, amount, desc: t.description });
            } else if (t.type === 'debt') {
                summaryObj.debts.push({ date: t.date, amount, desc: t.description });
            } else if (t.type === 'savings') {
                summaryObj.savings.push({ date: t.date, amount, desc: t.description });
            } else if (t.type === 'expense') {
                summaryObj.expenses.push({ 
                    date: t.date, 
                    amount, 
                    desc: t.description, 
                    details: t.details.map((d: any) => ({ 
                        category: d.categoryName, 
                        amount: (d.base_amount || d.amount) * d.quantity 
                    })) 
                });
            }
        });

        const prompt = `
Tôi cung cấp cho bạn dữ liệu tài chính trong 3 tháng gần nhất của tôi (bao gồm Thu nhập, Chi tiêu, Khoản nợ và Tiết kiệm).
Hãy phân tích và trả về kết quả theo định dạng JSON gồm 3 trường:
- "analysis": Đánh giá tổng quan về thói quen chi tiêu và tình hình nợ/tiết kiệm.
- "prediction": Dự đoán xu hướng tài chính tháng tới.
- "advice": Lời khuyên cụ thể để tối ưu hóa chi tiêu, quản lý nợ và tăng tiết kiệm.

Dữ liệu (JSON):
${JSON.stringify(summaryObj).substring(0, 3000)} // Giới hạn độ dài để tránh quá tải
`;

        try {
            if (!process.env.GEMINI_API_KEY) throw new Error("No API key");
            
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            
            // Trích xuất JSON từ codeblock markdown nếu có
            let jsonStr = text;
            const match = text.match(/```(?:json)?\\n([\\s\\S]*?)\\n```/);
            if (match) {
                jsonStr = match[1];
            } else if (text.startsWith('```json')) {
                jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            } else if (text.startsWith('{')) {
                jsonStr = text.trim();
            } else {
                // Nếu AI không trả về JSON mà là văn bản, hãy quay lại phân tích theo quy tắc
                throw new Error("Invalid format from AI");
            }

            const parsed = JSON.parse(jsonStr);
            return {
                analysis: parsed.analysis || "",
                prediction: parsed.prediction || "",
                advice: parsed.advice || ""
            };
        } catch (error) {
            console.error("AI Insight Error, falling back to rule-based:", error);
            return this.generateRuleBasedInsights(transactions);
        }
    }
}

export default new insightsService();
