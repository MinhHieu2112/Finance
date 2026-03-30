import transactionRepository from './Repository';

class transactionService {
	async listTransactions(userID: string) {
		return transactionRepository.listTransactions(userID);
	}
}

export default new transactionService();
