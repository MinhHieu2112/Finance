import CurrencyModel from '../../../models/Currency';

// Repository xử lý việc xóa tiền tệ khỏi Database.
export class DeleteCurrencyRepository {
  // Xóa một loại tiền tệ.
  async delete(id: string, userId: string) {
    return await CurrencyModel.findOneAndDelete({ _id: id, userId });
  }
}
