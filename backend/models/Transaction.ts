import mongoose, { Schema } from 'mongoose';

export enum TransactionType {
  INCOME  = 'income',
  EXPENSE = 'expense',
}

export enum TransactionFrequency {
  WEEKLY   = 'weekly',
  MONTHLY  = 'monthly',
  YEARLY   = 'yearly',
  ONE_TIME = 'one-time',
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
                                                    trim    : true,},
                                      frequency  : {type    : String,
                                                    required: true,
                                                    enum    : Object.values(TransactionFrequency),
                                                    default : TransactionFrequency.ONE_TIME,},
                                      date       : {type    : Date,
                                                    required: true,}},
                                     {timestamps : true,
                                      versionKey : false,
                                      collection : 'transactions'}
);

export default mongoose.model('Transaction', transactionSchema);
