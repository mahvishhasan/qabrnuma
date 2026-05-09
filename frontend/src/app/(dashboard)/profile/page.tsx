'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { UserCircleIcon, KeyIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    phone_number: user?.phone_number || '',
    cnic: user?.cnic || '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
    setProfileSuccess(false);
    setProfileError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setPasswordSuccess(false);
    setPasswordError('');
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess(false);

    try {
      const res = await api.put('/auth/profile', profileData);
      setUser({ ...user!, ...res.data.user });
      setProfileSuccess(true);
    } catch (err: any) {
      setProfileError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSuccess(false);

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('New passwords do not match');
      setPasswordSaving(false);
      return;
    }

    if (passwordData.new_password.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      setPasswordSaving(false);
      return;
    }

    try {
      await api.put('/auth/password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setPasswordSuccess(true);
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleLabels: Record<string, string> = {
      admin: 'Administrator',
      cemetery_manager: 'Cemetery Manager',
      funeral_coordinator: 'Funeral Coordinator',
      staff: 'Staff',
      user: 'User',
    };
    return roleLabels[role] || role;
  };

  return (
    <div>
      <Header title="Profile" />

      <div className="p-6 lg:p-8">
        <div className="max-w-2xl">
          <div className="card mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#2D6A4F] rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{user?.full_name}</h2>
                <p className="text-gray-500">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-[#2D6A4F]/10 text-[#2D6A4F] text-xs font-medium rounded">
                  {getRoleBadge(user?.role || '')}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === 'profile'
                    ? 'border-[#2D6A4F] text-[#2D6A4F]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <UserCircleIcon className="w-4 h-4" />
                Profile Settings
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === 'password'
                    ? 'border-[#2D6A4F] text-[#2D6A4F]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <KeyIcon className="w-4 h-4" />
                Change Password
              </button>
            </div>

            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                {profileError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {profileError}
                  </div>
                )}
                {profileSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5" />
                    Profile updated successfully
                  </div>
                )}

                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={profileData.full_name}
                    onChange={handleProfileChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="input-field bg-gray-50"
                    disabled
                  />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={profileData.phone_number}
                    onChange={handleProfileChange}
                    className="input-field"
                    placeholder="+92 300 1234567"
                  />
                </div>

                <div>
                  <label className="label">CNIC</label>
                  <input
                    type="text"
                    name="cnic"
                    value={profileData.cnic}
                    onChange={handleProfileChange}
                    className="input-field"
                    placeholder="12345-1234567-1"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="btn-primary disabled:opacity-50"
                  >
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {passwordError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5" />
                    Password changed successfully
                  </div>
                )}

                <div>
                  <label className="label">Current Password</label>
                  <input
                    type="password"
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">New Password</label>
                  <input
                    type="password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    className="input-field"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
                </div>

                <div>
                  <label className="label">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    className="input-field"
                    required
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="btn-primary disabled:opacity-50"
                  >
                    {passwordSaving ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
