import { DeleteCurrencyRepository } from './Repository';

// Service xử lý logic xóa tiền tệ.
export class DeleteCurrencyService {
  private repository: DeleteCurrencyRepository;

  constructor() {
    this.repository = new DeleteCurrencyRepository();
  }

  // Thực thi xóa tiền tệ.
  async execute(id: string, userId: string) {
    const deleted = await this.repository.delete(id, userId);

    if (!deleted) {
      throw new Error('Không tìm thấy tiền tệ !');
    }

    return {
      success: true,
      message: 'Xóa thành công !'
    };
  }
}
