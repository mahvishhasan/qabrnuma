'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Cog6ToothIcon, BellIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface Settings {
  cemetery_name: string;
  contact_email: string;
  default_holding_fee: number;
  notify_on_case_status_change: boolean;
  notify_on_reservation_expiry: boolean;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [settings, setSettings] = useState<Settings>({
    cemetery_name: 'QabrNuma',
    contact_email: '',
    default_holding_fee: 250,
    notify_on_case_status_change: true,
    notify_on_reservation_expiry: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      router.push('/unauthorized');
      return;
    }
    checkApiAvailability();
  }, [currentUser]);

  const checkApiAvailability = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data) {
        setSettings(res.data);
        setApiAvailable(true);
      }
    } catch (err) {
      console.log('Settings API not available');
      setApiAvailable(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value,
    });
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!apiAvailable) return;

    setIsSaving(true);
    try {
      await api.put('/settings', settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (currentUser?.role !== 'admin') return null;

  return (
    <div>
      <Header title="Settings" />

      <div className="p-6 lg:p-8">
        <div className="max-w-2xl space-y-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Cog6ToothIcon className="w-5 h-5 text-gray-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">System Settings</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Organization Name</label>
                <input
                  type="text"
                  name="cemetery_name"
                  value={settings.cemetery_name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., City Cemetery Management"
                />
              </div>

              <div>
                <label className="label">Contact Email</label>
                <input
                  type="email"
                  name="contact_email"
                  value={settings.contact_email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label className="label">Default Holding Fee (PKR)</label>
                <input
                  type="number"
                  name="default_holding_fee"
                  value={settings.default_holding_fee}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="5000"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Default fee charged for grave reservations
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BellIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="notify_on_case_status_change"
                  checked={settings.notify_on_case_status_change}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#2D6A4F] rounded border-gray-300 focus:ring-[#2D6A4F]"
                />
                <div>
                  <p className="font-medium text-gray-900">Case Status Notifications</p>
                  <p className="text-sm text-gray-500">
                    Send email when death case status changes
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="notify_on_reservation_expiry"
                  checked={settings.notify_on_reservation_expiry}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#2D6A4F] rounded border-gray-300 focus:ring-[#2D6A4F]"
                />
                <div>
                  <p className="font-medium text-gray-900">Reservation Expiry Alerts</p>
                  <p className="text-sm text-gray-500">
                    Send reminder before reservation expires
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={!apiAvailable || isSaving}
              className="btn-primary disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>

            {saveSuccess && (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircleIcon className="w-5 h-5" />
                Settings saved successfully
              </span>
            )}

            {!apiAvailable && (
              <span className="text-amber-600 text-sm">
                Settings API coming soon - form is preview only
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
