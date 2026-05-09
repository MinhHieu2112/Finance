import express from 'express';
import protect from '../middleware/Auth';
import listCurrency from '../modules/Currencies/listCurrency/Controller';
import addCurrency from '../modules/Currencies/addCurrency/Controller';
import editCurrency from '../modules/Currencies/editCurrency/Controller';
import deleteCurrency from '../modules/Currencies/deleteCurrency/Controller';

const currencyRouter = express.Router();

/**
 * Áp dụng middleware bảo vệ (protect) cho tất cả các route tiền tệ.
 * Điều này đảm bảo người dùng phải đăng nhập mới có thể truy cập.
 */
currencyRouter.use(protect);

// 1. Lấy danh sách tiền tệ
currencyRouter
  .route('/list')
  .get(listCurrency);

// 2. Thêm tiền tệ mới
currencyRouter
  .route('/add')
  .post(addCurrency);

// 3. Chỉnh sửa thông tin tiền tệ
currencyRouter
  .route('/edit/:id')
  .put(editCurrency);

// 4. Xóa tiền tệ
currencyRouter
  .route('/delete/:id')
  .delete(deleteCurrency);

export default currencyRouter;
