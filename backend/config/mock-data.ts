import fs from 'fs';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const generateMockData = async () => {
  const plainPassword = '1234';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const users = [
    {
      _id: new mongoose.Types.ObjectId().toString(),
      username: 'tri',
      email: 'tri@gmail.com',
      password: hashedPassword
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      username: 'hieu',
      email: 'hieu@gmail.com',
      password: hashedPassword
    }
  ];

  const getUser = () =>
    users[Math.floor(Math.random() * users.length)];

  const categoryNames = [
    'Salary','Interest','Rent','Food & Dining','Transportation',
    'Utilities','Entertainment','Shopping','Health','Investment','Other'
  ];

  const categories: any[] = [];

  users.forEach(user => {
    categoryNames.forEach(name => {
      categories.push({
        _id: new mongoose.Types.ObjectId().toString(),
        userId: user._id,
        name,
        description: ''
      });
    });
  });

  const getCategory = (userId: string, name: string) =>
    categories.find(c => c.userId === userId && c.name === name)!;

  const getRandomExpenseCategory = (userId: string) => {
    const filtered = categories.filter(c =>
      c.userId === userId &&
      !['Salary', 'Interest', 'Rent'].includes(c.name)
    );
    return filtered[Math.floor(Math.random() * filtered.length)];
  };

  const transactions: any[] = [];
  const frequencies = ['weekly', 'monthly', 'yearly', 'one-time'];

  let date = new Date('2024-01-01');
  const end = new Date('2026-03-31');

  while (date <= end) {
    const user = getUser();
    const userId = user._id;
    const dateStr = date.toISOString();

    if (date.getDate() === 1) {
      const salary = getCategory(userId, 'Salary');
      const rent = getCategory(userId, 'Rent');

      transactions.push({
        _id: new mongoose.Types.ObjectId().toString(),
        userId,
        description: `Salary ${date.getMonth() + 1}/${date.getFullYear()}`,
        type: 'income',
        frequency: 'monthly',
        date: dateStr,
        total_amount: 5000000,
        details: [{
          categoryId: salary._id,
          categoryName: salary.name,
          quantity: 1,
          amount: 5000000,
          name: ''
        }]
      });

      transactions.push({
        _id: new mongoose.Types.ObjectId().toString(),
        userId,
        description: `Rent ${date.getMonth() + 1}/${date.getFullYear()}`,
        type: 'expense',
        frequency: 'monthly',
        date: dateStr,
        total_amount: 2000000,
        details: [{
          categoryId: rent._id,
          categoryName: rent.name,
          quantity: 1,
          amount: 2000000,
          name: ''
        }]
      });
    }

    // if (date.getDate() === 15) {
    //   const interest = getCategory(userId, 'Interest');

    //   transactions.push({
    //     _id: new mongoose.Types.ObjectId().toString(),
    //     userId,
    //     description: `Interest ${date.getMonth() + 1}/${date.getFullYear()}`,
    //     type: 'income',
    //     frequency: 'monthly',
    //     date: dateStr,
    //     total_amount: 2000000,
    //     details: [{
    //       categoryId: interest._id,
    //       categoryName: interest.name,
    //       quantity: 1,
    //       amount: 2000000,
    //       name: ''
    //     }]
    //   });
    // }

    const cat = getRandomExpenseCategory(userId);
    const amount = Math.floor(Math.random() * 90000) + 10000;

    transactions.push({
      _id: new mongoose.Types.ObjectId().toString(),
      userId,
      description: `Expense ${cat.name}`,
      type: 'expense',
      frequency: frequencies[Math.floor(Math.random() * frequencies.length)],
      date: dateStr,
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

  fs.writeFileSync('config/users.json', JSON.stringify(users, null, 2));
  fs.writeFileSync('config/categories.json', JSON.stringify(categories, null, 2));
  fs.writeFileSync('config/transactions.json', JSON.stringify(transactions, null, 2));

  console.log('✅ Done');
  console.log(`Users: ${users.length}`);
  console.log(`Transactions: ${transactions.length}`);
};

generateMockData();