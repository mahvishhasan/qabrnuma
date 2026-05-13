'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  BuildingOffice2Icon,
  MapPinIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface Cemetery {
  cemetery_id: number;
  name: string;
  address: string;
  city: string;
  total_capacity: number;
  current_occupancy: number;
  is_active: boolean;
  image_url?: string;
  description?: string;
  type?: string;
  total_available_plots?: number;
}

export default function SelectCemeteryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const reservationId = searchParams.get('reservationId');

  const [cemeteries, setCemeteries] = useState<Cemetery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCemetery, setSelectedCemetery] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const canAccess = user?.role === 'admin' || user?.role === 'funeral_coordinator' || user?.role === 'cemetery_manager';

  useEffect(() => {
    if (user && !canAccess) {
      router.push('/grave-plots');
      return;
    }
    fetchCemeteries();
  }, [user, canAccess]);

  const fetchCemeteries = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/cemeteries');
      setCemeteries(res.data.cemeteries || []);
    } catch (err) {
      console.error('Failed to fetch cemeteries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getOccupancyPercent = (current: number, total: number) => {
    if (!total) return 0;
    return Math.round((current / total) * 100);
  };

  const handleSelect = (cemeteryId: number) => {
    setSelectedCemetery(cemeteryId);
  };

  const handleConfirm = async () => {
    if (!selectedCemetery) return;

    setIsSubmitting(true);
    try {
      if (reservationId) {
        setToast('Cemetery preference saved');
        setTimeout(() => {
          router.push(`/grave-plots?cemetery_id=${selectedCemetery}`);
        }, 1000);
      } else {
        router.push(`/grave-plots?cemetery_id=${selectedCemetery}`);
      }
    } catch (err) {
      setToast('Failed to save preference');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCemeteries = cemeteries.filter(c => c.is_active !== false);
  const inactiveCemeteries = cemeteries.filter(c => c.is_active === false);

  return (
    <div>
      <Header title="Select Cemetery" />

      <div className="p-6 lg:p-8">
        {toast && (
          <div className={`fixed top-20 right-6 px-4 py-3 rounded-lg shadow-lg z-50 ${
            toast.includes('Failed') ? 'bg-red-500 text-white' : 'bg-[#2D6A4F] text-white'
          }`}>
            {toast}
          </div>
        )}

        <Link
          href="/grave-plots"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Grave Plots
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Select Cemetery Preference</h1>
          <p className="text-gray-500 mt-1">
            Choose a cemetery for the reservation. Unavailable cemeteries are shown but cannot be selected.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : cemeteries.length === 0 ? (
          <div className="card">
            <EmptyState
              title="No cemeteries available"
              description="No cemeteries have been registered yet."
              icon={BuildingOffice2Icon}
            />
          </div>
        ) : (
          <>
            {activeCemeteries.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Cemeteries</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeCemeteries.map((cemetery) => {
                    const occupancy = getOccupancyPercent(cemetery.current_occupancy, cemetery.total_capacity);
                    const isSelected = selectedCemetery === cemetery.cemetery_id;
                    const isFull = occupancy >= 100;

                    return (
                      <button
                        key={cemetery.cemetery_id}
                        onClick={() => !isFull && handleSelect(cemetery.cemetery_id)}
                        disabled={isFull}
                        className={`card text-left transition-all ${
                          isSelected
                            ? 'ring-2 ring-[#2D6A4F] bg-[#2D6A4F]/5'
                            : isFull
                            ? 'opacity-60 cursor-not-allowed'
                            : 'hover:shadow-md cursor-pointer'
                        }`}
                      >
                        <div className="h-32 rounded-lg overflow-hidden mb-3 relative">
                          {cemetery.image_url ? (
                            <img
                              src={cemetery.image_url}
                              alt={cemetery.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#2D6A4F] to-[#1B3A2D]" />
                          )}
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-[#2D6A4F] text-white p-1 rounded-full">
                              <CheckCircleIcon className="w-5 h-5" />
                            </div>
                          )}
                          {isFull && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                Full
                              </span>
                            </div>
                          )}
                        </div>

                        <h3 className="font-semibold text-gray-900">{cemetery.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <MapPinIcon className="w-4 h-4" />
                          <span>{cemetery.city}</span>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500">Capacity</span>
                            <span className="font-medium">
                              {cemetery.current_occupancy || 0} / {cemetery.total_capacity || 0}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                occupancy >= 90 ? 'bg-red-500' : occupancy >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(occupancy, 100)}%` }}
                            />
                          </div>
                        </div>

                        {cemetery.total_available_plots !== undefined && (
                          <p className="text-xs text-gray-400 mt-2">
                            {cemetery.total_available_plots} plots available
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {inactiveCemeteries.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-500 mb-4">Unavailable Cemeteries</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {inactiveCemeteries.map((cemetery) => (
                    <div
                      key={cemetery.cemetery_id}
                      className="card opacity-50 cursor-not-allowed"
                    >
                      <div className="h-32 rounded-lg overflow-hidden mb-3 relative">
                        {cemetery.image_url ? (
                          <img
                            src={cemetery.image_url}
                            alt={cemetery.name}
                            className="w-full h-full object-cover grayscale"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300" />
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Unavailable
                          </span>
                        </div>
                      </div>

                      <h3 className="font-semibold text-gray-600">{cemetery.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                        <MapPinIcon className="w-4 h-4" />
                        <span>{cemetery.city}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCemetery && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 flex items-center gap-4">
                <p className="text-sm text-gray-600">
                  Selected: <strong>{activeCemeteries.find(c => c.cemetery_id === selectedCemetery)?.name}</strong>
                </p>
                <button
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="btn-primary disabled:opacity-50"
                >
                  {isSubmitting ? 'Confirming...' : 'Confirm Selection'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
