const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/Finance');
  const Transaction = mongoose.model('Transaction', new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    type: String,
    total_amount: Number
  }, { collection: 'transactions' }));
  
  const txs = await Transaction.find().limit(5);
  console.log("Sample Transactions:", txs);
  
  if (txs.length > 0) {
      const tx = txs[0];
      const result = await Transaction.aggregate([
          { $match: { userId: tx.userId } },
          {
              $group: {
                  _id: null,
                  totalIncome: {
                      $sum: {
                          $cond: [{ $eq: ['$type', 'income'] }, '$total_amount', 0]
                      }
                  },
                  totalExpense: {
                      $sum: {
                          $cond: [{ $eq: ['$type', 'expense'] }, '$total_amount', 0]
                      }
                  }
              }
          }
      ]);
      console.log("Aggregation Result:", result);
  }
  
  mongoose.connection.close();
}
run();
