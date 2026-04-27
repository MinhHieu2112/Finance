import fs from 'fs';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const generateMockData = async () => {
  const plainPassword = '123456';
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
    { _id: new mongoose.Types.ObjectId(), type: 'expense', name: 'Chi phí sinh hoạt' },
    { _id: new mongoose.Types.ObjectId(), type: 'expense', name: 'Chi phí bất ngờ' },
    { _id: new mongoose.Types.ObjectId(), type: 'expense', name: 'Chi phí cố định' },
    { _id: new mongoose.Types.ObjectId(), type: 'expense', name: 'Đầu tư & Tiết kiệm' },

    // income
    { _id: new mongoose.Types.ObjectId(), type: 'income', name: 'Doanh thu' }
  ];

  const getCatalog = (name: string) =>
    catalogs.find(c => c.name === name)!;

  // ================= CATEGORY TEMPLATE =================
  const categorySeed = [
    // Expense
    { catalog: 'Chi phí sinh hoạt', type: 'expense', names: ['thực phẩm', 'siêu thị', 'ăn uống', 'giao thông'] },
    { catalog: 'Chi phí bất ngờ', type: 'expense', names: ['mua sắm', 'giải trí', 'làm đẹp', 'y tế', 'từ thiện'] },
    { catalog: 'Chi phí cố định', type: 'expense', names: ['hóa đơn', 'nhà ở', 'gia đình'] },
    { catalog: 'Đầu tư & Tiết kiệm', type: 'expense', names: ['đầu tư', 'giáo dục'] },

    // Income
    { catalog: 'Doanh thu', type: 'income', names: ['thu hồi nợ', 'kinh doanh', 'lợi nhuận', 'thưởng', 'trợ cấp', 'lương'] }
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
        c => c.userId.equals(userId) && c.name === 'lương'
      );

      transactions.push({
        _id: new mongoose.Types.ObjectId(),
        userId,
        description: `Lương tháng ${date.getMonth() + 1}/${date.getFullYear()}`,
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
      description: `Chi phí ${cat.name}`,
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

  console.log('Done!');
  console.log(`Users: ${users.length}`);
  console.log(`Catalogs: ${catalogs.length}`);
  console.log(`Categories: ${categories.length}`);
  console.log(`Transactions: ${transactions.length}`);
};

generateMockData();