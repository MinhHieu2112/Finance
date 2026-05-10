const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/Finance');
  const Transaction = mongoose.model('Transaction', new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    type: String,
    total_amount: Number
  }, { collection: 'transactions' }));
  
  const txs = await Transaction.find().limit(1);
  if (txs.length > 0) {
      const tx = txs[0];
      const userIdStr = tx.userId.toString();
      
      const objectIdUserId = typeof userIdStr === 'string' ? new mongoose.Types.ObjectId(userIdStr) : userIdStr;
      
      const result = await Transaction.aggregate([
          { $match: { userId: objectIdUserId } },
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
      console.log("Calculated Balance:", result.length > 0 ? result[0].totalIncome - result[0].totalExpense : 0);
  }
  
  mongoose.connection.close();
}
run();
