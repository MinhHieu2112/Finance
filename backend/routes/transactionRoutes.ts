import express from 'express';
import addTransaction from '../modules/Transactions/addTransaction/Controller';
import listTransaction from '../modules/Transactions/listTransaction/Controller';
import editTransaction from '../modules/Transactions/editTransaction/Controller';
import deleteTransaction from '../modules/Transactions/deleteTransaction/Controller';

const transactionRouter = express.Router();

transactionRouter
    .route("/list")
    .get(listTransaction);
transactionRouter
    .route("/add")
    .post(addTransaction);
transactionRouter
    .route('/edit/:id')
    .put(editTransaction);

transactionRouter
    .route('/delete/:id')
    .delete(deleteTransaction);

export default transactionRouter;
