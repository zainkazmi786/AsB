import mongoose from 'mongoose';

const donorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'نام ضروری ہے'],
    trim: true,
    minlength: [2, 'نام کم از کم 2 حروف کا ہونا چاہیے'],
  },
  phone: {
    type: String,
    required: [true, 'فون نمبر ضروری ہے'],
    trim: true,
    unique: true,
    validate: {
      validator: function(v) {
        // Allow various phone formats
        return /^[\d\s\-+()]+$/.test(v);
      },
      message: 'غلط فون نمبر کی شکل',
    },
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true, // Allow multiple nulls but enforce uniqueness for non-null values
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'غلط ای میل کی شکل',
    },
  },
  address: {
    type: String,
    trim: true,
  },
  totalDonations: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastDonationDate: {
    type: Date,
    default: null,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Index for search optimization
donorSchema.index({ name: 'text', phone: 'text' });
donorSchema.index({ isDeleted: 1 });

// Method to update donor stats (called when donation is created/updated/deleted)
donorSchema.statics.updateDonorStats = async function(donorId) {
  const Donation = mongoose.model('Donation');
  
  const stats = await Donation.aggregate([
    {
      $match: {
        donorId: new mongoose.Types.ObjectId(donorId),
        isDeleted: { $ne: true },
      },
    },
    {
      $group: {
        _id: null,
        totalDonations: { $sum: '$amount' },
        lastDonationDate: { $max: '$date' },
      },
    },
  ]);

  const updateData = {
    totalDonations: stats[0]?.totalDonations || 0,
    lastDonationDate: stats[0]?.lastDonationDate || null,
  };

  await this.findByIdAndUpdate(donorId, updateData);
};

// Exclude deleted donors by default
donorSchema.pre(/^find/, function() {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

const Donor = mongoose.model('Donor', donorSchema);

export default Donor;
