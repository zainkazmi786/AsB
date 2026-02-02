import { Donor, Donation, DashboardStats, BankAccount, Expense } from '@/types';

export const mockDonors: Donor[] = [
  {
    id: '1',
    name: 'محمد احمد',
    phone: '0300-1234567',
    email: 'ahmed@example.com',
    address: 'لاہور، پاکستان',
    totalDonations: 150000,
    lastDonationDate: '2026-01-15',
    createdAt: '2025-06-01',
  },
  {
    id: '2',
    name: 'فاطمہ خان',
    phone: '0321-9876543',
    totalDonations: 75000,
    lastDonationDate: '2026-01-10',
    createdAt: '2025-08-15',
  },
  {
    id: '3',
    name: 'علی حسین',
    phone: '0333-5555555',
    email: 'ali@example.com',
    totalDonations: 250000,
    lastDonationDate: '2026-01-18',
    createdAt: '2025-03-20',
  },
  {
    id: '4',
    name: 'عائشہ بیگم',
    phone: '0345-1112233',
    totalDonations: 50000,
    lastDonationDate: '2026-01-05',
    createdAt: '2025-09-10',
  },
  {
    id: '5',
    name: 'عمر فاروق',
    phone: '0312-4445566',
    address: 'کراچی، پاکستان',
    totalDonations: 180000,
    lastDonationDate: '2026-01-12',
    createdAt: '2025-04-05',
  },
];

export const mockDonations: Donation[] = [
  {
    id: '1',
    receiptNumber: 'DON-2026-001',
    donorId: '1',
    donorName: 'محمد احمد',
    date: '2026-01-15',
    category: 'زکوٰۃ',
    amount: 50000,
    paymentMethod: 'بینک ٹرانسفر',
    remarks: 'سالانہ زکوٰۃ',
    createdAt: '2026-01-15',
  },
  {
    id: '2',
    receiptNumber: 'DON-2026-002',
    donorId: '2',
    donorName: 'فاطمہ خان',
    date: '2026-01-10',
    category: 'صدقہ',
    amount: 25000,
    paymentMethod: 'نقد',
    createdAt: '2026-01-10',
  },
  {
    id: '3',
    receiptNumber: 'DON-2026-003',
    donorId: '3',
    donorName: 'علی حسین',
    date: '2026-01-18',
    category: 'تعلیمی فنڈ',
    amount: 100000,
    paymentMethod: 'چیک',
    remarks: 'یتیم بچوں کی تعلیم کے لیے',
    createdAt: '2026-01-18',
  },
  {
    id: '4',
    receiptNumber: 'DON-2026-004',
    donorId: '4',
    donorName: 'عائشہ بیگم',
    date: '2026-01-05',
    category: 'عام عطیہ',
    amount: 15000,
    paymentMethod: 'آن لائن',
    createdAt: '2026-01-05',
  },
  {
    id: '5',
    receiptNumber: 'DON-2026-005',
    donorId: '5',
    donorName: 'عمر فاروق',
    date: '2026-01-12',
    category: 'تعمیراتی فنڈ',
    amount: 80000,
    paymentMethod: 'بینک ٹرانسفر',
    remarks: 'مسجد کی تعمیر',
    createdAt: '2026-01-12',
  },
];

export const mockBankAccounts: BankAccount[] = [
  {
    id: '1',
    name: 'مین اکاؤنٹ',
    accountNumber: '****1234',
    balance: 1250000,
    bankName: 'حبیب بینک',
  },
  {
    id: '2',
    name: 'زکوٰۃ فنڈ',
    accountNumber: '****5678',
    balance: 450000,
    bankName: 'میزان بینک',
  },
];

export const mockExpenses: Expense[] = [
  {
    id: '1',
    date: '2026-01-14',
    category: 'تنخواہیں',
    description: 'ملازمین کی تنخواہیں',
    amount: 120000,
    paidFrom: 'مین اکاؤنٹ',
  },
  {
    id: '2',
    date: '2026-01-10',
    category: 'بجلی',
    description: 'بجلی کا بل',
    amount: 15000,
    paidFrom: 'مین اکاؤنٹ',
  },
];

export const mockDashboardStats: DashboardStats = {
  totalDonationsThisMonth: 270000,
  totalExpensesThisMonth: 135000,
  bankBalance: 1700000,
  activeDonors: 45,
};

export const donationCategories = [
  'زکوٰۃ',
  'صدقہ',
  'فطرانہ',
  'قربانی',
  'عام عطیہ',
  'تعمیراتی فنڈ',
  'تعلیمی فنڈ',
];

export const paymentMethods = [
  'نقد',
  'بینک ٹرانسفر',
  'چیک',
  'آن لائن',
];

export const monthlyDonationData = [
  { month: 'جنوری', amount: 270000 },
  { month: 'دسمبر', amount: 350000 },
  { month: 'نومبر', amount: 280000 },
  { month: 'اکتوبر', amount: 220000 },
  { month: 'ستمبر', amount: 195000 },
  { month: 'اگست', amount: 240000 },
];

export const categoryDistribution = [
  { name: 'زکوٰۃ', value: 45, color: 'hsl(var(--chart-1))' },
  { name: 'صدقہ', value: 25, color: 'hsl(var(--chart-2))' },
  { name: 'تعلیمی فنڈ', value: 15, color: 'hsl(var(--chart-3))' },
  { name: 'تعمیراتی فنڈ', value: 10, color: 'hsl(var(--chart-4))' },
  { name: 'دیگر', value: 5, color: 'hsl(var(--chart-5))' },
];
