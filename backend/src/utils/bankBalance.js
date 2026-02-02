import Bank from '../models/Bank.js';
import BankTransaction from '../models/BankTransaction.js';

/**
 * Credit a bank account (e.g. donation received).
 * Updates currentBalance and creates a credit transaction.
 * @param {ObjectId} bankId
 * @param {Number} amount
 * @param {'donation'|'expense'} source - source type for reverse (expense is used when reversing a debit)
 * @param {ObjectId} referenceId - Donation or Expense _id
 * @param {String} sourceRef - 'Donation' or 'Expense'
 */
export const creditBank = async (bankId, amount, source, referenceId, sourceRef = 'Donation') => {
  const bank = await Bank.findById(bankId);
  if (!bank) {
    const err = new Error('بینک اکاؤنٹ نہیں ملا');
    err.code = 'BANK_NOT_FOUND';
    throw err;
  }
  if (!bank.isActive) {
    const err = new Error('بینک اکاؤنٹ غیر فعال ہے');
    err.code = 'BANK_INACTIVE';
    throw err;
  }

  bank.currentBalance = (bank.currentBalance || 0) + Number(amount);
  await bank.save();

  await BankTransaction.create({
    bankId,
    type: 'credit',
    amount: Number(amount),
    source,
    referenceId,
    sourceRef,
    date: new Date(),
  });
};

/**
 * Debit a bank account (e.g. expense paid).
 * Validates sufficient balance, updates currentBalance, creates a debit transaction.
 * @param {ObjectId} bankId
 * @param {Number} amount
 * @param {'donation'|'expense'} source
 * @param {ObjectId} referenceId
 * @param {String} sourceRef - 'Donation' or 'Expense'
 */
export const debitBank = async (bankId, amount, source, referenceId, sourceRef = 'Expense') => {
  const bank = await Bank.findById(bankId);
  if (!bank) {
    const err = new Error('بینک اکاؤنٹ نہیں ملا');
    err.code = 'BANK_NOT_FOUND';
    throw err;
  }
  if (!bank.isActive) {
    const err = new Error('بینک اکاؤنٹ غیر فعال ہے');
    err.code = 'BANK_INACTIVE';
    throw err;
  }

  const balance = bank.currentBalance || 0;
  const debitAmount = Number(amount);
  if (balance < debitAmount) {
    const err = new Error('بینک اکاؤنٹ میں رقم ناکافی ہے');
    err.code = 'INSUFFICIENT_BALANCE';
    throw err;
  }

  bank.currentBalance = balance - debitAmount;
  await bank.save();

  await BankTransaction.create({
    bankId,
    type: 'debit',
    amount: debitAmount,
    source,
    referenceId,
    sourceRef,
    date: new Date(),
  });
};
