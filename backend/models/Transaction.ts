import mongoose, { Schema } from 'mongoose';

enum TransactionType {
  INCOME  = 'income',
  EXPENSE = 'expense',
  DEBT    = 'debt',
  SAVINGS = 'savings',
}

enum TransactionFrequency {
  WEEKLY   = 'weekly',
  MONTHLY  = 'monthly',
  YEARLY   = 'yearly',
  ONE_TIME = 'one-time',
}

enum Currency {
  VND = 'VND',
}

// Schema chi tiết cho từng mục trong một giao dịch (ví dụ: các món hàng trong một hóa đơn).
const transactionDetailSchema = new Schema({categoryId  : {type    : Schema.Types.ObjectId,
                                                            required: true,
                                                            ref     : 'Category',},
                                             categoryName: {type    : String,
                                                            required: true,
                                                            trim    : true,},
                                             quantity    : {type    : Number,
                                                            required: true,
                                                            min     : 1,},
                                             amount      : {type    : Number,
                                                            required: true,
                                                            min     : 0,},
                                             base_amount : {type    : Number,
                                                            required: true,
                                                            min     : 0,
                                                            default : 0,},
                                             name        : {type    : String,
                                                            default : '',
                                                            trim    : true,}},
                                            { _id: false }
);

// Schema chính cho giao dịch (thu nhập hoặc chi tiêu).
const transactionSchema = new Schema({userId      : {type    : Schema.Types.ObjectId,
                                                     required: true,
                                                     ref     : 'User',
                                                     index   : true,},
                                      description : {type    : String,
                                                     required: true,
                                                     trim    : true,},
                                      type        : {type    : String,
                                                     required: true,
                                                     enum    : Object.values(TransactionType),},
                                      frequency   : {type    : String,
                                                     required: true,
                                                     enum    : Object.values(TransactionFrequency),
                                                     default : TransactionFrequency.ONE_TIME,},
                                      date        : {type    : Date,
                                                     required: true,},
                                      total_amount: {type    : Number,
                                                     required: true,
                                                     min     : 0,},
                                      currency    : {type    : String,
                                                     required: true,
                                                     default : 'VND',},
                                      base_amount : {type    : Number,
                                                     required: true,
                                                     min     : 0,
                                                     default : 0,},
                                      details     : {type    : [transactionDetailSchema],
                                                     required: true,
                                                     validate: [(value: unknown[]) => value.length > 0, 'At least one transaction detail is required'],}},
                                     {timestamps : true,
                                      versionKey : false,
                                      collection : 'transactions'}
);

transactionSchema.index({ userId: 1, date: -1 });

export default mongoose.model('Transaction', transactionSchema);
