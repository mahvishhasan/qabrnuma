'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/ui/StatusBadge';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import api from '@/lib/api';
import { DeathCase } from '@/types';
import {
  PlusIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CheckIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const statusSteps = ['pending', 'under_review', 'approved', 'allocated', 'completed'];

export default function DeathCasesPage() {
  const [cases, setCases] = useState<DeathCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCase, setExpandedCase] = useState<number | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    pages: 0,
  });
  const [completedThisWeek, setCompletedThisWeek] = useState(0);

  useEffect(() => {
    fetchCases();
  }, [pagination.page]);

  const fetchCases = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/death-cases/my-cases?page=${pagination.page}&limit=${pagination.limit}`);
      setCases(res.data.cases || []);
      setPagination(res.data.pagination);

      // Count completed this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const completed = (res.data.cases || []).filter(
        (c: DeathCase) => c.status === 'completed' && new Date(c.updated_at) > weekAgo
      ).length;
      setCompletedThisWeek(completed);
    } catch (error) {
      console.error('Failed to fetch cases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStepStatus = (caseStatus: string, stepIndex: number) => {
    const currentIndex = statusSteps.indexOf(caseStatus);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const toggleExpand = (caseId: number) => {
    setExpandedCase(expandedCase === caseId ? null : caseId);
  };

  return (
    <div>
      <Header
        title="Track Death Cases"
        badge="ROLE: REGISTRAR"
      />

      <div className="p-6 lg:p-8">
        {/* Stats Card */}
        <div className="bg-[#1B3A2D] rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/60 font-medium">
                Active Requests
              </p>
              <p className="text-4xl font-bold text-white mt-1">{pagination.total}</p>
              <p className="text-sm text-white/60 mt-1">
                {completedThisWeek} cases completed this week
              </p>
            </div>
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
              <DocumentTextIcon className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Your Submissions</h3>
            <Link href="/death-cases/create" className="btn-primary">
              <PlusIcon className="w-4 h-4" />
              Report New Case
            </Link>
          </div>

          {isLoading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : cases.length === 0 ? (
            <EmptyState
              title="No death cases found"
              description="You haven't submitted any death cases yet."
              icon={DocumentTextIcon}
              action={
                <Link href="/death-cases/create" className="btn-primary">
                  <PlusIcon className="w-4 h-4" />
                  Report New Case
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-3 text-left">Case ID</th>
                    <th className="px-4 py-3 text-left">Deceased Name</th>
                    <th className="px-4 py-3 text-left">Submitted Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((deathCase) => (
                    <>
                      <tr
                        key={deathCase.case_id}
                        className="table-row cursor-pointer"
                        onClick={() => toggleExpand(deathCase.case_id)}
                      >
                        <td className="px-4 py-3">
                          <span className="text-[#2D6A4F] font-medium">
                            {deathCase.registration_number}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {deathCase.deceased_name}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-sm">
                          {format(new Date(deathCase.created_at), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={deathCase.status} />
                        </td>
                        <td className="px-4 py-3">
                          {expandedCase === deathCase.case_id ? (
                            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </td>
                      </tr>
                      {expandedCase === deathCase.case_id && (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 bg-gray-50">
                            {/* Timeline Header */}
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-semibold text-gray-900">
                                Case Tracking Timeline
                              </h4>
                              {deathCase.status === 'completed' && (
                                <button className="text-sm text-[#2D6A4F] hover:text-[#245c43] font-medium flex items-center gap-1">
                                  <ArrowDownTrayIcon className="w-4 h-4" />
                                  Download Certificate
                                </button>
                              )}
                            </div>

                            {/* Timeline Steps */}
                            <div className="flex items-center justify-between mb-6">
                              {statusSteps.map((step, index) => {
                                const stepStatus = getStepStatus(deathCase.status, index);
                                return (
                                  <div key={step} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center">
                                      <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                          stepStatus === 'completed'
                                            ? 'bg-[#1B3A2D] text-white'
                                            : stepStatus === 'current'
                                            ? 'border-2 border-[#2D6A4F] text-[#2D6A4F]'
                                            : 'bg-gray-200 text-gray-500'
                                        }`}
                                      >
                                        {stepStatus === 'completed' ? (
                                          <CheckIcon className="w-4 h-4" />
                                        ) : (
                                          index + 1
                                        )}
                                      </div>
                                      <p
                                        className={`text-xs mt-2 capitalize ${
                                          stepStatus === 'upcoming'
                                            ? 'text-gray-400'
                                            : 'text-gray-700'
                                        }`}
                                      >
                                        {step.replace('_', ' ')}
                                      </p>
                                    </div>
                                    {index < statusSteps.length - 1 && (
                                      <div
                                        className={`flex-1 h-0.5 mx-2 ${
                                          getStepStatus(deathCase.status, index + 1) !== 'upcoming'
                                            ? 'bg-[#1B3A2D]'
                                            : 'bg-gray-200'
                                        }`}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Latest Update */}
                            <div className="bg-white border-l-4 border-[#2D6A4F] p-4 rounded-r-lg">
                              <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-1">
                                Latest Update
                              </p>
                              <p className="text-sm text-gray-700">
                                Case is currently in <strong>{deathCase.status.replace('_', ' ')}</strong> status.
                                {deathCase.assigned_staff_name && (
                                  <> Assigned to {deathCase.assigned_staff_name}.</>
                                )}
                              </p>
                            </div>

                            {/* View Details Link */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <Link
                                href={`/death-cases/${deathCase.case_id}`}
                                className="text-[#2D6A4F] hover:text-[#245c43] font-medium text-sm"
                              >
                                View Full Details →
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} records
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                {Array.from({ length: pagination.pages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPagination((p) => ({ ...p, page: i + 1 }))}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      pagination.page === i + 1
                        ? 'bg-[#2D6A4F] text-white'
                        : 'border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
