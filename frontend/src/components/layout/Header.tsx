'use client';

import {
  BellIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children?: React.ReactNode;
}

export default function Header({ title, subtitle, badge, children }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="page-header">
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {badge && (
              <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {children}

        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <BellIcon className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Cog6ToothIcon className="w-5 h-5" />
        </button>

        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="w-9 h-9 bg-[#2D6A4F] rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
