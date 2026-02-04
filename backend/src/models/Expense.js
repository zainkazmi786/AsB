import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'تاریخ ضروری ہے'],
  },
  category: {
    type: String,
    required: [true, 'زمرہ ضروری ہے'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  amount: {
    type: Number,
    required: [true, 'رقم ضروری ہے'],
    min: [0.01, 'رقم صفر سے زیادہ ہونی چاہیے'],
  },
  paymentSource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bank',
    required: [true, 'ادائیگی کا ذریعہ ضروری ہے'],
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
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

expenseSchema.index({ paymentSource: 1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ isDeleted: 1 });
expenseSchema.index({ departmentId: 1 });

expenseSchema.pre(/^find/, function() {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
