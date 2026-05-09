'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const ROLES = [
  { value: 'user', label: 'User' },
  { value: 'staff', label: 'Staff' },
  { value: 'funeral_coordinator', label: 'Funeral Coordinator' },
  { value: 'cemetery_manager', label: 'Cemetery Manager' },
  { value: 'admin', label: 'Administrator' },
];

export default function CreateUserPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone_number: '',
    cnic: '',
    role: 'user',
  });

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email || !formData.password) {
      setError('Full Name, Email, and Password are required');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await api.post('/auth/register', formData);
      router.push('/admin/users');
    } catch (err: any) {
      console.error('Failed to create user:', err);
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role !== 'admin') return null;

  return (
    <div>
      <Header title="Add New User" />

      <div className="p-6 lg:p-8">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Users
        </Link>

        <div className="card max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Add New User</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter full name"
                required
              />
            </div>

            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="user@example.com"
                required
              />
            </div>

            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pr-10"
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="input-field"
                placeholder="+92 300 1234567"
              />
            </div>

            <div>
              <label className="label">CNIC</label>
              <input
                type="text"
                name="cnic"
                value={formData.cnic}
                onChange={handleChange}
                className="input-field"
                placeholder="12345-1234567-1"
              />
            </div>

            <div>
              <label className="label">Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-field"
                required
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create User'}
              </button>
              <Link href="/admin/users" className="btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
