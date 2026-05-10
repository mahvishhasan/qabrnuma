'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/ui/StatusBadge';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import api from '@/lib/api';
import { Reservation } from '@/types';
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface StatusCounts {
  pending: number;
  approved: number;
  cancelled: number;
  expiring_soon: number;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    pending: 0,
    approved: 0,
    cancelled: 0,
    expiring_soon: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchReservations();
  }, [pagination.page]);

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/reservations?page=${pagination.page}&limit=${pagination.limit}`);
      setReservations(res.data.reservations || []);
      setStatusCounts(res.data.status_counts || {});
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReservations = reservations.filter(
    (r) =>
      !searchQuery ||
      r.plot_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reservation_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statCards = [
    {
      title: 'Pending',
      value: statusCounts.pending,
      icon: ClipboardDocumentListIcon,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Approved',
      value: statusCounts.approved,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Canceled',
      value: statusCounts.cancelled,
      icon: XCircleIcon,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      title: 'Expiring Soon',
      value: statusCounts.expiring_soon,
      icon: CalendarIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
  ];

  return (
    <div>
      <Header title="Grave Plot Reservations" />

      <div className="p-6 lg:p-8">
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat) => (
            <div key={stat.title} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400 font-medium">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.bg} p-3 rounded-lg`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Reservation Status</h3>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by Plot ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-9 w-64"
              />
            </div>
          </div>

          {isLoading ? (
            <TableSkeleton rows={6} columns={5} />
          ) : filteredReservations.length === 0 ? (
            <EmptyState
              title="No reservations found"
              description="You haven't made any reservations yet."
              icon={ClipboardDocumentListIcon}
              action={
                <Link href="/grave-plots" className="btn-primary">
                  Browse Plots
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-3 text-left">Plot ID</th>
                    <th className="px-4 py-3 text-left">Requester</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Expiry Date</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((reservation) => {
                    const isCancelled = reservation.status === 'cancelled';
                    return (
                      <tr
                        key={reservation.reservation_id}
                        className={`table-row ${isCancelled ? 'opacity-50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/grave-plots/${reservation.grave_id}`}
                            className={`font-medium ${
                              isCancelled ? 'text-gray-500' : 'text-[#2D6A4F] hover:underline'
                            }`}
                          >
                            {reservation.plot_id}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          {reservation.primary_contact}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={reservation.status} />
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-sm">
                          {format(new Date(reservation.expiry_date), 'MMM dd, yyyy HH:mm')}
                        </td>
                        <td className="px-4 py-3">
                          {isCancelled ? (
                            <span className="text-sm text-gray-400">No actions available</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/reservations/cancel/${reservation.reservation_id}`}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                              >
                                Cancel
                              </Link>
                              <span className="text-gray-300">|</span>
                              <button className="text-sm text-[#2D6A4F] hover:text-[#245c43] font-medium">
                                Link to Case
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          
          {pagination.total > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} reservations
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
