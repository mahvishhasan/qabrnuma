'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/ui/StatusBadge';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  ArrowLeftIcon,
  PencilIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  Square3Stack3DIcon,
} from '@heroicons/react/24/outline';

interface Cemetery {
  cemetery_id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  total_capacity: number;
  current_occupancy: number;
  contact_phone: string;
  contact_email: string;
  is_active: boolean;
  image_url?: string;
  description?: string;
}

interface Grave {
  grave_id: number;
  section: string;
  row_number: string;
  plot_number: string;
  status: string;
  grave_type: string;
}

export default function CemeteryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [cemetery, setCemetery] = useState<Cemetery | null>(null);
  const [graves, setGraves] = useState<Grave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    total_capacity: '',
    contact_phone: '',
    contact_email: '',
    is_active: true,
  });

  const canEdit = user?.role === 'admin' || user?.role === 'cemetery_manager';

  useEffect(() => {
    fetchCemetery();
    fetchGraves();
  }, [params.id]);

  const fetchCemetery = async () => {
    try {
      const res = await api.get(`/cemeteries/${params.id}`);
      const cem = res.data.cemetery;
      setCemetery(cem);
      setFormData({
        name: cem.name || '',
        address: cem.address || '',
        city: cem.city || '',
        state: cem.state || '',
        country: cem.country || '',
        postal_code: cem.postal_code || '',
        total_capacity: cem.total_capacity?.toString() || '',
        contact_phone: cem.contact_phone || '',
        contact_email: cem.contact_email || '',
        is_active: cem.is_active ?? true,
      });
    } catch (err) {
      console.error('Failed to fetch cemetery:', err);
      setError('Cemetery not found');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGraves = async () => {
    try {
      const res = await api.get(`/graves?cemetery_id=${params.id}&limit=20`);
      setGraves(res.data.graves || []);
    } catch (err) {
      console.error('Failed to fetch graves:', err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      const payload = {
        ...formData,
        total_capacity: parseInt(formData.total_capacity) || 0,
      };

      await api.put(`/cemeteries/${params.id}`, payload);
      await fetchCemetery();
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to update cemetery:', err);
      setError(err.response?.data?.error || 'Failed to update cemetery');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const getOccupancyPercent = () => {
    if (!cemetery?.total_capacity) return 0;
    return Math.round((cemetery.current_occupancy / cemetery.total_capacity) * 100);
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Cemetery Details" />
        <div className="p-6 lg:p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="card h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !cemetery) {
    return (
      <div>
        <Header title="Cemetery Details" />
        <div className="p-6 lg:p-8">
          <div className="card text-center py-12">
            <p className="text-gray-500">{error}</p>
            <Link href="/cemeteries" className="btn-primary mt-4 inline-block">
              Back to Cemeteries
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const occupancyPercent = getOccupancyPercent();

  return (
    <div>
      <Header title="Cemetery Details" />

      {/* Header Banner Image */}
      <div className="relative h-[200px] w-full overflow-hidden">
        {cemetery?.image_url ? (
          <img
            src={cemetery.image_url}
            alt={cemetery.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#2D6A4F] to-[#1B3A2D]" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{cemetery?.name}</h1>
            <StatusBadge status={cemetery?.is_active ? 'active' : 'inactive'} />
          </div>
          {cemetery?.description && (
            <p className="text-white/80 text-sm mt-1 max-w-2xl">{cemetery.description}</p>
          )}
        </div>
      </div>

      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/cemeteries"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Cemeteries
          </Link>
          {canEdit && !isEditing && (
            <button onClick={() => setIsEditing(true)} className="btn-primary">
              <PencilIcon className="w-4 h-4" />
              Edit Cemetery
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cemetery Information</h2>

              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="label">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="input-field"
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
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="label">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label">State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="label">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label">Postal Code</label>
                      <input
                        type="text"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleChange}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="label">Contact Phone</label>
                      <input
                        type="tel"
                        name="contact_phone"
                        value={formData.contact_phone}
                        onChange={handleChange}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label">Contact Email</label>
                      <input
                        type="email"
                        name="contact_email"
                        value={formData.contact_email}
                        onChange={handleChange}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_active"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#2D6A4F] rounded border-gray-300"
                    />
                    <label htmlFor="is_active" className="text-sm text-gray-700">
                      Cemetery is active
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="btn-primary disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button onClick={() => setIsEditing(false)} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <dl className="grid gap-4 md:grid-cols-2">
                  <div>
                    <dt className="text-sm text-gray-500">Name</dt>
                    <dd className="font-medium">{cemetery?.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Status</dt>
                    <dd>
                      <StatusBadge status={cemetery?.is_active ? 'active' : 'inactive'} />
                    </dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" /> Address
                    </dt>
                    <dd className="font-medium">
                      {[cemetery?.address, cemetery?.city, cemetery?.state, cemetery?.country]
                        .filter(Boolean)
                        .join(', ')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 flex items-center gap-1">
                      <PhoneIcon className="w-4 h-4" /> Phone
                    </dt>
                    <dd className="font-medium">{cemetery?.contact_phone || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 flex items-center gap-1">
                      <EnvelopeIcon className="w-4 h-4" /> Email
                    </dt>
                    <dd className="font-medium">{cemetery?.contact_email || '-'}</dd>
                  </div>
                </dl>
              )}
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Grave Plots</h2>
                <Link href="/grave-plots" className="text-sm text-[#2D6A4F] hover:underline">
                  View All
                </Link>
              </div>

              {graves.length === 0 ? (
                <EmptyState
                  title="No graves"
                  description="No grave plots have been added to this cemetery."
                  icon={Square3Stack3DIcon}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="table-header">
                      <tr>
                        <th className="px-3 py-2 text-left">Plot</th>
                        <th className="px-3 py-2 text-left">Section</th>
                        <th className="px-3 py-2 text-left">Type</th>
                        <th className="px-3 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {graves.map((grave) => (
                        <tr key={grave.grave_id} className="table-row">
                          <td className="px-3 py-2 font-medium">
                            {grave.row_number}-{grave.plot_number}
                          </td>
                          <td className="px-3 py-2">{grave.section}</td>
                          <td className="px-3 py-2 capitalize">{grave.grave_type}</td>
                          <td className="px-3 py-2">
                            <StatusBadge status={grave.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Capacity Overview</h3>
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-gray-900">{occupancyPercent}%</div>
                <p className="text-sm text-gray-500">Occupied</p>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full transition-all ${
                    occupancyPercent >= 90
                      ? 'bg-red-500'
                      : occupancyPercent >= 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${occupancyPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Current</span>
                <span className="font-medium">{cemetery?.current_occupancy || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Capacity</span>
                <span className="font-medium">{cemetery?.total_capacity || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Available</span>
                <span className="font-medium text-green-600">
                  {(cemetery?.total_capacity || 0) - (cemetery?.current_occupancy || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
