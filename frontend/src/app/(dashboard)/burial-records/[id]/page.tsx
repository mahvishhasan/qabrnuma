'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/LoadingSkeleton';
import api from '@/lib/api';
import { BurialRecord } from '@/types';
import {
  ArrowLeftIcon,
  MapPinIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function BurialRecordDetailPage() {
  const params = useParams();
  const [record, setRecord] = useState<BurialRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecord();
  }, [params.id]);

  const fetchRecord = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/burial-records/${params.id}`);
      setRecord(res.data.record);
    } catch (error) {
      console.error('Failed to fetch record:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Loading..." />
        <div className="p-6 lg:p-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div>
        <Header title="Record Not Found" />
        <div className="p-6 lg:p-8">
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">Burial record not found.</p>
            <Link href="/burial-records" className="btn-primary">
              Back to Records
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Burial Records" />

      <div className="p-6 lg:p-8">
        {/* Back Link */}
        <Link
          href="/burial-records"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Records
        </Link>

        {/* Record Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="badge bg-[#1B3A2D] text-white">
                {record.record_number}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{record.deceased_name}</h2>
            <p className="text-gray-500 flex items-center gap-1 mt-1">
              {record.date_of_death && (
                <>
                  {format(new Date(record.date_of_death), 'yyyy')} -{' '}
                  {record.date_of_service
                    ? format(new Date(record.date_of_service), 'yyyy')
                    : 'Present'}
                </>
              )}
            </p>
            <p className="text-gray-500 flex items-center gap-1 mt-1">
              <MapPinIcon className="w-4 h-4" />
              {record.cemetery_name} • {record.section_name} • {record.plot_id}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Details */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Service Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="label">Funeral Director</p>
                  <p className="text-gray-900">{record.funeral_director || 'N/A'}</p>
                </div>
                <div>
                  <p className="label">Burial Type</p>
                  <p className="text-gray-900">{record.burial_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="label">Date of Service</p>
                  <p className="text-gray-900">
                    {record.date_of_service
                      ? format(new Date(record.date_of_service), 'MMMM dd, yyyy')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="label">Officiating Clergy</p>
                  <p className="text-gray-900">{record.officiating_clergy || 'N/A'}</p>
                </div>
                <div>
                  <p className="label">Religious Affiliation</p>
                  <p className="text-gray-900">{record.religious_affiliation || 'N/A'}</p>
                </div>
                <div>
                  <p className="label">Vault Type</p>
                  <p className="text-gray-900">{record.vault_type || 'N/A'}</p>
                </div>
              </div>
              {record.remarks && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="label">Remarks/Notes</p>
                  <p className="text-gray-700">{record.remarks}</p>
                </div>
              )}
            </div>

            {/* Next of Kin */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Next of Kin & Contacts</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="table-header">
                    <tr>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Relationship</th>
                      <th className="px-4 py-3 text-left">Phone</th>
                      <th className="px-4 py-3 text-left"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="table-row">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {record.next_of_kin_name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">Primary Contact</td>
                      <td className="px-4 py-3 text-gray-500">
                        {record.next_of_kin_contact || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-[#2D6A4F] hover:text-[#245c43]">
                          <EnvelopeIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Plot Metadata */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Plot Metadata</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Plot Ownership</span>
                  <span className="text-sm font-medium text-gray-900">
                    {record.plot_ownership || 'Permanent'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <StatusBadge status="occupied" />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Maintenance Plan</span>
                  <span className="text-sm font-medium text-gray-900">Standard</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Memorial Type</span>
                  <span className="text-sm font-medium text-gray-900">
                    {record.memorial_type || 'Headstone'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
