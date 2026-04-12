import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import Transaction from '../models/Transaction';
import User from '../models/Users';
import Category from '../models/Category';
import Catalog from '../models/Catalog';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const DB = process.env.DATABASE_LOCAL!;
mongoose.connect(DB);

const read = (file: string) =>
  JSON.parse(fs.readFileSync(path.resolve(__dirname, file), 'utf-8'));

const users        = read('users.json');
const catalogs     = read('catalogs.json') as Array<{
  _id?: string;
  type: 'income' | 'expense';
  name: string;
}>;
const categories   = read('categories.json') as Array<{
  _id?: string;
  userId?: string;
  catalogId?: string;
  name: string;
  description?: string;
  type: 'income' | 'expense';
}>;
const transactions = read('transactions.json');

const normalizeCategoryType = (type: string) => (type === 'income' ? 'income' : 'expense') as 'income' | 'expense';

const importData = async () => {
  try {
    await User.deleteMany();
    await Catalog.deleteMany();
    await Category.deleteMany();
    await Transaction.deleteMany();

    await User.insertMany(users);
    await Catalog.insertMany(catalogs);

    const normalizedCategories = categories
      .filter((item) => item?.userId && item?.catalogId && item?.name)
      .map((item) => {
        const type = normalizeCategoryType(item.type);

        return {
          ...item,
          type,
          description: item.description ?? '',
        };
      });

    await Category.insertMany(normalizedCategories);
    await Transaction.insertMany(transactions);

    console.log('✅ Import done');
  } catch (err) {
    console.error('❌ Error:', err);
  }
  process.exit();
};

const deleteData = async () => {
  await User.deleteMany();
  await Catalog.deleteMany();
  await Category.deleteMany();
  await Transaction.deleteMany();
  console.log('🧹 Deleted');
  process.exit();
};

if (process.argv[2] === '--import') importData();
if (process.argv[2] === '--delete') deleteData();