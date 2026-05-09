'use client';

import Link from 'next/link';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldExclamationIcon className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-6">
          You don't have permission to access this page.
        </p>
        <Link href="/dashboard" className="btn-primary">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
