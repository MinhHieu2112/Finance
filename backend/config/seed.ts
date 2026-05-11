/**
 * seed.ts — Seed toàn bộ dữ liệu mock vào MongoDB trong một bước duy nhất.
 *
 * Chạy:
 *   npx tsx config/seed.ts           → seed (xoá cũ + thêm mới)
 *   npx tsx config/seed.ts --fresh   → chỉ seed (mặc định)
 *   npx tsx config/seed.ts --delete  → chỉ xoá dữ liệu
 *
 * Hoặc thêm vào package.json:
 *   "seed": "tsx config/seed.ts"
 */

import path    from 'path';
import dotenv  from 'dotenv';
import mongoose, { Types } from 'mongoose';
import bcrypt  from 'bcryptjs';

import User        from '../models/Users';
import Catalog     from '../models/Catalog';
import Category    from '../models/Category';
import Transaction from '../models/Transaction';
import Debt        from '../models/Debt';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const randInt  = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFrom = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const addDays  = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

// ─────────────────────────────────────────────
// 1. USERS
// ─────────────────────────────────────────────
async function buildUsers() {
  const hash = await bcrypt.hash('1234', 10);
  return [
    { _id: new Types.ObjectId(), username: 'tri',  email: 'tri@gmail.com',  phone: '0123459876', password: hash },
    { _id: new Types.ObjectId(), username: 'hieu', email: 'hieu@gmail.com', phone: '0123459871', password: hash },
    { _id: new Types.ObjectId(), username: 'lan',  email: 'lan@gmail.com',  phone: '0123459872', password: hash },
    { _id: new Types.ObjectId(), username: 'test',  email: 'test@gmail.com',  phone: '0123459873', password: hash },
  ];
}

// ─────────────────────────────────────────────
// 2. CATALOGS
// ─────────────────────────────────────────────
const CATALOG_SEEDS = [
  { type: 'expense' as const, name: 'Chi phí sinh hoạt'   },
  { type: 'expense' as const, name: 'Chi phí bất ngờ'     },
  { type: 'expense' as const, name: 'Chi phí cố định'     },
  { type: 'expense' as const, name: 'Đầu tư & Tiết kiệm'  },
  { type: 'income'  as const, name: 'Doanh thu'           },
  { type: 'debt'    as const, name: 'Khoản nợ'            },
  { type: 'savings' as const, name: 'Tiết kiệm'           },
];

// ─────────────────────────────────────────────
// 3. CATEGORIES (per user)
// ─────────────────────────────────────────────
const CATEGORY_TEMPLATES = [
  { catalog: 'Chi phí sinh hoạt',  type: 'expense'  as const, names: ['Thực phẩm', 'Siêu thị', 'Ăn uống ngoài', 'Giao thông', 'Xăng xe'] },
  { catalog: 'Chi phí bất ngờ',    type: 'expense'  as const, names: ['Mua sắm', 'Giải trí', 'Làm đẹp', 'Y tế', 'Từ thiện', 'Sửa chữa'] },
  { catalog: 'Chi phí cố định',    type: 'expense'  as const, names: ['Hóa đơn điện nước', 'Thuê nhà', 'Internet', 'Điện thoại', 'Gia đình'] },
  { catalog: 'Đầu tư & Tiết kiệm', type: 'expense'  as const, names: ['Đầu tư chứng khoán', 'Giáo dục & Khoá học', 'Sách'] },
  { catalog: 'Doanh thu',          type: 'income'   as const, names: ['Lương', 'Thưởng', 'Lợi nhuận kinh doanh', 'Thu hồi nợ', 'Trợ cấp', 'Freelance'] },
  { catalog: 'Khoản nợ',           type: 'debt'     as const, names: ['Vay tiêu dùng', 'Vay mua xe', 'Vay bạn bè'] },
  { catalog: 'Tiết kiệm',          type: 'savings'  as const, names: ['Tiết kiệm ngân hàng', 'Quỹ khẩn cấp'] },
];

function buildCategories(
  users   : { _id: Types.ObjectId }[],
  catalogs: { _id: Types.ObjectId; name: string }[],
) {
  const catalogMap = new Map(catalogs.map(c => [c.name, c._id]));
  const result: any[] = [];

  users.forEach(user => {
    CATEGORY_TEMPLATES.forEach(tmpl => {
      const catalogId = catalogMap.get(tmpl.catalog);
      if (!catalogId) return;

      tmpl.names.forEach(name => {
        result.push({
          _id      : new Types.ObjectId(),
          userId   : user._id,
          catalogId,
          name,
          type     : tmpl.type,
        });
      });
    });
  });

  return result;
}

