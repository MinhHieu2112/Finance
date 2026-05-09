import CurrencyModel from '../models/Currency';

/**
 * Chuyển đổi một số tiền từ đơn vị tiền tệ bất kỳ sang đơn vị tiền tệ cơ sở (VND).
 * Bây giờ hàm này sẽ tra cứu tỷ giá động từ cơ sở dữ liệu dựa trên mã tiền tệ và người dùng.
 * 
 * @param amount Số tiền cần quy đổi
 * @param currencyCode Mã tiền tệ (Ví dụ: USD, EUR)
 * @param userId ID của người dùng thực hiện giao dịch
 * @returns Số tiền sau khi đã quy đổi sang VND
 */
export const convertToBase = async (amount: number, currencyCode: string, userId: string): Promise<number> => {
  // 1. Nếu là VND thì tỷ giá luôn là 1
  if (currencyCode.toUpperCase() === 'VND') {
    return amount;
  }

  try {
    // 2. Tìm tỷ giá trong bảng Currency của người dùng này
    const currency = await CurrencyModel.findOne({ 
      userId, 
      code: currencyCode.toUpperCase() 
    });

    // 3. Nếu tìm thấy, lấy tỷ giá đó. Nếu không, mặc định là 1 (hoặc có thể báo lỗi tùy logic)
    const rate = currency ? currency.rateToVnd : 1;
    
    return amount * rate;
  } catch (error) {
    console.error('Lỗi quy đổi tiền tệ:', error);
    return amount; // Trả về số tiền gốc nếu có lỗi hệ thống
  }
};
