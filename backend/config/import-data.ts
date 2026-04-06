import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import Transaction from '../models/Transaction';
import User from '../models/Users';
import Category from '../models/Category';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const DB = process.env.DATABASE_LOCAL!;
mongoose.connect(DB);

const read = (file: string) =>
  JSON.parse(fs.readFileSync(path.resolve(__dirname, file), 'utf-8'));

const users        = read('users.json');
const categories   = read('categories.json');
const transactions = read('transactions.json');

const importData = async () => {
  try {
    await User.deleteMany();
    await Category.deleteMany();
    await Transaction.deleteMany();

    await User.insertMany(users);
    await Category.insertMany(categories);
    await Transaction.insertMany(transactions);

    console.log('✅ Import done');
  } catch (err) {
    console.error('❌ Error:', err);
  }
  process.exit();
};

const deleteData = async () => {
  await User.deleteMany();
  await Category.deleteMany();
  await Transaction.deleteMany();
  console.log('🧹 Deleted');
  process.exit();
};

if (process.argv[2] === '--import') importData();
if (process.argv[2] === '--delete') deleteData();