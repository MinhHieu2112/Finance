import categoryRepository from './Repository';

class categoryService {
	async listCategories() {
		return categoryRepository.listCategories();
	}
}

export default new categoryService();
