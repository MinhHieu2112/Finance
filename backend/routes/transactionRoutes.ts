import express, { type Request, type Response, type NextFunction } from 'express';
import Transaction from '../models/Transaction';

const router = express.Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await Transaction.create(req.body);
    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
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

export default router;
