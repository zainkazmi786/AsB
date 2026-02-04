import express from 'express';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentStats,
} from '../controllers/departmentController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';
import { validate, departmentSchema, departmentUpdateSchema } from '../utils/validation.js';

const router = express.Router();

// Public routes (but still need authentication)
router.get('/', authMiddleware, getAllDepartments);
router.get('/:id', authMiddleware, getDepartmentById);
router.get('/:id/stats', authMiddleware, getDepartmentStats);

// Protected routes - only admin and accountant can create/update
router.post('/', authMiddleware, roleMiddleware(['admin', 'accountant']), validate(departmentSchema), createDepartment);
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'accountant']), validate(departmentUpdateSchema), updateDepartment);

// Protected route - only admin can delete
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deleteDepartment);

export default router;
