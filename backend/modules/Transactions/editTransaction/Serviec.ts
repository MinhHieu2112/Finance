import transactionRepository from './Repository';
import AppError from '../../../utils/appError';
import categoryModel from '../../../models/Category';
import { TransactionFrequency, TransactionType } from '../../../models/Transaction';

class transactionService {
	async editTransaction(id	: string,
						  userID: string,
						  data	: { description : string, 
									amount		: number, 
									type		: string, 
									category	: string, 
									frequency	: string,
									date		: Date }) {
		const description = data.description?.trim();
		const type = data.type?.trim() as TransactionType;
		const category = data.category?.trim();
		const frequency = data.frequency?.trim() as TransactionFrequency;

		if (!id) {
			throw new AppError('Transaction id is required', 400);
		}

		if (!userID) {
			throw new AppError('Unauthorized', 401);
		}

		if (!description ||
			data.amount === undefined ||
			data.amount === null ||
			!type ||
			!category ||
			!frequency ||
			!data.date) {
			throw new AppError('Missing required transaction fields', 400);
		}

		if (data.amount < 0) {
			throw new AppError('Amount must be greater than or equal to 0', 400);
		}

		if (!Object.values(TransactionType).includes(type)) {
			throw new AppError('Invalid transaction type', 400);
		}

		if (!Object.values(TransactionFrequency).includes(frequency)) {
			throw new AppError('Invalid transaction frequency', 400);
		}

		if (type === TransactionType.EXPENSE) {
			const existingCategory = await categoryModel.findOne({ name: category });
			if (!existingCategory) {
				throw new AppError('Expense category does not exist', 400);
			}
		}

		const updatedTransaction = await transactionRepository.editTransactionById(id,
																	 userID,
																	 {description,
																	  amount: data.amount,
																	  type,
																	  category,
																	  frequency,
																	  date: data.date,});

		if (!updatedTransaction) {
			throw new AppError('Transaction not found', 404);
		}

		return updatedTransaction;
	}
}

export default new transactionService();
