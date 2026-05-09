'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ArrowLeftIcon, MinusIcon, PlusIcon, PhoneIcon } from '@heroicons/react/24/outline';

interface Cemetery {
  cemetery_id: number;
  name: string;
}

interface Section {
  section_id: number;
  section_name: string;
  section_code: string;
}

export default function RequestFamilyPlotPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [cemeteries, setCemeteries] = useState<Cemetery[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [formData, setFormData] = useState({
    group_name: '',
    number_of_members: 2,
    cemetery_id: '',
    preferred_section: '',
    special_requirements: '',
  });

  useEffect(() => {
    fetchCemeteries();
  }, []);

  useEffect(() => {
    if (formData.cemetery_id) {
      fetchSections(formData.cemetery_id);
    }
  }, [formData.cemetery_id]);

  const fetchCemeteries = async () => {
    try {
      const res = await api.get('/cemeteries');
      setCemeteries(res.data.cemeteries || []);
    } catch (err) {
      console.error('Failed to fetch cemeteries:', err);
    }
  };

  const fetchSections = async (cemeteryId: string) => {
    try {
      const res = await api.get(`/cemeteries/${cemeteryId}/sections`);
      setSections(res.data.sections || []);
    } catch (err) {
      console.error('Failed to fetch sections:', err);
    }
  };

  const handleMemberChange = (delta: number) => {
    const newValue = formData.number_of_members + delta;
    if (newValue >= 2 && newValue <= 20) {
      setFormData({ ...formData, number_of_members: newValue });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.group_name) {
      setToast('Family name is required');
      setTimeout(() => setToast(''), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/reservations/family-plot', {
        group_name: formData.group_name,
        number_of_members: formData.number_of_members,
        preferred_section: formData.preferred_section,
        special_requirements: formData.special_requirements,
      });
      setToast('Family plot request submitted successfully!');
      setTimeout(() => {
        router.push('/reservations');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to submit request:', err);
      setToast(err.response?.data?.error || 'Failed to submit request');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Header title="Request Family Plot" />

      <div className="p-6 lg:p-8">
        {toast && (
          <div className={`fixed top-20 right-6 px-4 py-3 rounded-lg shadow-lg z-50 ${
            toast.includes('success') ? 'bg-[#2D6A4F] text-white' : 'bg-red-500 text-white'
          }`}>
            {toast}
          </div>
        )}

        <Link
          href="/grave-plots"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Grave Plots
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Request Family Plot</h1>
          <p className="text-gray-500 mt-1">
            Reserve multiple adjacent plots for your family members.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="card">
              <div className="space-y-6">
                <div>
                  <label className="label">Family Name *</label>
                  <input
                    type="text"
                    value={formData.group_name}
                    onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Khan Family"
                    required
                  />
                </div>

                <div>
                  <label className="label">Number of Members</label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleMemberChange(-1)}
                      disabled={formData.number_of_members <= 2}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                    >
                      <MinusIcon className="w-5 h-5" />
                    </button>
                    <span className="text-2xl font-bold text-gray-900 w-12 text-center">
                      {formData.number_of_members}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleMemberChange(1)}
                      disabled={formData.number_of_members >= 20}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Minimum 2, maximum 20 members</p>
                </div>

                <div>
                  <label className="label">Preferred Cemetery</label>
                  <select
                    value={formData.cemetery_id}
                    onChange={(e) => setFormData({ ...formData, cemetery_id: e.target.value, preferred_section: '' })}
                    className="input-field"
                  >
                    <option value="">Select a cemetery</option>
                    {cemeteries.map((cem) => (
                      <option key={cem.cemetery_id} value={cem.cemetery_id}>
                        {cem.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.cemetery_id && (
                  <div>
                    <label className="label">Preferred Section</label>
                    <select
                      value={formData.preferred_section}
                      onChange={(e) => setFormData({ ...formData, preferred_section: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Any section</option>
                      {sections.map((sec) => (
                        <option key={sec.section_id} value={sec.section_name}>
                          {sec.section_name} ({sec.section_code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="label">Special Requirements</label>
                  <textarea
                    value={formData.special_requirements}
                    onChange={(e) => setFormData({ ...formData, special_requirements: e.target.value })}
                    className="input-field"
                    rows={4}
                    placeholder="Any specific requirements or preferences..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Family Request'}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  A cemetery administrator will contact you within 2-3 business days.
                </p>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div className="card bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-3">Reservation Policy</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#2D6A4F] mt-1">•</span>
                  Family plots require a non-refundable deposit of 15% upon approval
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2D6A4F] mt-1">•</span>
                  Allocation is subject to availability in the chosen section
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#2D6A4F] mt-1">•</span>
                  Maintenance fees are consolidated for all plots in a family group
                </li>
              </ul>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Need Assistance?</h3>
              <p className="text-sm text-gray-500 mb-3">
                Our counselors are here to help you make the right choice for your family.
              </p>
              <button className="btn-secondary w-full">
                <PhoneIcon className="w-4 h-4" />
                Contact Counselor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
