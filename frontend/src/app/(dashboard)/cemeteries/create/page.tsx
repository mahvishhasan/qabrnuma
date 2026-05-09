'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function CreateCemeteryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    total_capacity: '',
    type: 'standard',
    is_active: true,
  });

  const canCreate = user?.role === 'admin' || user?.role === 'cemetery_manager';

  useEffect(() => {
    if (user && !canCreate) {
      router.push('/cemeteries');
    }
  }, [user, canCreate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.city) {
      setError('Cemetery Name and City are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        ...formData,
        total_capacity: parseInt(formData.total_capacity) || 0,
      };

      const res = await api.post('/cemeteries', payload);
      router.push(`/cemeteries/${res.data.cemetery.cemetery_id}`);
    } catch (err: any) {
      console.error('Failed to create cemetery:', err);
      setError(err.response?.data?.error || 'Failed to create cemetery');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canCreate) return null;

  return (
    <div>
      <Header title="Add New Cemetery" />

      <div className="p-6 lg:p-8">
        <Link
          href="/cemeteries"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Cemeteries
        </Link>

        <div className="card max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Add New Cemetery</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="label">Cemetery Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Memorial Gardens Cemetery"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Street address"
                />
              </div>

              <div>
                <label className="label">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Karachi"
                  required
                />
              </div>

              <div>
                <label className="label">Total Capacity</label>
                <input
                  type="number"
                  name="total_capacity"
                  value={formData.total_capacity}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Number of plots"
                  min="0"
                />
              </div>

              <div>
                <label className="label">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="heritage">Heritage</option>
                </select>
              </div>

              <div>
                <label className="label">Status</label>
                <select
                  name="is_active"
                  value={formData.is_active ? 'active' : 'maintenance'}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                  className="input-field"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Cemetery'}
              </button>
              <Link href="/cemeteries" className="btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
