import categoryRepository from './Repository';
import AppError from '../../../utils/appError';
// import { toObjectId } from '../../../utils/objectId';
import { Types } from 'mongoose';

class categoryService {
	async listCategories(userId: Types.ObjectId) {
		if (!userId) {
			throw new AppError('User id is required', 400);
		}

		const categories = await categoryRepository.listCategories(userId);

		return categories.map((category) => {
			const catalogData = category.catalogId;
			const catalogName = typeof catalogData === 'object' && catalogData && 'name' in catalogData
				? catalogData.name
				: undefined;
			const catalogId = typeof catalogData === 'object' && catalogData && '_id' in catalogData
				? catalogData._id
				: category.catalogId;

			return {
				...category,
				catalogId,
				catalogName,
			};
		});
	}
}

export default new categoryService();
