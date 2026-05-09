'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/ui/StatusBadge';
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
  BuildingOffice2Icon,
  CheckCircleIcon,
  UserGroupIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from 'date-fns';

interface DashboardStats {
  deathCases: number;
  reservations: number;
  scheduledServices: number;
  availablePlots: number;
  cemeteries: number;
  pendingApprovals: number;
  completedThisWeek: number;
  completedBurials: number;
  assignedServices: number;
  inProgressServices: number;
  pendingServices: number;
  activeCases: number;
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
    availablePlots: 0,
    cemeteries: 0,
    pendingApprovals: 0,
    completedThisWeek: 0,
    completedBurials: 0,
    assignedServices: 0,
    inProgressServices: 0,
    pendingServices: 0,
    activeCases: 0,
  });
  const [recentServices, setRecentServices] = useState<any[]>([]);
  const [pendingServicesList, setPendingServicesList] = useState<any[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const role = user?.role || 'user';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises: Promise<any>[] = [];

        if (role === 'user') {
          promises.push(
            api.get('/death-cases/my-cases?limit=5'),
            api.get('/reservations')
          );
        } else if (role === 'admin') {
          promises.push(
            api.get('/death-cases?limit=5'),
            api.get('/reservations'),
            api.get('/graves?status=available&limit=1'),
            api.get('/cemeteries')
          );
        } else if (role === 'cemetery_manager') {
          promises.push(
            api.get('/cemeteries'),
            api.get('/graves?limit=1'),
            api.get('/reservations')
          );
        } else if (role === 'staff') {
          promises.push(
            api.get('/funeral-services/my-assigned')
          );
        } else if (role === 'funeral_coordinator') {
          promises.push(
            api.get('/death-cases?limit=100'),
            api.get('/funeral-services?limit=100')
          );
        }

        const results = await Promise.all(promises);

        if (role === 'user') {
          const [casesRes, reservationsRes] = results;
          setStats({
            ...stats,
            deathCases: casesRes.data.pagination?.total || casesRes.data.cases?.length || 0,
            reservations: (reservationsRes.data.status_counts?.pending || 0) + (reservationsRes.data.status_counts?.approved || 0),
            scheduledServices: 0,
          });
          buildActivities(casesRes.data.cases);
        } else if (role === 'admin') {
          const [casesRes, reservationsRes, gravesRes, cemeteriesRes] = results;
          setStats({
            ...stats,
            deathCases: casesRes.data.pagination?.total || 0,
            reservations: (reservationsRes.data.status_counts?.pending || 0) + (reservationsRes.data.status_counts?.approved || 0),
            availablePlots: gravesRes.data.pagination?.total || 0,
            cemeteries: cemeteriesRes.data.cemeteries?.length || 0,
          });
          buildActivities(casesRes.data.cases);
        } else if (role === 'cemetery_manager') {
          const [cemeteriesRes, gravesRes, reservationsRes] = results;
          setStats({
            ...stats,
            cemeteries: cemeteriesRes.data.cemeteries?.length || 0,
            availablePlots: gravesRes.data.pagination?.total || 0,
            reservations: (reservationsRes.data.status_counts?.pending || 0) + (reservationsRes.data.status_counts?.approved || 0),
            pendingApprovals: reservationsRes.data.status_counts?.pending || 0,
          });
        } else if (role === 'staff') {
          const [servicesRes] = results;
          const services = servicesRes.data.services || [];
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const completedThisWeek = services.filter(
            (s: any) => s.status === 'completed' && s.completed_at && new Date(s.completed_at) > weekAgo
          ).length;
          setStats({
            ...stats,
            assignedServices: services.length,
            inProgressServices: services.filter((s: any) => s.status === 'in_progress').length,
            completedThisWeek,
          });
          setRecentServices(services.slice(0, 3));
        } else if (role === 'funeral_coordinator') {
          const [casesRes, servicesRes] = results;
          const cases = casesRes.data.cases || [];
          const services = servicesRes.data.services || [];
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const activeCases = cases.filter((c: any) => c.status !== 'completed').length;
          const pendingServices = services.filter((s: any) => s.status === 'pending');
          const scheduledServices = services.filter((s: any) => s.status === 'scheduled').length;
          const completedThisWeek = services.filter(
            (s: any) => s.status === 'completed' && s.completed_at && new Date(s.completed_at) > weekAgo
          ).length;
          setStats({
            ...stats,
            activeCases,
            pendingServices: pendingServices.length,
            scheduledServices,
            completedThisWeek,
          });
          setPendingServicesList(pendingServices.slice(0, 3));
          buildActivities(cases);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const buildActivities = (cases: any[] | undefined) => {
      if (!cases) return;
      const recentActivities: ActivityItem[] = cases.slice(0, 5).map((c: any) => ({
        id: `case-${c.case_id}`,
        title: `Case ${c.registration_number}`,
        subtitle: `${c.deceased_name} - ${c.status}`,
        time: c.created_at,
        icon: 'case',
      }));
      setActivities(recentActivities);
    };

    fetchData();
  }, [role]);

  const getGreeting = () => {
    if (role === 'admin') return `Welcome back, ${user?.full_name}`;
    return `Assalamu Alaikum, ${user?.full_name}`;
  };

  const getSubtitle = () => {
    switch (role) {
      case 'admin':
        return 'System overview and administration';
      case 'cemetery_manager':
        return 'Manage cemeteries and plot allocations';
      case 'staff':
        return 'Your assigned tasks and services';
      case 'funeral_coordinator':
        return 'Coordinate funeral services and burials';
      default:
        return 'Manage your family records and cemetery services with ease.';
    }
  };

  const getStatCards = () => {
    switch (role) {
      case 'admin':
        return [
          { title: 'Death Cases', value: stats.deathCases, badge: 'Total', badgeColor: 'bg-blue-100 text-blue-700', icon: DocumentTextIcon, iconBg: 'bg-blue-500' },
          { title: 'Available Plots', value: stats.availablePlots, badge: 'Free', badgeColor: 'bg-green-100 text-green-700', icon: MapPinIcon, iconBg: 'bg-green-500' },
          { title: 'Active Reservations', value: stats.reservations, badge: 'Active', badgeColor: 'bg-amber-100 text-amber-700', icon: ClipboardDocumentListIcon, iconBg: 'bg-amber-500' },
          { title: 'Cemeteries', value: stats.cemeteries, badge: 'Managed', badgeColor: 'bg-purple-100 text-purple-700', icon: BuildingOffice2Icon, iconBg: 'bg-purple-500' },
        ];
      case 'cemetery_manager':
        return [
          { title: 'Cemeteries Managed', value: stats.cemeteries, badge: 'Active', badgeColor: 'bg-purple-100 text-purple-700', icon: BuildingOffice2Icon, iconBg: 'bg-purple-500' },
          { title: 'Total Plots', value: stats.availablePlots, badge: 'Available', badgeColor: 'bg-green-100 text-green-700', icon: MapPinIcon, iconBg: 'bg-green-500' },
          { title: 'Active Reservations', value: stats.reservations, badge: 'Reserved', badgeColor: 'bg-amber-100 text-amber-700', icon: ClipboardDocumentListIcon, iconBg: 'bg-amber-500' },
          { title: 'Pending Approvals', value: stats.pendingApprovals, badge: 'Waiting', badgeColor: 'bg-red-100 text-red-700', icon: ClockIcon, iconBg: 'bg-red-500' },
        ];
      case 'staff':
        return [
          { title: 'Assigned Services', value: stats.assignedServices, badge: 'Total', badgeColor: 'bg-blue-100 text-blue-700', icon: CalendarDaysIcon, iconBg: 'bg-blue-500' },
          { title: 'In Progress', value: stats.inProgressServices, badge: 'Active', badgeColor: 'bg-amber-100 text-amber-700', icon: ClockIcon, iconBg: 'bg-amber-500' },
          { title: 'Completed This Week', value: stats.completedThisWeek, badge: 'Done', badgeColor: 'bg-green-100 text-green-700', icon: CheckCircleIcon, iconBg: 'bg-green-500' },
        ];
      case 'funeral_coordinator':
        return [
          { title: 'Active Cases', value: stats.activeCases, badge: 'Managing', badgeColor: 'bg-blue-100 text-blue-700', icon: DocumentTextIcon, iconBg: 'bg-blue-500' },
          { title: 'Pending Services', value: stats.pendingServices, badge: 'Needs Action', badgeColor: 'bg-red-100 text-red-700', icon: ClockIcon, iconBg: 'bg-red-500' },
          { title: 'Scheduled Services', value: stats.scheduledServices, badge: 'Upcoming', badgeColor: 'bg-amber-100 text-amber-700', icon: CalendarDaysIcon, iconBg: 'bg-amber-500' },
          { title: 'Completed This Week', value: stats.completedThisWeek, badge: 'Done', badgeColor: 'bg-green-100 text-green-700', icon: CheckCircleIcon, iconBg: 'bg-green-500' },
        ];
      default:
        return [
          { title: 'Death Cases', value: stats.deathCases, badge: 'Active', badgeColor: 'bg-green-100 text-green-700', icon: DocumentTextIcon, iconBg: 'bg-blue-500' },
          { title: 'Reservations', value: stats.reservations, badge: 'Reserved', badgeColor: 'bg-amber-100 text-amber-700', icon: ClipboardDocumentListIcon, iconBg: 'bg-purple-500' },
          { title: 'Scheduled Services', value: stats.scheduledServices, badge: 'Pending', badgeColor: 'bg-blue-100 text-blue-700', icon: CalendarDaysIcon, iconBg: 'bg-orange-500' },
        ];
    }
  };

  const getQuickActions = () => {
    switch (role) {
      case 'admin':
        return [
          { title: 'New Death Case', description: 'Register a new death case', href: '/death-cases/create', icon: PlusIcon },
          { title: 'Find Plot', description: 'Search available plots', href: '/grave-plots', icon: MapPinIcon },
          { title: 'My Reservations', description: 'View all reservations', href: '/reservations', icon: ClipboardDocumentListIcon },
          { title: 'Burial Records', description: 'View burial history', href: '/burial-records', icon: BookOpenIcon },
        ];
      case 'cemetery_manager':
        return [
          { title: 'Add Cemetery', description: 'Register new cemetery', href: '/cemeteries', icon: BuildingOffice2Icon },
          { title: 'Manage Plots', description: 'View and edit plots', href: '/grave-plots', icon: MapPinIcon },
          { title: 'Approve Reservations', description: 'Review pending requests', href: '/reservations', icon: ClipboardDocumentListIcon },
        ];
      case 'staff':
        return [
          { title: 'View My Services', description: 'See assigned services', href: '/services', icon: CalendarDaysIcon },
          { title: 'Update Case Status', description: 'Manage death cases', href: '/death-cases', icon: DocumentTextIcon },
        ];
      case 'funeral_coordinator':
        return [
          { title: 'Schedule Service', description: 'Create new service', href: '/services/create', icon: CalendarDaysIcon },
          { title: 'View All Cases', description: 'Manage death cases', href: '/death-cases', icon: DocumentTextIcon },
          { title: 'Burial Records', description: 'View burial history', href: '/burial-records', icon: BookOpenIcon },
        ];
      default:
        return [
          { title: 'Create Death Case', description: 'Register a new death case', href: '/death-cases/create', icon: PlusIcon },
          { title: 'Reserve Plot', description: 'Reserve a burial plot', href: '/grave-plots', icon: MapPinIcon },
          { title: 'Request Services', description: 'Schedule funeral services', href: '/services', icon: WrenchScrewdriverIcon },
        ];
    }
  };

  const statCards = getStatCards();
  const quickActions = getQuickActions();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'case': return DocumentTextIcon;
      case 'reservation': return ClipboardDocumentListIcon;
      case 'service': return CalendarDaysIcon;
      default: return ClockIcon;
    }
  };

  return (
    <div>
      <Header title="Dashboard" />

      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{getGreeting()}</h2>
          <p className="text-gray-500 mt-1">{getSubtitle()}</p>
        </div>

        {isLoading ? (
          <div className={`grid gap-4 mb-6 ${statCards.length === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
            {[...Array(statCards.length)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className={`grid gap-4 mb-6 ${statCards.length === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
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
                  </div>
                  <div className={`${stat.iconBg} p-3 rounded-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className={`space-y-4 ${role === 'admin' ? 'lg:col-span-2' : 'lg:col-span-2'}`}>
            <p className="text-xs uppercase tracking-wide text-gray-400 font-medium">
              Quick Actions
            </p>

            {role === 'admin' ? (
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="bg-[#2D6A4F] hover:bg-[#245c43] text-white rounded-xl p-4 transition-colors"
                  >
                    <action.icon className="w-5 h-5 mb-2" />
                    <p className="font-medium text-sm">{action.title}</p>
                    <p className="text-xs text-white/70">{action.description}</p>
                  </Link>
                ))}
              </div>
            ) : (
              quickActions.map((action) => (
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
              ))
            )}

            {role === 'user' && (
              <div className="relative rounded-xl overflow-hidden h-48 bg-gradient-to-br from-[#1B3A2D] to-[#2D6A4F]">
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <p className="text-white/90 text-center italic text-sm">
                    &ldquo;Every soul will taste death, and you will only be given your full compensation on the Day of Resurrection.&rdquo;
                    <span className="block mt-2 text-white/60 not-italic text-xs">— Quran 3:185</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            <div className="card h-full">
              {role === 'staff' ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Recent Assigned Services</h3>
                    <Link
                      href="/services"
                      className="text-sm text-[#2D6A4F] hover:text-[#245c43] font-medium"
                    >
                      View All
                    </Link>
                  </div>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 animate-pulse">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentServices.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CalendarDaysIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-sm">No services assigned yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentServices.map((service) => (
                        <Link
                          key={service.service_id}
                          href={`/services/${service.service_id}`}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-10 h-10 bg-[#2D6A4F]/10 rounded-lg flex items-center justify-center">
                            <CalendarDaysIcon className="w-5 h-5 text-[#2D6A4F]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm capitalize">
                              {service.service_type?.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {service.registration_number || `Case #${service.case_id}`}
                              {service.scheduled_datetime && ` • ${format(new Date(service.scheduled_datetime), 'MMM dd, HH:mm')}`}
                            </p>
                          </div>
                          <StatusBadge status={service.status} />
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : role === 'funeral_coordinator' ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Pending Services Requiring Action</h3>
                    <Link
                      href="/services?status=pending"
                      className="text-sm text-[#2D6A4F] hover:text-[#245c43] font-medium"
                    >
                      View All
                    </Link>
                  </div>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 animate-pulse">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : pendingServicesList.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircleIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-sm">No pending services</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingServicesList.map((service) => (
                        <div
                          key={service.service_id}
                          className="flex items-center gap-4 p-3 rounded-lg bg-amber-50 border border-amber-100"
                        >
                          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <ClockIcon className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm capitalize">
                              {service.service_type?.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {service.requester_name && `${service.requester_name} • `}
                              {service.registration_number || `Case #${service.case_id}`}
                            </p>
                          </div>
                          <Link
                            href={`/services/${service.service_id}`}
                            className="px-3 py-1.5 bg-[#2D6A4F] text-white text-xs font-medium rounded-lg hover:bg-[#245c43]"
                          >
                            Assign Now
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
