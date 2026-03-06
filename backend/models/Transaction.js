const mongoose = require('mongoose');
const transactionTypes = require('../config/transaction-types.json');
const transactionCategories = require('../config/transaction-categories.json');

const transactionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      required: true,
      enum: transactionTypes,
    },
    category: {
      type: String,
      required: true,
      enum: transactionCategories,
      trim: true,
    },
    date: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'transactions',
  }
);

module.exports = mongoose.model('Transaction', transactionSchema);
