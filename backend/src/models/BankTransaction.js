import mongoose from 'mongoose';

const bankTransactionSchema = new mongoose.Schema({
  bankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bank',
    required: true,
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'رقم صفر سے زیادہ ہونی چاہیے'],
  },
  source: {
    type: String,
    enum: ['donation', 'expense'],
    required: true,
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'sourceRef',
  },
  sourceRef: {
    type: String,
    enum: ['Donation', 'Expense'],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  remarks: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

bankTransactionSchema.index({ bankId: 1, date: -1 });
bankTransactionSchema.index({ referenceId: 1, source: 1 });

const BankTransaction = mongoose.model('BankTransaction', bankTransactionSchema);

export default BankTransaction;
