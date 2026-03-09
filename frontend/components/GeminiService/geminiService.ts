import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../../types";

// Initialize Gemini Client
// We assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Sends transaction history to Gemini to get a brief financial analysis.
 */
export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  try {
    const transactionSummary = JSON.stringify(transactions);
    
    // Updated prompt for Vietnamese output
    const prompt = `
      Đóng vai một chuyên gia tư vấn tài chính cá nhân thân thiện.
      Đây là danh sách các giao dịch gần đây của tôi dưới dạng JSON: ${transactionSummary}.
      
      Vui lòng cung cấp:
      1. Một câu tóm tắt ngắn gọn về thói quen chi tiêu của tôi.
      2. Ba lời khuyên thiết thực để cải thiện việc tiết kiệm hoặc cắt giảm chi phí.
      
      Hãy giữ giọng điệu khích lệ và chuyên nghiệp. Trả lời bằng Tiếng Việt. Định dạng bằng các gạch đầu dòng đơn giản hoặc markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Hiện tại không thể tạo lời khuyên.";
  } catch (error) {
    console.error("Error fetching AI advice:", error);
    return "Xin lỗi, tôi không thể phân tích dữ liệu của bạn lúc này. Vui lòng kiểm tra API Key hoặc thử lại sau.";
  }
};