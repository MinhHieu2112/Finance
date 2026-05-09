import { EditCurrencyRepository } from './Repository';

// Service xử lý logic chỉnh sửa thông tin tiền tệ.
export class EditCurrencyService {
  private repository: EditCurrencyRepository;

  constructor() {
    this.repository = new EditCurrencyRepository();
  }

  // Thực thi cập nhật tiền tệ.
  async execute(id: string, userId: string, payload: any) {
    const updated = await this.repository.update(id, userId, payload);
    
    if (!updated) {
      throw new Error('Không tìm thấy tiền tệ !');
    }

    return {
      success: true,
      message: 'Cập nhật thành công !',
      currency: updated
    };
  }
}
