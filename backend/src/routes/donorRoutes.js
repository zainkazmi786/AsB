import express from 'express';
import {
  getAllDonors,
  getDonorById,
  createDonor,
  updateDonor,
  deleteDonor,
  getDonorDonations,
} from '../controllers/donorController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';
import { validate, donorSchema } from '../utils/validation.js';

const router = express.Router();

// Public routes (but still need authentication)
router.get('/', authMiddleware, getAllDonors);
router.get('/:id', authMiddleware, getDonorById);
router.get('/:id/donations', authMiddleware, getDonorDonations);

// Protected routes - only admin and accountant can create/update
router.post('/', authMiddleware, roleMiddleware(['admin', 'accountant']), validate(donorSchema), createDonor);
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'accountant']), validate(donorSchema), updateDonor);

// Protected route - only admin can delete
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deleteDonor);

export default router;
