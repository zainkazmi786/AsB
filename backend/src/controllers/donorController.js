import Donor from '../models/Donor.js';

/**
 * Get all donors with pagination and search
 * GET /api/donors
 */
export const getAllDonors = async (req, res) => {
  try {
    const {
      search = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    const searchQuery = {};
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort query
    const sortQuery = {};
    sortQuery[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get donors with pagination
    const [donors, total] = await Promise.all([
      Donor.find(searchQuery)
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum)
        .select('-isDeleted')
        .lean(),
      Donor.countDocuments(searchQuery),
    ]);

    res.status(200).json({
      success: true,
      data: {
        donors,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
        },
      },
    });
  } catch (error) {
    console.error('Get all donors error:', error);
    res.status(500).json({
      success: false,
      message: 'عطیہ دہندگان حاصل کرنے میں خرابی',
      error: 'FETCH_ERROR',
    });
  }
};

/**
 * Get donor by ID with donation history
 * GET /api/donors/:id
 */
export const getDonorById = async (req, res) => {
  try {
    const { id } = req.params;

    const donor = await Donor.findById(id)
      .select('-isDeleted')
      .lean();

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'عطیہ دہندہ نہیں ملا',
        error: 'NOT_FOUND',
      });
    }

    // Get donation history (if Donation model exists)
    let donations = [];
    try {
      const Donation = (await import('../models/Donation.js')).default;
      donations = await Donation.find({ donorId: id, isDeleted: { $ne: true } })
        .sort({ date: -1 })
        .limit(50)
        .select('date category amount receiptNumber')
        .lean();
    } catch (err) {
      // Donation model not implemented yet, skip
    }

    res.status(200).json({
      success: true,
      data: {
        donor: {
          ...donor,
          donations,
        },
      },
    });
  } catch (error) {
    console.error('Get donor by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'عطیہ دہندہ حاصل کرنے میں خرابی',
      error: 'FETCH_ERROR',
    });
  }
};

/**
 * Create new donor
 * POST /api/donors
 */
export const createDonor = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const userId = req.user._id;

    // Check if phone already exists
    const existingDonor = await Donor.findOne({ phone, isDeleted: { $ne: true } });
    if (existingDonor) {
      return res.status(400).json({
        success: false,
        message: 'یہ فون نمبر پہلے سے موجود ہے',
        error: 'DUPLICATE_PHONE',
      });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await Donor.findOne({ email, isDeleted: { $ne: true } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'یہ ای میل پہلے سے موجود ہے',
          error: 'DUPLICATE_EMAIL',
        });
      }
    }

    const donor = new Donor({
      name,
      phone,
      email: email || undefined,
      address: address || undefined,
      totalDonations: 0,
      lastDonationDate: null,
      createdBy: userId,
    });

    await donor.save();

    res.status(201).json({
      success: true,
      message: 'عطیہ دہندہ کامیابی سے شامل ہو گیا',
      data: {
        donor: donor.toJSON(),
      },
    });
  } catch (error) {
    console.error('Create donor error:', error);
    
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `یہ ${field === 'phone' ? 'فون نمبر' : 'ای میل'} پہلے سے موجود ہے`,
        error: 'DUPLICATE_FIELD',
      });
    }

    res.status(500).json({
      success: false,
      message: 'عطیہ دہندہ شامل کرنے میں خرابی',
      error: 'CREATE_ERROR',
    });
  }
};

/**
 * Update donor
 * PUT /api/donors/:id
 */
export const updateDonor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;

    const donor = await Donor.findById(id);

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'عطیہ دہندہ نہیں ملا',
        error: 'NOT_FOUND',
      });
    }

    // Check if phone is being changed and already exists
    if (phone && phone !== donor.phone) {
      const existingDonor = await Donor.findOne({ phone, isDeleted: { $ne: true } });
      if (existingDonor) {
        return res.status(400).json({
          success: false,
          message: 'یہ فون نمبر پہلے سے موجود ہے',
          error: 'DUPLICATE_PHONE',
        });
      }
    }

    // Check if email is being changed and already exists
    if (email && email !== donor.email) {
      const existingEmail = await Donor.findOne({ email, isDeleted: { $ne: true } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'یہ ای میل پہلے سے موجود ہے',
          error: 'DUPLICATE_EMAIL',
        });
      }
    }

    // Update fields
    if (name) donor.name = name;
    if (phone) donor.phone = phone;
    if (email !== undefined) donor.email = email || undefined;
    if (address !== undefined) donor.address = address || undefined;

    await donor.save();

    res.status(200).json({
      success: true,
      message: 'عطیہ دہندہ کامیابی سے اپڈیٹ ہو گیا',
      data: {
        donor: donor.toJSON(),
      },
    });
  } catch (error) {
    console.error('Update donor error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `یہ ${field === 'phone' ? 'فون نمبر' : 'ای میل'} پہلے سے موجود ہے`,
        error: 'DUPLICATE_FIELD',
      });
    }

    res.status(500).json({
      success: false,
      message: 'عطیہ دہندہ اپڈیٹ کرنے میں خرابی',
      error: 'UPDATE_ERROR',
    });
  }
};

/**
 * Delete donor (soft delete)
 * DELETE /api/donors/:id
 */
export const deleteDonor = async (req, res) => {
  try {
    const { id } = req.params;

    const donor = await Donor.findById(id);

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'عطیہ دہندہ نہیں ملا',
        error: 'NOT_FOUND',
      });
    }

    // Soft delete
    donor.isDeleted = true;
    await donor.save();

    res.status(200).json({
      success: true,
      message: 'عطیہ دہندہ کامیابی سے حذف ہو گیا',
    });
  } catch (error) {
    console.error('Delete donor error:', error);
    res.status(500).json({
      success: false,
      message: 'عطیہ دہندہ حذف کرنے میں خرابی',
      error: 'DELETE_ERROR',
    });
  }
};

/**
 * Get donor donation history
 * GET /api/donors/:id/donations
 */
export const getDonorDonations = async (req, res) => {
  try {
    const { id } = req.params;

    const donor = await Donor.findById(id);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'عطیہ دہندہ نہیں ملا',
        error: 'NOT_FOUND',
      });
    }

    // Get donation history (if Donation model exists)
    let donations = [];
    try {
      const Donation = (await import('../models/Donation.js')).default;
      donations = await Donation.find({ donorId: id, isDeleted: { $ne: true } })
        .sort({ date: -1 })
        .select('date category amount receiptNumber paymentMethod')
        .lean();
    } catch (err) {
      // Donation model not implemented yet
    }

    res.status(200).json({
      success: true,
      data: {
        donations,
      },
    });
  } catch (error) {
    console.error('Get donor donations error:', error);
    res.status(500).json({
      success: false,
      message: 'عطیات کی تاریخ حاصل کرنے میں خرابی',
      error: 'FETCH_ERROR',
    });
  }
};
