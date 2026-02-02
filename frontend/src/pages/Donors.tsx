import { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Eye, Edit, Upload, Download, Phone, Mail, Loader2, Trash2 } from 'lucide-react';
import { donorsApi, Donor as ApiDonor } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// Type compatibility - map API Donor to local Donor type
interface Donor extends Omit<ApiDonor, '_id'> {
  id: string;
}
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ur-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDate = (date: string | null) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ur-PK');
};

const Donors = () => {
  const { user } = useAuth();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [donorDonations, setDonorDonations] = useState<any[]>([]);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  // Fetch donors
  const fetchDonors = async (search = '', page = 1) => {
    setIsLoading(true);
    try {
      const response = await donorsApi.getAll(search, page, 10);
      if (response.success && response.data) {
        // Map _id to id for compatibility
        const mappedDonors = response.data.donors.map(donor => ({
          ...donor,
          id: donor._id,
          lastDonationDate: donor.lastDonationDate ? formatDate(donor.lastDonationDate) : '-',
        }));
        setDonors(mappedDonors);
        setPagination(response.data.pagination);
      } else {
        toast.error(response.message || 'عطیہ دہندگان حاصل کرنے میں خرابی');
      }
    } catch (error: any) {
      toast.error(error?.message || 'نیٹ ورک کی خرابی');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDonors(searchTerm, 1);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Load initial data
  useEffect(() => {
    fetchDonors();
  }, []);

  const columns = useMemo(() => [
    { key: 'name', header: 'نام' },
    { 
      key: 'phone', 
      header: 'فون نمبر',
      render: (item: Donor) => (
        <span className="ltr-nums flex items-center gap-1">
          <Phone className="w-3 h-3" />
          {item.phone}
        </span>
      )
    },
    { 
      key: 'totalDonations', 
      header: 'کل عطیات',
      render: (item: Donor) => (
        <span className="ltr-nums font-semibold text-primary">
          {formatCurrency(item.totalDonations)}
        </span>
      )
    },
    { 
      key: 'lastDonationDate', 
      header: 'آخری عطیہ',
      className: 'ltr-nums'
    },
    {
      key: 'actions',
      header: 'کارروائی',
      render: (item: Donor) => (
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => handleViewDetail(item)}
            title="تفصیلات دیکھیں"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => handleEdit(item)}
            title="ترمیم کریں"
          >
            <Edit className="w-4 h-4" />
          </Button>
          {user?.role === 'admin' && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleDelete(item)}
              title="حذف کریں"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      )
    }
  ], [user]);

  const handleViewDetail = async (donor: Donor) => {
    setSelectedDonor(donor);
    setIsDetailOpen(true);
    
    // Fetch donation history
    try {
      const response = await donorsApi.getDonations(donor._id);
      if (response.success && response.data) {
        setDonorDonations(response.data.donations || []);
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
      setDonorDonations([]);
    }
  };

  const handleEdit = (donor: Donor) => {
    setEditingDonor(donor);
    setFormData({
      name: donor.name,
      phone: donor.phone,
      email: donor.email || '',
      address: donor.address || '',
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingDonor(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) {
      toast.error('نام اور فون نمبر ضروری ہیں');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingDonor) {
        const response = await donorsApi.update(editingDonor._id, {
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          address: formData.address || undefined,
        });

        if (response.success) {
          toast.success('عطیہ دہندہ کامیابی سے اپڈیٹ ہو گیا');
          setIsDialogOpen(false);
          fetchDonors(searchTerm, pagination.currentPage);
        } else {
          toast.error(response.message || 'اپڈیٹ کرنے میں خرابی');
        }
      } else {
        const response = await donorsApi.create({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          address: formData.address || undefined,
        });

        if (response.success) {
          toast.success('نیا عطیہ دہندہ کامیابی سے شامل ہو گیا');
          setIsDialogOpen(false);
          fetchDonors(searchTerm, 1);
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

  const handleDelete = async (donor: Donor) => {
    if (!confirm(`کیا آپ واقعی ${donor.name} کو حذف کرنا چاہتے ہیں؟`)) {
      return;
    }

    try {
      const response = await donorsApi.delete(donor._id);
      if (response.success) {
        toast.success('عطیہ دہندہ کامیابی سے حذف ہو گیا');
        fetchDonors(searchTerm, pagination.currentPage);
      } else {
        toast.error(response.message || 'حذف کرنے میں خرابی');
      }
    } catch (error: any) {
      toast.error(error?.message || 'حذف کرنے میں خرابی');
    }
  };

  return (
    <MainLayout>
      <PageHeader
        title="عطیہ دہندگان"
        description="تمام عطیہ دہندگان کا انتظام"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" disabled>
              <Upload className="w-4 h-4" />
              درآمد
            </Button>
            <Button variant="outline" className="gap-2" disabled>
              <Download className="w-4 h-4" />
              برآمد
            </Button>
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="w-4 h-4" />
              نیا عطیہ دہندہ
            </Button>
          </div>
        }
      />

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="نام یا فون نمبر تلاش کریں..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Data Table */}
          <DataTable
            columns={columns}
            data={donors}
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={(page) => fetchDonors(searchTerm, page)}
          />
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingDonor ? 'عطیہ دہندہ میں ترمیم' : 'نیا عطیہ دہندہ شامل کریں'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>نام *</Label>
              <Input
                placeholder="مکمل نام"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <Label>فون نمبر *</Label>
              <Input
                placeholder="0300-0000000"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="ltr-nums"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <Label>ای میل (اختیاری)</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="ltr-nums"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <Label>پتہ (اختیاری)</Label>
              <Input
                placeholder="مکمل پتہ"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
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
                  {editingDonor ? 'اپڈیٹ ہو رہا ہے...' : 'شامل ہو رہا ہے...'}
                </>
              ) : (
                editingDonor ? 'اپڈیٹ کریں' : 'شامل کریں'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>عطیہ دہندہ کی تفصیلات</DialogTitle>
          </DialogHeader>

          {selectedDonor && (
            <div className="space-y-6 py-4">
              {/* Donor Info Card */}
              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <h3 className="text-xl font-semibold mb-3">{selectedDonor.name}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="ltr-nums">{selectedDonor.phone}</span>
                  </div>
                  {selectedDonor.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="ltr-nums">{selectedDonor.email}</span>
                    </div>
                  )}
                  {selectedDonor.address && (
                    <div className="flex items-center gap-2 col-span-2">
                      <span className="text-muted-foreground">پتہ:</span>
                      <span>{selectedDonor.address}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-border flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">کل عطیات</p>
                    <p className="text-lg font-bold text-primary ltr-nums">
                      {formatCurrency(selectedDonor.totalDonations)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">آخری عطیہ</p>
                    <p className="font-medium ltr-nums">
                      {selectedDonor.lastDonationDate || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Donation History */}
              <div>
                <h4 className="font-semibold mb-3">عطیات کی تاریخ</h4>
                {donorDonations.length > 0 ? (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-right p-3">تاریخ</th>
                          <th className="text-right p-3">قسم</th>
                          <th className="text-right p-3">رقم</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donorDonations.map((donation, index) => (
                          <tr key={index} className="border-t border-border">
                            <td className="p-3 ltr-nums">
                              {formatDate(donation.date)}
                            </td>
                            <td className="p-3">{donation.category}</td>
                            <td className="p-3 ltr-nums font-semibold text-primary">
                              {formatCurrency(donation.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    کوئی عطیات موجود نہیں
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              بند کریں
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Donors;
