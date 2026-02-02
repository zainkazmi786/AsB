import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Download, Calendar } from 'lucide-react';
import { useState } from 'react';

const reportTypes = [
  { value: 'donations', label: 'عطیات کی رپورٹ' },
  { value: 'expenses', label: 'اخراجات کی رپورٹ' },
  { value: 'donors', label: 'عطیہ دہندگان کی رپورٹ' },
  { value: 'monthly', label: 'ماہانہ خلاصہ' },
  { value: 'yearly', label: 'سالانہ رپورٹ' },
];

const Reports = () => {
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState('thisMonth');

  return (
    <MainLayout>
      <PageHeader
        title="رپورٹس"
        description="مختلف رپورٹس بنائیں اور ڈاؤنلوڈ کریں"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg border border-border p-6 space-y-5">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              رپورٹ کی ترتیبات
            </h3>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">رپورٹ کی قسم</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="قسم منتخب کریں" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">مدت</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisMonth">اس ماہ</SelectItem>
                  <SelectItem value="lastMonth">پچھلا مہینہ</SelectItem>
                  <SelectItem value="thisYear">اس سال</SelectItem>
                  <SelectItem value="custom">مخصوص تاریخ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 space-y-3">
              <Button className="w-full gap-2" disabled={!reportType}>
                <FileText className="w-4 h-4" />
                رپورٹ بنائیں
              </Button>
              <Button variant="outline" className="w-full gap-2" disabled={!reportType}>
                <Download className="w-4 h-4" />
                PDF ڈاؤنلوڈ کریں
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg border border-border min-h-96 flex flex-col items-center justify-center p-8">
            {!reportType ? (
              <div className="text-center text-muted-foreground">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">رپورٹ کی قسم منتخب کریں</p>
                <p className="text-sm">بائیں طرف سے اختیارات منتخب کر کے رپورٹ بنائیں</p>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">رپورٹ بنانے کے لیے بٹن دبائیں</p>
                <p className="text-sm">منتخب کردہ: {reportTypes.find(r => r.value === reportType)?.label}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Reports;
