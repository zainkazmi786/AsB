import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { 
  HandHeart, 
  Users, 
  Wallet, 
  TrendingUp,
  Plus,
  Receipt,
  FileText
} from 'lucide-react';
import { 
  mockDashboardStats, 
  monthlyDonationData, 
  categoryDistribution 
} from '@/data/mockData';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ur-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const Dashboard = () => {
  const navigate = useNavigate();
  const stats = mockDashboardStats;

  return (
    <MainLayout>
      <PageHeader 
        title="ڈیش بورڈ"
        description="خیراتی ادارہ کا مالیاتی جائزہ"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="اس ماہ کے عطیات"
          value={formatCurrency(stats.totalDonationsThisMonth)}
          icon={<HandHeart className="w-6 h-6" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="اس ماہ کے اخراجات"
          value={formatCurrency(stats.totalExpensesThisMonth)}
          icon={<Receipt className="w-6 h-6" />}
          trend={{ value: 5, isPositive: false }}
        />
        <StatCard
          title="بینک بیلنس"
          value={formatCurrency(stats.bankBalance)}
          icon={<Wallet className="w-6 h-6" />}
          description="تمام اکاؤنٹس کا مجموعہ"
        />
        <StatCard
          title="فعال عطیہ دہندگان"
          value={stats.activeDonors}
          icon={<Users className="w-6 h-6" />}
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Donation Trend Chart */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              عطیات کا رجحان
            </h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyDonationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  tickFormatter={(value) => `${value / 1000}k`}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  dataKey="month" 
                  type="category" 
                  width={80}
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontFamily: 'Noto Nastaliq Urdu' }}
                  tick={{ textAnchor: 'end' }}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'رقم']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontFamily: 'Noto Nastaliq Urdu'
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="hsl(var(--primary))" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold mb-6">زمرہ وار تقسیم</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'حصہ']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontFamily: 'Noto Nastaliq Urdu'
                  }}
                />
                <Legend 
                  formatter={(value) => <span style={{ fontFamily: 'Noto Nastaliq Urdu' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">فوری کارروائیاں</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/donations')} className="gap-2">
            <Plus className="w-4 h-4" />
            نیا عطیہ شامل کریں
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/finance/expenses')}
            className="gap-2"
          >
            <Receipt className="w-4 h-4" />
            اخراجات شامل کریں
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/reports')}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            رپورٹ بنائیں
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
