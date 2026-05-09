'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ClockIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface ActivityLog {
  history_id: number;
  case_id: number;
  registration_number: string;
  old_status: string | null;
  new_status: string;
  changed_by_name: string;
  changed_at: string;
  notes: string | null;
}

export default function AdminActivityLogsPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    user: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      router.push('/unauthorized');
      return;
    }
    fetchLogs();
  }, [currentUser]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/activity-logs');
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('Failed to fetch activity logs, trying fallback:', err);
      try {
        const fallbackRes = await api.get('/death-cases/status-history');
        setLogs(fallbackRes.data.history || []);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        setError('Failed to load activity logs');
        setLogs([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filters.startDate && new Date(log.changed_at) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(log.changed_at) > new Date(filters.endDate + 'T23:59:59')) return false;
    if (filters.user && !log.changed_by_name?.toLowerCase().includes(filters.user.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      under_review: 'bg-blue-100 text-blue-700',
      approved: 'bg-green-100 text-green-700',
      allocated: 'bg-purple-100 text-purple-700',
      completed: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (currentUser?.role !== 'admin') return null;

  return (
    <div>
      <Header title="Activity Logs" />

      <div className="p-6 lg:p-8">
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Case Status Changes</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary text-sm"
            >
              <FunnelIcon className="w-4 h-4" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="label">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">User</label>
                <input
                  type="text"
                  value={filters.user}
                  onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                  className="input-field"
                  placeholder="Filter by user name..."
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ startDate: '', endDate: '', user: '' })}
                  className="btn-secondary text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          {isLoading ? (
            <TableSkeleton rows={8} columns={5} />
          ) : error ? (
            <EmptyState
              title="Error loading logs"
              description={error}
              icon={ClockIcon}
            />
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              title="No activity logs"
              description="No activity has been recorded yet."
              icon={ClockIcon}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-3 text-left">Timestamp</th>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Action</th>
                    <th className="px-4 py-3 text-left">Entity</th>
                    <th className="px-4 py-3 text-left">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.history_id} className="table-row">
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {format(new Date(log.changed_at), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {log.changed_by_name || 'System'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">Status Change</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#2D6A4F] font-medium">
                          Death Case {log.registration_number || `#${log.case_id}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {log.old_status && (
                            <>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(log.old_status)}`}>
                                {log.old_status.replace('_', ' ')}
                              </span>
                              <span className="text-gray-400">→</span>
                            </>
                          )}
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(log.new_status)}`}>
                            {log.new_status.replace('_', ' ')}
                          </span>
                        </div>
                        {log.notes && (
                          <p className="text-xs text-gray-400 mt-1">{log.notes}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
