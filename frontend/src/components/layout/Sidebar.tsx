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
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Death Cases', href: '/death-cases', icon: DocumentTextIcon },
  { name: 'Grave Plots', href: '/grave-plots', icon: MapIcon },
  { name: 'Reservations', href: '/reservations', icon: ClipboardDocumentListIcon },
  { name: 'Cemeteries', href: '/cemeteries', icon: BuildingOffice2Icon },
  { name: 'Services', href: '/services', icon: CalendarDaysIcon },
  { name: 'Burial Records', href: '/burial-records', icon: BookOpenIcon },
  { name: 'Profile', href: '/profile', icon: UserCircleIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="p-6 pb-8">
        <h1 className="text-white font-bold text-xl">QabrNuma</h1>
        <p className="text-[#52b788] text-sm mt-0.5">Cemetery Management</p>
      </div>

      {/* Navigation */}
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

      {/* Logout - pinned to bottom */}
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
