import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Building2, 
  Shield, 
  Plus,
  Edit,
  Key
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const mockUsers = [
  { id: '1', name: 'منتظم', email: 'admin@example.com', role: 'admin' },
  { id: '2', name: 'اکاؤنٹنٹ', email: 'accountant@example.com', role: 'accountant' },
  { id: '3', name: 'ناظر', email: 'viewer@example.com', role: 'viewer' },
];

const roleLabels: Record<string, string> = {
  admin: 'منتظم',
  accountant: 'اکاؤنٹنٹ',
  viewer: 'ناظر',
};

const roleColors: Record<string, string> = {
  admin: 'bg-primary text-primary-foreground',
  accountant: 'bg-accent text-accent-foreground',
  viewer: 'bg-muted text-muted-foreground',
};

const Settings = () => {
  return (
    <MainLayout>
      <PageHeader
        title="ترتیبات"
        description="سسٹم اور صارفین کی ترتیبات"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Management */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              صارفین کا انتظام
            </h3>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              نیا صارف
            </Button>
          </div>

          <div className="space-y-3">
            {mockUsers.map((user) => (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground ltr-nums">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={roleColors[user.role]}>
                    {roleLabels[user.role]}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Key className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Organization Settings */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-primary" />
            ادارے کی معلومات
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ادارے کا نام</Label>
              <Input defaultValue="خیراتی ادارہ" />
            </div>
            <div className="space-y-2">
              <Label>پتہ</Label>
              <Input defaultValue="لاہور، پاکستان" />
            </div>
            <div className="space-y-2">
              <Label>فون نمبر</Label>
              <Input defaultValue="042-1234567" className="ltr-nums" />
            </div>
            <div className="space-y-2">
              <Label>ای میل</Label>
              <Input defaultValue="info@charity.org" className="ltr-nums" />
            </div>
            <Button className="mt-4">تبدیلیاں محفوظ کریں</Button>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            سسٹم ترتیبات
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>رسید نمبر فارمیٹ</Label>
              <Input defaultValue="DON-{YEAR}-{NUMBER}" className="ltr-nums font-mono" />
              <p className="text-xs text-muted-foreground">
                پیش نظارہ: DON-2026-001
              </p>
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-2">بیک اپ کی صورتحال</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span className="text-sm">آخری بیک اپ: آج صبح ۶:۰۰ بجے</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
