import transactionModel from '../../../models/Transaction';
import Notification from '../../../models/Notification';
import { Types } from 'mongoose';

export const detectAnomalyAndNotify = async (transaction: any) => {
    // Only detect anomalies for expenses
    if (transaction.type !== 'expense') return;

    try {
        const userId = transaction.userId;
        
        // Let's check each detail to see if it's anomalous compared to past expenses in that category
        for (const detail of transaction.details) {
            const categoryId = detail.categoryId;
            const currentAmount = detail.amount * detail.quantity;

            // Get average for this category over the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const pastTransactions = await transactionModel.aggregate([
                { 
                    $match: { 
                        userId: new Types.ObjectId(userId.toString()),
                        type: 'expense',
                        date: { $gte: thirtyDaysAgo }
                    } 
                },
                { $unwind: '$details' },
                { 
                    $match: { 
                        'details.categoryId': new Types.ObjectId(categoryId.toString()) 
                    } 
                },
                {
                    $group: {
                        _id: null,
                        avgAmount: { $avg: { $multiply: ['$details.amount', '$details.quantity'] } },
                        count: { $sum: 1 }
                    }
                }
            ]);

            if (pastTransactions.length > 0 && pastTransactions[0].count >= 2) {
                const avg = pastTransactions[0].avgAmount;
                // If current amount is > 2.5x the average
                if (currentAmount > avg * 2.5) {
                    await Notification.create({
                        userId: userId,
                        title: 'Phát hiện chi tiêu bất thường',
                        message: `Khoản chi "${detail.categoryName}" (${currentAmount.toLocaleString()}đ) cao gấp ${(currentAmount / avg).toFixed(1)} lần mức trung bình gần đây của bạn.`,
                        type: 'anomaly'
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error detecting anomaly:', error);
    }
};
