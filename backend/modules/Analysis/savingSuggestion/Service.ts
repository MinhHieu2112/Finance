
class savingSuggestionService {
    // Cung cấp lời khuyên tài chính thông minh dựa trên chiến lược Thác nước tài chính (Financial Waterfall)
    getSavingAdvice(totalIncome: number, totalExpense: number, totalUnpaidDebt: number = 0, currentBalance: number = 0) {
        const monthlySavings = totalIncome - totalExpense;
        const savingsRate = totalIncome > 0 ? monthlySavings / totalIncome : 0;
        
        // Chỉ số DTI (Debt-to-Income): Nợ / Thu nhập hàng tháng
        const dti = totalIncome > 0 ? (totalUnpaidDebt / totalIncome) : 0;
        
        // Chỉ số Emergency Fund Cover: Số dư / Chi tiêu trung bình tháng
        const emergencyFundMonths = totalExpense > 0 ? Math.max(0, currentBalance / totalExpense) : 0;

        // Trường hợp 1: Chi tiêu lớn hơn thu nhập
        if (totalIncome < totalExpense) {
            return `Cảnh báo thâm hụt! Chi tiêu (${totalExpense.toLocaleString()}đ) đang vượt quá thu nhập (${totalIncome.toLocaleString()}đ). Bạn cần cắt giảm ngay các khoản chi không thiết yếu.`;
        }

        // Trường hợp 2: Chỉ số nợ > 0.3
        if (dti > 0.3) {
            return `Chỉ số nợ (DTI) của bạn đang ở mức ${(dti * 100).toFixed(1)}%. Hãy ưu tiên trả nợ thay vì đầu tư vào các hoạt động khác.`;
        }

        // Trường hợp 3: Quỹ dự phòng < 3 tháng
        if (emergencyFundMonths < 3) {
            return `Quỹ dự phòng hiện chỉ đủ cho ${emergencyFundMonths.toFixed(1)} tháng chi tiêu. Hãy ưu tiên xây dựng khoản tiết kiệm để có quỹ dự phòng ít nhất 3-6 tháng (${(totalExpense * 3).toLocaleString()}đ).`;
        }

        // Trường hợp 4: Tỷ lệ tiết kiệm < 30% 
        if (savingsRate < 0.3) {
            return `Tỷ lệ tiết kiệm hiện tại (${(savingsRate * 100).toFixed(1)}%) đang ở mức thấp so với tiêu chuẩn 30%. Hãy tối ưu hóa các khoản chi tiêu không thiết yếu để tăng cường tích lũy tài sản cho mục tiêu dài hạn.`;
        }

        return `Tuyệt vời! Bạn có quỹ dự phòng an toàn (${emergencyFundMonths.toFixed(1)} tháng) và tỷ lệ tiết kiệm cao. Đây là thời điểm tốt để tìm kiếm các kênh đầu tư sinh lời.`;
    }
}

export default new savingSuggestionService();
