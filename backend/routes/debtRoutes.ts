import express from 'express';
import listDebtController from '../modules/Debts/listDebt/Controller';
import updateDebtController from '../modules/Debts/updateDebt/Controller';
import auth from '../middleware/Auth';

const router = express.Router();

router.get('/list', auth, listDebtController.handle);
router.put('/mark-paid/:id', auth, updateDebtController.markPaid);
router.put('/mark-unpaid/:id', auth, updateDebtController.markUnpaid);

export default router;
