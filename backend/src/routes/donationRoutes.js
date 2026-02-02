import express from 'express';
import {
  getAllDonations,
  getDonationById,
  createDonation,
  updateDonation,
  deleteDonation,
  getDonationOptions,
} from '../controllers/donationController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';
import { validate, donationSchema, donationUpdateSchema } from '../utils/validation.js';

const router = express.Router();

// Public for authenticated users (read)
router.get('/options', authMiddleware, getDonationOptions);
router.get('/', authMiddleware, getAllDonations);
router.get('/:id', authMiddleware, getDonationById);

// Protected - admin and accountant only
router.post('/', authMiddleware, roleMiddleware(['admin', 'accountant']), validate(donationSchema), createDonation);
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'accountant']), validate(donationUpdateSchema), updateDonation);
router.delete('/:id', authMiddleware, roleMiddleware(['admin', 'accountant']), deleteDonation);

export default router;
