import mongoose, { Schema } from 'mongoose';

export enum TransactionType {
  INCOME  = 'income',
  EXPENSE = 'expense',
}

// Enum for Categories to keep data structured
export enum Category {
  FOOD          = 'Food & Dining',
  TRANSPORT     = 'Transportation',
  UTILITIES     = 'Utilities',
  ENTERTAINMENT = 'Entertainment',
  SHOPPING      = 'Shopping',
  HEALTH        = 'Health',
  SALARY        = 'Salary',
  INVESTMENT    = 'Investment',
  OTHER         = 'Other',
}

const transactionSchema = new Schema({id         : {type    : String,
                                                    required: true,
                                                    unique  : true,
                                                    trim    : true,},
                                      userID     : {type    : String,
                                                    required: true,
                                                    ref     : 'User',
                                                    index   : true,},
                                      description: {type    : String,
                                                    required: true,
                                                    trim    : true,},
                                      amount     : {type    : Number,
                                                    required: true,
                                                    min     : 0,},
                                      type       : {type    : String,
                                                    required: true,
                                                    enum    : Object.values(TransactionType),},
                                      category   : {type    : String,
                                                    required: true,
                                                    enum    : Object.values(Category),
                                                    trim    : true,},
                                      date       : {type    : String,
                                                    required: true,}},
                                     {timestamps : true,
                                      versionKey : false,
                                      collection : 'transactions'}
);

export default mongoose.model('Transaction', transactionSchema);
