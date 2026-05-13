'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import api from '@/lib/api';
import { Grave, DeathCase } from '@/types';
import {
  MapPinIcon,
  InformationCircleIcon,
  XMarkIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';

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
  const router = useRouter();
  const { user } = useAuth();
  const [grave, setGrave] = useState<GraveDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [deathCases, setDeathCases] = useState<DeathCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocateError, setAllocateError] = useState('');

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');

  const canManagePlots = user?.role === 'admin' || user?.role === 'cemetery_manager' || user?.role === 'staff';

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

  const fetchDeathCases = async () => {
    try {
      const res = await api.get('/death-cases/my-cases?limit=100');
      const eligibleCases = (res.data.cases || []).filter(
        (c: DeathCase) => c.status === 'approved' || c.status === 'allocated'
      );
      setDeathCases(eligibleCases);
    } catch (error) {
      console.error('Failed to fetch death cases:', error);
    }
  };

  const openAllocateModal = () => {
    setShowAllocateModal(true);
    setSelectedCaseId(null);
    setAllocateError('');
    fetchDeathCases();
  };

  const handleAllocate = async () => {
    if (!selectedCaseId || !grave) return;

    setIsAllocating(true);
    setAllocateError('');

    try {
      await api.post('/burial-records', {
        case_id: selectedCaseId,
        grave_id: grave.grave_id,
        burial_type: 'standard',
        date_of_service: new Date().toISOString().split('T')[0],
      });
      setShowAllocateModal(false);
      router.push('/burial-records');
    } catch (error: any) {
      setAllocateError(error.response?.data?.error || 'Failed to allocate plot');
    } finally {
      setIsAllocating(false);
    }
  };

  const openStatusModal = () => {
    setShowStatusModal(true);
    setNewStatus(grave?.status || '');
    setStatusError('');
  };

  const handleUpdateStatus = async () => {
    if (!grave || !newStatus) return;

    setIsUpdatingStatus(true);
    setStatusError('');

    try {
      await api.put(`/graves/${grave.grave_id}/status`, { status: newStatus });
      setShowStatusModal(false);
      fetchGrave();
    } catch (error: any) {
      setStatusError(error.response?.data?.error || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
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
        
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link href="/grave-plots" className="text-gray-500 hover:text-gray-700">
            Grave Plots
          </Link>
          <span className="text-gray-400">&gt;</span>
          <span className="text-gray-900">Plot {grave.plot_id}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            
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

          
          <div className="space-y-6">
            
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
                    <button onClick={openAllocateModal} className="btn-primary w-full">
                      Allocate to Case
                    </button>
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
                {canManagePlots && (
                  <button
                    onClick={openStatusModal}
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <WrenchScrewdriverIcon className="w-4 h-4" />
                    Update Plot Status
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-3 flex items-start gap-1">
                <InformationCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Reserving this plot will lock it for 48 hours pending approval.
              </p>
            </div>

            
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

      {showAllocateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Allocate Plot to Case</h3>
              <button
                onClick={() => setShowAllocateModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Select a death case to allocate this plot. This will create a burial record
              and mark the plot as occupied.
            </p>

            {allocateError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {allocateError}
              </div>
            )}

            <div className="mb-4">
              <label className="label">Select Death Case</label>
              {deathCases.length === 0 ? (
                <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                  No eligible death cases found. Cases must be in "approved" or "allocated" status.
                </p>
              ) : (
                <select
                  value={selectedCaseId || ''}
                  onChange={(e) => setSelectedCaseId(Number(e.target.value))}
                  className="input-field"
                >
                  <option value="">Choose a case...</option>
                  {deathCases.map((dc) => (
                    <option key={dc.case_id} value={dc.case_id}>
                      {dc.registration_number} - {dc.deceased_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAllocateModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAllocate}
                disabled={!selectedCaseId || isAllocating}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {isAllocating ? 'Allocating...' : 'Allocate Plot'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Update Plot Status</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Change the status of this grave plot. Use with caution as this affects availability.
            </p>

            {statusError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {statusError}
              </div>
            )}

            <div className="mb-4">
              <label className="label">Current Status</label>
              <p className="text-sm font-medium text-gray-900 capitalize mb-3">
                {grave?.status}
              </p>

              <label className="label">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="input-field"
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <p className="text-sm text-amber-700">
                <strong>Warning:</strong> Changing status manually may affect linked reservations or burial records.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={!newStatus || newStatus === grave?.status || isUpdatingStatus}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {isUpdatingStatus ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
