'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { FuneralService } from '@/types';
import { ArrowLeftIcon, PencilIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface User {
  user_id: number;
  full_name: string;
}

interface ExtendedService extends FuneralService {
  assigned_staff_name?: string;
  registration_number?: string;
  deceased_name?: string;
  rejection_reason?: string;
  requester_name?: string;
}

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role || 'user';
  const [service, setService] = useState<ExtendedService | null>(null);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [formData, setFormData] = useState({
    service_type: '',
    scheduled_datetime: '',
    assigned_staff_id: '',
    location: '',
    status: '',
    notes: '',
  });

  const [assignModal, setAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ scheduled_datetime: '', assigned_staff_id: '' });
  const [isAssigning, setIsAssigning] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{ open: boolean; newStatus: string }>({ open: false, newStatus: '' });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const isCoordinatorOrAdmin = role === 'admin' || role === 'funeral_coordinator';
  const isStaff = role === 'staff';
  const isUser = role === 'user';

  useEffect(() => {
    fetchService();
    if (isCoordinatorOrAdmin) {
      fetchStaff();
    }
  }, [params.id]);

  const fetchService = async () => {
    try {
      const res = await api.get(`/funeral-services/${params.id}`);
      const svc = res.data.service;
      setService(svc);
      setFormData({
        service_type: svc.service_type || '',
        scheduled_datetime: svc.scheduled_datetime
          ? new Date(svc.scheduled_datetime).toISOString().slice(0, 16)
          : '',
        assigned_staff_id: svc.assigned_staff_id?.toString() || '',
        location: svc.location || '',
        status: svc.status || '',
        notes: svc.notes || '',
      });
    } catch (err) {
      console.error('Failed to fetch service:', err);
      setError('Service not found');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await api.get('/users?role=staff');
      setStaffList(res.data.users || []);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      const payload = {
        ...formData,
        assigned_staff_id: formData.assigned_staff_id ? parseInt(formData.assigned_staff_id) : null,
      };

      await api.put(`/funeral-services/${params.id}`, payload);
      await fetchService();
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to update service:', err);
      setError(err.response?.data?.error || 'Failed to update service');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAssign = async () => {
    if (!assignForm.scheduled_datetime || !assignForm.assigned_staff_id) return;
    setIsAssigning(true);
    try {
      await api.put(`/funeral-services/${params.id}/schedule`, {
        scheduled_datetime: assignForm.scheduled_datetime,
        assigned_staff_id: parseInt(assignForm.assigned_staff_id),
      });
      setToast('Service scheduled and staff assigned');
      setAssignModal(false);
      setAssignForm({ scheduled_datetime: '', assigned_staff_id: '' });
      await fetchService();
      setTimeout(() => setToast(''), 3000);
    } catch (err: any) {
      setToast(err.response?.data?.error || 'Failed to assign service');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === 'completed') {
      setConfirmModal({ open: true, newStatus });
      return;
    }
    await updateStatus(newStatus);
  };

  const updateStatus = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      await api.put(`/funeral-services/${params.id}/status`, { status: newStatus });
      setToast('Service status updated');
      setConfirmModal({ open: false, newStatus: '' });
      await fetchService();
      setTimeout(() => setToast(''), 3000);
    } catch (err: any) {
      setToast(err.response?.data?.error || 'Failed to update status');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Service Details" />
        <div className="p-6 lg:p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="card h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !service) {
    return (
      <div>
        <Header title="Service Details" />
        <div className="p-6 lg:p-8">
          <div className="card text-center py-12">
            <p className="text-gray-500">{error}</p>
            <Link href="/services" className="btn-primary mt-4 inline-block">
              Back to Services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Service Details" />

      <div className="p-6 lg:p-8">
        {toast && (
          <div className={`fixed top-20 right-6 px-4 py-3 rounded-lg shadow-lg z-50 ${
            toast.includes('Failed') ? 'bg-red-500 text-white' : 'bg-[#2D6A4F] text-white'
          }`}>
            {toast}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Services
          </Link>
          {isCoordinatorOrAdmin && !isEditing && service?.status !== 'pending' && (
            <button onClick={() => setIsEditing(true)} className="btn-primary">
              <PencilIcon className="w-4 h-4" />
              Edit Service
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Information</h2>

            {isEditing && isCoordinatorOrAdmin ? (
              <div className="space-y-4">
                <div>
                  <label className="label">Service Type</label>
                  <select
                    name="service_type"
                    value={formData.service_type}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="ghusl">Ghusl</option>
                    <option value="kafan">Kafan</option>
                    <option value="janaza">Janaza</option>
                    <option value="transport">Transport</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="label">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    name="scheduled_datetime"
                    value={formData.scheduled_datetime}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="pending">Pending</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="label">Assigned Staff</label>
                  <select
                    name="assigned_staff_id"
                    value={formData.assigned_staff_id}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Unassigned</option>
                    {staffList.map((s) => (
                      <option key={s.user_id} value={s.user_id}>
                        {s.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="input-field"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Service ID</dt>
                    <dd className="font-medium">SVC-{String(service?.service_id).padStart(4, '0')}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Type</dt>
                    <dd className="capitalize">{service?.service_type}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-500">Status</dt>
                    <dd><StatusBadge status={service?.status || ''} /></dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Scheduled</dt>
                    <dd>
                      {service?.scheduled_datetime
                        ? format(new Date(service.scheduled_datetime), 'MMM dd, yyyy HH:mm')
                        : 'Not scheduled'}
                    </dd>
                  </div>
                  {(isCoordinatorOrAdmin || isStaff) && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Assigned Staff</dt>
                      <dd>{service?.assigned_staff_name || 'Unassigned'}</dd>
                    </div>
                  )}
                  {isUser && service?.status === 'scheduled' && service?.assigned_staff_name && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Assigned Staff</dt>
                      <dd>{service.assigned_staff_name.split(' ')[0]}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Location</dt>
                    <dd>{service?.location || '-'}</dd>
                  </div>
                  {service?.status === 'completed' && service?.completed_at && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Completed At</dt>
                      <dd>{format(new Date(service.completed_at), 'MMM dd, yyyy HH:mm')}</dd>
                    </div>
                  )}
                </dl>

                {service?.status === 'cancelled' && service?.rejection_reason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-700">{service.rejection_reason}</p>
                  </div>
                )}

                {isUser && service?.status === 'pending' && (
                  <p className="mt-4 text-sm text-gray-500 italic">
                    Awaiting coordinator confirmation
                  </p>
                )}

                {isUser && service?.status === 'cancelled' && !service?.rejection_reason && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">This service was not approved.</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Case</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Case ID</dt>
                  <dd>
                    <Link
                      href={`/death-cases/${service?.case_id}`}
                      className="text-[#2D6A4F] hover:underline font-medium"
                    >
                      {service?.registration_number || `Case #${service?.case_id}`}
                    </Link>
                  </dd>
                </div>
                {service?.deceased_name && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Deceased</dt>
                    <dd className="font-medium">{service.deceased_name}</dd>
                  </div>
                )}
              </dl>

              {!isEditing && service?.notes && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{service.notes}</p>
                </div>
              )}
            </div>

            {isCoordinatorOrAdmin && service?.status === 'pending' && (
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>
                <button
                  onClick={() => setAssignModal(true)}
                  className="btn-primary w-full"
                >
                  Schedule & Assign
                </button>
              </div>
            )}

            {isStaff && service?.assigned_staff_id === user?.user_id && (
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
                {service?.status === 'scheduled' && (
                  <button
                    onClick={() => handleStatusUpdate('in_progress')}
                    disabled={isUpdatingStatus}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {isUpdatingStatus ? 'Updating...' : 'Mark as In Progress'}
                  </button>
                )}
                {service?.status === 'in_progress' && (
                  <button
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={isUpdatingStatus}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {isUpdatingStatus ? 'Updating...' : 'Mark as Completed'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {assignModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Schedule & Assign Service</h2>
                <button onClick={() => setAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Scheduled Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={assignForm.scheduled_datetime}
                    onChange={(e) => setAssignForm({ ...assignForm, scheduled_datetime: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Assign Staff *</label>
                  <select
                    value={assignForm.assigned_staff_id}
                    onChange={(e) => setAssignForm({ ...assignForm, assigned_staff_id: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select staff member</option>
                    {staffList.map((staff) => (
                      <option key={staff.user_id} value={staff.user_id}>
                        {staff.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setAssignModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  disabled={!assignForm.scheduled_datetime || !assignForm.assigned_staff_id || isAssigning}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmModal.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 rounded-full">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Confirm Service Completion</h2>
              </div>

              <p className="text-gray-600 mb-6">
                This will mark the service as completed and cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ open: false, newStatus: '' })}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateStatus(confirmModal.newStatus)}
                  disabled={isUpdatingStatus}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {isUpdatingStatus ? 'Completing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
