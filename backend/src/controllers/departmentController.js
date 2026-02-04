import Department from '../models/Department.js';
import Donation from '../models/Donation.js';
import Expense from '../models/Expense.js';
import Donor from '../models/Donor.js';

/**
 * Get all departments with pagination and search
 * GET /api/departments
 */
export const getAllDepartments = async (req, res) => {
  try {
    const {
      search = '',
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc',
      isActive = '',
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    const searchQuery = {};
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by active status
    if (isActive !== '') {
      searchQuery.isActive = isActive === 'true';
    }

    // Build sort query
    const sortQuery = {};
    sortQuery[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get departments with pagination
    const [departments, total] = await Promise.all([
      Department.find(searchQuery)
        .select('-createdBy')
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Department.countDocuments(searchQuery),
    ]);

    res.status(200).json({
      success: true,
      data: {
        departments,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
        },
      },
    });
  } catch (error) {
    console.error('Get all departments error:', error);
    res.status(500).json({
      success: false,
      message: 'ذیلی ادارے حاصل کرنے میں خرابی',
      error: 'FETCH_ERROR',
    });
  }
};

/**
 * Get department by ID with statistics
 * GET /api/departments/:id
 */
export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id)
      .select('-createdBy')
      .lean();

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'ذیلی ادارہ نہیں ملا',
        error: 'NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        department,
      },
    });
  } catch (error) {
    console.error('Get department by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'ذیلی ادارہ حاصل کرنے میں خرابی',
      error: 'FETCH_ERROR',
    });
  }
};

/**
 * Create new department
 * POST /api/departments
 */
export const createDepartment = async (req, res) => {
  try {
    const {
      name,
      code,
      address,
      phone,
      email,
      managerName,
      managerPhone,
      description,
      isActive = true,
    } = req.body;
    const userId = req.user._id;

    // Check if name already exists
    const existingName = await Department.findOne({
      name: name.trim(),
      isDeleted: { $ne: true },
    });
    if (existingName) {
      return res.status(400).json({
        success: false,
        message: 'یہ نام پہلے سے موجود ہے',
        error: 'DUPLICATE_NAME',
      });
    }

    // Check if code already exists (if provided)
    let finalCode = code;
    if (!finalCode || finalCode.trim() === '') {
      // Auto-generate code
      finalCode = await Department.generateNextCode();
    } else {
      finalCode = finalCode.trim().toUpperCase();
      const existingCode = await Department.findOne({
        code: finalCode,
        isDeleted: { $ne: true },
      });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'یہ کوڈ پہلے سے موجود ہے',
          error: 'DUPLICATE_CODE',
        });
      }
    }

    // Check if email already exists (if provided)
    if (email && email.trim() !== '') {
      const existingEmail = await Department.findOne({
        email: email.trim().toLowerCase(),
        isDeleted: { $ne: true },
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'یہ ای میل پہلے سے موجود ہے',
          error: 'DUPLICATE_EMAIL',
        });
      }
    }

    const department = new Department({
      name: name.trim(),
      code: finalCode,
      address: address?.trim() || undefined,
      phone: phone?.trim() || undefined,
      email: email?.trim().toLowerCase() || undefined,
      managerName: managerName?.trim() || undefined,
      managerPhone: managerPhone?.trim() || undefined,
      description: description?.trim() || undefined,
      isActive: isActive !== false,
      createdBy: userId,
    });

    await department.save();

    res.status(201).json({
      success: true,
      message: 'ذیلی ادارہ کامیابی سے شامل ہو گیا',
      data: {
        department: department.toJSON(),
      },
    });
  } catch (error) {
    console.error('Create department error:', error);

    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      let message = 'یہ معلومات پہلے سے موجود ہے';
      if (field === 'name') message = 'یہ نام پہلے سے موجود ہے';
      if (field === 'code') message = 'یہ کوڈ پہلے سے موجود ہے';
      if (field === 'email') message = 'یہ ای میل پہلے سے موجود ہے';

      return res.status(400).json({
        success: false,
        message,
        error: 'DUPLICATE_FIELD',
      });
    }

    res.status(500).json({
      success: false,
      message: 'ذیلی ادارہ شامل کرنے میں خرابی',
      error: 'CREATE_ERROR',
    });
  }
};

