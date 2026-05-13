'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface DeathCase {
  case_id: number;
  registration_number: string;
  deceased_name: string;
}

interface User {
  user_id: number;
  full_name: string;
  role: string;
}

export default function CreateServicePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deathCases, setDeathCases] = useState<DeathCase[]>([]);
  const [staff, setStaff] = useState<User[]>([]);

  const [formData, setFormData] = useState({
    case_id: '',
    service_type: 'ghusl',
    scheduled_datetime: '',
    assigned_staff_id: '',
    notes: '',
  });

  const canCreate = user?.role === 'admin' || user?.role === 'funeral_coordinator';

  useEffect(() => {
    if (!canCreate) {
      router.push('/services');
      return;
    }
    fetchDeathCases();
    fetchStaff();
  }, [canCreate]);

  const fetchDeathCases = async () => {
    try {
      const res = await api.get('/death-cases?limit=100');
      setDeathCases(res.data.cases || []);
    } catch (err) {
      console.error('Failed to fetch death cases:', err);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await api.get('/users?role=staff');
      setStaff(res.data.users || []);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        case_id: parseInt(formData.case_id),
        service_type: formData.service_type,
        scheduled_datetime: formData.scheduled_datetime || null,
        assigned_staff_id: formData.assigned_staff_id ? parseInt(formData.assigned_staff_id) : null,
        notes: formData.notes || null,
      };

      await api.post('/funeral-services', payload);
      router.push('/services');
    } catch (err: any) {
      console.error('Failed to create service:', err);
      setError(err.response?.data?.error || 'Failed to schedule service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!canCreate) return null;

  return (
    <div>
      <Header title="Schedule Service" />

      <div className="p-6 lg:p-8">
        <Link
          href="/services"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Services
        </Link>

        <div className="card max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Schedule New Service</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Death Case *</label>
              <select
                name="case_id"
                value={formData.case_id}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select a case</option>
                {deathCases.map((dc) => (
                  <option key={dc.case_id} value={dc.case_id}>
                    {dc.registration_number} - {dc.deceased_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Service Type *</label>
              <select
                name="service_type"
                value={formData.service_type}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="ghusl">Ghusl (Ritual Washing)</option>
                <option value="kafan">Kafan (Shrouding)</option>
                <option value="janaza">Janaza (Funeral Prayer)</option>
                <option value="transport">Transport</option>
                <option value="grave_prep">Grave Preparation</option>
                <option value="headstone">Headstone / Memorial Marker</option>
                <option value="cleaning">Grave Cleaning</option>
                <option value="perpetual">Perpetual Care</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="label">Scheduled Date & Time *</label>
              <input
                type="datetime-local"
                name="scheduled_datetime"
                value={formData.scheduled_datetime}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label">Assign Staff</label>
              <select
                name="assigned_staff_id"
                value={formData.assigned_staff_id}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select staff member</option>
                {staff.map((s) => (
                  <option key={s.user_id} value={s.user_id}>
                    {s.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="input-field"
                rows={3}
                placeholder="Additional instructions or notes..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary disabled:opacity-50"
              >
                {isSubmitting ? 'Scheduling...' : 'Schedule Service'}
              </button>
              <Link href="/services" className="btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
