import anomalyRepository from './Repository';

class AnomalyService {
    // Tự động phát hiện chi tiêu bất thường bằng cách so sánh với mức chi tiêu trung bình trong quá khứ.
    async detectAnomaly(transaction: any) {
        if (transaction.type !== 'expense') return;

        try {
            const userId = transaction.userId;
            
            for (const detail of transaction.details) {
                const categoryId = detail.categoryId;
                const currentAmount = (detail.base_amount || detail.amount) * detail.quantity;

                const pastTransactions = await anomalyRepository.getPastTransactionsAverage(userId, categoryId, 30);

                if (pastTransactions.length > 0 && pastTransactions[0].count >= 2) {
                    const avg = pastTransactions[0].avgAmount;

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
