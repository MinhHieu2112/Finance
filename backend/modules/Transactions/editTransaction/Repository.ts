import transactionModel from '../../../models/Transaction';

class transactionRepository {
	async editTransactionById(id  : string,
				 userID: string,
                                 data: { description: string, 
                                         amount     : number, 
                                         type       : string, 
                                         category   : string, 
                                         frequency  : string,
                                         date       : Date }): Promise<any> {
		return transactionModel.findOneAndUpdate({ id, userID },
                                                         data,
                                                         { new: true, runValidators: true });
	}
}

export default new transactionRepository();
