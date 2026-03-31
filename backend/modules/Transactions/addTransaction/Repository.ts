import transactionModel from '../../../models/Transaction';

class transactionRepository {
    async addTransaction(data: { id         : string, 
                                 userID     : string,
                                 description: string, 
                                 amount     : number, 
                                 type       : string, 
                                 category   : string, 
                                 frequency  : string,
                                 date       : string }) {
        const transaction = await transactionModel.create(data);
        return transaction;
    }
}

export default new transactionRepository()