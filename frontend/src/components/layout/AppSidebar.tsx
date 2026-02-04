import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  HandHeart, 
  Users, 
  Wallet, 
  FileText, 
  Settings, 
  LogOut,
  Building2,
  Receipt,
  BadgeDollarSign,
  PiggyBank,
  ChevronDown,
  Network
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { label: 'ڈیش بورڈ', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'عطیات', path: '/donations', icon: <HandHeart className="w-5 h-5" /> },
  { label: 'عطیہ دہندگان', path: '/donors', icon: <Users className="w-5 h-5" /> },
  { label: 'ذیلی ادارے', path: '/departments', icon: <Network className="w-5 h-5" /> },
  { 
    label: 'مالیاتی انتظام', 
    path: '/finance',
    icon: <Wallet className="w-5 h-5" />,
    children: [
      { label: 'بینک اکاؤنٹس', path: '/finance/banks', icon: <Building2 className="w-4 h-4" /> },
      { label: 'اخراجات', path: '/finance/expenses', icon: <Receipt className="w-4 h-4" /> },
      { label: 'تنخواہیں', path: '/finance/payroll', icon: <BadgeDollarSign className="w-4 h-4" /> },
      { label: 'بجٹ', path: '/finance/budget', icon: <PiggyBank className="w-4 h-4" /> },
    ]
  },
  { label: 'رپورٹس', path: '/reports', icon: <FileText className="w-5 h-5" /> },
  { label: 'ترتیبات', path: '/settings', icon: <Settings className="w-5 h-5" /> },
];

export const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [financeOpen, setFinanceOpen] = useState(
    location.pathname.startsWith('/finance')
  );

  const isActive = (path: string) => {
    if (path === '/finance') {
      return location.pathname.startsWith('/finance');
    }
    return location.pathname === path;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="fixed right-0 top-0 h-screen w-64 border-l border-sidebar-border flex flex-col z-50" style={{ backgroundColor: 'hsl(220 30% 18%)' }}>
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground text-center">
          نظام عطیات
        </h1>
        <p className="text-sm text-sidebar-foreground/60 text-center mt-1">
          خیراتی ادارہ
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              {item.children ? (
                <Collapsible open={financeOpen} onOpenChange={setFinanceOpen}>
                  <CollapsibleTrigger className="w-full">
                    <div
                      className={cn(
                        'sidebar-item justify-between',
                        isActive(item.path) && 'bg-sidebar-accent text-sidebar-accent-foreground'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      <ChevronDown 
                        className={cn(
                          'w-4 h-4 transition-transform',
                          financeOpen && 'rotate-180'
                        )} 
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ul className="mt-1 mr-4 space-y-1 border-r border-sidebar-border/50 pr-2">
                      {item.children.map((child) => (
                        <li key={child.path}>
                          <button
                            onClick={() => handleNavigation(child.path)}
                            className={cn(
                              'sidebar-item w-full text-sm py-2',
                              location.pathname === child.path && 'sidebar-item-active'
                            )}
                          >
                            {child.icon}
                            <span>{child.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    'sidebar-item w-full',
                    isActive(item.path) && 'sidebar-item-active'
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="mb-3 px-4 py-2 bg-sidebar-accent/50 rounded-lg">
          <p className="text-sm text-sidebar-foreground/70">خوش آمدید</p>
          <p className="font-semibold text-sidebar-foreground">{user?.name}</p>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-item w-full text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5" />
          <span>لاگ آؤٹ</span>
        </button>
      </div>
    </aside>
  );
};
