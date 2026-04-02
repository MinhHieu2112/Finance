import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction';
import User from '../models/Users';
import Category from '../models/Category';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const DB = process.env.DATABASE_LOCAL!;

mongoose.connect(DB)
  
// READ JSON FILE
const transactions = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'transactions.json'), 'utf-8')
);

const users = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'users.json'), 'utf-8')
);

const categories = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'categories.json'), 'utf-8')
);

const categoriesByUser = users.flatMap((user: { userID: string }) =>
  categories.map((category: { id: string; name: string; description?: string }) => ({
    id: `${user.userID}-${category.id}`,
    userID: user.userID,
    name: category.name,
    description: category.description ?? '',
  }))
);

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Category.syncIndexes();
    await User.create(users);
    await Category.create(categoriesByUser);
    await Transaction.create(transactions);

    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE ALL DATA FROM DB
const deleteData = async () => {
  try {
    await Transaction.deleteMany();
    await Category.deleteMany();
    await User.deleteMany();
    console.log('Data successfully deleted!');

  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
