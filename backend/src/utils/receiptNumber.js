import Donation from '../models/Donation.js';
import { DEFAULT_RECEIPT_FORMAT } from '../constants/donations.js';

/**
 * Generate next receipt number based on format.
 * Format placeholders: {YEAR}, {NUMBER} (padded to 3 digits).
 * @returns {Promise<string>} Next receipt number e.g. DON-2026-001
 */
export const getNextReceiptNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `DON-${year}-`;

  // Find max sequence for current year (receiptNumber like "DON-2026-001")
  const lastDonation = await Donation.findOne({
    receiptNumber: new RegExp(`^${prefix}\\d+$`),
    isDeleted: { $ne: true },
  })
    .sort({ receiptNumber: -1 })
    .select('receiptNumber')
    .lean();

  let nextSeq = 1;
  if (lastDonation && lastDonation.receiptNumber) {
    const match = lastDonation.receiptNumber.match(/-(\d+)$/);
    if (match) {
      nextSeq = parseInt(match[1], 10) + 1;
    }
  }

  const numberPart = String(nextSeq).padStart(3, '0');
  return `${prefix}${numberPart}`;
};