// ─────────────────────────────────────────────
// 4. TRANSACTIONS  (2024-01-01 → 2026-03-31)
// ─────────────────────────────────────────────
function buildTransactions(
  users     : { _id: Types.ObjectId }[],
  categories: { _id: Types.ObjectId; userId: Types.ObjectId; name: string; type: string }[],
) {
  const transactions: any[]  = [];
  const debtTxnIds  : { userId: Types.ObjectId; txnId: Types.ObjectId; amount: number; date: Date }[] = [];

  const frequencies = ['weekly', 'monthly', 'yearly', 'one-time'] as const;

  const getCat = (userId: Types.ObjectId, type: string, name?: string) => {
    const pool = categories.filter(c => c.userId.equals(userId) && c.type === type && (!name || c.name === name));
    return randFrom(pool);
  };

  users.forEach(user => {
    let day = new Date('2024-01-01');
    const end = new Date('2026-03-31');

    while (day <= end) {
      const date   = new Date(day);
      const month  = date.getMonth() + 1;
      const year   = date.getFullYear();
      const userId = user._id;

      // ── Lương hàng tháng (ngày 1) ──
      if (date.getDate() === 1) {
        const cat    = getCat(userId, 'income', 'Lương');
        const amount = randInt(12_000_000, 20_000_000);
        transactions.push(makeTxn(userId, `Lương tháng ${month}/${year}`, 'income', 'monthly', date, amount, cat));
      }

      // ── Thưởng / freelance (ngẫu nhiên ~15% ngày) ──
      if (Math.random() < 0.15) {
        const cat    = getCat(userId, 'income');
        const amount = randInt(500_000, 5_000_000);
        transactions.push(makeTxn(userId, `Thu nhập thêm – ${cat.name}`, 'income', 'one-time', date, amount, cat));
      }

      // ── Chi tiêu hàng ngày (expense) ──
      const numExp = randInt(1, 3);
      for (let i = 0; i < numExp; i++) {
        const cat    = getCat(userId, 'expense');
        const amount = randInt(20_000, 500_000);
        transactions.push(makeTxn(userId, `Chi – ${cat.name}`, 'expense', randFrom(frequencies), date, amount, cat));
      }

      // ── Chi phí cố định (ngày 5 hàng tháng) ──
      if (date.getDate() === 5) {
        const fixedItems = [
          { name: 'Hóa đơn điện nước', amount: randInt(300_000, 600_000) },
          { name: 'Internet',           amount: randInt(150_000, 250_000) },
          { name: 'Thuê nhà',           amount: randInt(3_000_000, 6_000_000) },
        ];
        fixedItems.forEach(item => {
          const cat = getCat(userId, 'expense', item.name) ?? getCat(userId, 'expense');
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

// ─────────────────────────────────────────────
// 5. DEBTS (từ debt transactions)
// ─────────────────────────────────────────────
function buildDebts(
  debtTxnIds: { userId: Types.ObjectId; txnId: Types.ObjectId; amount: number; date: Date }[],
) {
  return debtTxnIds.map(d => {
    const dueDate = addDays(d.date, randInt(30, 180));
    const isPaid  = dueDate < new Date() && Math.random() < 0.6; // 60% khoản quá hạn đã trả
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

// ─────────────────────────────────────────────
// SEED  /  DELETE
// ─────────────────────────────────────────────
async function clearAll() {
  await Promise.all([
    User.deleteMany({}),
    Catalog.deleteMany({}),
    Category.deleteMany({}),
    Transaction.deleteMany({}),
    Debt.deleteMany({}),
  ]);
  console.log('Đã xoá toàn bộ dữ liệu cũ.');
}

async function seed() {
  console.log('Đang tạo dữ liệu mock...');

  // 1. Users
  const users = await buildUsers();
  await User.insertMany(users);
  console.log(`Users:        ${users.length}`);

  // 2. Catalogs
  const catalogDocs = CATALOG_SEEDS.map(s => ({ _id: new Types.ObjectId(), ...s }));
  await Catalog.insertMany(catalogDocs);
  console.log(`Catalogs:     ${catalogDocs.length}`);

  // 3. Categories
  const categories = buildCategories(users, catalogDocs);
  await Category.insertMany(categories);
  console.log(`Categories:   ${categories.length}`);

  // 4. Transactions
  const { transactions, debtTxnIds } = buildTransactions(users, categories as any);
  // MongoDB insertMany mặc định ordered=true, chia batch tránh timeout
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

  console.log('\n🎉 Seed hoàn tất!');
}

// ─────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────
(async () => {
  const DB = process.env.DATABASE_LOCAL;
  if (!DB) { console.error('DATABASE_LOCAL không được cấu hình trong .env'); process.exit(1); }

  await mongoose.connect(DB);
  console.log(`🔗 Kết nối MongoDB: ${DB}`);

  const arg = process.argv[2];

  if (arg === '--delete') {
    await clearAll();
  } else {
    // mặc định: xoá cũ rồi seed mới
    await clearAll();
    await seed();
  }

  await mongoose.disconnect();
  process.exit(0);
})().catch(err => {
  console.error('Lỗi seed:', err);
  process.exit(1);
});
