import path    from 'path';
import dotenv  from 'dotenv';
import mongoose, { Types } from 'mongoose';
import bcrypt  from 'bcryptjs';

import User        from '../models/Users';
import Catalog     from '../models/Catalog';
import Category    from '../models/Category';
import Transaction from '../models/Transaction';
import Debt        from '../models/Debt';
import { bootstrapCatalogs } from './bootstrapCatalogs';

// Đọc nguồn dữ liệu chuẩn từ file config (nhất quán với server)
import catalogsConfig  from './catalogs.json';
import categoriesConfig from './categories.json';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Helpers
const randInt  = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFrom = <T>(arr: readonly T[]): T  => arr[Math.floor(Math.random() * arr.length)];
const addDays  = (d: Date, n: number)       => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

// 1. USERS
async function buildUsers() {
  const hash = await bcrypt.hash('1234', 10);
  return [
    { _id: new Types.ObjectId(), username: 'tri',  email: 'tri@gmail.com',  phone: '0123459876', password: hash },
    { _id: new Types.ObjectId(), username: 'hieu', email: 'hieu@gmail.com', phone: '0123459871', password: hash },
    { _id: new Types.ObjectId(), username: 'lan',  email: 'lan@gmail.com',  phone: '0123459872', password: hash },
    { _id: new Types.ObjectId(), username: 'test', email: 'test@gmail.com', phone: '0123459873', password: hash },
  ];
}

// 2. CATALOGS — lấy từ DB (đã upsert qua bootstrapCatalogs)
async function loadCatalogs() {
  const names = catalogsConfig.map(c => c.name);
  const docs   = await Catalog.find({ name: { $in: names } }).lean();
  if (docs.length !== catalogsConfig.length) {
    throw new Error(
      `Thiếu catalog trong DB. Tìm thấy ${docs.length}/${catalogsConfig.length}. Hãy chạy server một lần để bootstrapCatalogs khởi tạo.`
    );
  }
  return docs as { _id: Types.ObjectId; name: string; type: string }[];
}

// 3. CATEGORIES (per user) — lấy từ categories.json
// Map từ type → tên catalog tương ứng (khớp với catalogs.json)
const TYPE_TO_CATALOG: Record<string, string> = {
  income : 'Doanh thu',
  expense: 'Chi tiêu',
  debt   : 'Khoản nợ',
  savings: 'Tiết kiệm',
};

function buildCategories(
  users   : { _id: Types.ObjectId }[],
  catalogs: { _id: Types.ObjectId; name: string }[],
) {
  const catalogMap = new Map(catalogs.map(c => [c.name, c._id]));
  const result: any[] = [];

  users.forEach(user => {
    categoriesConfig.forEach(cat => {
      const catalogName = TYPE_TO_CATALOG[cat.type];
      const catalogId   = catalogMap.get(catalogName);
      if (!catalogId) return; // bỏ qua type không có trong catalogs.json

      result.push({
        _id      : new Types.ObjectId(),
        userId   : user._id,
        catalogId,
        name     : cat.name,
        type     : cat.type,
      });
    });
  });

  return result;
}

// 4. TRANSACTIONS  (2024-01-01 → 2026-03-31)
function buildTransactions(
  users     : { _id: Types.ObjectId }[],
  categories: { _id: Types.ObjectId; userId: Types.ObjectId; name: string; type: string }[],
) {
  const transactions: any[] = [];
  const debtTxnIds: { userId: Types.ObjectId; txnId: Types.ObjectId; amount: number; date: Date }[] = [];

  const frequencies = ['weekly', 'monthly', 'yearly', 'one-time'] as const;

  const getCat = (userId: Types.ObjectId, type: string, name?: string) => {
    const pool = categories.filter(c =>
      c.userId.equals(userId) && c.type === type && (!name || c.name === name)
    );
    if (pool.length === 0) {
      throw new Error(`Không tìm thấy category: type='${type}'${name ? `, name='${name}'` : ''}`);
    }
    return randFrom(pool);
  };

  users.forEach(user => {
    let day      = new Date('2024-01-01');
    const end    = new Date('2026-03-31');
    const userId = user._id;

    while (day <= end) {
      const date  = new Date(day);
      const month = date.getMonth() + 1;
      const year  = date.getFullYear();

      // ── Lương hàng tháng (ngày 1) ──
      if (date.getDate() === 1) {
        const cat    = getCat(userId, 'income', 'Lương');
        const amount = randInt(12_000_000, 20_000_000);
        transactions.push(makeTxn(userId, `Lương tháng ${month}/${year}`, 'income', 'monthly', date, amount, cat));
      }

      // ── Thu nhập thêm (ngẫu nhiên ~15% ngày) ──
      if (Math.random() < 0.15) {
        const cat    = getCat(userId, 'income');
        const amount = randInt(500_000, 5_000_000);
        transactions.push(makeTxn(userId, `Thu nhập thêm – ${cat.name}`, 'income', 'one-time', date, amount, cat));
      }

      // ── Chi tiêu hàng ngày (1–3 khoản/ngày) ──
      const numExp = randInt(1, 3);
      for (let i = 0; i < numExp; i++) {
        const cat    = getCat(userId, 'expense');
        const amount = randInt(20_000, 500_000);
        transactions.push(makeTxn(userId, `Chi – ${cat.name}`, 'expense', randFrom(frequencies), date, amount, cat));
      }

      // ── Chi phí cố định (ngày 5 hàng tháng) ──
      if (date.getDate() === 5) {
        const fixedItems = [
          { name: 'Hóa đơn điện nước', amount: randInt(300_000,   600_000) },
          { name: 'Internet',           amount: randInt(150_000,   250_000) },
          { name: 'Thuê nhà',           amount: randInt(3_000_000, 6_000_000) },
        ];
        fixedItems.forEach(item => {
          const cat = getCat(userId, 'expense', item.name);
          transactions.push(makeTxn(userId, item.name, 'expense', 'monthly', date, item.amount, cat));
        });
      }

      // ── Tiết kiệm (ngày 10 hàng tháng) ──
      if (date.getDate() === 10) {
        const cat    = getCat(userId, 'savings');
        const amount = randInt(1_000_000, 3_000_000);
        transactions.push(makeTxn(userId, 'Gửi tiết kiệm định kỳ', 'savings', 'monthly', date, amount, cat));
      }

      // ── Khoản nợ (ngẫu nhiên ~3% ngày) ──
      if (Math.random() < 0.03) {
        const cat    = getCat(userId, 'debt');
        const amount = randInt(500_000, 5_000_000);
        const txn    = makeTxn(userId, `Khoản vay – ${cat.name}`, 'debt', 'one-time', date, amount, cat);
        transactions.push(txn);
        debtTxnIds.push({ userId, txnId: txn._id, amount, date });
      }

      day = addDays(day, 1);
    }
  });

  return { transactions, debtTxnIds };
}

