const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./db');
const Transaction = require('../models/Transaction');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const transactionsFilePath = path.resolve(__dirname, 'transactions.json');

const readTransactionsFromJson = () => {
	const raw = fs.readFileSync(transactionsFilePath, 'utf-8');
	return JSON.parse(raw);
};

const importData = async () => {
	try {
		await connectDB();

		const transactions = readTransactionsFromJson();

		await Transaction.deleteMany();
		await Transaction.insertMany(transactions);

		console.log('Data imported successfully');
		process.exit(0);
	} catch (error) {
		console.error('Data import failed:', error.message);
		process.exit(1);
	}
};

importData();
