import catalogRepository from './Repository';

class catalogService {
	async listCatalogs() {
		return catalogRepository.listCatalogs();
	}
}

export default new catalogService();
