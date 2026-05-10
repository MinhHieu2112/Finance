import transactionRepository from './Repository';
import AppError from '@/utils/appError';
import { TransactionFrequency, TransactionType, Currency } from './types';
import type { transactionDetailSchema, transactionSchema } from './types';

import { convertToBase } from '@/utils/currencyConverter';
import { parseCurrencyInput } from '@/utils/parseCurrencyInput';

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
            throw new AppError('Giao dịch thiếu các trường thông tin bắt buộc', 400);
        }

        if (!Object.values(TransactionType).includes(type)) {
            throw new AppError('Loại giao dịch không hợp lệ', 400);
        }

        if (!Object.values(TransactionFrequency).includes(frequency)) {
            throw new AppError('Tần suất giao dịch không hợp lệ', 400);
        }

        if (totalAmount !== undefined && totalAmount !== null && Number(totalAmount) < 0) {
            throw new AppError('Tổng số tiền (total_amount) phải lớn hơn hoặc bằng 0', 400);
        }
        const parsedDetails = [];
        for (const detail of details) {
            const categoryId   = detail.categoryId;
            const quantity     = Number(detail.quantity) || 1;
            const name         = detail.name?.trim() || '';
            const parsedAmount = parseCurrencyInput(detail.amount);
            const amount       = parsedAmount.amount;

            if (!categoryId) {
                throw new AppError('Chi tiết giao dịch bị thiếu danh mục (categoryId)', 400);
            }

            if (parsedAmount.detectedCurrency) {
                if (inferredCurrency && inferredCurrency !== parsedAmount.detectedCurrency) {
                    throw new AppError('Không hỗ trợ sử dụng nhiều loại tiền tệ trong cùng một giao dịch', 400);
                }
                inferredCurrency = parsedAmount.detectedCurrency;
            }

            if (!Number.isFinite(amount) || amount === null || amount < 0) {
                throw new AppError(`Chi tiết giao dịch có số tiền không hợp lệ`, 400);
            }

            if (!Number.isFinite(quantity) || quantity <= 0) {
                throw new AppError(`Chi tiết giao dịch có số lượng không hợp lệ`, 400);
            }
            parsedDetails.push({categoryId, name, amount, quantity});
        }

        const currency = inferredCurrency || data.currency || 'VND';

        const normalizedDetails = [];
        for (const detail of parsedDetails) {
            const existingCategory = await transactionRepository.findCategoryNameById(data.userId, detail.categoryId, type);
            if (!existingCategory) {
                throw new AppError('Không tìm thấy danh mục cho tài khoản này', 400);
            }
            normalizedDetails.push({
                categoryId  : detail.categoryId,
                categoryName: existingCategory.name,
                name        : detail.name,
                amount      : detail.amount,
                quantity    : detail.quantity,
                base_amount : await convertToBase(detail.amount, currency, data.userId.toString()),
            });
        }

        totalAmount = normalizedDetails.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
        const baseAmount = await convertToBase(totalAmount, currency, data.userId.toString());
    
        if (type === TransactionType.EXPENSE) {
            const currentBalance = await transactionRepository.getCurrentBalance(data.userId as unknown as import('mongoose').Types.ObjectId);
            if (currentBalance - baseAmount < 0) {
                throw new AppError(`Giao dịch không hợp lệ: Tổng số dư hiện tại (${currentBalance}) không đủ để thanh toán khoản chi (${totalAmount} ${currency} ≈ ${Math.round(baseAmount).toLocaleString('vi-VN')} VND)`, 400);
            }
        }

        const transaction = await transactionRepository.addTransaction({
            userId      : data.userId,
            description : description,
            type        : type,
            frequency   : frequency,
            currency    : currency,
            base_amount : baseAmount,
            date        : data.date,
            total_amount: totalAmount,
            details     : normalizedDetails,
        });



        return transaction;
    }
}

export default new transactionService()
