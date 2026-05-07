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
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['admin', 'staff', 'cemetery_manager', 'user', 'funeral_coordinator'] },
  { name: 'Death Cases', href: '/death-cases', icon: DocumentTextIcon, roles: ['admin', 'staff', 'cemetery_manager', 'user', 'funeral_coordinator'] },
  { name: 'Grave Plots', href: '/graves', icon: MapIcon, roles: ['admin', 'staff', 'cemetery_manager', 'user'] },
  { name: 'Reservations', href: '/reservations', icon: ClipboardDocumentListIcon, roles: ['admin', 'staff', 'cemetery_manager', 'user'] },
  { name: 'Cemeteries', href: '/cemeteries', icon: BuildingOffice2Icon, roles: ['admin', 'cemetery_manager'] },
  { name: 'Services', href: '/services', icon: CalendarDaysIcon, roles: ['admin', 'staff', 'funeral_coordinator'] },
  { name: 'Burial Records', href: '/burial-records', icon: BookOpenIcon, roles: ['admin', 'staff', 'cemetery_manager'] },
  { name: 'Profile', href: '/profile', icon: UserCircleIcon, roles: ['admin', 'staff', 'cemetery_manager', 'user', 'funeral_coordinator'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const filteredNav = navigation.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const NavContent = () => (
    <>
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-mint rounded-lg flex items-center justify-center">
            <span className="text-forest font-bold text-lg">Q</span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-white font-bold text-xl">QabrNuma</h1>
              <p className="text-gray-400 text-xs">Cemetery Management</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-[#234d38] text-white'
                  : 'text-gray-300 hover:bg-[#234d38] hover:text-white'
              )}
              onClick={() => setIsMobileOpen(false)}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#234d38]">
        {!isCollapsed && user && (
          <div className="mb-4 px-4">
            <p className="text-white text-sm font-medium truncate">{user.full_name}</p>
            <p className="text-gray-400 text-xs capitalize">{user.role.replace('_', ' ')}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-gray-300 hover:bg-[#234d38] hover:text-white rounded-lg transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-forest text-white rounded-lg"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <Bars3Icon className="w-6 h-6" />
        )}
      </button>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={clsx(
          'lg:hidden fixed top-0 left-0 z-40 h-full w-64 bg-forest transform transition-transform duration-300 flex flex-col',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={clsx(
          'hidden lg:flex flex-col sticky top-0 h-screen bg-forest transition-all duration-300',
          isCollapsed ? 'w-20' : 'w-60'
        )}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-sage text-white rounded-full flex items-center justify-center hover:bg-mint transition-colors"
        >
          <Bars3Icon className="w-4 h-4" />
        </button>
        <NavContent />
      </aside>
    </>
  );
}
