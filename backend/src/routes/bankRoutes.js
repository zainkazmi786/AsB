import express from 'express';
import {
  getAllBanks,
  getBankById,
  createBank,
  updateBank,
  disableBank,
  getBankTransactions,
} from '../controllers/bankController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';
import { validate, bankSchema, bankUpdateSchema } from '../utils/validation.js';

const router = express.Router();

router.get('/', authMiddleware, getAllBanks);
router.get('/:id', authMiddleware, getBankById);
router.get('/:id/transactions', authMiddleware, getBankTransactions);

router.post('/', authMiddleware, roleMiddleware(['admin', 'accountant']), validate(bankSchema), createBank);
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'accountant']), validate(bankUpdateSchema), updateBank);
router.delete('/:id', authMiddleware, roleMiddleware(['admin', 'accountant']), disableBank);

export default router;
