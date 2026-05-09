'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import api from '@/lib/api';
import { Grave } from '@/types';
import {
  MapPinIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface GraveDetails extends Grave {
  cemetery_type?: string;
  image_url?: string;
  current_reservation?: {
    reservation_number: string;
    reserved_by_name: string;
    expiry_date: string;
    status: string;
  };
  burial_records?: Array<{
    record_number: string;
    deceased_name: string;
    date_of_death: string;
  }>;
}

export default function GravePlotDetailPage() {
  const params = useParams();
  const [grave, setGrave] = useState<GraveDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGrave();
  }, [params.id]);

  const fetchGrave = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/graves/${params.id}`);
      setGrave(res.data.grave);
    } catch (error) {
      console.error('Failed to fetch grave:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Loading..." />
        <div className="p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
              <div className="card">
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!grave) {
    return (
      <div>
        <Header title="Plot Not Found" />
        <div className="p-6 lg:p-8">
          <div className="card text-center py-12">
            <MapPinIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Grave plot not found</p>
            <Link href="/grave-plots" className="btn-primary mt-4">
              Back to Plots
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Grave Plots" subtitle={`Plot ${grave.plot_id}`} />

      <div className="p-6 lg:p-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link href="/grave-plots" className="text-gray-500 hover:text-gray-700">
            Grave Plots
          </Link>
          <span className="text-gray-400">&gt;</span>
          <span className="text-gray-900">Plot {grave.plot_id}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Plot Image */}
            <div className="rounded-xl overflow-hidden" style={{ maxHeight: '240px' }}>
              {grave.image_url ? (
                <img
                  src={grave.image_url}
                  alt={`Plot ${grave.plot_id}`}
                  className="w-full h-60 object-cover"
                />
              ) : (
                <div className="w-full h-60 bg-gradient-to-br from-[#2D6A4F] to-[#1B3A2D] flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">{grave.plot_id}</span>
                </div>
              )}
            </div>

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Plot ID: {grave.plot_id}
                  </h2>
                  <StatusBadge status={grave.status} />
                </div>
                <p className="text-gray-500 mt-1 flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  {grave.cemetery_name} • {grave.section_name}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Plot Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="label">Section</p>
                  <p className="text-gray-900 font-medium">{grave.section_code}</p>
                </div>
                <div>
                  <p className="label">Type</p>
                  <p className="text-gray-900 font-medium capitalize">{grave.plot_type}</p>
                </div>
                <div>
                  <p className="label">Dimensions</p>
                  <p className="text-gray-900 font-medium">{grave.dimensions || 'Standard'}</p>
                </div>
                <div>
                  <p className="label">Premium Tier</p>
                  <p className="text-gray-900 font-medium capitalize">
                    {grave.premium_tier || 'Standard'}
                  </p>
                </div>
              </div>
            </div>

            {/* Historical Logs */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Historical & Status Logs</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#2D6A4F] rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Plot Created</p>
                    <p className="text-xs text-gray-500">
                      {new Date(grave.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {grave.status === 'reserved' && grave.current_reservation && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Reserved</p>
                      <p className="text-xs text-gray-500">
                        By {grave.current_reservation.reserved_by_name}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions Card */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Management Actions</h3>
              <div className="space-y-3">
                {grave.status === 'available' && (
                  <>
                    <Link
                      href={`/grave-plots/reserve/${grave.grave_id}`}
                      className="btn-secondary w-full"
                    >
                      Reserve Plot
                    </Link>
                    <button className="btn-primary w-full">Allocate to Case</button>
                  </>
                )}
                {grave.status === 'reserved' && (
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    This plot is currently reserved.
                  </p>
                )}
                {grave.status === 'occupied' && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    This plot is occupied.
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-3 flex items-start gap-1">
                <InformationCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Reserving this plot will lock it for 48 hours pending approval.
              </p>
            </div>

            {/* Financial Overview */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Financial Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Base Plot Fee</span>
                  <span className="text-gray-900">
                    Rs. {grave.base_price?.toLocaleString() || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Endowment Care</span>
                  <span className="text-gray-900">Rs. 5,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Admin Surcharge</span>
                  <span className="text-gray-900">Rs. 2,500</span>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">Total Estimated</span>
                    <span className="font-bold text-lg text-gray-900">
                      Rs. {((grave.base_price || 0) + 7500).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Maintenance Info */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Plot Maintenance</h3>
              <p className="text-sm text-gray-600">
                This plot includes {grave.maintenance_plan || 'basic'} maintenance coverage.
              </p>
              <button className="text-sm text-[#2D6A4F] hover:text-[#245c43] font-medium mt-2">
                View maintenance schedule →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
