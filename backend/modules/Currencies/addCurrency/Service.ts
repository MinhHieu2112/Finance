import { AddCurrencyRepository } from './Repository';

// Service xử lý nghiệp vụ thêm tiền tệ mới.
export class AddCurrencyService {
  private repository: AddCurrencyRepository;

  constructor() {
    this.repository = new AddCurrencyRepository();
  }

  // Thực thi thêm tiền tệ.
  async execute(userId: string, payload: { code: string, name: string, rateToVnd: number, symbol?: string }) {
    // 1. Kiểm tra xem mã tiền tệ đã tồn tại chưa
    const existing = await this.repository.findByCode(userId, payload.code);
    if (existing) {
      throw new Error(`Mã tiền tệ ${payload.code.toUpperCase()} đã tồn tại trong danh sách của bạn.`);
    }

    // 2. Tạo mới
    const currency = await this.repository.create({
      ...payload,
      userId
    });

    return {
      success: true,
      message: 'Thêm tiền tệ thành công',
      currency
    };
  }
}
