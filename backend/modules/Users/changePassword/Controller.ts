import { type Request, type Response, type NextFunction } from 'express';
import changePasswordService from './Service';

const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authUser = res.locals.authUser;
    const { oldPassword, newPassword } = req.body;

    await changePasswordService.changePassword(authUser.id, { oldPassword, newPassword });

    res.status(200).json({
      status: 'success',
      message: 'Đổi mật khẩu thành công',
    });
  } catch (err) {
    next(err);
  }
};

export default changePassword;
