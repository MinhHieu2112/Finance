import { type Request, type Response, type NextFunction } from 'express';
import CurrencyModel from '../../../models/Currency';

//Xóa một loại tiền tệ.
const deleteCurrency = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const authUser = res.locals.authUser;

    const deleted = await CurrencyModel.findOneAndDelete({ 
      _id: id, 
      userId: authUser.id 
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tiền tệ !'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa thành công !'
    });
  } catch (error) {
    next(error);
  }
};

export default deleteCurrency;
