import transactionRepository from './Repository';
import AppError from '../../../utils/appError';
import { TransactionFrequency, TransactionType } from './types';
import type { transactionDetailSchema, transactionSchema } from './types';
import anomalyService from '../../aiAssistant/analyzer/Service';

class transactionService {
    async addTransaction(data: transactionSchema): Promise<transactionSchema> {
        let   totalAmount = data.total_amount;
        const description = data.description?.trim();
        const type        = data.type?.trim() as TransactionType;
        const frequency   = data.frequency?.trim() as TransactionFrequency;
        const details     = data.details as transactionDetailSchema[];

        if (!data.userId ||
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
            const amount       = Number(detail.amount);
            const quantity     = Number(detail.quantity) || 1;
            const name         = detail.name?.trim() || '';

            if (!categoryId) {
                throw new AppError('Transaction detail is missing categoryId', 400);
            }

            if (!Number.isFinite(amount) || amount < 0) {
                throw new AppError(`Transaction detail has invalid amount`, 400);
            }

            if (!Number.isFinite(quantity) || quantity <= 0) {
                throw new AppError(`Transaction detail has invalid quantity`, 400);
            }

            const existingCategory = await transactionRepository.findCategoryNameById(data.userId, categoryId, type);
            if (!existingCategory) {
                throw new AppError('Category not found for this user', 400);
            }
            normalizedDetails.push({categoryId,
                                    categoryName: existingCategory.name,
                                    name,
                                    amount,
                                    quantity});
        }

        totalAmount = normalizedDetails.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
    
        if (type === TransactionType.EXPENSE) {
            const currentBalance = await transactionRepository.getCurrentBalance(data.userId as unknown as import('mongoose').Types.ObjectId);
            if (currentBalance - totalAmount < 0) {
                throw new AppError(`Giao dịch không hợp lệ: Tổng số dư hiện tại (${currentBalance}) không đủ để thanh toán khoản chi (${totalAmount})`, 400);
            }
        }

        const transaction = await transactionRepository.addTransaction({userId      : data.userId,
                                                                        description : description,
                                                                        type        : type,
                                                                        frequency   : frequency,
                                                                        date        : data.date,
                                                                        total_amount: totalAmount,
                                                                        details     : normalizedDetails,});
                                                                                // Run anomaly detection asynchronously
        anomalyService.detectAnomaly(transaction).catch(err => console.error(err));

        return transaction;
    }
}

export default new transactionService()