function makeTxn(
  userId     : Types.ObjectId,
  description: string,
  type       : string,
  frequency  : string,
  date       : Date,
  amount     : number,
  cat        : { _id: Types.ObjectId; name: string },
) {
  return {
    _id         : new Types.ObjectId(),
    userId,
    description,
    type,
    frequency,
    date,
    total_amount: amount,
    currency    : 'VND',
    base_amount : amount,
    details     : [{
      categoryId  : cat._id,
      categoryName: cat.name,
      quantity    : 1,
      amount,
      base_amount : amount,
      name        : description,
    }],
  };
}

// 5. DEBTS (tạo từ các giao dịch type = debt)
function buildDebts(
  debtTxnIds: { userId: Types.ObjectId; txnId: Types.ObjectId; amount: number; date: Date }[],
) {
  return debtTxnIds.map(d => {
    const dueDate = addDays(d.date, randInt(30, 180));
    const isPaid  = dueDate < new Date() && Math.random() < 0.6; 
    return {
      _id          : new Types.ObjectId(),
      userId       : d.userId,
      transactionId: d.txnId,
      amount       : d.amount,
      status       : isPaid ? 'paid' : 'unpaid',
      dueDate,
      description  : `Hạn trả: ${dueDate.toLocaleDateString('vi-VN')}`,
    };
  });
}

// SEED  /  DELETE
async function clearAll() {
  await Promise.all([
    User.deleteMany({}),
    Catalog.deleteMany({}),
    Category.deleteMany({}),
    Transaction.deleteMany({}),
    Debt.deleteMany({}),
  ]);
  console.log('Da xoa toan bo du lieu cu.');
}

async function seed() {
  console.log('Dang tao du lieu mock...');

  // 1. Catalogs — upsert qua bootstrapCatalogs (dùng chung logic với server)
  await bootstrapCatalogs();
  const catalogs = await loadCatalogs();
  console.log(`Catalogs:     ${catalogs.length}`);

  // 2. Users
  const users = await buildUsers();
  await User.insertMany(users);
  console.log(`Users:        ${users.length}`);

  // 3. Categories
  const categories = buildCategories(users, catalogs);
  await Category.insertMany(categories);
  console.log(`Categories:   ${categories.length}`);

  // 4. Transactions (chia batch 500 tránh timeout)
  const { transactions, debtTxnIds } = buildTransactions(users, categories as any);
  const BATCH = 500;
  for (let i = 0; i < transactions.length; i += BATCH) {
    await Transaction.insertMany(transactions.slice(i, i + BATCH), { ordered: false });
  }
  console.log(`Transactions: ${transactions.length}`);

  // 5. Debts
  const debts = buildDebts(debtTxnIds);
  if (debts.length) {
    await Debt.insertMany(debts, { ordered: false });
  }
  console.log(`Debts:        ${debts.length}`);

  console.log('\nSeed hoan tat!');
}

// ENTRY POINT
(async () => {
  const DB = process.env.DATABASE_LOCAL;
  if (!DB) { console.error('DATABASE_LOCAL chua duoc cau hinh trong .env'); process.exit(1); }

  await mongoose.connect(DB);
  console.log(`Ket noi MongoDB: ${DB}`);

  const arg = process.argv[2];

  if (arg === '--delete') {
    await clearAll();
  } else {
    await clearAll();
    await seed();
  }

  await mongoose.disconnect();
  process.exit(0);
})().catch(err => {
  console.error('Loi seed:', err);
  process.exit(1);
});
