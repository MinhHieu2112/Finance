import catalogModel from '../../../models/Catalog';

class catalogRepository {
	async listCatalogs() {
		return catalogModel.find().sort({ type: 1, name: 1 }).lean();
	}
}

export default new catalogRepository();
