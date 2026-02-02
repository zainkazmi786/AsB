import mongoose from 'mongoose';

const bankSchema = new mongoose.Schema({
  bankName: {
    type: String,
    required: [true, 'بینک کا نام ضروری ہے'],
    trim: true,
  },
  accountName: {
    type: String,
    required: [true, 'اکاؤنٹ کا نام ضروری ہے'],
    trim: true,
  },
  accountNumber: {
    type: String,
    required: [true, 'اکاؤنٹ نمبر ضروری ہے'],
    trim: true,
  },
  currentBalance: {
    type: Number,
    default: 0,
    min: [0, 'بیلنس منفی نہیں ہو سکتا'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Unique: same bank + account number cannot exist twice
bankSchema.index({ bankName: 1, accountNumber: 1 }, { unique: true });
bankSchema.index({ isActive: 1 });

const Bank = mongoose.model('Bank', bankSchema);

export default Bank;
