import categoryModel from '../../../models/Category';
import { type Types } from 'mongoose';

class add_trans_by_receiptImgRepository {
	async findCategoryByName(userId: Types.ObjectId, name: string) {
		const category = await categoryModel.findOne({ userId, name })
			.select('_id')
			.lean<{ _id: Types.ObjectId }>();

		return category?._id ?? null;
	}

}

export default new add_trans_by_receiptImgRepository();
