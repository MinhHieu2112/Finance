import CurrencyModel from '../../../models/Currency';


export class ListCurrencyRepository {
  /**
   * Tìm tất cả các loại tiền tệ thuộc về một người dùng cụ thể.
   * @param userId ID của người dùng
   */
  async findAllByUserId(userId: string) {
    return await CurrencyModel.find({ userId }).sort({ code: 1 });
  }
}
