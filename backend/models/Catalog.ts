import mongoose, { Schema } from 'mongoose';

enum TransactionType {
  INCOME  = 'income',
  EXPENSE = 'expense',
}

const catalogSchema = new Schema({type        : {type    : String,
                                                 required: true,
                                                 enum    : Object.values(TransactionType)},
                                  name        : {type    : String,
                                                 required: true,
                                                 trim    : true,}},
                                {timestamps: true,
                                 versionKey: false,
                                 collection: 'catalogs'}
);

catalogSchema.index({ type: 1, name: 1 }, { unique: true });

export default mongoose.model('Catalog', catalogSchema);
