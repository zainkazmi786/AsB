import Donation from '../models/Donation.js';
import Donor from '../models/Donor.js';
import { getNextReceiptNumber } from '../utils/receiptNumber.js';
import { creditBank, debitBank } from '../utils/bankBalance.js';

/**
 * Get all donations with pagination, search, and filters
 * GET /api/donations
 */
export const getAllDonations = async (req, res) => {
  try {
    const {
      search = '',
      category = '',
      page = 1,
      limit = 10,
      sortBy = 'date',
      sortOrder = 'desc',
      dateFrom = '',
      dateTo = '',
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const matchStage = { isDeleted: { $ne: true } };

    if (category) {
      matchStage.category = category;
    }

    if (dateFrom || dateTo) {
      matchStage.date = {};
      if (dateFrom) matchStage.date.$gte = new Date(dateFrom);
      if (dateTo) matchStage.date.$lte = new Date(dateTo);
    }

    const sortOrderNum = sortOrder === 'asc' ? 1 : -1;

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'donors',
          localField: 'donorId',
          foreignField: '_id',
          as: 'donor',
        },
      },
      { $unwind: { path: '$donor', preserveNullAndEmptyArrays: true } },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { receiptNumber: { $regex: search, $options: 'i' } },
            { 'donor.name': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    const countPipeline = [...pipeline, { $count: 'total' }];
    const dataPipeline = [
      ...pipeline,
      { $sort: { [sortBy]: sortOrderNum } },
      { $skip: skip },
      { $limit: limitNum },
    ];

    const [countResult, donations] = await Promise.all([
      Donation.aggregate(countPipeline),
      Donation.aggregate(dataPipeline),
    ]);

    const total = countResult[0]?.total || 0;

    const mappedDonations = donations.map((d) => ({
      _id: d._id,
      id: d._id.toString(),
      receiptNumber: d.receiptNumber,
      donorId: d.donorId?.toString(),
      donorName: d.donor?.name || '',
      date: d.date,
      category: d.category,
      amount: d.amount,
      paymentMethod: d.paymentMethod,
      bankId: d.bankId?.toString() || null,
      remarks: d.remarks,
      createdAt: d.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        donations: mappedDonations,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
        },
      },
    });
  } catch (error) {
    console.error('Get all donations error:', error);
    res.status(500).json({
      success: false,
      message: 'عطیات حاصل کرنے میں خرابی',
      error: 'FETCH_ERROR',
    });
  }
};

/**
 * Get donation by ID
 * GET /api/donations/:id
 */
export const getDonationById = async (req, res) => {
  try {
    const { id } = req.params;

    const donation = await Donation.findById(id)
      .populate('donorId', 'name phone')
      .select('-isDeleted')
      .lean();

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'عطیہ نہیں ملا',
        error: 'NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        donation: {
          ...donation,
          id: donation._id.toString(),
          donorId: donation.donorId?._id?.toString(),
          donorName: donation.donorId?.name || '',
        },
      },
    });
  } catch (error) {
    console.error('Get donation by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'عطیہ حاصل کرنے میں خرابی',
      error: 'FETCH_ERROR',
    });
  }
};

/**
 * Create donation and update donor stats
 * POST /api/donations
 */
export const createDonation = async (req, res) => {
  try {
    const { donorId, date, category, amount, paymentMethod, bankId, remarks } = req.body;
    const userId = req.user._id;

    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'عطیہ دہندہ نہیں ملا',
        error: 'DONOR_NOT_FOUND',
      });
    }

    const receiptNumber = await getNextReceiptNumber();

    const newDonation = new Donation({
      receiptNumber,
      donorId,
      date: new Date(date),
      category,
      amount: Number(amount),
      paymentMethod,
      bankId: bankId || null,
      remarks: remarks || '',
      createdBy: userId,
    });

    await newDonation.save();

    if (bankId) {
      try {
        await creditBank(bankId, Number(amount), 'donation', newDonation._id, 'Donation');
      } catch (bankErr) {
        await Donation.findByIdAndDelete(newDonation._id);
        return res.status(400).json({
          success: false,
          message: bankErr.message || 'بینک میں رقم شامل کرنے میں خرابی',
          error: bankErr.code || 'BANK_ERROR',
        });
      }
    }

    await Donor.updateDonorStats(donorId);

    const populated = await Donation.findById(newDonation._id)
      .populate('donorId', 'name')
      .lean();

    res.status(201).json({
      success: true,
      message: 'عطیہ کامیابی سے شامل ہو گیا',
      data: {
        donation: {
          ...populated,
          id: populated._id.toString(),
          donorId: populated.donorId?._id?.toString(),
          donorName: populated.donorId?.name || '',
        },
      },
    });
  } catch (error) {
    console.error('Create donation error:', error);
    res.status(500).json({
      success: false,
      message: 'عطیہ شامل کرنے میں خرابی',
      error: 'CREATE_ERROR',
    });
  }
};

