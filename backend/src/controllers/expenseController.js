import Expense from '../models/Expense.js';
import { creditBank, debitBank } from '../utils/bankBalance.js';

/**
 * Get all expenses with pagination and filters
 * GET /api/finance/expenses
 */
export const getAllExpenses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'date',
      sortOrder = 'desc',
      category = '',
      dateFrom = '',
      dateTo = '',
      bankId = '',
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const match = { isDeleted: { $ne: true } };
    if (category) match.category = category;
    if (bankId) match.paymentSource = bankId;
    if (dateFrom || dateTo) {
      match.date = {};
      if (dateFrom) match.date.$gte = new Date(dateFrom);
      if (dateTo) match.date.$lte = new Date(dateTo);
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [expenses, total] = await Promise.all([
      Expense.find(match)
        .populate('paymentSource', 'accountName bankName accountNumber currentBalance')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .select('-isDeleted')
        .lean(),
      Expense.countDocuments(match),
    ]);

    const mapped = expenses.map((e) => ({
      _id: e._id,
      id: e._id.toString(),
      date: e.date,
      category: e.category,
      description: e.description,
      amount: e.amount,
      paymentSource: e.paymentSource?._id?.toString(),
      paidFrom: e.paymentSource?.accountName || e.paymentSource?.bankName || '-',
      createdAt: e.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        expenses: mapped,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
        },
      },
    });
  } catch (error) {
    console.error('Get all expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'اخراجات حاصل کرنے میں خرابی',
      error: 'FETCH_ERROR',
    });
  }
};

/**
 * Get expense by ID
 * GET /api/finance/expenses/:id
 */
export const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id)
      .populate('paymentSource', 'accountName bankName accountNumber currentBalance')
      .select('-isDeleted')
      .lean();

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'خرچہ نہیں ملا',
        error: 'NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        expense: {
          ...expense,
          id: expense._id.toString(),
          paymentSource: expense.paymentSource?._id?.toString(),
          paidFrom: expense.paymentSource?.accountName || expense.paymentSource?.bankName || '-',
        },
      },
    });
  } catch (error) {
    console.error('Get expense by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'خرچہ حاصل کرنے میں خرابی',
      error: 'FETCH_ERROR',
    });
  }
};

/**
 * Create expense and debit bank
 * POST /api/finance/expenses
 */
export const createExpense = async (req, res) => {
  try {
    const { date, category, description, amount, paymentSource } = req.body;
    const userId = req.user._id;

    const newExpense = new Expense({
      date: new Date(date),
      category,
      description: description || '',
      amount: Number(amount),
      paymentSource,
      createdBy: userId,
    });

    await newExpense.save();

    try {
      await debitBank(paymentSource, Number(amount), 'expense', newExpense._id, 'Expense');
    } catch (bankErr) {
      await Expense.findByIdAndDelete(newExpense._id);
      return res.status(400).json({
        success: false,
        message: bankErr.message || 'بینک میں رقم ناکافی ہے',
        error: bankErr.code || 'INSUFFICIENT_BALANCE',
      });
    }

    const populated = await Expense.findById(newExpense._id)
      .populate('paymentSource', 'accountName bankName')
      .lean();

    res.status(201).json({
      success: true,
      message: 'خرچہ کامیابی سے شامل ہو گیا',
      data: {
        expense: {
          ...populated,
          id: populated._id.toString(),
          paymentSource: populated.paymentSource?._id?.toString(),
          paidFrom: populated.paymentSource?.accountName || populated.paymentSource?.bankName || '-',
        },
      },
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: 'خرچہ شامل کرنے میں خرابی',
      error: 'CREATE_ERROR',
    });
  }
};

/**
 * Update expense and adjust bank (reverse old debit, apply new debit)
 * PUT /api/finance/expenses/:id
 */
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, category, description, amount, paymentSource } = req.body;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'خرچہ نہیں ملا',
        error: 'NOT_FOUND',
      });
    }

    const oldBankId = expense.paymentSource.toString();
    const oldAmount = expense.amount;

    const newBankId = paymentSource ? paymentSource.toString() : oldBankId;
    const newAmount = amount !== undefined ? Number(amount) : oldAmount;

    if (oldBankId !== newBankId || oldAmount !== newAmount) {
      try {
        await creditBank(oldBankId, oldAmount, 'expense', expense._id, 'Expense');
      } catch (creditErr) {
        return res.status(400).json({
          success: false,
          message: creditErr.message || 'بینک میں تبدیلی کرنے میں خرابی',
          error: creditErr.code || 'BANK_ERROR',
        });
      }
      try {
        await debitBank(newBankId, newAmount, 'expense', expense._id, 'Expense');
      } catch (debitErr) {
        await debitBank(oldBankId, oldAmount, 'expense', expense._id, 'Expense');
        return res.status(400).json({
          success: false,
          message: debitErr.message || 'بینک میں رقم ناکافی ہے',
          error: debitErr.code || 'INSUFFICIENT_BALANCE',
        });
      }
    }

    if (date !== undefined) expense.date = new Date(date);
    if (category !== undefined) expense.category = category;
    if (description !== undefined) expense.description = description || '';
    if (amount !== undefined) expense.amount = Number(amount);
    if (paymentSource !== undefined) expense.paymentSource = paymentSource;

    await expense.save();

    const populated = await Expense.findById(expense._id)
      .populate('paymentSource', 'accountName bankName')
      .lean();

    res.status(200).json({
      success: true,
      message: 'خرچہ کامیابی سے اپڈیٹ ہو گیا',
      data: {
        expense: {
          ...populated,
          id: populated._id.toString(),
          paymentSource: populated.paymentSource?._id?.toString(),
          paidFrom: populated.paymentSource?.accountName || populated.paymentSource?.bankName || '-',
        },
      },
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({
      success: false,
      message: 'خرچہ اپڈیٹ کرنے میں خرابی',
      error: 'UPDATE_ERROR',
    });
  }
};

/**
 * Soft delete expense and reverse debit (credit bank)
 * DELETE /api/finance/expenses/:id
 */
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'خرچہ نہیں ملا',
        error: 'NOT_FOUND',
      });
    }

    const bankId = expense.paymentSource.toString();
    const amount = expense.amount;

    try {
      await creditBank(bankId, amount, 'expense', expense._id, 'Expense');
    } catch (bankErr) {
      return res.status(400).json({
        success: false,
        message: bankErr.message || 'بینک میں رقم واپس کرنے میں خرابی',
        error: bankErr.code || 'BANK_ERROR',
      });
    }

    expense.isDeleted = true;
    await expense.save();

    res.status(200).json({
      success: true,
      message: 'خرچہ کامیابی سے حذف ہو گیا',
    });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({
      success: false,
      message: 'خرچہ حذف کرنے میں خرابی',
      error: 'DELETE_ERROR',
    });
  }
};

/**
 * Get expense categories (for frontend dropdown)
 * GET /api/finance/expenses/options
 */
export const getExpenseOptions = async (req, res) => {
  try {
    const { EXPENSE_CATEGORIES } = await import('../constants/expenses.js');
    res.status(200).json({
      success: true,
      data: { categories: EXPENSE_CATEGORIES },
    });
  } catch (error) {
    console.error('Get expense options error:', error);
    res.status(500).json({
      success: false,
      message: 'اختیارات حاصل کرنے میں خرابی',
      error: 'FETCH_ERROR',
    });
  }
};
