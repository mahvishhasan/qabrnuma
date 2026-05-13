'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import api from '@/lib/api';
import { BurialRecord } from '@/types';
import {
  MagnifyingGlassIcon,
  UsersIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function FamilyHistoryPage() {
  const [surname, setSurname] = useState('');
  const [records, setRecords] = useState<BurialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surname.trim()) return;

    setIsLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const res = await api.get(`/burial-records/family-history?surname=${encodeURIComponent(surname.trim())}`);
      setRecords(res.data.records || []);
    } catch (err) {
      console.error('Failed to search family history:', err);
      setError('Failed to search. Please try again.');
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Header title="Family Burial History" />

      <div className="p-6 lg:p-8">
        <Link
          href="/burial-records"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Burial Records
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Family Burial History</h1>
          <p className="text-gray-500 mt-1">
            Search burial records by family name to view chronological history.
          </p>
        </div>

        <div className="card mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <label className="label">Family Name / Surname</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  className="input-field pl-9"
                  placeholder="Enter surname to search..."
                  required
                />
              </div>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={isLoading} className="btn-primary disabled:opacity-50">
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="card">
          {isLoading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : !hasSearched ? (
            <EmptyState
              title="Search for family records"
              description="Enter a surname above to find burial records for family members."
              icon={UsersIcon}
            />
          ) : records.length === 0 ? (
            <EmptyState
              title="No records found"
              description={`No burial records found matching "${surname}".`}
              icon={UsersIcon}
            />
          ) : (
            <>
              <div className="mb-4 p-3 bg-[#2D6A4F]/10 rounded-lg">
                <p className="text-sm text-[#2D6A4F] font-medium">
                  Found {records.length} record{records.length !== 1 ? 's' : ''} for "{surname}"
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="table-header">
                    <tr>
                      <th className="px-4 py-3 text-left">Record #</th>
                      <th className="px-4 py-3 text-left">Deceased Name</th>
                      <th className="px-4 py-3 text-left">Date of Death</th>
                      <th className="px-4 py-3 text-left">Burial Date</th>
                      <th className="px-4 py-3 text-left">Location</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.record_id} className="table-row">
                        <td className="px-4 py-3">
                          <span className="font-medium text-[#2D6A4F]">
                            {record.record_number}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {record.deceased_name}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-sm">
                          {record.date_of_death
                            ? format(new Date(record.date_of_death), 'MMM dd, yyyy')
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-sm">
                          {record.date_of_service
                            ? format(new Date(record.date_of_service), 'MMM dd, yyyy')
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="text-gray-900">{record.cemetery_name}</span>
                          <br />
                          <span className="text-gray-500">Plot: {record.plot_id}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/burial-records/${record.record_id}`}
                            className="text-[#2D6A4F] hover:text-[#245c43]"
                          >
                            <ChevronRightIcon className="w-5 h-5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
