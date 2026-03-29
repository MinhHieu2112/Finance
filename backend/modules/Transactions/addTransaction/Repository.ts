import transactionModel from '../../../models/Transaction';

class transactionRepository {
    async addTransaction(data: { id         : string, 
                                 description: string, 
                                 amount     : number, 
                                 type       : string, 
                                 category   : string, 
                                 date       : string }) {
        const transaction = await transactionModel.create(data);
        return transaction;
    }
}

export default new transactionRepository()