import transactionRepository from './Repository';
import AppError from '../../../utils/appError';
import { TransactionFrequency, TransactionType, Currency } from './types';
import type { transactionDetailSchema, transactionSchema } from './types';
import anomalyService from '../../aiAssistant/analyzer/Service';
import { convertToBase } from '../../../utils/currencyConverter';
import { parseCurrencyInput } from '../../../utils/parseCurrencyInput';

class transactionService {
	// Thực hiện nghiệp vụ thêm mới giao dịch, bao gồm kiểm tra số dư và quy đổi sang đơn vị VND.
    async addTransaction(data: transactionSchema): Promise<transactionSchema> {
        let   totalAmount = data.total_amount;
        const description = data.description?.trim();
        const type        = data.type?.trim() as TransactionType;
        const frequency   = data.frequency?.trim() as TransactionFrequency;
        const details     = data.details as transactionDetailSchema[];
        let inferredCurrency: Currency | null = null;

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
        const parsedDetails = [];
        for (const detail of details) {
            const categoryId   = detail.categoryId;
            const quantity     = Number(detail.quantity) || 1;
            const name         = detail.name?.trim() || '';
            const parsedAmount = parseCurrencyInput(detail.amount);
            const amount       = parsedAmount.amount;

            if (!categoryId) {
                throw new AppError('Transaction detail is missing categoryId', 400);
            }

            if (parsedAmount.detectedCurrency) {
                if (inferredCurrency && inferredCurrency !== parsedAmount.detectedCurrency) {
                    throw new AppError('Mixed currencies in one transaction are not supported', 400);
                }
                inferredCurrency = parsedAmount.detectedCurrency;
            }

            if (!Number.isFinite(amount) || amount === null || amount < 0) {
                throw new AppError(`Transaction detail has invalid amount`, 400);
            }

            if (!Number.isFinite(quantity) || quantity <= 0) {
                throw new AppError(`Transaction detail has invalid quantity`, 400);
            }
            parsedDetails.push({categoryId, name, amount, quantity});
        }

        const currency = inferredCurrency || data.currency || Currency.VND;

        if (!Object.values(Currency).includes(currency)) {
            throw new AppError('Invalid currency', 400);
        }

        const normalizedDetails = [];
        for (const detail of parsedDetails) {
            const existingCategory = await transactionRepository.findCategoryNameById(data.userId, detail.categoryId, type);
            if (!existingCategory) {
                throw new AppError('Category not found for this user', 400);
            }
            normalizedDetails.push({categoryId  : detail.categoryId,
                                    categoryName: existingCategory.name,
                                    name        : detail.name,
                                    amount      : detail.amount,
                                    quantity    : detail.quantity,
                                    base_amount : convertToBase(detail.amount, currency)});
        }

        totalAmount = normalizedDetails.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
        const baseAmount = convertToBase(totalAmount, currency);
    
        if (type === TransactionType.EXPENSE) {
            const currentBalance = await transactionRepository.getCurrentBalance(data.userId as unknown as import('mongoose').Types.ObjectId);
            if (currentBalance - baseAmount < 0) {
                throw new AppError(`Giao dịch không hợp lệ: Tổng số dư hiện tại (${currentBalance}) không đủ để thanh toán khoản chi (${totalAmount} ${currency} ≈ ${Math.round(baseAmount).toLocaleString('vi-VN')} VND)`, 400);
            }
        }

        const transaction = await transactionRepository.addTransaction({userId      : data.userId,
                                                                        description : description,
                                                                        type        : type,
                                                                        frequency   : frequency,
                                                                        currency    : currency,
                                                                        base_amount : baseAmount,
                                                                        date        : data.date,
                                                                        total_amount: totalAmount,
                                                                        details     : normalizedDetails,});
                                                                                // Run anomaly detection asynchronously
        anomalyService.detectAnomaly(transaction).catch(err => console.error(err));

        return transaction;
    }
}

export default new transactionService()
