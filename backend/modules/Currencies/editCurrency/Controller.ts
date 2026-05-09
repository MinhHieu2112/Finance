import { type Request, type Response, type NextFunction } from 'express';
import CurrencyModel from '../../../models/Currency';

//Cập nhật thông tin tiền tệ.
const editCurrency = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const authUser = res.locals.authUser;

    const updated = await CurrencyModel.findOneAndUpdate(
      { _id: id, userId: authUser.id },
      { $set: payload },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tiền tệ!'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật thành công!',
      currency: updated
    });
  } catch (error) {
    next(error);
  }
};

export default editCurrency;
