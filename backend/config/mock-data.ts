import fs from 'fs';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const generateMockData = async () => {
  const plainPassword = '1234';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // ================= USERS =================
  const users = [
    {
      _id: new mongoose.Types.ObjectId(),
      username: 'tri',
      email: 'tri@gmail.com',
      password: hashedPassword
    },
    {
      _id: new mongoose.Types.ObjectId(),
      username: 'hieu',
      email: 'hieu@gmail.com',
      password: hashedPassword
    }
  ];

  const getUser = () =>
    users[Math.floor(Math.random() * users.length)];

  // ================= CATALOGS =================
  const catalogs = [
    // expense
    { _id: new mongoose.Types.ObjectId(), type: 'expense', name: 'Living Expenses' },
    { _id: new mongoose.Types.ObjectId(), type: 'expense', name: 'Unexpected Expenses' },
    { _id: new mongoose.Types.ObjectId(), type: 'expense', name: 'Fixed Expenses' },
    { _id: new mongoose.Types.ObjectId(), type: 'expense', name: 'Investment & Savings' },

    // income
    { _id: new mongoose.Types.ObjectId(), type: 'income', name: 'Income' }
  ];

  const getCatalog = (name: string) =>
    catalogs.find(c => c.name === name)!;

  // ================= CATEGORY TEMPLATE =================
  const categorySeed = [
    // Expense
    { catalog: 'Living Expenses', type: 'expense', names: ['groceries', 'supermarket', 'food', 'transportation'] },
    { catalog: 'Unexpected Expenses', type: 'expense', names: ['shopping', 'entertainment', 'beauty', 'healthcare', 'charity'] },
    { catalog: 'Fixed Expenses', type: 'expense', names: ['bills', 'housing', 'family'] },
    { catalog: 'Investment & Savings', type: 'expense', names: ['investment', 'education'] },

    // Income
    { catalog: 'Income', type: 'income', names: ['debt_collection', 'business', 'profit', 'bonus', 'allowance', 'salary'] }
  ];

  // ================= CATEGORIES =================
  const categories: any[] = [];

  users.forEach(user => {
    categorySeed.forEach(seed => {
      const catalog = getCatalog(seed.catalog);

      seed.names.forEach(name => {
        categories.push({
          _id: new mongoose.Types.ObjectId(),
          userId: user._id,
          catalogId: catalog._id,
          name,
          type: seed.type
        });
      });
    });
  });

  const getRandomCategory = (userId: any, type: string) => {
    const filtered = categories.filter(
      c => c.userId.equals(userId) && c.type === type
    );
    return filtered[Math.floor(Math.random() * filtered.length)];
  };

  // ================= TRANSACTIONS =================
  const transactions: any[] = [];
  const frequencies = ['weekly', 'monthly', 'yearly', 'one-time'];

  let date = new Date('2024-01-01');
  const end = new Date('2026-03-31');

  while (date <= end) {
    const user = getUser();
    const userId = user._id;

    const dateObj = new Date(date);

    // ===== Monthly Salary =====
    if (date.getDate() === 1) {
      const salary = categories.find(
        c => c.userId.equals(userId) && c.name === 'salary'
      );

      transactions.push({
        _id: new mongoose.Types.ObjectId(),
        userId,
        description: `Salary ${date.getMonth() + 1}/${date.getFullYear()}`,
        type: 'income',
        frequency: 'monthly',
        date: dateObj,
        total_amount: 5000000,
        details: [{
          categoryId: salary._id,
          categoryName: salary.name,
          quantity: 1,
          amount: 5000000,
          name: ''
        }]
      });
    }

    // ===== Random Expense =====
    const cat = getRandomCategory(userId, 'expense');
    const amount = Math.floor(Math.random() * 90000) + 10000;

    transactions.push({
      _id: new mongoose.Types.ObjectId(),
      userId,
      description: `Expense ${cat.name}`,
      type: 'expense',
      frequency: frequencies[Math.floor(Math.random() * frequencies.length)],
      date: dateObj,
      total_amount: amount,
      details: [{
        categoryId: cat._id,
        categoryName: cat.name,
        quantity: 1,
        amount,
        name: ''
      }]
    });

    date.setDate(date.getDate() + 1);
  }

  // ================= EXPORT =================
  fs.writeFileSync('config/users.json', JSON.stringify(users, null, 2));
  fs.writeFileSync('config/catalogs.json', JSON.stringify(catalogs, null, 2));
  fs.writeFileSync('config/categories.json', JSON.stringify(categories, null, 2));
  fs.writeFileSync('config/transactions.json', JSON.stringify(transactions, null, 2));

  console.log('✅ Done');
  console.log(`Users: ${users.length}`);
  console.log(`Catalogs: ${catalogs.length}`);
  console.log(`Categories: ${categories.length}`);
  console.log(`Transactions: ${transactions.length}`);
};

generateMockData();