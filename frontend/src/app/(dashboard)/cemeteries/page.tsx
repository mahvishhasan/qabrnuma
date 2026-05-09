'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  PlusIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface Cemetery {
  cemetery_id: number;
  name: string;
  address: string;
  city: string;
  total_capacity: number;
  current_occupancy: number;
  contact_phone: string;
  contact_email: string;
  is_active: boolean;
  image_url?: string;
  description?: string;
  type?: string;
}

export default function CemeteriesPage() {
  const { user } = useAuth();
  const [cemeteries, setCemeteries] = useState<Cemetery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const canCreate = user?.role === 'admin' || user?.role === 'cemetery_manager';

  useEffect(() => {
    fetchCemeteries();
  }, []);

  const fetchCemeteries = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/cemeteries');
      setCemeteries(res.data.cemeteries || []);
    } catch (err) {
      console.error('Failed to fetch cemeteries:', err);
      setError('Failed to load cemeteries');
      setCemeteries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCemeteries = cemeteries.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase())
  );

  const getOccupancyPercent = (current: number, total: number) => {
    if (!total) return 0;
    return Math.round((current / total) * 100);
  };

  const getOccupancyColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div>
      <Header title="Cemeteries" />

      <div className="p-6 lg:p-8">
        <div className="card mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="label">Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field"
                placeholder="Search by name or city..."
              />
            </div>
            {canCreate && (
              <Link href="/cemeteries/create" className="btn-primary">
                <PlusIcon className="w-4 h-4" />
                Add Cemetery
              </Link>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="card">
            <TableSkeleton rows={4} columns={6} />
          </div>
        ) : error ? (
          <div className="card">
            <EmptyState
              title="Error loading cemeteries"
              description={error}
              icon={BuildingOffice2Icon}
            />
          </div>
        ) : filteredCemeteries.length === 0 ? (
          <div className="card">
            <EmptyState
              title="No cemeteries found"
              description={search ? 'No cemeteries match your search.' : 'No cemeteries have been added yet.'}
              icon={BuildingOffice2Icon}
              action={
                canCreate ? (
                  <Link href="/cemeteries/create" className="btn-primary">
                    <PlusIcon className="w-4 h-4" />
                    Add Cemetery
                  </Link>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCemeteries.map((cemetery) => {
              const occupancyPercent = getOccupancyPercent(
                cemetery.current_occupancy,
                cemetery.total_capacity
              );
              return (
                <Link
                  key={cemetery.cemetery_id}
                  href={`/cemeteries/${cemetery.cemetery_id}`}
                  className="card hover:shadow-md transition-shadow overflow-hidden p-0"
                >
                  <div className="h-32 relative">
                    {cemetery.image_url ? (
                      <img
                        src={cemetery.image_url}
                        alt={cemetery.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#2D6A4F] to-[#1B3A2D]" />
                    )}
                    {cemetery.type && (
                      <span className="absolute top-2 left-2 px-2 py-1 bg-white/90 text-xs font-medium rounded capitalize">
                        {cemetery.type}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{cemetery.name}</h3>
                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{cemetery.city}</span>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Occupancy</span>
                      <span className="font-medium">
                        {cemetery.current_occupancy} / {cemetery.total_capacity}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getOccupancyColor(occupancyPercent)} transition-all`}
                        style={{ width: `${occupancyPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{occupancyPercent}% full</p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 text-sm text-gray-500">
                      {cemetery.contact_phone || cemetery.contact_email || 'No contact info'}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
