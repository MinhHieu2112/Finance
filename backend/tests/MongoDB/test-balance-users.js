const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/Finance');
  const Transaction = mongoose.model('Transaction', new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    type: String,
    total_amount: Number
  }, { collection: 'transactions' }));
  
  const User = mongoose.model('User', new mongoose.Schema({
      username: String
  }, { collection: 'users' }));
  
  const users = await User.find();
  console.log("Users:");
  for (const u of users) {
      console.log(`- ${u.username} (${u._id})`);
      
      const result = await Transaction.aggregate([
          { $match: { userId: u._id } },
          {
              $group: {
                  _id: null,
                  totalIncome: {
                      $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$total_amount', 0] }
                  },
                  totalExpense: {
                      $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$total_amount', 0] }
                  }
              }
          }
      ]);
      console.log("  Balance:", result.length > 0 ? result[0].totalIncome - result[0].totalExpense : 0);
  }
  
  mongoose.connection.close();
}
run();