/**
 * Update donation and refresh donor stats
 * PUT /api/donations/:id
 */
export const updateDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const { donorId, date, category, amount, paymentMethod, bankId, remarks } = req.body;

    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'عطیہ نہیں ملا',
        error: 'NOT_FOUND',
      });
    }

    const previousDonorId = donation.donorId?.toString();
    const previousBankId = donation.bankId?.toString();
    const previousAmount = donation.amount;

    if (donorId) donation.donorId = donorId;
    if (date !== undefined) donation.date = new Date(date);
    if (category) donation.category = category;
    if (amount !== undefined) donation.amount = Number(amount);
    if (paymentMethod) donation.paymentMethod = paymentMethod;
    if (bankId !== undefined) donation.bankId = bankId || null;
    if (remarks !== undefined) donation.remarks = remarks || '';

    const newBankId = donation.bankId?.toString() || null;
    const newAmount = donation.amount;

    if (previousBankId && (previousBankId !== newBankId || previousAmount !== newAmount)) {
      try {
        await debitBank(previousBankId, previousAmount, 'donation', donation._id, 'Donation');
      } catch (bankErr) {
        return res.status(400).json({
          success: false,
          message: bankErr.message || 'بینک میں تبدیلی کرنے میں خرابی',
          error: bankErr.code || 'BANK_ERROR',
        });
      }
    }
    if (newBankId && (previousBankId !== newBankId || previousAmount !== newAmount)) {
      try {
        await creditBank(newBankId, newAmount, 'donation', donation._id, 'Donation');
      } catch (bankErr) {
        if (previousBankId && previousBankId !== newBankId) {
          await creditBank(previousBankId, previousAmount, 'donation', donation._id, 'Donation');
        }
        return res.status(400).json({
          success: false,
          message: bankErr.message || 'بینک میں رقم شامل کرنے میں خرابی',
          error: bankErr.code || 'BANK_ERROR',
        });
      }
    }

    await donation.save();

    await Donor.updateDonorStats(donation.donorId.toString());
    if (previousDonorId !== donation.donorId.toString()) {
      await Donor.updateDonorStats(previousDonorId);
    }

    const populated = await Donation.findById(donation._id)
      .populate('donorId', 'name')
      .lean();

    res.status(200).json({
      success: true,
      message: 'عطیہ کامیابی سے اپڈیٹ ہو گیا',
      data: {
        donation: {
          ...populated,
          id: populated._id.toString(),
          donorId: populated.donorId?._id?.toString(),
          donorName: populated.donorId?.name || '',
        },
      },
    });
  } catch (error) {
    console.error('Update donation error:', error);
    res.status(500).json({
      success: false,
      message: 'عطیہ اپڈیٹ کرنے میں خرابی',
      error: 'UPDATE_ERROR',
    });
  }
};

/**
 * Soft delete donation and update donor stats
 * DELETE /api/donations/:id
 */
export const deleteDonation = async (req, res) => {
  try {
    const { id } = req.params;

    const donation = await Donation.findById(id);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'عطیہ نہیں ملا',
        error: 'NOT_FOUND',
      });
    }

    const donorId = donation.donorId.toString();
    const bankId = donation.bankId?.toString();
    const amount = donation.amount;

    if (bankId) {
      try {
        await debitBank(bankId, amount, 'donation', donation._id, 'Donation');
      } catch (bankErr) {
        return res.status(400).json({
          success: false,
          message: bankErr.message || 'بینک سے رقم واپس کرنے میں خرابی',
          error: bankErr.code || 'BANK_ERROR',
        });
      }
    }

    donation.isDeleted = true;
    await donation.save();

    await Donor.updateDonorStats(donorId);

    res.status(200).json({
      success: true,
      message: 'عطیہ کامیابی سے حذف ہو گیا',
    });
  } catch (error) {
    console.error('Delete donation error:', error);
    res.status(500).json({
      success: false,
      message: 'عطیہ حذف کرنے میں خرابی',
      error: 'DELETE_ERROR',
    });
  }
};

/**
 * Get donation categories and payment methods (for frontend dropdowns)
 * GET /api/donations/options
 */
export const getDonationOptions = async (req, res) => {
  try {
    const { DONATION_CATEGORIES, PAYMENT_METHODS } = await import('../constants/donations.js');
    res.status(200).json({
      success: true,
      data: {
        categories: DONATION_CATEGORIES,
        paymentMethods: PAYMENT_METHODS,
      },
    });
  } catch (error) {
    console.error('Get donation options error:', error);
    res.status(500).json({
      success: false,
      message: 'اختیارات حاصل کرنے میں خرابی',
      error: 'FETCH_ERROR',
    });
  }
};
