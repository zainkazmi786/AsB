export interface Donor {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalDonations: number;
  lastDonationDate: string;
  createdAt: string;
}

export interface Donation {
  id: string;
  receiptNumber: string;
  donorId: string;
  donorName: string;
  date: string;
  category: DonationCategory;
  amount: number;
  paymentMethod: PaymentMethod;
  remarks?: string;
  createdAt: string;
}

export type DonationCategory = 
  | 'زکوٰۃ' 
  | 'صدقہ' 
  | 'فطرانہ' 
  | 'قربانی' 
  | 'عام عطیہ' 
  | 'تعمیراتی فنڈ' 
  | 'تعلیمی فنڈ';

export type PaymentMethod = 
  | 'نقد' 
  | 'بینک ٹرانسفر' 
  | 'چیک' 
  | 'آن لائن';

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paidFrom: string;
}

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  balance: number;
  bankName: string;
}

export interface DashboardStats {
  totalDonationsThisMonth: number;
  totalExpensesThisMonth: number;
  bankBalance: number;
  activeDonors: number;
}
