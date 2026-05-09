import { type Request, type Response, type NextFunction } from 'express';
import CurrencyModel from '../../../models/Currency';

//Thêm mới một loại tiền tệ và tỷ giá.
const addCurrency = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, name, rateToVnd, symbol } = req.body;
    const authUser = res.locals.authUser;

    // 1. Kiểm tra dữ liệu bắt buộc
    if (!code || !name || rateToVnd === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ các thông tin bắt buộc (Mã, Tên, Tỷ giá)'
      });
    }

    // 2. Kiểm tra trùng lặp mã tiền tệ
    const existing = await CurrencyModel.findOne({ 
      userId: authUser.id, 
      code: code.toUpperCase() 
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Mã tiền tệ ${code.toUpperCase()} đã tồn tại.`
      });
    }

    // 3. Tạo mới
    const currency = await CurrencyModel.create({
      code: code.toUpperCase(),
      name,
      rateToVnd,
      symbol,
      userId: authUser.id
    });

    res.status(201).json({
      success: true,
      message: 'Thêm tiền tệ thành công',
      currency
    });
  } catch (error) {
    next(error);
  }
};

export default addCurrency;
