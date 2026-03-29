import transactionRepository from './Repository';

class transactionService {
	async listTransactions() {
		return transactionRepository.listTransactions();
	}
}

export default new transactionService();
