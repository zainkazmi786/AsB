import { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Edit, Trash2, Loader2, Building2, Phone, Mail, MapPin, User } from 'lucide-react';
import { departmentsApi, Department } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ur-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(value);
};

const Departments = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [departmentStats, setDepartmentStats] = useState<any>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  const canEdit = user?.role === 'admin' || user?.role === 'accountant';
  const canDelete = user?.role === 'admin';

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    managerName: '',
    managerPhone: '',
    description: '',
    isActive: true,
  });

  // Fetch departments
  const fetchDepartments = async (search = '', page = 1, isActive?: boolean) => {
    setIsLoading(true);
    try {
      const activeFilterValue = activeFilter === 'all' ? undefined : activeFilter === 'active';
      const response = await departmentsApi.getAll(search, page, 10, activeFilterValue);
      if (response.success && response.data) {
        setDepartments(response.data.departments.map(dept => ({
          ...dept,
          id: dept._id,
        })));
        setPagination(response.data.pagination);
      } else {
        toast.error(response.message || 'ذیلی ادارے حاصل کرنے میں خرابی');
      }
    } catch (error: any) {
      toast.error(error?.message || 'نیٹ ورک کی خرابی');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch department stats
  const fetchDepartmentStats = async (id: string) => {
    try {
      const response = await departmentsApi.getStats(id);
      if (response.success && response.data) {
        setDepartmentStats(response.data.stats);
      }
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
      setDepartmentStats(null);
    }
  };

  // Initial load and search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDepartments(searchTerm, 1);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, activeFilter]);

  // Load initial data
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Table columns
  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'نام',
      render: (item: Department) => (
        <div className="font-medium">{item.name}</div>
      ),
    },
    {
      key: 'code',
      header: 'کوڈ',
      render: (item: Department) => (
        <div className="text-muted-foreground">{item.code || '-'}</div>
      ),
    },
    {
      key: 'phone',
      header: 'فون',
      render: (item: Department) => (
        <div>{item.phone || '-'}</div>
      ),
    },
    {
      key: 'managerName',
      header: 'منیجر',
      render: (item: Department) => (
        <div>{item.managerName || '-'}</div>
      ),
    },
    {
      key: 'isActive',
      header: 'حالت',
      render: (item: Department) => (
        <Badge variant={item.isActive ? 'default' : 'secondary'}>
          {item.isActive ? 'فعال' : 'غیر فعال'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'اعمال',
      render: (item: Department) => {
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetails(item)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(item)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(item)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        );
      },
    },
  ], [canEdit, canDelete]);

  const handleAddNew = () => {
    setEditingDepartment(null);
    setFormData({
      name: '',
      code: '',
      address: '',
      phone: '',
      email: '',
      managerName: '',
      managerPhone: '',
      description: '',
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code || '',
      address: department.address || '',
      phone: department.phone || '',
      email: department.email || '',
      managerName: department.managerName || '',
      managerPhone: department.managerPhone || '',
      description: department.description || '',
      isActive: department.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleViewDetails = async (department: Department) => {
    setSelectedDepartment(department);
    setIsDetailOpen(true);
    await fetchDepartmentStats(department.id);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('نام ضروری ہے');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingDepartment) {
        const response = await departmentsApi.update(editingDepartment.id, formData);
        if (response.success) {
          toast.success('ذیلی ادارہ کامیابی سے اپڈیٹ ہو گیا');
          setIsDialogOpen(false);
          fetchDepartments(searchTerm, pagination.currentPage);
        } else {
          toast.error(response.message || 'اپڈیٹ کرنے میں خرابی');
        }
      } else {
        const response = await departmentsApi.create(formData);
        if (response.success) {
          toast.success('ذیلی ادارہ کامیابی سے شامل ہو گیا');
          setIsDialogOpen(false);
          fetchDepartments(searchTerm, pagination.currentPage);
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

  const handleDelete = async (department: Department) => {
    if (!confirm(`کیا آپ واقعی "${department.name}" کو حذف کرنا چاہتے ہیں؟`)) {
      return;
    }

    try {
      const response = await departmentsApi.delete(department.id);
      if (response.success) {
        toast.success('ذیلی ادارہ کامیابی سے حذف ہو گیا');
        fetchDepartments(searchTerm, pagination.currentPage);
      } else {
        toast.error(response.message || 'حذف کرنے میں خرابی');
      }
    } catch (error: any) {
      toast.error(error?.message || 'حذف کرنے میں خرابی');
    }
  };

  const handlePageChange = (page: number) => {
    fetchDepartments(searchTerm, page);
  };

  return (
    <MainLayout>
      <PageHeader
        title="ذیلی ادارے"
        description="ذیلی اداروں کا انتظام"
      />

      <div className="space-y-4">
        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-2 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="تلاش کریں..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">تمام</SelectItem>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="inactive">غیر فعال</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {canEdit && (
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              نیا ادارہ
            </Button>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={departments}
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? 'ذیلی ادارہ ترمیم کریں' : 'نیا ذیلی ادارہ'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">نام *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ادارے کا نام"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">کوڈ</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="DEPT-001 (خودکار)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">پتہ</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="مکمل پتہ"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">فون نمبر</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="03XX-XXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">ای میل</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="managerName">منیجر کا نام</Label>
                <Input
                  id="managerName"
                  value={formData.managerName}
                  onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                  placeholder="منیجر کا نام"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="managerPhone">منیجر کا فون</Label>
                <Input
                  id="managerPhone"
                  value={formData.managerPhone}
                  onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                  placeholder="03XX-XXXXXXX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">تفصیل</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="اضافی معلومات"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="isActive">حالت</Label>
              <Select
                value={formData.isActive ? 'active' : 'inactive'}
                onValueChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="inactive">غیر فعال</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              منسوخ
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingDepartment ? 'اپڈیٹ کریں' : 'شامل کریں'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDepartment?.name}</DialogTitle>
          </DialogHeader>
          {selectedDepartment && (
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">کوڈ</Label>
                  <p className="font-medium">{selectedDepartment.code || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">حالت</Label>
                  <Badge variant={selectedDepartment.isActive ? 'default' : 'secondary'}>
                    {selectedDepartment.isActive ? 'فعال' : 'غیر فعال'}
                  </Badge>
                </div>
              </div>

              {selectedDepartment.address && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    پتہ
                  </Label>
                  <p>{selectedDepartment.address}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedDepartment.phone && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      فون نمبر
                    </Label>
                    <p>{selectedDepartment.phone}</p>
                  </div>
                )}
                {selectedDepartment.email && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      ای میل
                    </Label>
                    <p>{selectedDepartment.email}</p>
                  </div>
                )}
              </div>

              {(selectedDepartment.managerName || selectedDepartment.managerPhone) && (
                <div className="space-y-2 border-t pt-4">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    منیجر کی معلومات
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedDepartment.managerName && (
                      <p><strong>نام:</strong> {selectedDepartment.managerName}</p>
                    )}
                    {selectedDepartment.managerPhone && (
                      <p><strong>فون:</strong> {selectedDepartment.managerPhone}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedDepartment.description && (
                <div className="space-y-1 border-t pt-4">
                  <Label className="text-muted-foreground">تفصیل</Label>
                  <p className="text-sm">{selectedDepartment.description}</p>
                </div>
              )}

              {/* Statistics */}
              {departmentStats && (
                <div className="space-y-4 border-t pt-4">
                  <Label className="text-lg font-semibold">اعداد و شمار</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1 p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">کل عطیات</p>
                      <p className="text-2xl font-bold">{departmentStats.donationsCount}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(departmentStats.donationsTotal)}
                      </p>
                    </div>
                    <div className="space-y-1 p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">کل اخراجات</p>
                      <p className="text-2xl font-bold">{departmentStats.expensesCount}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(departmentStats.expensesTotal)}
                      </p>
                    </div>
                    <div className="space-y-1 p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">عطیہ دہندگان</p>
                      <p className="text-2xl font-bold">{departmentStats.donorsCount}</p>
                    </div>
                    <div className="space-y-1 p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">خالص رقم</p>
                      <p className={`text-2xl font-bold ${departmentStats.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(departmentStats.netAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
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

export default Departments;
