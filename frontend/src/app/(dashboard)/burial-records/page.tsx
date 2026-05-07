'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import api from '@/lib/api';
import { BurialRecord } from '@/types';
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function BurialRecordsPage() {
  const [records, setRecords] = useState<BurialRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      // For user role, we fetch records related to their cases
      const casesRes = await api.get('/death-cases/my-cases?limit=100');
      const cases = casesRes.data.cases || [];

      const burialRecords: BurialRecord[] = [];
      for (const caseItem of cases.filter((c: { status: string }) => c.status === 'completed')) {
        try {
          const res = await api.get(`/burial-records/case/${caseItem.case_id}`);
          if (res.data.record) {
            burialRecords.push(res.data.record);
          }
        } catch {
          // No burial record for this case
        }
      }
      setRecords(burialRecords);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecords = records.filter(
    (r) =>
      !searchQuery ||
      r.deceased_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.record_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <Header title="Burial Records" />

      <div className="p-6 lg:p-8">
        {/* Search and Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[250px] relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or record number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-9"
              />
            </div>
            <button className="btn-secondary">
              <FunnelIcon className="w-4 h-4" />
              Filters
            </button>
            <Link
              href="/burial-records/family-history"
              className="btn-secondary"
            >
              Family History
            </Link>
          </div>
        </div>

        {/* Records Table */}
        <div className="card">
          {isLoading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : filteredRecords.length === 0 ? (
            <EmptyState
              title="No burial records found"
              description="Burial records will appear here once death cases are completed."
              icon={BookOpenIcon}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-3 text-left">Record #</th>
                    <th className="px-4 py-3 text-left">Deceased Name</th>
                    <th className="px-4 py-3 text-left">Date of Service</th>
                    <th className="px-4 py-3 text-left">Plot Location</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
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
                        {record.date_of_service
                          ? format(new Date(record.date_of_service), 'MMM dd, yyyy')
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">
                          {record.cemetery_name} • {record.plot_id}
                        </span>
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
          )}
        </div>
      </div>
    </div>
  );
}
