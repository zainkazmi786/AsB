import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Building2, CreditCard, ArrowUpDown, Plus, Edit, Loader2, Trash2 } from 'lucide-react';
import { banksApi, Bank } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ur-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(value);
};

const Banks = () => {
  const { user } = useAuth();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
  });

  const canEdit = user?.role === 'admin' || user?.role === 'accountant';

  const fetchBanks = async () => {
    setIsLoading(true);
    try {
      const response = await banksApi.getAll();
      if (response.success && response.data) {
        setBanks(response.data.banks.map((b) => ({ ...b, id: b._id })));
      } else {
        toast.error(response.message || 'بینک اکاؤنٹس حاصل کرنے میں خرابی');
      }
    } catch (error: any) {
      toast.error(error?.message || 'نیٹ ورک کی خرابی');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const totalBalance = banks.reduce((sum, acc) => sum + (acc.balance ?? acc.currentBalance ?? 0), 0);

  const handleAddNew = () => {
    setEditingBank(null);
    setFormData({ bankName: '', accountName: '', accountNumber: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setFormData({
      bankName: bank.bankName,
      accountName: bank.accountName || bank.name || '',
      accountNumber: bank.accountNumber,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.bankName || !formData.accountName || !formData.accountNumber) {
      toast.error('تمام فیلڈز پُر کریں');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingBank) {
        const response = await banksApi.update(editingBank._id, formData);
        if (response.success) {
          toast.success('بینک اکاؤنٹ کامیابی سے اپڈیٹ ہو گیا');
          setIsDialogOpen(false);
          fetchBanks();
        } else {
          toast.error(response.message || 'اپڈیٹ کرنے میں خرابی');
        }
      } else {
        const response = await banksApi.create(formData);
        if (response.success) {
          toast.success('بینک اکاؤنٹ کامیابی سے شامل ہو گیا');
          setIsDialogOpen(false);
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

  const handleDisable = async (bank: Bank) => {
    const balance = bank.balance ?? bank.currentBalance ?? 0;
    if (balance !== 0) {
      toast.error('بیلنس صفر ہونے پر ہی اکاؤنٹ غیر فعال کیا جا سکتا ہے');
      return;
    }
    if (!confirm(`کیا آپ واقعی ${bank.accountName || bank.name} کو غیر فعال کرنا چاہتے ہیں؟`)) return;
    try {
      const response = await banksApi.delete(bank._id);
      if (response.success) {
        toast.success('بینک اکاؤنٹ غیر فعال ہو گیا');
        fetchBanks();
      } else {
        toast.error(response.message || 'غیر فعال کرنے میں خرابی');
      }
    } catch (error: any) {
      toast.error(error?.message || 'غیر فعال کرنے میں خرابی');
    }
  };

  const handleViewTransactions = async (bankId: string) => {
    setSelectedBankId(bankId);
    setIsTransactionsOpen(true);
    try {
      const response = await banksApi.getTransactions(bankId);
      if (response.success && response.data) {
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      toast.error('لین دین حاصل کرنے میں خرابی');
      setTransactions([]);
    }
  };

  const selectedBank = banks.find((b) => b._id === selectedBankId);

  return (
    <MainLayout>
      <PageHeader
        title="بینک اکاؤنٹس"
        description="تمام بینک اکاؤنٹس کا جائزہ"
        actions={
          canEdit && (
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="w-4 h-4" />
              نیا اکاؤنٹ
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="mb-6">
            <StatCard
              title="کل بیلنس"
              value={formatCurrency(totalBalance)}
              icon={<Building2 className="w-6 h-6" />}
              description="تمام اکاؤنٹس کا مجموعہ"
              className="max-w-md"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banks.map((account) => (
              <div
                key={account._id}
                className="bg-card rounded-lg border border-border p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {account.bankName}
                  </span>
                </div>

                <h3 className="font-semibold text-lg mb-1">
                  {account.accountName || account.name}
                </h3>
                <p className="text-sm text-muted-foreground ltr-nums mb-4">
                  {account.accountNumber}
                </p>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">موجودہ بیلنس</p>
                  <p className="text-xl font-bold text-primary ltr-nums">
                    {formatCurrency(account.balance ?? account.currentBalance ?? 0)}
                  </p>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => handleViewTransactions(account._id)}
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    لین دین دیکھیں
                  </Button>
                  {canEdit && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(account)}
                        title="ترمیم"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDisable(account)}
                        title="غیر فعال کریں"
                        disabled={(account.balance ?? account.currentBalance ?? 0) !== 0}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {banks.length === 0 && (
            <p className="text-center text-muted-foreground py-12">کوئی بینک اکاؤنٹ موجود نہیں</p>
          )}
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingBank ? 'بینک اکاؤنٹ میں ترمیم' : 'نیا بینک اکاؤنٹ شامل کریں'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>بینک کا نام</Label>
              <Input
                value={formData.bankName}
                onChange={(e) => setFormData((p) => ({ ...p, bankName: e.target.value }))}
                placeholder="مثلاً حبیب بینک"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label>اکاؤنٹ کا نام</Label>
              <Input
                value={formData.accountName}
                onChange={(e) => setFormData((p) => ({ ...p, accountName: e.target.value }))}
                placeholder="مثلاً مین اکاؤنٹ"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label>اکاؤنٹ نمبر</Label>
              <Input
                value={formData.accountNumber}
                onChange={(e) => setFormData((p) => ({ ...p, accountNumber: e.target.value }))}
                placeholder="مثلاً 1234567890"
                className="ltr-nums"
                disabled={isSubmitting}
              />
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
                  {editingBank ? 'اپڈیٹ ہو رہا ہے...' : 'شامل ہو رہا ہے...'}
                </>
              ) : editingBank ? (
                'اپڈیٹ کریں'
              ) : (
                'شامل کریں'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTransactionsOpen} onOpenChange={setIsTransactionsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              لین دین {selectedBank ? `- ${selectedBank.accountName || selectedBank.name}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg overflow-hidden">
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">کوئی لین دین موجود نہیں</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-right p-3">تاریخ</th>
                    <th className="text-right p-3">قسم</th>
                    <th className="text-right p-3">ذریعہ</th>
                    <th className="text-right p-3">رقم</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx: any) => (
                    <tr key={tx._id} className="border-t border-border">
                      <td className="p-3 ltr-nums">
                        {new Date(tx.date).toLocaleDateString('ur-PK')}
                      </td>
                      <td className="p-3">{tx.type === 'credit' ? 'جمع' : 'منہا'}</td>
                      <td className="p-3">{tx.source === 'donation' ? 'عطیہ' : 'خرچہ'}</td>
                      <td
                        className={`p-3 ltr-nums font-semibold ${
                          tx.type === 'credit' ? 'text-primary' : 'text-destructive'
                        }`}
                      >
                        {tx.type === 'credit' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Banks;
