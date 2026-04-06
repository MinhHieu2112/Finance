import transactionModel from '../../../models/Transaction';
import categoryModel from '../../../models/Category';
import { type Types } from 'mongoose';
import { type transactionDetailSchema } from '../../types/Transactions';

class transactionRepository {
        async findCategoryNameById(userId: Types.ObjectId, categoryId: Types.ObjectId) {
                return categoryModel.findOne({ _id: categoryId, userId })
                        .select('name')
                        .lean<{ name: string }>();
        }

        async findOrCreateCategoryByName(userId: Types.ObjectId, name: string) {
                const category = await categoryModel.findOneAndUpdate(
                        { userId, name },
                        { $setOnInsert: { userId, name, description: '' } },
                        { new: true, upsert: true, setDefaultsOnInsert: true },
                )
                        .select('_id name')
                        .lean<{ _id: Types.ObjectId; name: string }>();

                return category;
        }

        async editTransactionById(transactionId : Types.ObjectId,
                                  userId        : Types.ObjectId,
                                  data          : {description  : string;
                                                   type         : string;
                                                   frequency    : string;
                                                   date         : Date;
                                                   total_amount : number;
                                                   details      : transactionDetailSchema[];}): Promise<any> {
                return transactionModel.findOneAndUpdate({ _id: transactionId, userId },
                                                         data,
                                                         { new: true, runValidators: true });
	}
}

export default new transactionRepository();
