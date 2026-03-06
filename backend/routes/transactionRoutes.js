const express = require('express');
const Transaction = require('../models/Transaction');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const transaction = await Transaction.create(req.body);
    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deletedTransaction = await Transaction.findOneAndDelete({ id: req.params.id });

    if (!deletedTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
