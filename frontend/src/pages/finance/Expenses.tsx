import { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { expensesApi, banksApi, Expense } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ur-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDateDisplay = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('ur-PK');
};

const formatDateForInput = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
};

const Expenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [banks, setBanks] = useState<{ _id: string; accountName: string; bankName: string }[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: '',
    paymentSource: '',
  });

  const canEdit = user?.role === 'admin' || user?.role === 'accountant';

  const fetchExpenses = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await expensesApi.getAll(page, 10);
      if (response.success && response.data) {
        const mapped = response.data.expenses.map((e) => ({
          ...e,
          id: e._id,
          dateRaw: e.date,
          date: formatDateDisplay(e.date),
        }));
        setExpenses(mapped);
        setPagination(response.data.pagination);
      } else {
        toast.error(response.message || 'اخراجات حاصل کرنے میں خرابی');
      }
    } catch (error: any) {
      toast.error(error?.message || 'نیٹ ورک کی خرابی');
    } finally {
      setIsLoading(false);
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

  const fetchOptions = async () => {
    try {
      const response = await expensesApi.getOptions();
      if (response.success && response.data) {
        setCategories(response.data.categories || []);
      }
    } catch (error) {
      setCategories(['تنخواہیں', 'بجلی', 'گیس', 'پانی', 'کرایہ', 'تعمیرات', 'تعلیم', 'صحت', 'دیگر']);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchBanks();
    fetchOptions();
  }, []);

  const totalExpensesThisMonth = expenses.reduce((sum, e) => {
    const d = new Date((e as any).dateRaw || e.date);
    const now = new Date();
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      return sum + e.amount;
    }
    return sum;
  }, 0);

  const columns = useMemo(
    () => [
      { key: 'date', header: 'تاریخ', className: 'ltr-nums' },
      { key: 'category', header: 'زمرہ' },
      { key: 'description', header: 'تفصیل' },
      {
        key: 'amount',
        header: 'رقم',
        render: (item: Expense) => (
          <span className="ltr-nums font-semibold text-destructive">
            {formatCurrency(item.amount)}
          </span>
        ),
      },
      { key: 'paidFrom', header: 'ادائیگی' },
      {
        key: 'actions',
        header: 'کارروائی',
        render: (item: Expense) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                setViewingExpense(item);
                setIsViewOpen(true);
              }}
              title="تفصیلات"
            >
              <Eye className="w-4 h-4" />
            </Button>
            {canEdit && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleEdit(item)}
                  title="ترمیم"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive"
                  onClick={() => handleDelete(item)}
                  title="حذف کریں"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        ),
      },
    ],
    [canEdit]
  );

  const handleAddNew = () => {
    setEditingExpense(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      amount: '',
      paymentSource: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      date: formatDateForInput((expense as any).dateRaw || expense.date),
      category: expense.category,
      description: expense.description || '',
      amount: expense.amount.toString(),
      paymentSource: expense.paymentSource || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.date || !formData.category || !formData.amount || !formData.paymentSource) {
      toast.error('تاریخ، زمرہ، رقم اور ادائیگی کا ذریعہ ضروری ہیں');
      return;
    }
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('درست رقم درج کریں');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingExpense) {
        const response = await expensesApi.update(editingExpense._id, {
          date: formData.date,
          category: formData.category,
          description: formData.description || undefined,
          amount,
          paymentSource: formData.paymentSource,
        });
        if (response.success) {
          toast.success('خرچہ کامیابی سے اپڈیٹ ہو گیا');
          setIsDialogOpen(false);
          fetchExpenses(pagination.currentPage);
          fetchBanks();
        } else {
          toast.error(response.message || 'اپڈیٹ کرنے میں خرابی');
        }
      } else {
        const response = await expensesApi.create({
          date: formData.date,
          category: formData.category,
          description: formData.description || undefined,
          amount,
          paymentSource: formData.paymentSource,
        });
        if (response.success) {
          toast.success('نیا خرچہ کامیابی سے شامل ہو گیا');
          setIsDialogOpen(false);
          fetchExpenses(1);
          fetchBanks();
        } else {
          toast.error(response.message || 'شامل کرنے میں خرابی');
        }
      }
    } catch (error: any) {
      toast.error(error?.message || 'عمل میں خرابی');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (expense: Expense) => {
    if (!confirm(`کیا آپ واقعی اس خرچے کو حذف کرنا چاہتے ہیں؟`)) return;
    try {
      const response = await expensesApi.delete(expense._id);
      if (response.success) {
        toast.success('خرچہ کامیابی سے حذف ہو گیا');
        fetchExpenses(pagination.currentPage);
        fetchBanks();
      } else {
        toast.error(response.message || 'حذف کرنے میں خرابی');
      }
    } catch (error: any) {
      toast.error(error?.message || 'حذف کرنے میں خرابی');
    }
  };

  const tableData = expenses.map((e) => ({
    ...e,
    id: e.id || e._id,
    dateRaw: e.date,
  }));

  return (
    <MainLayout>
      <PageHeader
        title="اخراجات"
        description="تمام اخراجات کا انتظام"
        actions={
          canEdit && (
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="w-4 h-4" />
              نیا خرچہ شامل کریں
            </Button>
          )
        }
      />

      <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <p className="text-sm text-muted-foreground">اس ماہ کے کل اخراجات</p>
        <p className="text-2xl font-bold text-destructive ltr-nums">
          {formatCurrency(totalExpensesThisMonth)}
        </p>
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
          onPageChange={(page) => fetchExpenses(page)}
          emptyMessage="کوئی خرچہ موجود نہیں"
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'خرچہ میں ترمیم' : 'نیا خرچہ شامل کریں'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>تاریخ</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                  className="ltr-nums"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label>زمرہ</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((p) => ({ ...p, category: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="زمرہ منتخب کریں" />
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
            </div>
            <div className="grid gap-2">
              <Label>تفصیل</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="خرچے کی تفصیل"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>رقم</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.amount}
                  onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
                  className="ltr-nums"
                  placeholder="0"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label>ادائیگی کا ذریعہ (بینک)</Label>
                <Select
                  value={formData.paymentSource}
                  onValueChange={(value) => setFormData((p) => ({ ...p, paymentSource: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="بینک منتخب کریں" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={bank._id} value={bank._id}>
                        {bank.accountName} ({bank.bankName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              منسوخ
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingExpense ? 'اپڈیٹ ہو رہا ہے...' : 'شامل ہو رہا ہے...'}
                </>
              ) : editingExpense ? (
                'اپڈیٹ کریں'
              ) : (
                'شامل کریں'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>خرچہ کی تفصیلات</DialogTitle>
          </DialogHeader>
          {viewingExpense && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-muted-foreground">تاریخ</p>
                <p className="font-medium ltr-nums">
                  {formatDateDisplay((viewingExpense as any).dateRaw || viewingExpense.date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">زمرہ</p>
                <p className="font-medium">{viewingExpense.category}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تفصیل</p>
                <p className="font-medium">{viewingExpense.description || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">رقم</p>
                <p className="font-bold text-destructive ltr-nums text-lg">
                  {formatCurrency(viewingExpense.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ادائیگی کا ذریعہ</p>
                <p className="font-medium">{viewingExpense.paidFrom}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              بند کریں
            </Button>
            {canEdit && viewingExpense && (
              <Button
                onClick={() => {
                  setIsViewOpen(false);
                  handleEdit(viewingExpense);
                }}
              >
                ترمیم کریں
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Expenses;
