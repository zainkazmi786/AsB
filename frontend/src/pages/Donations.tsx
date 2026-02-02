import { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, RotateCcw, Eye, Edit, Printer, Loader2 } from 'lucide-react';
import { donationsApi, donorsApi, banksApi, Donation } from '@/lib/api';
import { DonationCategory, PaymentMethod } from '@/types';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ur-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDateForInput = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
};

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('ur-PK');
};

const Donations = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donors, setDonors] = useState<{ _id: string; name: string }[]>([]);
  const [banks, setBanks] = useState<{ _id: string; accountName: string; bankName: string }[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  const [formData, setFormData] = useState({
    donorId: '',
    date: new Date().toISOString().split('T')[0],
    category: '' as DonationCategory,
    amount: '',
    paymentMethod: '' as PaymentMethod,
    bankId: '' as string,
    remarks: '',
  });

  const fetchDonations = async (search = '', category = '', page = 1) => {
    setIsLoading(true);
    try {
      const response = await donationsApi.getAll(search, category, page, 10);
      if (response.success && response.data) {
        const mapped = response.data.donations.map((d) => ({
          ...d,
          id: d._id,
          dateRaw: d.date,
          date: formatDateDisplay(d.date),
        }));
        setDonations(mapped);
        setPagination(response.data.pagination);
      } else {
        toast.error(response.message || 'عطیات حاصل کرنے میں خرابی');
      }
    } catch (error: any) {
      toast.error(error?.message || 'نیٹ ورک کی خرابی');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDonors = async () => {
    try {
      const response = await donorsApi.getAll('', 1, 500);
      if (response.success && response.data) {
        setDonors(response.data.donors.map((d) => ({ _id: d._id, name: d.name })));
      }
    } catch (error) {
      console.error('Failed to fetch donors:', error);
    }
  };

  const fetchOptions = async () => {
    try {
      const response = await donationsApi.getOptions();
      if (response.success && response.data) {
        setCategories(response.data.categories || []);
        setPaymentMethods(response.data.paymentMethods || []);
      }
    } catch (error) {
      console.error('Failed to fetch options:', error);
      setCategories(['زکوٰۃ', 'صدقہ', 'فطرانہ', 'قربانی', 'عام عطیہ', 'تعمیراتی فنڈ', 'تعلیمی فنڈ']);
      setPaymentMethods(['نقد', 'بینک ٹرانسفر', 'چیک', 'آن لائن']);
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await banksApi.getAll();
      if (response.success && response.data) {
        setBanks(
          response.data.banks.map((b) => ({
            _id: b._id,
            accountName: b.accountName || b.name || '',
            bankName: b.bankName,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to fetch banks:', error);
    }
  };

  useEffect(() => {
    fetchOptions();
    fetchDonors();
    fetchBanks();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDonations(searchTerm, categoryFilter, 1);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, categoryFilter]);

  const handlePageChange = (page: number) => {
    fetchDonations(searchTerm, categoryFilter, page);
  };

  const columns = useMemo(
    () => [
      { key: 'receiptNumber', header: 'رسید نمبر', className: 'ltr-nums font-mono' },
      { key: 'date', header: 'تاریخ', className: 'ltr-nums' },
      { key: 'donorName', header: 'عطیہ دہندہ' },
      { key: 'category', header: 'قسم' },
      {
        key: 'amount',
        header: 'رقم',
        render: (item: Donation) => (
          <span className="ltr-nums font-semibold text-primary">
            {formatCurrency(item.amount)}
          </span>
        ),
      },
      { key: 'paymentMethod', header: 'ادائیگی کا طریقہ' },
      {
        key: 'actions',
        header: 'کارروائی',
        render: (item: Donation) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="تفصیلات">
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleEdit(item)}
              title="ترمیم"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="پرنٹ">
              <Printer className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const handleEdit = (donation: Donation & { dateRaw?: string }) => {
    setEditingDonation(donation);
    setFormData({
      donorId: donation.donorId,
      date: formatDateForInput(donation.dateRaw || donation.date),
      category: donation.category as DonationCategory,
      amount: donation.amount.toString(),
      paymentMethod: donation.paymentMethod as PaymentMethod,
      bankId: donation.bankId || '',
      remarks: donation.remarks || '',
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingDonation(null);
    setFormData({
      donorId: '',
      date: new Date().toISOString().split('T')[0],
      category: '' as DonationCategory,
      amount: '',
      paymentMethod: '' as PaymentMethod,
      bankId: '',
      remarks: '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.donorId || !formData.category || !formData.amount || !formData.paymentMethod) {
      toast.error('تمام ضروری فیلڈز پُر کریں');
      return;
    }
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('درست رقم درج کریں');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingDonation) {
        const response = await donationsApi.update(editingDonation._id, {
          donorId: formData.donorId,
          date: formData.date,
          category: formData.category,
          amount,
          paymentMethod: formData.paymentMethod,
          bankId: formData.bankId && formData.bankId !== '__none__' ? formData.bankId : undefined,
          remarks: formData.remarks || undefined,
        });
        if (response.success) {
          toast.success('عطیہ کامیابی سے اپڈیٹ ہو گیا');
          setIsDialogOpen(false);
          fetchDonations(searchTerm, categoryFilter, pagination.currentPage);
        } else {
          toast.error(response.message || 'اپڈیٹ کرنے میں خرابی');
        }
      } else {
        const response = await donationsApi.create({
          donorId: formData.donorId,
          date: formData.date,
          category: formData.category,
          amount,
          paymentMethod: formData.paymentMethod,
          bankId: formData.bankId && formData.bankId !== '__none__' ? formData.bankId : undefined,
          remarks: formData.remarks || undefined,
        });
        if (response.success) {
          toast.success('نیا عطیہ کامیابی سے شامل ہو گیا');
          setIsDialogOpen(false);
          fetchDonations(searchTerm, categoryFilter, 1);
        } else {
          toast.error(response.message || 'شامل کرنے میں خرابی');
        }
      }
    } catch (error: any) {
      toast.error(error?.message || 'عمل میں خرابی ہوئی');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    fetchDonations('', 'all', 1);
  };

  const tableData = donations.map((d) => ({
    ...d,
    id: d.id || d._id,
  }));

  return (
    <MainLayout>
      <PageHeader
        title="عطیات کا اندراج"
        description="تمام عطیات کا انتظام اور ریکارڈ"
        actions={
          <Button onClick={handleAddNew} className="gap-2">
            <Plus className="w-4 h-4" />
            نیا عطیہ شامل کریں
          </Button>
        }
      />

      <div className="filter-bar">
        <div className="flex-1 min-w-48">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="نام یا رسید نمبر تلاش کریں..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="قسم منتخب کریں" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">تمام اقسام</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={handleReset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          ری سیٹ
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={tableData}
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          emptyMessage="کوئی عطیات موجود نہیں"
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingDonation ? 'عطیہ میں ترمیم' : 'نیا عطیہ شامل کریں'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>عطیہ دہندہ</Label>
              <Select
                value={formData.donorId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, donorId: value }))}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="عطیہ دہندہ منتخب کریں" />
                </SelectTrigger>
                <SelectContent>
                  {donors.map((donor) => (
                    <SelectItem key={donor._id} value={donor._id}>
                      {donor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>تاریخ</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  className="ltr-nums"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label>رقم</Label>
                <Input
                  type="number"
                  placeholder="0"
                  min={1}
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  className="ltr-nums"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>عطیہ کی قسم</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value as DonationCategory }))
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="قسم منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>ادائیگی کا طریقہ</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, paymentMethod: value as PaymentMethod }))
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="طریقہ منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>بینک اکاؤنٹ (اختیاری - اگر بینک میں جمع کروایا)</Label>
              <Select
                value={formData.bankId || '__none__'}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, bankId: value === '__none__' ? '' : value }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="بینک اکاؤنٹ منتخب کریں" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">کوئی نہیں</SelectItem>
                  {banks.map((bank) => (
                    <SelectItem key={bank._id} value={bank._id}>
                      {bank.accountName} ({bank.bankName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>تبصرہ (اختیاری)</Label>
              <Textarea
                placeholder="اضافی معلومات..."
                value={formData.remarks}
                onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              منسوخ
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingDonation ? 'اپڈیٹ ہو رہا ہے...' : 'شامل ہو رہا ہے...'}
                </>
              ) : editingDonation ? (
                'اپڈیٹ کریں'
              ) : (
                'شامل کریں'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Donations;
