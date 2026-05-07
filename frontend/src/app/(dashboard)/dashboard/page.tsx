'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import {
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  PlusIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  ArrowRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface DashboardStats {
  deathCases: number;
  reservations: number;
  scheduledServices: number;
}

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  icon: 'case' | 'reservation' | 'service';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    deathCases: 0,
    reservations: 0,
    scheduledServices: 0,
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [casesRes, reservationsRes] = await Promise.all([
          api.get('/death-cases/my-cases?limit=5'),
          api.get('/reservations'),
        ]);

        setStats({
          deathCases: casesRes.data.pagination?.total || 0,
          reservations: (reservationsRes.data.status_counts?.pending || 0) + (reservationsRes.data.status_counts?.approved || 0),
          scheduledServices: 0,
        });

        // Build activity list from recent cases
        const recentActivities: ActivityItem[] = [];
        if (casesRes.data.cases) {
          casesRes.data.cases.slice(0, 5).forEach((c: { case_id: number; registration_number: string; deceased_name: string; status: string; created_at: string }) => {
            recentActivities.push({
              id: `case-${c.case_id}`,
              title: `Case ${c.registration_number}`,
              subtitle: `${c.deceased_name} - ${c.status}`,
              time: c.created_at,
              icon: 'case',
            });
          });
        }
        setActivities(recentActivities);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      title: 'Death Cases',
      value: stats.deathCases,
      badge: 'Active',
      badgeColor: 'bg-[#D1FAE5] text-green-700',
      icon: DocumentTextIcon,
      iconBg: 'bg-blue-500',
    },
    {
      title: 'Reservations',
      value: stats.reservations,
      badge: 'Reserved',
      badgeColor: 'bg-[#FEF3C7] text-amber-700',
      icon: ClipboardDocumentListIcon,
      iconBg: 'bg-purple-500',
    },
    {
      title: 'Scheduled Services',
      value: stats.scheduledServices,
      badge: 'Pending',
      badgeColor: 'bg-[#DBEAFE] text-blue-700',
      icon: CalendarDaysIcon,
      iconBg: 'bg-orange-500',
    },
  ];

  const quickActions = [
    {
      title: 'Create Death Case',
      description: 'Register a new death case',
      href: '/death-cases/create',
      icon: PlusIcon,
    },
    {
      title: 'Reserve Plot',
      description: 'Reserve a burial plot',
      href: '/grave-plots',
      icon: MapPinIcon,
    },
    {
      title: 'Request Services',
      description: 'Schedule funeral services',
      href: '/services',
      icon: WrenchScrewdriverIcon,
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'case':
        return DocumentTextIcon;
      case 'reservation':
        return ClipboardDocumentListIcon;
      case 'service':
        return CalendarDaysIcon;
      default:
        return ClockIcon;
    }
  };

  return (
    <div>
      <Header title="Dashboard" />

      <div className="p-6 lg:p-8">
        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Assalamu Alaikum, {user?.full_name}
          </h2>
          <p className="text-gray-500 mt-1">
            Manage your family records and cemetery services with ease.
          </p>
        </div>

        {/* Stat Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {statCards.map((stat) => (
              <div key={stat.title} className="card relative">
                <span className={`badge ${stat.badgeColor} absolute top-4 right-4`}>
                  {stat.badge}
                </span>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 font-medium">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-sm text-gray-500 mt-1">Total active</p>
                  </div>
                  <div className={`${stat.iconBg} p-3 rounded-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Quick Actions (40%) */}
          <div className="lg:col-span-2 space-y-4">
            <p className="text-xs uppercase tracking-wide text-gray-400 font-medium">
              Quick Actions
            </p>

            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="block bg-[#2D6A4F] hover:bg-[#245c43] text-white rounded-xl p-4 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <action.icon className="w-5 h-5" />
                    <div>
                      <p className="font-medium">{action.title}</p>
                      <p className="text-sm text-white/70">{action.description}</p>
                    </div>
                  </div>
                  <ArrowRightIcon className="w-5 h-5" />
                </div>
              </Link>
            ))}

            {/* Inspirational Quote Card */}
            <div className="relative rounded-xl overflow-hidden h-48 bg-gradient-to-br from-[#1B3A2D] to-[#2D6A4F]">
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <p className="text-white/90 text-center italic text-sm">
                  &ldquo;Every soul will taste death, and you will only be given your full compensation on the Day of Resurrection.&rdquo;
                  <span className="block mt-2 text-white/60 not-italic text-xs">— Quran 3:185</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Recent Activity (60%) */}
          <div className="lg:col-span-3">
            <div className="card h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                <Link
                  href="/death-cases"
                  className="text-sm text-[#2D6A4F] hover:text-[#245c43] font-medium"
                >
                  View All
                </Link>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                      </div>
                      <div className="h-3 bg-gray-100 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ClockIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {activities.map((activity, index) => {
                    const Icon = getActivityIcon(activity.icon);
                    return (
                      <div
                        key={activity.id}
                        className={`flex items-center gap-4 py-3 ${
                          index < activities.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{activity.subtitle}</p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
