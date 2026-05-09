import CurrencyModel from '../../../models/Currency';

export class EditCurrencyRepository {
  //Tìm và cập nhật một loại tiền tệ.
  async update(id: string, userId: string, data: any) {
    return await CurrencyModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: data },
      { new: true }       
    );
  }
}
