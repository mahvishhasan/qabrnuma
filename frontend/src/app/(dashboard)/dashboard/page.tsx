'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  DocumentTextIcon,
  MapIcon,
  ClipboardDocumentListIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalCases: number;
  pendingCases: number;
  totalGraves: number;
  availableGraves: number;
  activeReservations: number;
  totalCemeteries: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    pendingCases: 0,
    totalGraves: 0,
    availableGraves: 0,
    activeReservations: 0,
    totalCemeteries: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [casesRes, gravesRes, reservationsRes, cemeteriesRes] = await Promise.all([
          api.get('/death-cases?limit=1'),
          api.get('/graves?limit=1'),
          api.get('/reservations'),
          api.get('/cemeteries'),
        ]);

        setStats({
          totalCases: casesRes.data.pagination?.total || 0,
          pendingCases: casesRes.data.cases?.filter((c: { status: string }) => c.status === 'pending').length || 0,
          totalGraves: gravesRes.data.pagination?.total || 0,
          availableGraves: gravesRes.data.plots?.length || 0,
          activeReservations: reservationsRes.data.status_counts?.pending + reservationsRes.data.status_counts?.approved || 0,
          totalCemeteries: cemeteriesRes.data.cemeteries?.length || 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Death Cases',
      value: stats.totalCases,
      subtitle: `${stats.pendingCases} pending`,
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Available Plots',
      value: stats.availableGraves,
      subtitle: `of ${stats.totalGraves} total`,
      icon: MapIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Active Reservations',
      value: stats.activeReservations,
      subtitle: 'pending & approved',
      icon: ClipboardDocumentListIcon,
      color: 'bg-purple-500',
    },
    {
      title: 'Cemeteries',
      value: stats.totalCemeteries,
      subtitle: 'managed locations',
      icon: BuildingOffice2Icon,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div>
      <Header title="Dashboard" />

      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Welcome back, {user?.full_name}
          </h2>
          <p className="text-gray-500 mt-1">
            Here&apos;s what&apos;s happening with your cemetery management today.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat) => (
              <div key={stat.title} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-gray-400 text-sm mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <p className="text-gray-500 text-sm">No recent activity to display.</p>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/death-cases/new"
                className="p-4 border border-gray-200 rounded-lg hover:border-sage hover:bg-sage/5 transition-colors text-center"
              >
                <DocumentTextIcon className="w-8 h-8 text-sage mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">New Death Case</p>
              </a>
              <a
                href="/graves"
                className="p-4 border border-gray-200 rounded-lg hover:border-sage hover:bg-sage/5 transition-colors text-center"
              >
                <MapIcon className="w-8 h-8 text-sage mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Find Plot</p>
              </a>
              <a
                href="/reservations"
                className="p-4 border border-gray-200 rounded-lg hover:border-sage hover:bg-sage/5 transition-colors text-center"
              >
                <ClipboardDocumentListIcon className="w-8 h-8 text-sage mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">My Reservations</p>
              </a>
              <a
                href="/burial-records"
                className="p-4 border border-gray-200 rounded-lg hover:border-sage hover:bg-sage/5 transition-colors text-center"
              >
                <BuildingOffice2Icon className="w-8 h-8 text-sage mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Burial Records</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
