import mongoose, { Schema } from 'mongoose';

export enum DebtStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
}

const debtSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true,
  },
  transactionId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Transaction',
    unique: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: Object.values(DebtStatus),
    default: DebtStatus.UNPAID,
  },
  dueDate: {
    type: Date,
  },
  description: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
  versionKey: false,
  collection: 'debts'
});

export default mongoose.model('Debt', debtSchema);