/**
 * Update department
 * PUT /api/departments/:id
 */
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      address,
      phone,
      email,
      managerName,
      managerPhone,
      description,
      isActive,
    } = req.body;

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'ذیلی ادارہ نہیں ملا',
        error: 'NOT_FOUND',
      });
    }

    // Check if name is being changed and already exists
    if (name && name.trim() !== department.name) {
      const existingName = await Department.findOne({
        name: name.trim(),
        _id: { $ne: id },
        isDeleted: { $ne: true },
      });
      if (existingName) {
        return res.status(400).json({
          success: false,
          message: 'یہ نام پہلے سے موجود ہے',
          error: 'DUPLICATE_NAME',
        });
      }
      department.name = name.trim();
    }

    // Check if code is being changed and already exists
    if (code !== undefined) {
      const finalCode = code && code.trim() !== '' ? code.trim().toUpperCase() : null;
      if (finalCode && finalCode !== department.code) {
        const existingCode = await Department.findOne({
          code: finalCode,
          _id: { $ne: id },
          isDeleted: { $ne: true },
        });
        if (existingCode) {
          return res.status(400).json({
            success: false,
            message: 'یہ کوڈ پہلے سے موجود ہے',
            error: 'DUPLICATE_CODE',
          });
        }
      }
      department.code = finalCode || undefined;
    }

    // Check if email is being changed and already exists
    if (email !== undefined) {
      const finalEmail = email && email.trim() !== '' ? email.trim().toLowerCase() : null;
      if (finalEmail && finalEmail !== department.email) {
        const existingEmail = await Department.findOne({
          email: finalEmail,
          _id: { $ne: id },
          isDeleted: { $ne: true },
        });
        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: 'یہ ای میل پہلے سے موجود ہے',
            error: 'DUPLICATE_EMAIL',
          });
        }
      }
      department.email = finalEmail || undefined;
    }

    // Update other fields
    if (address !== undefined) department.address = address?.trim() || undefined;
    if (phone !== undefined) department.phone = phone?.trim() || undefined;
    if (managerName !== undefined) department.managerName = managerName?.trim() || undefined;
    if (managerPhone !== undefined) department.managerPhone = managerPhone?.trim() || undefined;
    if (description !== undefined) department.description = description?.trim() || undefined;
    if (isActive !== undefined) department.isActive = isActive;

    await department.save();

    res.status(200).json({
      success: true,
      message: 'ذیلی ادارہ کامیابی سے اپڈیٹ ہو گیا',
      data: {
        department: department.toJSON(),
      },
    });
  } catch (error) {
    console.error('Update department error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      let message = 'یہ معلومات پہلے سے موجود ہے';
      if (field === 'name') message = 'یہ نام پہلے سے موجود ہے';
      if (field === 'code') message = 'یہ کوڈ پہلے سے موجود ہے';
      if (field === 'email') message = 'یہ ای میل پہلے سے موجود ہے';

      return res.status(400).json({
        success: false,
        message,
        error: 'DUPLICATE_FIELD',
      });
    }

    res.status(500).json({
      success: false,
      message: 'ذیلی ادارہ اپڈیٹ کرنے میں خرابی',
      error: 'UPDATE_ERROR',
    });
  }
};

/**
 * Delete department (soft delete)
 * DELETE /api/departments/:id
 */
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'ذیلی ادارہ نہیں ملا',
        error: 'NOT_FOUND',
      });
    }

    // Check if department has associated records
    const [donationsCount, expensesCount, donorsCount] = await Promise.all([
      Donation.countDocuments({ departmentId: id, isDeleted: { $ne: true } }),
      Expense.countDocuments({ departmentId: id, isDeleted: { $ne: true } }),
      Donor.countDocuments({ departmentId: id, isDeleted: { $ne: true } }),
    ]);

    if (donationsCount > 0 || expensesCount > 0 || donorsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'اس ادارے سے منسلک ریکارڈز موجود ہیں، حذف نہیں کیا جا سکتا',
        error: 'HAS_ASSOCIATED_RECORDS',
        data: {
          donationsCount,
          expensesCount,
          donorsCount,
        },
      });
    }

    // Soft delete
    department.isDeleted = true;
    await department.save();

    res.status(200).json({
      success: true,
      message: 'ذیلی ادارہ کامیابی سے حذف ہو گیا',
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: 'ذیلی ادارہ حذف کرنے میں خرابی',
      error: 'DELETE_ERROR',
    });
  }
};

/**
 * Get department statistics
 * GET /api/departments/:id/stats
 */
export const getDepartmentStats = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'ذیلی ادارہ نہیں ملا',
        error: 'NOT_FOUND',
      });
    }

    // Get statistics
    const [donationsStats, expensesStats, donorsCount] = await Promise.all([
      Donation.aggregate([
        {
          $match: {
            departmentId: department._id,
            isDeleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
      Expense.aggregate([
        {
          $match: {
            departmentId: department._id,
            isDeleted: { $ne: true },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
      Donor.countDocuments({ departmentId: id, isDeleted: { $ne: true } }),
    ]);

    const donations = donationsStats[0] || { count: 0, totalAmount: 0 };
    const expenses = expensesStats[0] || { count: 0, totalAmount: 0 };

    res.status(200).json({
      success: true,
      data: {
        stats: {
          donationsCount: donations.count,
          donationsTotal: donations.totalAmount,
          expensesCount: expenses.count,
          expensesTotal: expenses.totalAmount,
          donorsCount,
          netAmount: donations.totalAmount - expenses.totalAmount,
        },
      },
    });
  } catch (error) {
    console.error('Get department stats error:', error);
    res.status(500).json({
      success: false,
      message: 'اعداد و شمار حاصل کرنے میں خرابی',
      error: 'FETCH_ERROR',
    });
  }
};
