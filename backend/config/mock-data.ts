import fs from 'fs';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const generateMockData = async () => {
  const plainPassword = '1234';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // ================= 1. USERS =================
  // Schema mới yêu cầu thêm trường 'phone'
  const users = [
    {
      _id: new mongoose.Types.ObjectId(),
      username: 'tri',
      email: 'tri@gmail.com',
      phone: '0901234567',
      password: hashedPassword
    },
    {
      _id: new mongoose.Types.ObjectId(),
      username: 'hieu',
      email: 'hieu@gmail.com',
      phone: '0907654321',
      password: hashedPassword
    }
  ];

  const getUser = () => users[Math.floor(Math.random() * users.length)];

  // ================= 2. CATALOGS =================
  const catalogs = [
    // expense
    { _id: new mongoose.Types.ObjectId(), type: 'expense', name: 'Chi phí sinh hoạt' },
    { _id: new mongoose.Types.ObjectId(), type: 'expense', name: 'Chi phí bất ngờ' },
    { _id: new mongoose.Types.ObjectId(), type: 'expense', name: 'Chi phí cố định' },
    { _id: new mongoose.Types.ObjectId(), type: 'expense', name: 'Đầu tư & Tiết kiệm' },
    // income
    { _id: new mongoose.Types.ObjectId(), type: 'income', name: 'Doanh thu' }
  ];

  const getCatalog = (name: string) => catalogs.find(c => c.name === name)!;

  // ================= 3. CATEGORY TEMPLATE =================
  const categorySeed = [
    { catalog: 'Chi phí sinh hoạt', type: 'expense', names: ['thực phẩm', 'siêu thị', 'ăn uống', 'giao thông'] },
    { catalog: 'Chi phí bất ngờ', type: 'expense', names: ['mua sắm', 'giải trí', 'làm đẹp', 'y tế', 'từ thiện'] },
    { catalog: 'Chi phí cố định', type: 'expense', names: ['hóa đơn', 'nhà ở', 'gia đình'] },
    { catalog: 'Đầu tư & Tiết kiệm', type: 'expense', names: ['đầu tư', 'giáo dục'] },
    { catalog: 'Doanh thu', type: 'income', names: ['thu hồi nợ', 'kinh doanh', 'lợi nhuận', 'thưởng', 'trợ cấp', 'lương'] }
  ];

  // ================= 4. CATEGORIES =================
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
    const filtered = categories.filter(c => c.userId.equals(userId) && c.type === type);
    return filtered[Math.floor(Math.random() * filtered.length)];
  };

  // ================= 5. TRANSACTIONS =================
  const transactions: any[] = [];
  const frequencies = ['weekly', 'monthly', 'yearly', 'one-time'];

  let date = new Date('2024-01-01');
  const end = new Date('2026-03-31');

  while (date <= end) {
    const user = getUser();
    const userId = user._id;
    const dateObj = new Date(date);

    // ===== Lương Hàng Tháng (Income) =====
    if (date.getDate() === 1) {
      const salaryCat = categories.find(c => c.userId.equals(userId) && c.name === 'lương');
      const salaryAmount = 15000000; // 15 triệu

      transactions.push({
        _id: new mongoose.Types.ObjectId(),
        userId,
        description: `Lương tháng ${date.getMonth() + 1}/${date.getFullYear()}`,
        type: 'income',
        frequency: 'monthly',
        date: dateObj,
        total_amount: salaryAmount,
        currency: 'VND', // Schema mới
        base_amount: salaryAmount, // Schema mới (giả định tỷ giá 1:1 cho VND)
        details: [{
          categoryId: salaryCat._id,
          categoryName: salaryCat.name,
          quantity: 1,
          amount: salaryAmount,
          base_amount: salaryAmount, // Schema mới
          name: 'Lương chuyển khoản'
        }]
      });
    }

    // ===== Chi tiêu hàng ngày (Expense) =====
    const cat = getRandomCategory(userId, 'expense');
    const expenseAmount = Math.floor(Math.random() * 200000) + 20000;

    transactions.push({
      _id: new mongoose.Types.ObjectId(),
      userId,
      description: `Chi trả ${cat.name}`,
      type: 'expense',
      frequency: frequencies[Math.floor(Math.random() * frequencies.length)],
      date: dateObj,
      total_amount: expenseAmount,
      currency: 'VND',
      base_amount: expenseAmount,
      details: [{
        categoryId: cat._id,
        categoryName: cat.name,
        quantity: 1,
        amount: expenseAmount,
        base_amount: expenseAmount,
        name: ''
      }]
    });

    date.setDate(date.getDate() + 1);
  }

  // ================= 6. EXPORT TO JSON =================
  const dir = './config/data';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  fs.writeFileSync(`${dir}/users.json`, JSON.stringify(users, null, 2));
  fs.writeFileSync(`${dir}/catalogs.json`, JSON.stringify(catalogs, null, 2));
  fs.writeFileSync(`${dir}/categories.json`, JSON.stringify(categories, null, 2));
  fs.writeFileSync(`${dir}/transactions.json`, JSON.stringify(transactions, null, 2));

  console.log('--- Mock Data Generation Complete ---');
  console.log(`Users: ${users.length}`);
  console.log(`Catalogs: ${catalogs.length}`);
  console.log(`Categories: ${categories.length}`);
  console.log(`Transactions: ${transactions.length}`);
};

generateMockData().catch(err => console.error(err));