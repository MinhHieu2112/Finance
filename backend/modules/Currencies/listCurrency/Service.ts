import { ListCurrencyRepository } from './Repository';

/**
 * Lớp Service xử lý logic nghiệp vụ cho việc liệt kê tiền tệ.
 */
export class ListCurrencyService {
  private repository: ListCurrencyRepository;

  constructor() {
    this.repository = new ListCurrencyRepository();
  }

  //Thực thi việc lấy danh sách tiền tệ.
  async execute(userId: string) {
    const currencies = await this.repository.findAllByUserId(userId);
    return {
      success: true,
      currencies
    };
  }
}
