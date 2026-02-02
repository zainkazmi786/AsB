import Bank from '../models/Bank.js';
import BankTransaction from '../models/BankTransaction.js';

/**
 * Get all active bank accounts
 * GET /api/finance/banks
 */
export const getAllBanks = async (req, res) => {
  try {
    const banks = await Bank.find({ isActive: true })
      .select('-createdBy')
      .sort({ createdAt: -1 })
      .lean();

    const mapped = banks.map((b) => ({
      _id: b._id,
      id: b._id.toString(),
      bankName: b.bankName,
      accountName: b.accountName,
      name: b.accountName,
      accountNumber: b.accountNumber,
      currentBalance: b.currentBalance ?? 0,
      balance: b.currentBalance ?? 0,
      isActive: b.isActive,
      createdAt: b.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: { banks: mapped },
    });
  } catch (error) {
    console.error('Get all banks error:', error);
    res.status(500).json({
      success: false,
      message: 'بینک اکاؤنٹس حاصل کرنے میں خرابی',
      error: 'FETCH_ERROR',
    });
  }
};

/**
 * Get single bank by ID
 * GET /api/finance/banks/:id
 */
export const getBankById = async (req, res) => {
  try {
    const { id } = req.params;

    const bank = await Bank.findById(id).lean();

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'بینک اکاؤنٹ نہیں ملا',
        error: 'NOT_FOUND',
      });
    }

    if (!bank.isActive) {
      return res.status(400).json({
        success: false,
        message: 'بینک اکاؤنٹ غیر فعال ہے',
        error: 'BANK_INACTIVE',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        bank: {
          ...bank,
          id: bank._id.toString(),
          name: bank.accountName,
          balance: bank.currentBalance ?? 0,
        },
      },
    });
  } catch (error) {
    console.error('Get bank by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'بینک اکاؤنٹ حاصل کرنے میں خرابی',
      error: 'FETCH_ERROR',
    });
  }
};

/**
 * Create bank account (balance = 0)
 * POST /api/finance/banks
 */
export const createBank = async (req, res) => {
  try {
    const { bankName, accountName, accountNumber } = req.body;
    const userId = req.user._id;

    const existing = await Bank.findOne({
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      isActive: true,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'یہ بینک اور اکاؤنٹ نمبر پہلے سے موجود ہے',
        error: 'DUPLICATE_BANK_ACCOUNT',
      });
    }

    const bank = new Bank({
      bankName: bankName.trim(),
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
      currentBalance: 0,
      isActive: true,
      createdBy: userId,
    });

    await bank.save();

    res.status(201).json({
      success: true,
      message: 'بینک اکاؤنٹ کامیابی سے شامل ہو گیا',
      data: {
        bank: {
          _id: bank._id,
          id: bank._id.toString(),
          bankName: bank.bankName,
          accountName: bank.accountName,
          name: bank.accountName,
          accountNumber: bank.accountNumber,
          currentBalance: 0,
          balance: 0,
          isActive: bank.isActive,
          createdAt: bank.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Create bank error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'یہ بینک اور اکاؤنٹ نمبر پہلے سے موجود ہے',
        error: 'DUPLICATE_BANK_ACCOUNT',
      });
    }
    res.status(500).json({
      success: false,
      message: 'بینک اکاؤنٹ شامل کرنے میں خرابی',
      error: 'CREATE_ERROR',
    });
  }
};

/**
 * Update bank (no balance update)
 * PUT /api/finance/banks/:id
 */
export const updateBank = async (req, res) => {
  try {
    const { id } = req.params;
    const { bankName, accountName, accountNumber } = req.body;

    const bank = await Bank.findById(id);

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'بینک اکاؤنٹ نہیں ملا',
        error: 'NOT_FOUND',
      });
    }

    if (!bank.isActive) {
      return res.status(400).json({
        success: false,
        message: 'غیر فعال اکاؤنٹ میں ترمیم نہیں کی جا سکتی',
        error: 'BANK_INACTIVE',
      });
    }

    if (bankName !== undefined) bank.bankName = bankName.trim();
    if (accountName !== undefined) bank.accountName = accountName.trim();
    if (accountNumber !== undefined) bank.accountNumber = accountNumber.trim();

    await bank.save();

    res.status(200).json({
      success: true,
      message: 'بینک اکاؤنٹ کامیابی سے اپڈیٹ ہو گیا',
      data: {
        bank: {
          _id: bank._id,
          id: bank._id.toString(),
          bankName: bank.bankName,
          accountName: bank.accountName,
          name: bank.accountName,
          accountNumber: bank.accountNumber,
          currentBalance: bank.currentBalance,
          balance: bank.currentBalance,
          isActive: bank.isActive,
          createdAt: bank.createdAt,
          updatedAt: bank.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Update bank error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'یہ بینک اور اکاؤنٹ نمبر پہلے سے موجود ہے',
        error: 'DUPLICATE_BANK_ACCOUNT',
      });
    }
    res.status(500).json({
      success: false,
      message: 'بینک اکاؤنٹ اپڈیٹ کرنے میں خرابی',
      error: 'UPDATE_ERROR',
    });
  }
};

/**
 * Soft delete (disable) bank - only if balance is 0
 * DELETE /api/finance/banks/:id
 */
export const disableBank = async (req, res) => {
  try {
    const { id } = req.params;

    const bank = await Bank.findById(id);

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'بینک اکاؤنٹ نہیں ملا',
        error: 'NOT_FOUND',
      });
    }

    const balance = bank.currentBalance ?? 0;
    if (balance !== 0) {
      return res.status(400).json({
        success: false,
        message: 'بیلنس صفر ہونے پر ہی اکاؤنٹ غیر فعال کیا جا سکتا ہے',
        error: 'BALANCE_NOT_ZERO',
      });
    }

    bank.isActive = false;
    await bank.save();

    res.status(200).json({
      success: true,
      message: 'بینک اکاؤنٹ کامیابی سے غیر فعال ہو گیا',
    });
  } catch (error) {
    console.error('Disable bank error:', error);
    res.status(500).json({
      success: false,
      message: 'بینک اکاؤنٹ غیر فعال کرنے میں خرابی',
      error: 'DELETE_ERROR',
    });
  }
};

/**
 * Get bank transactions (for "View transactions")
 * GET /api/finance/banks/:id/transactions
 */
export const getBankTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const bank = await Bank.findById(id);
    if (!bank || !bank.isActive) {
      return res.status(404).json({
        success: false,
        message: 'بینک اکاؤنٹ نہیں ملا',
        error: 'NOT_FOUND',
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      BankTransaction.find({ bankId: id })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      BankTransaction.countDocuments({ bankId: id }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
        },
      },
    });
  } catch (error) {
    console.error('Get bank transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'لین دین حاصل کرنے میں خرابی',
      error: 'FETCH_ERROR',
    });
  }
};
