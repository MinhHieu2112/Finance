import { type Request, type Response, type NextFunction } from 'express';
import CurrencyModel from '../../../models/Currency';

//Liệt kê danh sách tiền tệ của người dùng.
const listCurrency = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = res.locals.authUser;
    
    // Tìm tất cả tiền tệ thuộc về user hiện tại và sắp xếp theo mã
    const currencies = await CurrencyModel.find({ userId: authUser.id }).sort({ code: 1 });

    res.status(200).json({
      success: true,
      currencies
    });
  } catch (error) {
    next(error);
  }
};

export default listCurrency;
