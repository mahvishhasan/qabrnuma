'use client';

import Header from '@/components/layout/Header';
import { BellIcon } from '@heroicons/react/24/outline';

export default function NotificationsPage() {
  return (
    <div>
      <Header title="Notifications" />

      <div className="p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="card text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BellIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Notifications Coming Soon
            </h2>
            <p className="text-gray-500 max-w-sm mx-auto">
              We're working on bringing you real-time notifications for case updates,
              reservation alerts, and important announcements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
