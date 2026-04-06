import transactionRepository from './Repository';
import AppError from '../../../utils/appError';
import { TransactionFrequency, TransactionType } from '../../types/Transactions';
import {type editTransactionSchema,
		type transactionDetailSchema } from '../../types/Transactions';
import { type Types } from 'mongoose';

class transactionService {
	async editTransaction(id	: Types.ObjectId,
						  userId: Types.ObjectId,
						  data	: editTransactionSchema) {
		let   totalAmount = data.total_amount;
        const description = data.description?.trim();
        const type        = data.type?.trim() as TransactionType;
        const frequency   = data.frequency?.trim() as TransactionFrequency;
        const details     = data.details as transactionDetailSchema[];

        if (!id ||
			!userId ||
            !description ||
            !type ||
            !frequency ||
            !data.date ||
            !Array.isArray(data.details) ||
            data.details.length === 0) {
            throw new AppError('Missing required transaction fields', 400);
        }

        if (!Object.values(TransactionType).includes(type)) {
            throw new AppError('Invalid transaction type', 400);
        }

        if (!Object.values(TransactionFrequency).includes(frequency)) {
            throw new AppError('Invalid transaction frequency', 400);
        }

        if (totalAmount !== undefined && totalAmount !== null && Number(totalAmount) < 0) {
            throw new AppError('total_amount must be greater than or equal to 0', 400);
        }

        const normalizedDetails = [];
        for (const detail of details) {
            const categoryId   = detail.categoryId;
            const categoryName = detail.categoryName?.trim();
            const amount       = Number(detail.amount);
            const quantity     = Number(detail.quantity) || 1;
            if (!categoryName) {
                throw new AppError(`Transaction detail is missing categoryName`, 400);
            }

            if (!Number.isFinite(amount) || amount < 0) {
                throw new AppError(`Transaction detail has invalid amount`, 400);
            }

            if (!Number.isFinite(quantity) || quantity <= 0) {
                throw new AppError(`Transaction detail has invalid quantity`, 400);
            }

            const existingCategory = await transactionRepository.findCategoryNameById(userId, categoryId);
            if (!existingCategory) {
                throw new AppError('Category not found for this user', 400);
            }
            normalizedDetails.push({
                    ...detail,
                    amount,
                    quantity
                });
        }

        totalAmount = normalizedDetails.reduce((sum, item) => sum + item.amount, 0);
    
        const updatedTransaction = await transactionRepository.editTransactionById(id,
																				   userId,
                                                                        		  {description : description,
                                                                        		   type        : type,
                                                                        		   frequency   : frequency,
                                                                        		   date        : data.date,
                                                                        		   total_amount: totalAmount,
                                                                        		   details     : normalizedDetails,});

		if (!updatedTransaction) {
			throw new AppError('Transaction not found', 404);
		}

		return updatedTransaction;
	}
}

export default new transactionService();
