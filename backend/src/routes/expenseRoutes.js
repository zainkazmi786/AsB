import express from 'express';
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseOptions,
} from '../controllers/expenseController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';
import { validate, expenseSchema, expenseUpdateSchema } from '../utils/validation.js';

const router = express.Router();

router.get('/options', authMiddleware, getExpenseOptions);
router.get('/', authMiddleware, getAllExpenses);
router.get('/:id', authMiddleware, getExpenseById);

router.post('/', authMiddleware, roleMiddleware(['admin', 'accountant']), validate(expenseSchema), createExpense);
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'accountant']), validate(expenseUpdateSchema), updateExpense);
router.delete('/:id', authMiddleware, roleMiddleware(['admin', 'accountant']), deleteExpense);

export default router;
