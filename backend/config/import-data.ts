import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction';
import User from '../models/Users';

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

// IMPORT DATA INTO DB
const importData = async () => {
  try {
      await User.create(users);
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
