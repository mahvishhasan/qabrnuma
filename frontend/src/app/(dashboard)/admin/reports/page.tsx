'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  MapIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface ReportSummary {
  deathsThisMonth: number;
  activeReservations: number;
  occupiedPlots: number;
  availablePlots: number;
  servicesCompleted: number;
  deathCasesPerMonth: { month: string; count: number }[];
}

export default function AdminReportsPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      router.push('/unauthorized');
      return;
    }
    fetchSummary();
  }, [currentUser]);

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/reports/summary');
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to fetch report summary:', err);
      setError('Failed to load report data');
      setSummary({
        deathsThisMonth: 0,
        activeReservations: 0,
        occupiedPlots: 0,
        availablePlots: 0,
        servicesCompleted: 0,
        deathCasesPerMonth: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!summary) return;

    const headers = ['Metric', 'Value'];
    const rows = [
      ['Deaths This Month', summary.deathsThisMonth],
      ['Active Reservations', summary.activeReservations],
      ['Occupied Plots', summary.occupiedPlots],
      ['Available Plots', summary.availablePlots],
      ['Services Completed', summary.servicesCompleted],
      [''],
      ['Monthly Death Cases'],
      ['Month', 'Count'],
      ...summary.deathCasesPerMonth.map(d => [d.month, d.count]),
    ];

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qabrnuma-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMaxCount = () => {
    if (!summary?.deathCasesPerMonth.length) return 1;
    return Math.max(...summary.deathCasesPerMonth.map(d => d.count), 1);
  };

  if (currentUser?.role !== 'admin') return null;

  return (
    <div>
      <Header title="Reports" />

      <div className="p-6 lg:p-8">
        <div className="flex justify-end mb-6">
          <button onClick={handleDownloadCSV} className="btn-primary">
            <ArrowDownTrayIcon className="w-4 h-4" />
            Download Report
          </button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <DocumentTextIcon className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Deaths This Month</p>
                    <p className="text-2xl font-bold text-gray-900">{summary?.deathsThisMonth || 0}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Reservations</p>
                    <p className="text-2xl font-bold text-gray-900">{summary?.activeReservations || 0}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <MapIcon className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Plots</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary?.occupiedPlots || 0} / {(summary?.occupiedPlots || 0) + (summary?.availablePlots || 0)}
                    </p>
                    <p className="text-xs text-gray-400">Occupied / Total</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CalendarDaysIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Services Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{summary?.servicesCompleted || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Death Cases per Month (Last 6 Months)</h3>

              {summary?.deathCasesPerMonth && summary.deathCasesPerMonth.length > 0 ? (
                <div className="flex items-end gap-4 h-48">
                  {summary.deathCasesPerMonth.map((data, idx) => {
                    const heightPercent = (data.count / getMaxCount()) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <span className="text-sm font-medium text-gray-700 mb-1">{data.count}</span>
                        <div
                          className="w-full bg-[#2D6A4F] rounded-t transition-all"
                          style={{ height: `${Math.max(heightPercent, 5)}%` }}
                        />
                        <span className="text-xs text-gray-500 mt-2">{data.month}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No data available for the chart
                </div>
              )}
            </div>
          </>
        )}

        {error && (
          <div className="card bg-yellow-50 border-yellow-200">
            <p className="text-yellow-700 text-sm">{error}. Showing placeholder data.</p>
          </div>
        )}
      </div>
    </div>
  );
}
