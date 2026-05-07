'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/ui/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';
import { Reservation } from '@/types';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function CancelReservationPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchReservation();
  }, [params.id]);

  const fetchReservation = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/reservations/${params.id}`);
      setReservation(res.data.reservation);
    } catch (error) {
      console.error('Failed to fetch reservation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await api.delete(`/reservations/${params.id}`);
      showToast('Reservation cancelled successfully', 'success');
      router.push('/reservations');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      showToast(err.response?.data?.error || 'Failed to cancel reservation', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Cancel Reservation" />
        <div className="p-6 lg:p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-64 bg-gray-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div>
        <Header title="Cancel Reservation" />
        <div className="p-6 lg:p-8">
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">Reservation not found.</p>
            <Link href="/reservations" className="btn-primary">
              Back to Reservations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Grave Plots" subtitle="Reservations" />

      <div className="p-6 lg:p-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link href="/grave-plots" className="text-gray-500 hover:text-gray-700">
            Grave Plots
          </Link>
          <span className="text-gray-400">/</span>
          <Link href="/reservations" className="text-gray-500 hover:text-gray-700">
            Reservations
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900">Cancel Reservation</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Warning */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-2">
                  Are you sure you want to cancel?
                </h3>
                <p className="text-sm text-red-700 mb-6">
                  Cancelling this reservation will release the plot back to available inventory.
                  Any holding fees paid may be subject to refund policies. This action cannot be
                  undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    disabled={isCancelling}
                    className="btn-destructive disabled:opacity-50"
                  >
                    {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                  </button>
                  <Link href="/reservations" className="btn-secondary">
                    Keep Reservation
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Reservation Details */}
          <div className="space-y-4">
            {/* Plot Preview */}
            <div className="h-48 bg-gradient-to-br from-[#2D6A4F]/20 to-[#1B3A2D]/20 rounded-xl relative">
              <StatusBadge status="reserved" className="absolute top-4 right-4" />
            </div>

            {/* Details */}
            <div className="card space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Reservation ID</span>
                <span className="text-sm font-medium text-gray-900">
                  {reservation.reservation_number}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Plot Number</span>
                <span className="text-sm font-medium text-gray-900">{reservation.plot_id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Reserved By</span>
                <span className="text-sm font-medium text-gray-900">
                  {reservation.primary_contact}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Date Reserved</span>
                <span className="text-sm font-medium text-gray-900">
                  {format(new Date(reservation.created_at), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500">Expiry Date</span>
                <span className="text-sm font-medium text-gray-900">
                  {format(new Date(reservation.expiry_date), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>
            </div>

            {/* Policy Note */}
            <div className="bg-gray-50 rounded-lg p-4 flex items-start gap-3">
              <InformationCircleIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">
                Refunds are processed within 5-7 business days. Cancellations made within 24
                hours of reservation are eligible for full refund.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
