'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  ArrowLeftIcon,
  XMarkIcon,
  CheckIcon,
  CalendarDaysIcon,
  UserIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface DeathCase {
  case_id: number;
  registration_number: string;
  deceased_name: string;
  gender: string;
  age: number;
  cnic: string;
  date_of_death: string;
  cause_of_death: string;
  next_of_kin_name: string;
  next_of_kin_contact: string;
  next_of_kin_relation: string;
  status: string;
  created_at: string;
}

interface StatusHistory {
  history_id: number;
  old_status: string;
  new_status: string;
  changed_by_name: string;
  notes: string;
  changed_at: string;
}

interface FuneralService {
  service_id: number;
  service_type: string;
  status: string;
  scheduled_datetime: string;
  assigned_staff_name: string;
}

interface BurialRecord {
  record_id: number;
  record_number: string;
}

const STEPS = ['pending', 'under_review', 'approved', 'allocated', 'completed'];
const STEP_LABELS = ['Pending', 'Under Review', 'Approved', 'Allocated', 'Completed'];

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['under_review'],
  under_review: ['approved', 'pending'],
  approved: ['allocated'],
  allocated: ['completed'],
  completed: [],
};

export default function DeathCaseDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [deathCase, setDeathCase] = useState<DeathCase | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [services, setServices] = useState<FuneralService[]>([]);
  const [burialRecord, setBurialRecord] = useState<BurialRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const canUpdateStatus = user?.role === 'admin' || user?.role === 'staff' || user?.role === 'funeral_coordinator';

  useEffect(() => {
    fetchDeathCase();
    fetchServices();
    fetchBurialRecord();
  }, [params.id]);

  const fetchDeathCase = async () => {
    try {
      const res = await api.get(`/death-cases/${params.id}`);
      setDeathCase(res.data.case);
      setStatusHistory(res.data.status_history || []);
    } catch (err) {
      console.error('Failed to fetch death case:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await api.get(`/funeral-services/case/${params.id}`);
      setServices(res.data.services || []);
    } catch (err) {
      console.error('Failed to fetch services:', err);
    }
  };

  const fetchBurialRecord = async () => {
    try {
      const res = await api.get(`/burial-records/case/${params.id}`);
      setBurialRecord(res.data.burial_record || null);
    } catch (err) {
      console.error('Failed to fetch burial record:', err);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    setIsUpdating(true);
    try {
      await api.put(`/death-cases/${params.id}/status`, {
        status: newStatus,
        notes: statusNotes,
      });
      await fetchDeathCase();
      setShowStatusModal(false);
      setNewStatus('');
      setStatusNotes('');
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStepIndex = (status: string) => STEPS.indexOf(status);
  const currentStepIndex = deathCase ? getStepIndex(deathCase.status) : 0;

  const getStepDate = (step: string) => {
    const historyItem = statusHistory.find(h => h.new_status === step);
    return historyItem ? format(new Date(historyItem.changed_at), 'MMM dd, HH:mm') : null;
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Death Case Details" />
        <div className="p-6 lg:p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="card h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!deathCase) {
    return (
      <div>
        <Header title="Death Case Details" />
        <div className="p-6 lg:p-8">
          <div className="card text-center py-12">
            <p className="text-gray-500">Death case not found</p>
            <Link href="/death-cases" className="btn-primary mt-4 inline-block">
              Back to Death Cases
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Death Case Details" />

      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/death-cases"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Death Cases
          </Link>
          {canUpdateStatus && VALID_TRANSITIONS[deathCase.status]?.length > 0 && (
            <button onClick={() => setShowStatusModal(true)} className="btn-primary">
              Update Status
            </button>
          )}
        </div>

        <div className="mb-6">
          <span className="inline-block px-3 py-1 bg-[#2D6A4F] text-white text-sm font-medium rounded-full mb-2">
            #{deathCase.registration_number}
          </span>
          <h1 className="text-2xl font-bold text-gray-900">{deathCase.deceased_name}</h1>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {deathCase.gender && (
            <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
              {deathCase.gender}
            </span>
          )}
          {deathCase.age && (
            <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
              Age: {deathCase.age}
            </span>
          )}
          {deathCase.date_of_death && (
            <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
              Died: {format(new Date(deathCase.date_of_death), 'MMM dd, yyyy')}
            </span>
          )}
          {deathCase.cnic && (
            <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700">
              CNIC: {deathCase.cnic}
            </span>
          )}
        </div>

        {deathCase.cause_of_death && (
          <div className="card bg-gray-50 mb-6">
            <p className="text-sm text-gray-500 mb-1">Cause of Death</p>
            <p className="text-gray-700">{deathCase.cause_of_death}</p>
          </div>
        )}

        <div className="card mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Case Tracking Timeline</h3>
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const stepDate = getStepDate(step);

              return (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div className="flex items-center w-full">
                    {index > 0 && (
                      <div className={`flex-1 h-1 ${index <= currentStepIndex ? 'bg-[#2D6A4F]' : 'bg-gray-200'}`} />
                    )}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm ${
                        isCompleted
                          ? 'bg-[#2D6A4F] text-white'
                          : isCurrent
                          ? 'border-2 border-[#2D6A4F] text-[#2D6A4F]'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? <CheckIcon className="w-5 h-5" /> : index + 1}
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={`flex-1 h-1 ${index < currentStepIndex ? 'bg-[#2D6A4F]' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <p className={`text-xs mt-2 ${isCurrent ? 'text-[#2D6A4F] font-medium' : 'text-gray-500'}`}>
                    {STEP_LABELS[index]}
                  </p>
                  {stepDate && (
                    <p className="text-xs text-gray-400">{stepDate}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <UserIcon className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Next of Kin</h3>
            </div>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Name</dt>
                <dd className="font-medium">{deathCase.next_of_kin_name || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Contact</dt>
                <dd className="font-medium flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4 text-gray-400" />
                  {deathCase.next_of_kin_contact || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Relationship</dt>
                <dd className="font-medium">{deathCase.next_of_kin_relation || '-'}</dd>
              </div>
            </dl>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Linked Burial Record</h3>
            </div>
            {burialRecord ? (
              <Link
                href={`/burial-records/${burialRecord.record_id}`}
                className="text-[#2D6A4F] hover:underline font-medium"
              >
                {burialRecord.record_number}
              </Link>
            ) : (
              <div>
                <p className="text-gray-500 text-sm mb-3">No burial record yet</p>
                {(user?.role === 'admin' || user?.role === 'funeral_coordinator') && (
                  <Link
                    href={`/burial-records/create?caseId=${params.id}`}
                    className="btn-primary text-sm"
                  >
                    Create Burial Record
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="card mt-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Linked Services</h3>
          </div>
          {services.length === 0 ? (
            <EmptyState
              title="No services linked"
              description="No services linked to this case yet."
              icon={CalendarDaysIcon}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="table-header">
                  <tr>
                    <th className="px-3 py-2 text-left">Service Type</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Scheduled Date</th>
                    <th className="px-3 py-2 text-left">Assigned Staff</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.service_id} className="table-row">
                      <td className="px-3 py-2 capitalize">{service.service_type}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={service.status} />
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {service.scheduled_datetime
                          ? format(new Date(service.scheduled_datetime), 'MMM dd, yyyy HH:mm')
                          : '-'}
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {service.assigned_staff_name || 'Unassigned'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showStatusModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Update Case Status</h2>
                <button onClick={() => setShowStatusModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500">Current Status</p>
                <StatusBadge status={deathCase.status} className="mt-1" />
              </div>

              <div className="mb-4">
                <label className="label">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select new status</option>
                  {VALID_TRANSITIONS[deathCase.status]?.map((status) => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="label">Notes</label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Add notes about this status change..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleUpdateStatus}
                  disabled={!newStatus || isUpdating}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Confirm'}
                </button>
                <button onClick={() => setShowStatusModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
