
class savingSuggestionService {
    // Cung cấp lời khuyên tài chính thông minh dựa trên chiến lược Thác nước tài chính (Financial Waterfall)
    getSavingAdvice(totalIncome: number, totalExpense: number, totalUnpaidDebt: number = 0, currentBalance: number = 0) {
        const monthlySavings = totalIncome - totalExpense;
        const savingsRate = totalIncome > 0 ? monthlySavings / totalIncome : 0;
        
        // Chỉ số DTI (Debt-to-Income): Nợ / Thu nhập hàng tháng
        const dti = totalIncome > 0 ? (totalUnpaidDebt / totalIncome) : 0;
        
        // Chỉ số Emergency Fund Cover: Số dư / Chi tiêu trung bình tháng
        const emergencyFundMonths = totalExpense > 0 ? (currentBalance / totalExpense) : 0;

        // Cảnh báo thâm hụt 
        if (totalIncome < totalExpense) {
            return `Cảnh báo thâm hụt! Chi tiêu (${totalExpense.toLocaleString()}đ) đang vượt quá thu nhập (${totalIncome.toLocaleString()}đ). Bạn cần cắt giảm ngay các khoản chi không thiết yếu.`;
        }

        // XỬ LÝ NỢ 
        if (dti > 0.3) {
            return `Chỉ số nợ (DTI) của bạn đang ở mức ${(dti * 100).toFixed(1)}%. Hãy ưu tiên trả nợ thay vì đầu tư vào các hoạt động khác.`;
        }

        // DỰ PHÒNG 
        if (emergencyFundMonths < 3) {
            return `Quỹ dự phòng hiện chỉ đủ cho ${emergencyFundMonths.toFixed(1)} tháng chi tiêu. Hãy ưu tiên xây dựng quỹ khẩn cấp đến mức 3-6 tháng (${(totalExpense * 3).toLocaleString()}đ).`;
        }

        // TỐI ƯU 
        if (savingsRate < 0.2) {
            return `Tài chính đã ổn định. Hãy nâng tỷ lệ tiết kiệm từ ${(savingsRate * 100).toFixed(1)}% lên 20% để chuẩn bị cho tương lai.`;
        }

        return `Tuyệt vời! Bạn có quỹ dự phòng an toàn (${emergencyFundMonths.toFixed(1)} tháng) và tỷ lệ tiết kiệm cao. Đây là thời điểm tốt để tìm kiếm các kênh đầu tư sinh lời.`;
    }
}

export default new savingSuggestionService();
