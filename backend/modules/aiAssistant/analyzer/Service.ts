import anomalyRepository from './Repository';

class AnomalyService {
    async detectAnomaly(transaction: any) {
        // Only detect anomalies for expenses
        if (transaction.type !== 'expense') return;

        try {
            const userId = transaction.userId;
            
            // Check each detail to see if it's anomalous compared to past expenses in that category
            for (const detail of transaction.details) {
                const categoryId = detail.categoryId;
                const currentAmount = detail.amount * detail.quantity;

                // Get average for this category over the last 30 days
                const pastTransactions = await anomalyRepository.getPastTransactionsAverage(userId, categoryId, 30);

                if (pastTransactions.length > 0 && pastTransactions[0].count >= 2) {
                    const avg = pastTransactions[0].avgAmount;
                    // If current amount is > 2.5x the average
                    if (currentAmount > avg * 2.5) {
                        console.log(`Phát hiện chi tiêu bất thường: Khoản chi "${detail.categoryName}" (${currentAmount.toLocaleString()}đ) cao gấp ${(currentAmount / avg).toFixed(1)} lần mức trung bình gần đây.`);
                    }
                }
            }
        } catch (error) {
            console.error('Error detecting anomaly:', error);
        }
    }
}

export default new AnomalyService();
