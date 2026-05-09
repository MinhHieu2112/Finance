import CurrencyModel from '../../../models/Currency';

// Repository xử lý việc ghi dữ liệu tiền tệ mới vào Database.
export class AddCurrencyRepository {
  // Tạo mới một bản ghi tiền tệ.
  async create(data: any) {
    return await CurrencyModel.create(data);
  }

  // Kiểm tra xem mã tiền tệ đã tồn tại cho người dùng này chưa.
  async findByCode(userId: string, code: string) {
    return await CurrencyModel.findOne({ userId, code: code.toUpperCase() });
  }
}
