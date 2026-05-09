'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  HomeIcon,
  DocumentTextIcon,
  MapIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  UsersIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ClockIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: Record<string, NavItem[]> = {
  user: [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Death Cases', href: '/death-cases', icon: DocumentTextIcon },
    { name: 'Grave Plots', href: '/grave-plots', icon: MapIcon },
    { name: 'Reservations', href: '/reservations', icon: ClipboardDocumentListIcon },
    { name: 'Services', href: '/services', icon: CalendarDaysIcon },
    { name: 'Burial Records', href: '/burial-records', icon: BookOpenIcon },
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
  ],
  staff: [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Death Cases', href: '/death-cases', icon: DocumentTextIcon },
    { name: 'Services', href: '/services', icon: CalendarDaysIcon },
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
  ],
  funeral_coordinator: [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Death Cases', href: '/death-cases', icon: DocumentTextIcon },
    { name: 'Services', href: '/services', icon: CalendarDaysIcon },
    { name: 'Burial Records', href: '/burial-records', icon: BookOpenIcon },
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
  ],
  cemetery_manager: [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Cemeteries', href: '/cemeteries', icon: BuildingOffice2Icon },
    { name: 'Grave Plots', href: '/grave-plots', icon: MapIcon },
    { name: 'Reservations', href: '/reservations', icon: ClipboardDocumentListIcon },
    { name: 'Burial Records', href: '/burial-records', icon: BookOpenIcon },
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
  ],
  admin: [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Users', href: '/admin/users', icon: UsersIcon },
    { name: 'Cemeteries', href: '/cemeteries', icon: BuildingOffice2Icon },
    { name: 'Death Cases', href: '/death-cases', icon: DocumentTextIcon },
    { name: 'Grave Plots', href: '/grave-plots', icon: MapIcon },
    { name: 'Reservations', href: '/reservations', icon: ClipboardDocumentListIcon },
    { name: 'Services', href: '/services', icon: CalendarDaysIcon },
    { name: 'Burial Records', href: '/burial-records', icon: BookOpenIcon },
    { name: 'Roles', href: '/admin/roles', icon: ShieldCheckIcon },
    { name: 'Reports', href: '/admin/reports', icon: ChartBarIcon },
    { name: 'Activity Logs', href: '/admin/activity-logs', icon: ClockIcon },
    { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const role = user?.role || 'user';
  const navigation = NAV_ITEMS[role] || NAV_ITEMS.user;

  return (
    <aside className="sidebar">
      <div className="p-6 pb-8">
        <h1 className="text-white font-bold text-xl">QabrNuma</h1>
        <p className="text-[#52b788] text-sm mt-0.5">Cemetery Management</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx('sidebar-nav-item', isActive && 'active')}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={logout}
          className="sidebar-nav-item w-full"
        >
          <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
