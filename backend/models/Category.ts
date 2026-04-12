import mongoose, { Schema } from 'mongoose';

enum TransactionType {
  INCOME  = 'income',
  EXPENSE = 'expense',
}

const categorySchema = new Schema({userId     : {type    : Schema.Types.ObjectId,
                                                 required: true,
                                                 ref     : 'User',
                                                 index   : true,},
                                   catalogId   : {type    : Schema.Types.ObjectId,
                                                 required: true,
                                                 ref     : 'Catalog',
                                                 index   : true,},
                                   name       : {type    : String,
                                                 required: true,
                                                 trim    : true,},
                                   type        : {type    : String,
                                                 required: true,
                                                 enum    : Object.values(TransactionType)}},
                                {timestamps: true,
                                 versionKey: false,
                                 collection: 'categories'}
);

categorySchema.index({ userId: 1, type: 1 });
categorySchema.index({ userId: 1, type: 1, name: 1 }, { unique: true });

export default mongoose.model('Category', categorySchema);
