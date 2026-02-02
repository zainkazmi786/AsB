import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: [true, 'عطیہ دہندہ ضروری ہے'],
  },
  date: {
    type: Date,
    required: [true, 'تاریخ ضروری ہے'],
  },
  category: {
    type: String,
    required: [true, 'قسم ضروری ہے'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'رقم ضروری ہے'],
    min: [0.01, 'رقم صفر سے زیادہ ہونی چاہیے'],
  },
  paymentMethod: {
    type: String,
    required: [true, 'ادائیگی کا طریقہ ضروری ہے'],
    trim: true,
  },
  bankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bank',
    default: null,
  },
  remarks: {
    type: String,
    trim: true,
    default: '',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

donationSchema.index({ donorId: 1 });
donationSchema.index({ date: -1 });
donationSchema.index({ category: 1 });
donationSchema.index({ isDeleted: 1 });
donationSchema.index({ receiptNumber: 'text' });

// Exclude deleted by default
donationSchema.pre(/^find/, function() {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

const Donation = mongoose.model('Donation', donationSchema);

export default Donation;
